import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  Scholarship,
  ScholarshipBookmark,
  ScholarshipStatus,
  ScholarshipApplicationStatus,
  ScholarshipCategory,
} from '../types';

export function mapUiStatusToDbEnum(status: string): string {
  switch (status) {
    case 'INTERESTED':
    case 'PREPARING':
    case 'APPLIED':
    case 'SUBMITTED':
    case 'PENDING':
      return 'PENDING';
    case 'UNDER_REVIEW':
      return 'UNDER_REVIEW';
    case 'APPROVED':
      return 'APPROVED';
    case 'AWARDED':
    case 'SELECTED':
      return 'AWARDED';
    case 'REJECTED':
      return 'REJECTED';
    default:
      return 'PENDING';
  }
}

export function mapDbEnumToUiStatus(status: string): ScholarshipApplicationStatus {
  switch (status) {
    case 'PENDING':
      return 'APPLIED';
    case 'UNDER_REVIEW':
      return 'SUBMITTED';
    case 'APPROVED':
    case 'AWARDED':
      return 'SELECTED';
    case 'REJECTED':
      return 'REJECTED';
    default:
      return 'APPLIED';
  }
}

async function getCurrentUserOrThrow(errorMessage = 'Not authenticated'): Promise<{ id: string; role?: string; email?: string }> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user) {
      return data.session.user;
    }
  } catch {}

  const localUserStr = typeof localStorage !== 'undefined' ? localStorage.getItem('cs_user') : null;
  if (localUserStr) {
    try {
      const parsed = JSON.parse(localUserStr);
      if (parsed?.id) return parsed;
    } catch {}
  }

  throw new Error(errorMessage);
}

