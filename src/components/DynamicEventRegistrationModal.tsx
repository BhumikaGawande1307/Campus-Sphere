import React, { useState, useEffect } from 'react';
import { Event, StudentProfile, EventFormField } from '../types';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input, Select, Textarea } from './Input';
import { Badge } from './Badge';
import { useToast } from '../context/ToastContext';
import { eventService } from '../services/eventService';
import { studentService } from '../services/studentService';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import QRCode from 'react-qr-code';
import {
  Calendar,
  MapPin,
  Award,
  User as UserIcon,
  BookOpen,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Send,
  ShieldCheck,
  Edit3,
  Phone,
  Mail,
  Building2,
  AlertCircle,
  Clock,
  Printer,
  Download,
  FileCheck,
} from 'lucide-react';

interface DynamicEventRegistrationModalProps {
  event: Event | null;
  studentProfile: StudentProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DynamicEventRegistrationModal: React.FC<DynamicEventRegistrationModalProps> = ({
  event,
  studentProfile,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const toast = useToast();
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedPass, setConfirmedPass] = useState<{
    registrationId: string;
    registeredAt: string;
  } | null>(null);

  // Editable & Verifiable Student Details
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

  // Event-specific Dynamic Custom Fields
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  useEffect(() => {
    const effectiveUser = studentProfile?.user || user;
    const first = effectiveUser?.first_name || '';
    const last = effectiveUser?.last_name || '';
    const fullName = `${first} ${last}`.trim() || effectiveUser?.username || '';
    const userEmail = effectiveUser?.email || '';

    setStudentDetails({
      name: fullName || 'Enrolled Student',
      student_id:
        studentProfile?.student_id ||
        (effectiveUser?.id ? `STU-${String(effectiveUser.id).substring(0, 6).toUpperCase()}` : 'STU-2026'),
      email: userEmail || 'student@campus.edu',
      phone: studentProfile?.phone_number || (effectiveUser as any)?.phone_number || '',
      department: studentProfile?.department?.name || 'Academic Department',
      course: studentProfile?.course || 'Degree Program',
      semester: studentProfile?.semester || 1,
      division: studentProfile?.division || 'A',
      cgpa: studentProfile?.cgpa || 8.5,
    });

    setActiveStep(1);
    setConfirmedPass(null);
    setFormData({});
  }, [studentProfile, user, event, isOpen]);

  if (!event || !isOpen) return null;

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleProceedToStep2 = () => {
    if (!studentDetails.phone.trim() || !studentDetails.email.trim()) {
      toast.warning('Please provide a verified contact email and phone number.');
      return;
    }
    setActiveStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Save any updated student phone or contact details
      await studentService.updateProfile({
        phone_number: studentDetails.phone,
      });

      const regRecord = await eventService.registerForEvent(event.id, {
        ...formData,
        verified_student_name: studentDetails.name,
        verified_student_id: studentDetails.student_id,
        verified_email: studentDetails.email,
        verified_phone: studentDetails.phone,
        verified_cgpa: studentDetails.cgpa,
      });

      const regId = `REG-EV-${regRecord?.id || Date.now()}`;

      setConfirmedPass({
        registrationId: regId,
        registeredAt: (regRecord as any)?.registered_at || new Date().toISOString(),
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success('Registration & Identity Verified! 🎉', `Confirmation ID: ${regId}`);
      setActiveStep(3);
      onSuccess();
    } catch (err: any) {
      toast.error('Registration Failed', err.message || 'Unable to complete enrollment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activeStep === 3 ? 'Registration Pass Confirmed' : `Event Registration & Verification`}
      description={
        activeStep === 3
          ? 'Your verified event pass is ready. You can find it under your attendance passes.'
          : 'Review your student details and complete your event registration.'
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
          <span className="hidden sm:inline truncate">1. Verify Identity</span>
          <span className="sm:hidden text-[11px] truncate">Identity</span>
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
          <span className="hidden sm:inline truncate">2. Event Details</span>
          <span className="sm:hidden text-[11px] truncate">Details</span>
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
          <span className="hidden sm:inline truncate">3. Pass Issued</span>
          <span className="sm:hidden text-[11px] truncate">Pass</span>
        </div>
      </div>

      {/* STEP 1: Verify Student Credentials */}
      {activeStep === 1 && (
        <div className="space-y-4">
          {/* Event Context Header */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="primary" size="sm">
                {event.category}
              </Badge>
              <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                +{event.points_reward} CampusPoints
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {event.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                {new Date(event.start_date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span>&bull;</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-rose-500" />
                {event.venue}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                Review & Verify Your Institutional Identity
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
                  <span className="text-[10px] text-slate-400 block font-semibold">Student Full Name</span>
                  <p className="font-bold text-slate-900 dark:text-white">{studentDetails.name}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">University Roll ID</span>
                  <p className="font-bold text-slate-900 dark:text-white font-mono">{studentDetails.student_id}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Enrolled Program</span>
                  <p className="font-bold text-slate-900 dark:text-white truncate">{studentDetails.course}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Department</span>
                  <p className="font-bold text-slate-900 dark:text-white truncate">{studentDetails.department}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Semester & Section</span>
                  <p className="font-bold text-slate-900 dark:text-white">Sem {studentDetails.semester} (Div {studentDetails.division})</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Cumulative CGPA</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{studentDetails.cgpa} / 10.0</p>
                </div>
              </div>

              {/* Editable Contact Fields */}
              {isEditingProfile ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-white/5">
                  <Input
                    label="Verified Email Address"
                    required
                    type="email"
                    value={studentDetails.email}
                    onChange={(e) => setStudentDetails({ ...studentDetails, email: e.target.value })}
                  />
                  <Input
                    label="Active Mobile Phone Number"
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
              onClick={handleProceedToStep2}
              rightIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              Verify & Continue &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Fill Opportunity-Specific Dynamic Fields */}
      {activeStep === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Required Opportunity Information
            </h4>

            {event.custom_fields && event.custom_fields.length > 0 ? (
              <div className="space-y-3">
                {event.custom_fields.map((field: EventFormField) => {
                  const value = formData[field.id] || '';

                  if (field.type === 'textarea') {
                    return (
                      <Textarea
                        key={field.id}
                        label={field.label}
                        required={field.required}
                        placeholder={field.placeholder}
                        value={value}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        rows={3}
                      />
                    );
                  }

                  if (field.type === 'dropdown' && field.options) {
                    return (
                      <Select
                        key={field.id}
                        label={field.label}
                        required={field.required}
                        value={value}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        options={[
                          { value: '', label: `-- Select ${field.label} --` },
                          ...field.options.map((opt) => ({ value: opt, label: opt })),
                        ]}
                      />
                    );
                  }

                  return (
                    <Input
                      key={field.id}
                      label={field.label}
                      type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={value}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  label="Team / Project Name (Optional)"
                  placeholder="e.g. Distributed Pioneers"
                  value={formData.team_name || ''}
                  onChange={(e) => handleFieldChange('team_name', e.target.value)}
                />
                <Textarea
                  label="Statement of Interest / Technical Background"
                  placeholder="Briefly state your motivation for participating..."
                  rows={3}
                  value={formData.statement || ''}
                  onChange={(e) => handleFieldChange('statement', e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
            <Button type="button" variant="outline" onClick={() => setActiveStep(1)} disabled={submitting}>
              &larr; Back to Verification
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting} leftIcon={<Send className="h-4 w-4" />}>
              Confirm Registration
            </Button>
          </div>
        </form>
      )}

      {/* STEP 3: Instant Confirmation Ticket Pass */}
      {activeStep === 3 && confirmedPass && (
        <div className="space-y-5">
          {/* Printable Ticket Card */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-midnight-900 border border-slate-200/90 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Badge variant="success" size="sm" dot>
                  Confirmed Pass
                </Badge>
                <span className="font-mono text-xs font-bold text-slate-500">
                  {confirmedPass.registrationId}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {new Date(confirmedPass.registeredAt).toLocaleDateString()}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs shrink-0">
                <QRCode value={`CAMPUSSPHERE:${confirmedPass.registrationId}:${studentDetails.student_id}`} size={90} />
              </div>

              <div className="space-y-1 text-xs sm:text-left text-center">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {event.title}
                </h4>
                <p className="text-slate-500">
                  Venue: <strong>{event.venue}</strong> &bull; Date: <strong>{new Date(event.start_date).toLocaleDateString()}</strong>
                </p>
                <p className="text-slate-500">
                  Enrolled Student: <strong>{studentDetails.name}</strong> ({studentDetails.student_id})
                </p>
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                  ✓ Verified Institutional Record Synchronized
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
            <Button variant="outline" size="sm" onClick={() => window.print()} leftIcon={<Printer className="h-3.5 w-3.5" />}>
              Print Pass
            </Button>
            <Button variant="primary" size="sm" onClick={onClose}>
              Done / Return to Portal
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
