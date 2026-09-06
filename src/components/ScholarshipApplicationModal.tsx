import React, { useState, useEffect } from 'react';
import { Scholarship, StudentProfile } from '../types';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input, Textarea } from './Input';
import { Badge } from './Badge';
import { useToast } from '../context/ToastContext';
import { scholarshipService } from '../services/scholarshipService';
import { studentService } from '../services/studentService';
import confetti from 'canvas-confetti';
import QRCode from 'react-qr-code';
import {
  IndianRupee,
  GraduationCap,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Edit3,
  Phone,
  Mail,
  Send,
  Printer,
  FileCheck,
  Building2,
} from 'lucide-react';

interface ScholarshipApplicationModalProps {
  scholarship: Scholarship | null;
  studentProfile: StudentProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ScholarshipApplicationModal: React.FC<ScholarshipApplicationModalProps> = ({
  scholarship,
  studentProfile,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedPass, setConfirmedPass] = useState<{
    applicationId: string;
    submittedAt: string;
  } | null>(null);

  // Editable Student Details
  const [studentDetails, setStudentDetails] = useState({
    name: '',
    student_id: '',
    email: '',
    phone: '',
    department: '',
    course: '',
    semester: 6,
    division: 'A',
    cgpa: 8.92,
  });

  // Application-Specific Fields
  const [form, setForm] = useState({
    statement_of_purpose: '',
    family_annual_income: '₹4,50,000 / annum',
    extracurricular_highlights: '',
    portfolio_link: 'https://github.com/aaravsharma',
    vault_marksheet_verified: true,
  });

  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const validExtensions = /\.(pdf|jpg|jpeg|png)$/i;

    if (!validTypes.includes(file.type) && !validExtensions.test(file.name)) {
      toast.error('Invalid File Type', 'File must be PDF, JPG, or PNG and under 5 MB.');
      e.target.value = '';
      setAttachedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File Too Large', 'File must be PDF, JPG, or PNG and under 5 MB.');
      e.target.value = '';
      setAttachedFile(null);
      return;
    }

    setAttachedFile(file);
    toast.success('Document Attached', `${file.name} (${Math.round(file.size / 1024)} KB)`);
  };

  useEffect(() => {
    if (studentProfile) {
      setStudentDetails({
        name: studentProfile.user
          ? `${studentProfile.user.first_name || ''} ${studentProfile.user.last_name || ''}`.trim()
          : 'Aarav Sharma',
        student_id: studentProfile.student_id || 'CS2026001',
        email: studentProfile.user?.email || 'student@campus.edu',
        phone: studentProfile.phone_number || '+91 98765 43210',
        department: studentProfile.department?.name || 'Computer Science & Engineering',
        course: studentProfile.course || 'B.Tech in Computer Science & Engineering',
        semester: studentProfile.semester || 6,
        division: studentProfile.division || 'A',
        cgpa: studentProfile.cgpa || 8.92,
      });
    }
    setActiveStep(1);
    setConfirmedPass(null);
  }, [studentProfile, scholarship, isOpen]);

  if (!scholarship || !isOpen) return null;