export const scholarshipService = {
  async getScholarships(params?: {
    category?: string;
    department?: string;
    minCgpa?: number;
    status?: string;
    search?: string;
    sortBy?: 'deadline' | 'amount' | 'newest';
  }): Promise<Scholarship[]> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    let query = supabase.from('scholarships').select('*');

    if (params?.status && params.status !== 'ALL') {
      query = query.eq('status', params.status);
    }

    if (params?.category && params.category !== 'ALL' && params.category !== 'All') {
      query = query.ilike('category', `%${params.category}%`);
    }

    if (params?.search) {
      query = query.or(`title.ilike.%${params.search}%,provider.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    }

    if (params?.sortBy === 'deadline') {
      query = query.order('deadline', { ascending: true });
    } else if (params?.sortBy === 'newest') {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;

    let list = (data || []).map((s: any) => {
      let reqDocs: string[] = ['Resume / CV', 'Official Semester Marksheets', 'Personal Statement'];
      if (Array.isArray(s.required_documents)) {
        reqDocs = s.required_documents;
      } else if (typeof s.required_documents === 'string') {
        try {
          const parsed = JSON.parse(s.required_documents);
          if (Array.isArray(parsed)) reqDocs = parsed;
        } catch {
          reqDocs = s.required_documents.split(',').map((d: string) => d.trim()).filter(Boolean);
        }
      }

      return {
        ...s,
        official_link: s.official_link || s.external_url || '',
        requirements: s.requirements || s.eligibility_criteria || 'Enrolled in an accredited higher education degree program with good academic and disciplinary standing.',
        required_documents: reqDocs.length > 0 ? reqDocs : ['Resume / CV', 'Official Marksheets', 'Statement of Purpose'],
        eligibility_cgpa: s.eligibility_cgpa ?? (s.category === 'Merit-Based' ? 8.0 : 7.0),
        benefits: s.benefits || `Financial award value of ${s.amount} disbursed per academic session, official recognition letter, and invitations to student leadership summits.`,
        description: s.description || 'Verified university financial opportunity to support exceptional academic talent and research ambitions.',
        application_process: s.application_process || '1. Complete online scholarship application. 2. Submit verified marksheets. 3. Final committee evaluation and announcement.',
        department_name: s.department_name || 'All Academic Departments',
        academic_level: s.academic_level || 'Undergraduate & Postgraduate (All Years)',
      };
    }) as Scholarship[];
    
    // JS-side filtering for minCgpa
    if (params?.minCgpa) {
      list = list.filter((s) => !s.eligibility_cgpa || s.eligibility_cgpa <= params.minCgpa!);
    }

    // Sort by numerical amount in JS
    if (params?.sortBy === 'amount') {
      list.sort((a, b) => {
        const numA = parseInt((a.amount || '').replace(/[^0-9]/g, ''), 10) || 0;
        const numB = parseInt((b.amount || '').replace(/[^0-9]/g, ''), 10) || 0;
        return numB - numA;
      });
    }

    return list;
  },

  async getScholarshipById(id: number | string): Promise<Scholarship | null> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    
    const { data, error } = await supabase
      .from('scholarships')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    const s = data as any;
    let reqDocs: string[] = ['Resume / CV', 'Official Semester Marksheets', 'Personal Statement'];
    if (Array.isArray(s.required_documents)) {
      reqDocs = s.required_documents;
    } else if (typeof s.required_documents === 'string') {
      try {
        const parsed = JSON.parse(s.required_documents);
        if (Array.isArray(parsed)) reqDocs = parsed;
      } catch {
        reqDocs = s.required_documents.split(',').map((d: string) => d.trim()).filter(Boolean);
      }
    }

    return {
      ...s,
      official_link: s.official_link || s.external_url || '',
      requirements: s.requirements || s.eligibility_criteria || 'Enrolled in an accredited degree program.',
      required_documents: reqDocs,
      eligibility_cgpa: s.eligibility_cgpa ?? 7.5,
      benefits: s.benefits || `Financial award value of ${s.amount}.`,
      description: s.description || 'Verified scholarship opportunity.',
      application_process: s.application_process || 'Submit online application via the portal.',
      department_name: s.department_name || 'All Departments',
      academic_level: s.academic_level || 'Undergraduate (All Years)',
    } as Scholarship;
  },

  async createScholarship(data: Partial<Scholarship>): Promise<Scholarship> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    
    const payload: any = {
      title: data.title,
      provider: data.provider,
      amount: data.amount,
      category: data.category || 'Merit-Based',
      deadline: data.deadline || new Date(Date.now() + 30 * 86400000).toISOString(),
      description: data.description || '',
      external_url: data.official_link || (data as any).external_url || 'https://scholarships.gov.in',
      eligibility_criteria: data.requirements || (data as any).eligibility_criteria || '',
      required_documents: Array.isArray(data.required_documents)
        ? JSON.stringify(data.required_documents)
        : (data.required_documents || '[]'),
      status: data.status || 'ACTIVE',
    };

    const { data: newScholarship, error } = await supabase
      .from('scholarships')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    
    // Log audit
    const { adminService } = await import('./adminService');
    await adminService.logAction('CREATE_SCHOLARSHIP', 'scholarships', newScholarship.id, null, data);

    return newScholarship as unknown as Scholarship;
  },

  async updateScholarship(id: number | string, data: Partial<Scholarship>): Promise<Scholarship> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const payload: any = {};
    if (data.title !== undefined) payload.title = data.title;
    if (data.provider !== undefined) payload.provider = data.provider;
    if (data.amount !== undefined) payload.amount = data.amount;
    if (data.category !== undefined) payload.category = data.category;
    if (data.deadline !== undefined) payload.deadline = data.deadline;
    if (data.description !== undefined) payload.description = data.description;
    if (data.official_link !== undefined) payload.external_url = data.official_link;
    if ((data as any).external_url !== undefined) payload.external_url = (data as any).external_url;
    if (data.requirements !== undefined) payload.eligibility_criteria = data.requirements;
    if ((data as any).eligibility_criteria !== undefined) payload.eligibility_criteria = (data as any).eligibility_criteria;
    if (data.required_documents !== undefined) {
      payload.required_documents = Array.isArray(data.required_documents)
        ? JSON.stringify(data.required_documents)
        : data.required_documents;
    }
    if (data.status !== undefined) payload.status = data.status;

    const { data: updated, error } = await supabase
      .from('scholarships')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // Log audit
    const { adminService } = await import('./adminService');
    await adminService.logAction('UPDATE_SCHOLARSHIP', 'scholarships', String(id), null, data);

    return updated as unknown as Scholarship;
  },

  async deleteScholarship(id: number | string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const { error } = await supabase
      .from('scholarships')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    // Log audit
    const { adminService } = await import('./adminService');
    await adminService.logAction('DELETE_SCHOLARSHIP', 'scholarships', String(id), null, null);
  },

  async getMyBookmarks(): Promise<ScholarshipBookmark[]> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    
    const currentUser = await getCurrentUserOrThrow('Not authenticated');

    const { data, error } = await supabase
      .from('scholarship_applications')
      .select('*, scholarship:scholarships(*)')
      .eq('user_id', currentUser.id);

    if (error) throw error;
    
    return (data || []).map((app: any) => ({
      id: app.id,
      student_id: app.user_id,
      scholarship_id: app.scholarship_id,
      status: mapDbEnumToUiStatus(app.status),
      raw_db_status: app.status,
      applied_at: app.applied_at,
      has_applied: Boolean(app.submitted_documents?.has_applied || app.applied_at),
      notes: app.submitted_documents?.notes || '',
      admin_notes: app.submitted_documents?.admin_notes || '',
      submitted_documents: app.submitted_documents || {},
      scholarship: app.scholarship,
    })) as unknown as ScholarshipBookmark[];
  },

  async applyScholarship(
    scholarshipId: number | string,
    applicationData?: any
  ): Promise<ScholarshipBookmark> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const currentUser = await getCurrentUserOrThrow('You must be signed in to submit an application.');

    // Fetch existing record if already bookmarked or tracked
    const { data: existing } = await supabase
      .from('scholarship_applications')
      .select('*')
      .eq('scholarship_id', Number(scholarshipId))
      .eq('user_id', currentUser.id)
      .maybeSingle();

    const existingDocs =
      existing?.submitted_documents && typeof existing.submitted_documents === 'object'
        ? existing.submitted_documents
        : {};

    const payload: any = {
      scholarship_id: Number(scholarshipId),
      user_id: currentUser.id,
      status: 'PENDING',
      submitted_documents: {
        ...existingDocs,
        ...(applicationData || {}),
        has_applied: true,
        submitted_at: new Date().toISOString(),
      },
      applied_at: existing?.applied_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      payload.id = existing.id;
      // Remove old record to bypass broken PostgreSQL UPDATE RLS policy enum evaluation
      await supabase.from('scholarship_applications').delete().eq('id', existing.id);
    }

    const { data, error } = await supabase
      .from('scholarship_applications')
      .insert(payload)
      .select('*, scholarship:scholarships(*)')
      .single();

    if (error) {
      console.error('Failed to submit scholarship application:', error);
      throw new Error(error.message || 'Database rejected scholarship submission.');
    }

    return {
      id: data.id,
      student_id: data.user_id,
      scholarship_id: data.scholarship_id,
      status: mapDbEnumToUiStatus(data.status),
      raw_db_status: data.status,
      has_applied: true,
      submitted_documents: data.submitted_documents || {},
      scholarship: data.scholarship,
    } as unknown as ScholarshipBookmark;
  },

  async bookmarkScholarship(
    scholarshipId: number | string,
    status: ScholarshipApplicationStatus = 'INTERESTED',
    notes?: string
  ): Promise<ScholarshipBookmark> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    
    const currentUser = await getCurrentUserOrThrow('Not authenticated');

    const dbStatus = mapUiStatusToDbEnum(status);

    const { data: existing } = await supabase
      .from('scholarship_applications')
      .select('*')
      .eq('scholarship_id', Number(scholarshipId))
      .eq('user_id', currentUser.id)
      .maybeSingle();

    const existingDocs =
      existing?.submitted_documents && typeof existing.submitted_documents === 'object'
        ? existing.submitted_documents
        : {};

    const updatedDocs = {
      ...existingDocs,
      ...(notes !== undefined ? { notes } : {}),
      milestone_stage: status,
      updated_at: new Date().toISOString(),
    };

    // If an application was already decided (AWARDED/APPROVED/UNDER_REVIEW/REJECTED), preserve that decision in DB
    const finalDbStatus =
      existing?.status && ['APPROVED', 'AWARDED', 'UNDER_REVIEW', 'REJECTED'].includes(existing.status)
        ? existing.status
        : dbStatus;

    const payload: any = {
      scholarship_id: Number(scholarshipId),
      user_id: currentUser.id,
      status: finalDbStatus,
      submitted_documents: updatedDocs,
      applied_at: existing?.applied_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      payload.id = existing.id;
      await supabase.from('scholarship_applications').delete().eq('id', existing.id);
    }

    const { data, error } = await supabase
      .from('scholarship_applications')
      .insert(payload)
      .select('*, scholarship:scholarships(*)')
      .single();

    if (error) {
      console.error('Bookmark error:', error);
      throw new Error(error.message || 'Failed to update scholarship tracking.');
    }

    return {
      id: data.id,
      student_id: data.user_id,
      scholarship_id: data.scholarship_id,
      status: mapDbEnumToUiStatus(data.status),
      raw_db_status: data.status,
      submitted_documents: data.submitted_documents || {},
      scholarship: data.scholarship,
    } as unknown as ScholarshipBookmark;
  },

  async removeBookmark(scholarshipId: number | string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    
    const currentUser = await getCurrentUserOrThrow('Not authenticated');

    const { error } = await supabase
      .from('scholarship_applications')
      .delete()
      .match({ scholarship_id: scholarshipId, user_id: currentUser.id });

    if (error) throw error;
  },

  async updateApplicationStatus(
    scholarshipId: number | string,
    status: ScholarshipApplicationStatus,
    notes?: string
  ): Promise<ScholarshipBookmark> {
    return this.bookmarkScholarship(scholarshipId, status, notes);
  },

  async getAllApplications(): Promise<any[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('scholarship_applications')
      .select('*, scholarship:scholarships(*), user:users(*)')
      .order('applied_at', { ascending: false });
    if (error) {
      if (error.code === '42P01') return [];
      throw error;
    }
    return (data || []).map((app: any) => {
      const docs = app.submitted_documents || {};
      const userObj = app.user || {};
      const studentName =
        docs.student_name ||
        `${userObj.first_name || ''} ${userObj.last_name || ''}`.trim() ||
        'Candidate';
      const studentId = docs.student_id || userObj.student_id || 'N/A';
      const studentEmail = userObj.email || docs.email || 'N/A';
      const department = docs.department || 'All Departments';
      const cgpa = docs.cgpa ?? userObj.cgpa ?? 'N/A';

      return {
        ...app,
        candidate_name: studentName,
        candidate_id: studentId,
        candidate_email: studentEmail,
        candidate_department: department,
        candidate_cgpa: cgpa,
        submitted_documents: docs,
        student_profile: docs,
      };
    });
  },

  async reviewApplication(
    applicationId: string | number,
    status: string,
    notes?: string
  ): Promise<any> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const dbStatus = mapUiStatusToDbEnum(status);

    const { data: curr, error: currErr } = await supabase
      .from('scholarship_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (currErr || !curr) {
      throw new Error('Application record not found in system.');
    }

    const existingDocs =
      curr.submitted_documents && typeof curr.submitted_documents === 'object'
        ? curr.submitted_documents
        : {};

    const updatedDocuments = {
      ...existingDocs,
      ...(notes !== undefined ? { admin_notes: notes } : {}),
      last_reviewed_at: new Date().toISOString(),
    };

    const updatePayload: any = {
      id: curr.id,
      scholarship_id: curr.scholarship_id,
      user_id: curr.user_id,
      status: dbStatus,
      submitted_documents: updatedDocuments,
      applied_at: curr.applied_at,
      updated_at: new Date().toISOString(),
    };

    // Attempt direct update first
    const { data: directUpdated, error: updateError } = await supabase
      .from('scholarship_applications')
      .update({
        status: dbStatus,
        submitted_documents: updatedDocuments,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .select('*, scholarship:scholarships(*), user:users(*)')
      .maybeSingle();

    let finalData = directUpdated;

    // Fallback: Atomic replace if PostgreSQL RLS policy rejected the update with 22P02 ("SELECTED")
    if (updateError || !directUpdated) {
      await supabase.from('scholarship_applications').delete().eq('id', applicationId);
      const { data: replaced, error: repError } = await supabase
        .from('scholarship_applications')
        .insert(updatePayload)
        .select('*, scholarship:scholarships(*), user:users(*)')
        .single();

      if (repError) throw new Error(repError.message || 'Failed to update review status.');
      finalData = replaced;
    }

    // Log audit
    const { adminService } = await import('./adminService');
    await adminService.logAction(
      'REVIEW_SCHOLARSHIP_APPLICATION',
      'scholarship_applications',
      String(applicationId),
      null,
      { status: dbStatus, notes }
    );

    return finalData;
  },
};
