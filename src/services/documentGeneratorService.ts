import { supabase, isSupabaseConfigured } from './supabaseClient';
import { OfficialDocumentRecord, StudentProfile } from '../types';

const generateSafeHash = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    try {
      return Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      // fallback
    }
  }
  return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

async function resolveStudentUserId(studentId: string | number): Promise<string> {
  const { data: session } = await supabase.auth.getSession();
  const currentUserId = session?.session?.user?.id;
  const strId = String(studentId).trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(strId);
  if (isUuid) {
    return strId;
  }
  // Try querying students table by numeric id
  const numId = Number(strId);
  if (!isNaN(numId) && numId > 0) {
    const { data } = await supabase.from('students').select('user_id').eq('id', numId).maybeSingle();
    if (data?.user_id) return data.user_id;
  }
  if (currentUserId) return currentUserId;
  throw new Error('Could not identify student user ID for document generation.');
}

export const documentGeneratorService = {
  async generateTranscript(studentId: string | number, profile?: StudentProfile | null, cgpa = 8.92, credits = 101): Promise<OfficialDocumentRecord> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const documentUid = `TR-2026-CS${randomDigits}`;
    const sha256Hash = generateSafeHash();

    const name = profile?.user?.first_name ? `${profile.user.first_name} ${profile.user.last_name || ''}`.trim() : 'Student Name';
    const dept = profile?.department?.name || 'Computer Science';
    const course = profile?.course || 'B.Tech';
    const standing = cgpa >= 8.5 ? 'First Class with Distinction' : cgpa >= 7.0 ? 'First Class' : 'Second Class';

    let dbId = Date.now();
    try {
      const targetUserId = await resolveStudentUserId(studentId);
      const { data: inserted, error } = await supabase
        .from('certificates')
        .insert({
          certificate_uid: documentUid,
          student_id: targetUserId,
          title: 'Official Academic Transcript',
          category: 'Academic',
          issuer: 'Office of the University Registrar',
          issue_date: new Date().toISOString().split('T')[0],
          status: 'APPROVED',
          is_public: true,
          description: `Official Transcript | CGPA: ${cgpa} | Credits: ${credits} | ${standing}`,
          points_awarded: 0,
        })
        .select('id')
        .maybeSingle();

      if (!error && inserted?.id) {
        dbId = Number(inserted.id);
      }
    } catch (persistErr) {
      console.warn('Could not persist transcript to certificates table:', persistErr);
    }

    const newDoc: OfficialDocumentRecord = {
      id: dbId,
      document_uid: documentUid,
      document_type: 'TRANSCRIPT',
      student_id: Number(studentId) || 1,
      student_name: name,
      department_name: dept,
      course_name: course,
      issue_date: new Date().toISOString().split('T')[0],
      status: 'VALID',
      sha256_hash: sha256Hash,
      qr_payload: `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${documentUid}?hash=${sha256Hash}`,
      metadata: {
        cgpa: cgpa,
        total_credits: credits,
        standing: standing,
        academic_year: '2025-2026',
      },
    };
    
    return newDoc;
  },

  async generateBonafideCertificate(
    studentId: string | number,
    purpose = 'General Student Verification & Visa/Passport Application'
  ): Promise<OfficialDocumentRecord> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const documentUid = `BN-2026-CS${randomDigits}`;
    const sha256Hash = generateSafeHash();

    let dbId = Date.now();
    let studentName = 'Student Name';
    let deptName = 'Computer Science';
    let courseName = 'B.Tech';

    try {
      const targetUserId = await resolveStudentUserId(studentId);
      const { data: uData } = await supabase
        .from('users')
        .select('first_name, last_name, department:departments(name)')
        .eq('id', targetUserId)
        .maybeSingle();
      if (uData) {
        studentName = `${uData.first_name} ${uData.last_name || ''}`.trim();
        if ((uData as any).department?.name) deptName = (uData as any).department.name;
      }

      const { data: inserted, error } = await supabase
        .from('certificates')
        .insert({
          certificate_uid: documentUid,
          student_id: targetUserId,
          title: 'Bonafide Student Certificate',
          category: 'Identity',
          issuer: 'Office of the University Registrar',
          issue_date: new Date().toISOString().split('T')[0],
          status: 'APPROVED',
          is_public: true,
          description: purpose.trim(),
          points_awarded: 0,
        })
        .select('id')
        .maybeSingle();

      if (!error && inserted?.id) {
        dbId = Number(inserted.id);
      }
    } catch (persistErr) {
      console.warn('Could not persist bonafide certificate:', persistErr);
    }

    return {
      id: dbId,
      document_uid: documentUid,
      document_type: 'BONAFIDE',
      student_id: Number(studentId) || 1,
      student_name: studentName,
      department_name: deptName,
      course_name: courseName,
      issue_date: new Date().toISOString().split('T')[0],
      purpose: purpose.trim(),
      status: 'VALID',
      sha256_hash: sha256Hash,
      qr_payload: `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${documentUid}`,
      metadata: {
        academic_year: '2025-2026',
        semester: 6,
        enrollment_status: 'Active Full-Time Undergraduate Student',
      },
    };
  },

  async getDocumentByUid(uid: string): Promise<OfficialDocumentRecord | null> {
    if (!isSupabaseConfigured || !uid) return null;

    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*, student:users!student_id(*)')
        .eq('certificate_uid', uid.trim().toUpperCase())
        .maybeSingle();

      if (error || !data) return null;

      const cert = data;
      const studentName = cert.student?.first_name
        ? `${cert.student.first_name} ${cert.student.last_name || ''}`.trim()
        : 'Enrolled Student';
      const isTranscript = cert.certificate_uid.startsWith('TR-') || cert.category === 'Academic';
      const isBonafide = cert.certificate_uid.startsWith('BN-') || cert.category === 'Identity';

      return {
        id: Number(cert.id),
        document_uid: cert.certificate_uid,
        document_type: isTranscript ? 'TRANSCRIPT' : isBonafide ? 'BONAFIDE' : 'COURSE_COMPLETION',
        student_id: Number(cert.id) || 1,
        student_name: studentName,
        department_name: cert.student?.department_id ? `Department #${cert.student.department_id}` : 'Academic Affairs',
        course_name: 'Academic Degree Program',
        issue_date: cert.issue_date || new Date().toISOString().split('T')[0],
        purpose: cert.description || undefined,
        status: cert.status === 'APPROVED' ? 'VALID' : 'REVOKED',
        sha256_hash: generateSafeHash(),
        qr_payload: `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${cert.certificate_uid}`,
        metadata: {
          issuer: cert.issuer || 'Office of the University Registrar',
          status: cert.status,
          verified_at: cert.verified_at,
        },
      };
    } catch (err) {
      console.error('Failed to get document by UID:', err);
      return null;
    }
  },
};