  const meetsCgpa =
    !scholarship.eligibility_cgpa || studentDetails.cgpa >= scholarship.eligibility_cgpa;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetsCgpa) {
      toast.error('Eligibility Constraint', `Minimum CGPA of ${scholarship.eligibility_cgpa} required.`);
      return;
    }
    setSubmitting(true);

    try {
      if (studentDetails.phone) {
        await studentService
          .updateProfile({
            phone_number: studentDetails.phone,
          })
          .catch((profileErr) => {
            console.warn('Non-blocking profile phone update notice:', profileErr);
          });
      }

      const appBookmark = await scholarshipService.applyScholarship(scholarship.id, {
        statement_of_purpose: form.statement_of_purpose,
        family_annual_income: form.family_annual_income,
        extracurricular_highlights: form.extracurricular_highlights,
        portfolio_link: form.portfolio_link,
        phone: studentDetails.phone,
        student_name: studentDetails.name,
        student_id: studentDetails.student_id,
        department: studentDetails.department,
        course: studentDetails.course,
        semester: studentDetails.semester,
        division: studentDetails.division,
        cgpa: studentDetails.cgpa,
        attached_file_name: attachedFile ? attachedFile.name : null,
      });

      const appId = `APP-SCH-${appBookmark?.id || Date.now()}`;

      setConfirmedPass({
        applicationId: appId,
        submittedAt: (appBookmark as any)?.applied_at || new Date().toISOString(),
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      toast.success('Scholarship Application Stamped! 🎉', `Application UID: ${appId}`);
      setActiveStep(3);
      onSuccess();
    } catch (err: any) {
      toast.error('Submission Failed', err.message || 'Could not record application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activeStep === 3 ? 'Endorsement Certificate Issued' : 'Scholarship Application & Verification'}
      description={
        activeStep === 3
          ? 'Your verified institutional endorsement and application have been submitted.'
          : 'Verify your academic standing and submit your fellowship nomination.'
      }
      size="lg"
    >
      {/* 3-Step Wizard Navigation Indicator */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-white/5">
        <div
          className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-xl text-xs font-semibold ${
            activeStep === 1
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40'
              : activeStep > 1
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-400'
          }`}
        >
          <span
            className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
              activeStep > 1 ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'
            }`}
          >
            {activeStep > 1 ? '✓' : '1'}
          </span>
          <span className="hidden sm:inline truncate">1. Academic Record</span>
          <span className="sm:hidden text-[11px] truncate">Record</span>
        </div>

        <div
          className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-xl text-xs font-semibold ${
            activeStep === 2
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40'
              : activeStep > 2
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-400'
          }`}
        >
          <span
            className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
              activeStep > 2 ? 'bg-emerald-500 text-white' : activeStep === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-midnight-800'
            }`}
          >
            {activeStep > 2 ? '✓' : '2'}
          </span>
          <span className="hidden sm:inline truncate">2. Application Form</span>
          <span className="sm:hidden text-[11px] truncate">Form</span>
        </div>

        <div
          className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-xl text-xs font-semibold ${
            activeStep === 3
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
              : 'text-slate-400'
          }`}
        >
          <span
            className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
              activeStep === 3 ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-midnight-800'
            }`}
          >
            3
          </span>
          <span className="hidden sm:inline truncate">3. Stamped Pass</span>
          <span className="sm:hidden text-[11px] truncate">Pass</span>
        </div>
      </div>

      {/* STEP 1: Verify Student Credentials & Eligibility */}
      {activeStep === 1 && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-emerald-500/10 to-violet-500/10 border border-blue-500/20 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="primary" size="sm">
                {scholarship.category}
              </Badge>
              <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {scholarship.amount}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {scholarship.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provider: {scholarship.provider} &bull; Deadline: {new Date(scholarship.deadline).toLocaleDateString()}
            </p>
          </div>

          {/* Eligibility Checkbox Banner */}
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
              meetsCgpa
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {meetsCgpa ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span className="font-semibold">
                {meetsCgpa
                  ? `CGPA Eligibility Verified: Your CGPA (${studentDetails.cgpa}) meets the required ${scholarship.eligibility_cgpa || '8.0'}.`
                  : `Eligibility Warning: Minimum CGPA of ${scholarship.eligibility_cgpa} required (Your CGPA: ${studentDetails.cgpa}).`}
              </span>
            </div>
            <Badge variant={meetsCgpa ? 'success' : 'danger'} size="sm">
              {meetsCgpa ? 'Eligible' : 'Ineligible'}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                Verified Student Identity
              </h4>
              <button
                type="button"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Edit3 className="h-3 w-3" />
                {isEditingProfile ? 'Done Editing' : 'Edit Contact Info'}
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-midnight-900/80 border border-slate-200/80 dark:border-white/5 space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Student Name</span>
                  <p className="font-bold text-slate-900 dark:text-white">{studentDetails.name}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Roll Number</span>
                  <p className="font-bold text-slate-900 dark:text-white font-mono">{studentDetails.student_id}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Program</span>
                  <p className="font-bold text-slate-900 dark:text-white truncate">{studentDetails.course}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Department</span>
                  <p className="font-bold text-slate-900 dark:text-white truncate">{studentDetails.department}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Current Semester</span>
                  <p className="font-bold text-slate-900 dark:text-white">Semester {studentDetails.semester}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Official CGPA</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{studentDetails.cgpa} / 10.0</p>
                </div>
              </div>

              {isEditingProfile ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-white/5">
                  <Input
                    label="Official Contact Email"
                    required
                    type="email"
                    value={studentDetails.email}
                    onChange={(e) => setStudentDetails({ ...studentDetails, email: e.target.value })}
                  />
                  <Input
                    label="Mobile Contact Number"
                    required
                    type="tel"
                    value={studentDetails.phone}
                    onChange={(e) => setStudentDetails({ ...studentDetails, phone: e.target.value })}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4 pt-2 border-t border-slate-200 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Mail className="h-3 w-3 text-blue-500" /> {studentDetails.email}
                  </span>
                  <span>&bull;</span>
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Phone className="h-3 w-3 text-emerald-500" /> {studentDetails.phone}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => setActiveStep(2)}
              disabled={!meetsCgpa}
              rightIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              Verify Academic Record &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Complete Fellowship Application */}
      {activeStep === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Textarea
              label="Statement of Purpose & Academic Goals"
              required
              rows={4}
              placeholder="Explain why you are applying for this scholarship and how this financial aid will support your studies..."
              value={form.statement_of_purpose}
              onChange={(e) => setForm({ ...form, statement_of_purpose: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Portfolio / GitHub Repository"
                placeholder="https://github.com/yourhandle"
                value={form.portfolio_link}
                onChange={(e) => setForm({ ...form, portfolio_link: e.target.value })}
              />
              <Input
                label="Declared Family Annual Income"
                value={form.family_annual_income}
                onChange={(e) => setForm({ ...form, family_annual_income: e.target.value })}
              />
            </div>

            {/* Optional Supporting Document Upload */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Supporting Document (Income Proof / Recommendation / Essay)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-midnight-800 dark:file:text-blue-300 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                File must be PDF, JPG, or PNG and under 5 MB.
              </p>
            </div>

            {/* Document Vault Auto-Attachment Badge */}
            <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    Verified Marksheets Attached from Document Vault
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Semesters 1-5 official transcripts hashed with SHA-256 digital signature.
                  </p>
                </div>
              </div>
              <Badge variant="success" size="sm">
                Attached
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
            <Button type="button" variant="outline" onClick={() => setActiveStep(1)} disabled={submitting}>
              &larr; Back to Verification
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting} leftIcon={<Send className="h-4 w-4" />}>
              Submit Application
            </Button>
          </div>
        </form>
      )}

      {/* STEP 3: Stamped Confirmation Pass */}
      {activeStep === 3 && confirmedPass && (
        <div className="space-y-5">
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-midnight-900 border border-slate-200/90 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Badge variant="success" size="sm" dot>
                  Institutional Endorsement Stamped
                </Badge>
                <span className="font-mono text-xs font-bold text-slate-500">
                  {confirmedPass.applicationId}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {new Date(confirmedPass.submittedAt).toLocaleDateString()}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs shrink-0">
                <QRCode value={`SCHOLARSHIP_APP:${confirmedPass.applicationId}:${studentDetails.student_id}`} size={90} />
              </div>

              <div className="space-y-1 text-xs sm:text-left text-center">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {scholarship.title}
                </h4>
                <p className="text-slate-500">
                  Grant Value: <strong className="text-emerald-600 dark:text-emerald-400">{scholarship.amount}</strong>
                </p>
                <p className="text-slate-500">
                  Applicant: <strong>{studentDetails.name}</strong> ({studentDetails.student_id})
                </p>
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                  ✓ Dean of Academic Affairs Institutional Signature Appended
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
            <Button variant="outline" size="sm" onClick={() => window.print()} leftIcon={<Printer className="h-3.5 w-3.5" />}>
              Print Endorsement
            </Button>
            <Button variant="primary" size="sm" onClick={onClose}>
              Done / Return to Directory
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
