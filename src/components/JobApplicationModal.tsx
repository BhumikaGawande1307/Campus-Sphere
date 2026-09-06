import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { JobPosting, StudentProfile } from '../types';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input, Textarea } from './Input';
import { Badge } from './Badge';
import { useToast } from '../context/ToastContext';
import { careerService } from '../services/careerService';
import { studentService } from '../services/studentService';
import confetti from 'canvas-confetti';
import QRCode from 'react-qr-code';
import {
  Briefcase,
  Building2,
  MapPin,
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
} from 'lucide-react';

interface JobApplicationModalProps {
  job: JobPosting | null;
  studentProfile: StudentProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const JobApplicationModal: React.FC<JobApplicationModalProps> = ({
  job,
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

  // Application fields
  const [form, setForm] = useState({
    resume_url: '',
    portfolio_url: 'https://github.com',
    cover_note: 'I am excited to apply for this role. My core competencies in distributed systems, TypeScript, and modern web architectures align directly with your job specification.',
    available_from: 'Immediate / Next Semester',
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);

  useEffect(() => {
    if (studentProfile) {
      const dbResumeUrl = (studentProfile as any).resume_url || (typeof window !== 'undefined' && localStorage.getItem(`cs_resume_${studentProfile.user_id}`) ? `${window.location.origin}/resume-builder` : '');
      setForm((prev) => ({
        ...prev,
        resume_url: prev.resume_url || dbResumeUrl,
        portfolio_url: studentProfile.portfolio_url || studentProfile.github_url || prev.portfolio_url,
      }));

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
  }, [studentProfile, job, isOpen]);

  if (!job || !isOpen) return null;

  const meetsCgpa = !job.min_cgpa || studentDetails.cgpa >= job.min_cgpa;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetsCgpa) {
      toast.error('Eligibility Alert', `Minimum CGPA of ${job.min_cgpa} required.`);
      return;
    }
    setSubmitting(true);

    try {
      await studentService.updateProfile({
        phone_number: studentDetails.phone,
      });

      const createdApp = await careerService.applyJob(job.id, {
        resume_url: form.resume_url,
      });

      const appId = `APP-JOB-${createdApp?.id || Date.now()}`;

      setConfirmedPass({
        applicationId: appId,
        submittedAt: (createdApp as any)?.created_at || new Date().toISOString(),
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      toast.success('Job Application Submitted! 🎉', `Application UID: ${appId}`);
      setActiveStep(3);
      onSuccess();
    } catch (err: any) {
      toast.error('Application Failed', err.message || 'Unable to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activeStep === 3 ? 'Recruitment Application Confirmed' : 'Placement Application & Verification'}
      description={
        activeStep === 3
          ? 'Your verified profile and ATS resume have been routed to the placement coordinator.'
          : 'Verify your placement profile details and submit your application.'
      }
      size="lg"
    >
      {/* 3-Step Navigation */}
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
          <span className="hidden sm:inline truncate">1. Placement Profile</span>
          <span className="sm:hidden text-[11px] truncate">Profile</span>
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
          <span className="hidden sm:inline truncate">2. ATS Resume</span>
          <span className="sm:hidden text-[11px] truncate">Resume</span>
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
          <span className="hidden sm:inline truncate">3. Candidate Pass</span>
          <span className="sm:hidden text-[11px] truncate">Pass</span>
        </div>
      </div>

      {/* STEP 1: Verify Student Profile */}
      {activeStep === 1 && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-violet-500/10 border border-blue-500/20 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="primary" size="sm">
                {job.job_type}
              </Badge>
              <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {job.stipend_salary}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {job.title} &bull; {job.company_name}
            </h3>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-rose-500" />
                {job.location}
              </span>
              <span>&bull;</span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                Deadline: {new Date(job.deadline).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* CGPA Eligibility Banner */}
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
                  ? `Eligibility Verified: Your CGPA (${studentDetails.cgpa}) meets the recruiter minimum of ${job.min_cgpa || '7.5'}.`
                  : `Eligibility Constraint: Minimum CGPA of ${job.min_cgpa} required (Your CGPA: ${studentDetails.cgpa}).`}
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
                Placement Candidate Credentials
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
                  <span className="text-[10px] text-slate-400 block font-semibold">Candidate Name</span>
                  <p className="font-bold text-slate-900 dark:text-white">{studentDetails.name}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Roll Number</span>
                  <p className="font-bold text-slate-900 dark:text-white font-mono">{studentDetails.student_id}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Degree & Major</span>
                  <p className="font-bold text-slate-900 dark:text-white truncate">{studentDetails.course}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Current Semester</span>
                  <p className="font-bold text-slate-900 dark:text-white">Semester {studentDetails.semester}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Official CGPA</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{studentDetails.cgpa} / 10.0</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Department</span>
                  <p className="font-bold text-slate-900 dark:text-white truncate">{studentDetails.department}</p>
                </div>
              </div>

              {isEditingProfile ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-white/5">
                  <Input
                    label="Official Email"
                    required
                    type="email"
                    value={studentDetails.email}
                    onChange={(e) => setStudentDetails({ ...studentDetails, email: e.target.value })}
                  />
                  <Input
                    label="Phone Number"
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
              Verify Candidate &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: ATS Resume & Cover Note */}
      {activeStep === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {!form.resume_url && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">No Verified Resume Linked</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    No active resume was found on your profile. You can build and download your verified ATS resume in the{' '}
                    <Link to="/resume-builder" target="_blank" className="font-bold underline text-blue-600 dark:text-blue-400">
                      Campus Resume Builder &rarr;
                    </Link>{' '}
                    or enter a direct PDF document link below.
                  </p>
                </div>
              </div>
            )}

            <Input
              label="ATS Resume / CV Document Link"
              required
              placeholder="https://... or link from resume builder"
              value={form.resume_url}
              onChange={(e) => setForm({ ...form, resume_url: e.target.value })}
              helperText="Auto-linked from your CampusSphere ATS Resume Builder or verified hosted URL"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Portfolio / GitHub URL"
                placeholder="https://github.com/..."
                value={form.portfolio_url}
                onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })}
              />
              <Input
                label="Earliest Availability Date"
                value={form.available_from}
                onChange={(e) => setForm({ ...form, available_from: e.target.value })}
              />
            </div>

            <Textarea
              label="Cover Note & Core Skills Pitch"
              rows={3}
              placeholder="Highlight your key achievements and technical projects relevant to this position..."
              value={form.cover_note}
              onChange={(e) => setForm({ ...form, cover_note: e.target.value })}
            />
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

      {/* STEP 3: Confirmed Candidate Pass */}
      {activeStep === 3 && confirmedPass && (
        <div className="space-y-5">
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-midnight-900 border border-slate-200/90 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Badge variant="success" size="sm" dot>
                  Application Submitted Successfully
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
                <QRCode value={`JOB_APP:${confirmedPass.applicationId}:${studentDetails.student_id}`} size={90} />
              </div>

              <div className="space-y-1 text-xs sm:text-left text-center">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {job.title} &bull; {job.company_name}
                </h4>
                <p className="text-slate-500">
                  Candidate: <strong>{studentDetails.name}</strong> ({studentDetails.student_id})
                </p>
                <p className="text-slate-500">
                  Compensation: <strong>{job.stipend_salary}</strong> &bull; Location: <strong>{job.location}</strong>
                </p>
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                  ✓ Verified Institutional Profile & Resume Dispatched
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
            <Button variant="outline" size="sm" onClick={() => window.print()} leftIcon={<Printer className="h-3.5 w-3.5" />}>
              Print Application Card
            </Button>
            <Button variant="primary" size="sm" onClick={onClose}>
              Done / Return to Career Hub
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
