import React, { useState, useEffect } from 'react';
import { Scholarship, ScholarshipCategory } from '../types';
import { scholarshipService } from '../services/scholarshipService';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input, Textarea } from './Input';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Building2,
  IndianRupee,
  Calendar,
  Award,
  CheckCircle2,
  Plus,
  X,
  ArrowRight,
  ArrowLeft,
  FileText,
  Clock,
  ShieldCheck,
  Globe,
  Tag,
  Check,
  Layers,
  GraduationCap,
} from 'lucide-react';

interface PublishScholarshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingScholarship?: Scholarship | null;
}

const CATEGORY_OPTIONS: Array<{ value: ScholarshipCategory; label: string }> = [
  { value: 'Merit-Based', label: '🏆 Merit-Based Academic Excellence' },
  { value: 'Need-Based', label: '🤝 Need-Based & Financial Aid' },
  { value: 'Women in Tech', label: '👩‍💻 Women in Technology & STEM' },
  { value: 'Research & Innovation', label: '🔬 Research & Innovation Grant' },
  { value: 'Corporate Endowment', label: '🏢 Corporate Industry Grant' },
  { value: 'Government', label: '🏛️ State / National Government Scheme' },
];

const SPONSOR_PRESETS = [
  'State Department of Higher Education',
  'National Merit Foundation',
  'Google Inc. Global Tech Scholars',
  'Microsoft Research University Fellowship',
  'Amazon Future Engineer Initiative',
  'University Alumni Scholarship Trust',
];

const AMOUNT_PRESETS = [
  '₹25,000 / Academic Year',
  '₹50,000 / Academic Year',
  '₹75,000 / Academic Year',
  '₹1,00,000 / Academic Year',
  '₹1,50,000 / Academic Year',
  '100% Tuition Fee Waiver',
];

const DOCUMENT_SUGGESTIONS = [
  'Resume / CV',
  'Official Semester Marksheets',
  'Personal Statement / SOP',
  'Income Certificate',
  'Letter of Recommendation',
  'Institutional ID Proof',
  'Research Proposal',
  'Caste / Category Certificate',
];

export const PublishScholarshipModal: React.FC<PublishScholarshipModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingScholarship,
}) => {
  const toast = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    provider: '',
    amount: '₹50,000 / Academic Year',
    category: 'Merit-Based' as ScholarshipCategory,
    deadline: '',
    eligibility_cgpa: 7.5,
    department_name: 'All Academic Departments',
    academic_level: 'Undergraduate & Postgraduate (All Semesters)',
    description: '',
    benefits: '',
    requirements: '',
    application_process: '',
    official_link: '',
    required_documents: [] as string[],
    is_featured: false,
  });

  const [customDocInput, setCustomDocInput] = useState('');

  useEffect(() => {
    if (editingScholarship) {
      setForm({
        title: editingScholarship.title,
        provider: editingScholarship.provider,
        amount: editingScholarship.amount,
        category: editingScholarship.category,
        deadline: editingScholarship.deadline ? editingScholarship.deadline.substring(0, 16) : '',
        eligibility_cgpa: editingScholarship.eligibility_cgpa || 7.5,
        department_name: editingScholarship.department_name || 'All Academic Departments',
        academic_level: editingScholarship.academic_level || 'Undergraduate & Postgraduate (All Semesters)',
        description: editingScholarship.description || '',
        benefits: editingScholarship.benefits || '',
        requirements: editingScholarship.requirements || '',
        application_process: editingScholarship.application_process || '',
        official_link: editingScholarship.official_link || '',
        required_documents: editingScholarship.required_documents || [
          'Resume / CV',
          'Official Semester Marksheets',
          'Personal Statement',
        ],
        is_featured: editingScholarship.is_featured || false,
      });
    } else {
      // Defaults for a new listing
      const defaultDate = new Date(Date.now() + 30 * 86400000);
      setForm({
        title: '',
        provider: '',
        amount: '₹50,000 / Academic Year',
        category: 'Merit-Based',
        deadline: defaultDate.toISOString().substring(0, 16),
        eligibility_cgpa: 7.5,
        department_name: 'All Academic Departments',
        academic_level: 'Undergraduate & Postgraduate (All Semesters)',
        description:
          'Scholarship grant designed to support outstanding academic performance, leadership, and student contributions.',
        benefits:
          'Direct grant payout, award certificate, and priority consideration for campus projects.',
        requirements:
          'Enrolled full-time student in an approved university program, minimum CGPA standing, and no disciplinary actions.',
        application_process:
          '1. Submit online application with required marksheets.\n2. Faculty committee reviews applications.\n3. Final grant payout and results announcement.',
        official_link: 'https://scholarships.gov.in',
        required_documents: ['Resume / CV', 'Official Semester Marksheets', 'Personal Statement'],
        is_featured: false,
      });
    }
    setStep(1);
  }, [editingScholarship, isOpen]);

  if (!isOpen) return null;

  // Deadline Presets
  const setDeadlineDays = (days: number) => {
    const d = new Date(Date.now() + days * 86400000);
    setForm((prev) => ({ ...prev, deadline: d.toISOString().substring(0, 16) }));
  };

  // Add / Remove Document Tag
  const toggleDoc = (doc: string) => {
    setForm((prev) => {
      const exists = prev.required_documents.includes(doc);
      if (exists) {
        return { ...prev, required_documents: prev.required_documents.filter((d) => d !== doc) };
      } else {
        return { ...prev, required_documents: [...prev.required_documents, doc] };
      }
    });
  };

  const handleAddCustomDoc = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customDocInput.trim()) return;
    if (!form.required_documents.includes(customDocInput.trim())) {
      setForm((prev) => ({
        ...prev,
        required_documents: [...prev.required_documents, customDocInput.trim()],
      }));
    }
    setCustomDocInput('');
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.provider.trim()) {
      toast.error('Required Information', 'Please provide a title and sponsoring organization.');
      setStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<Scholarship> = {
        title: form.title.trim(),
        provider: form.provider.trim(),
        amount: form.amount.trim(),
        category: form.category,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : new Date().toISOString(),
        eligibility_cgpa: Number(form.eligibility_cgpa),
        department_name: form.department_name.trim(),
        academic_level: form.academic_level.trim(),
        description: form.description.trim(),
        benefits: form.benefits.trim(),
        requirements: form.requirements.trim(),
        application_process: form.application_process.trim(),
        official_link: form.official_link.trim(),
        required_documents: form.required_documents,
        is_featured: form.is_featured,
      };

      if (editingScholarship) {
        await scholarshipService.updateScholarship(editingScholarship.id, payload);
        toast.success('Scholarship Updated', `"${form.title}" has been saved.`);
      } else {
        await scholarshipService.createScholarship(payload);
        confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 } });
        toast.success('Scholarship Published! 🎓', `"${form.title}" is now available to students.`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Submission Failed', err.message || 'Could not save scholarship listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingScholarship ? 'Edit Scholarship Listing' : 'Publish Scholarship & Financial Opportunity'}
      description="Configure grant details, eligibility parameters, and document requirements with live card preview."
      size="xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Stepper Form */}
        <div className="lg:col-span-7 space-y-5">
          {/* Stepper Progress Indicator */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {[
              { num: 1, title: 'Identity & Funding' },
              { num: 2, title: 'Eligibility & Dates' },
              { num: 3, title: 'Criteria & Checklist' },
            ].map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setStep(s.num as any)}
                className={`flex flex-col items-start p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border text-left transition-all ${
                  step === s.num
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                    : step > s.num
                    ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'border-slate-200 dark:border-white/10 text-slate-400 font-medium'
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider">
                  <span>Step {s.num}</span>
                  {step > s.num && <Check className="h-3 w-3 text-emerald-500" />}
                </div>
                <span className="text-xs truncate w-full hidden sm:block font-bold leading-tight mt-0.5">{s.title}</span>
                <span className="text-[11px] truncate w-full sm:hidden font-bold leading-tight mt-0.5">
                  {s.num === 1 ? 'Funding' : s.num === 2 ? 'Dates' : 'Criteria'}
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* STEP 1: IDENTITY & FUNDING */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <Input
                  label="Scholarship Title"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Merit-Cum-Means Engineering Fellowship 2026"
                />

                <div className="space-y-1.5">
                  <Input
                    label="Sponsoring Organization / Provider"
                    required
                    value={form.provider}
                    onChange={(e) => setForm({ ...form, provider: e.target.value })}
                    placeholder="e.g. State Government / Google Tech / AWS"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400">Presets:</span>
                    {SPONSOR_PRESETS.slice(0, 3).map((sp) => (
                      <button
                        key={sp}
                        type="button"
                        onClick={() => setForm({ ...form, provider: sp })}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-midnight-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
                      >
                        + {sp.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Input
                    label="Grant / Award Value"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="e.g. ₹50,000 / Academic Year or ₹1,50,000"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400">Presets:</span>
                    {AMOUNT_PRESETS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setForm({ ...form, amount: amt })}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 hover:bg-emerald-100 transition-colors"
                      >
                        {amt.split('/')[0].trim()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Official External Application URL"
                    type="url"
                    value={form.official_link}
                    onChange={(e) => setForm({ ...form, official_link: e.target.value })}
                    placeholder="https://scholarships.gov.in"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: ELIGIBILITY & DATES */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Minimum CGPA Requirement ({form.eligibility_cgpa})
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="5.0"
                      max="10.0"
                      value={form.eligibility_cgpa}
                      onChange={(e) => setForm({ ...form, eligibility_cgpa: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-1 mt-1">
                      {[6.5, 7.0, 7.5, 8.0, 8.5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setForm({ ...form, eligibility_cgpa: val })}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            form.eligibility_cgpa === val
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-midnight-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Input
                      label="Application Deadline"
                      type="datetime-local"
                      required
                      value={form.deadline}
                      onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    />
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] font-bold text-slate-400">Quick set:</span>
                      {[
                        { label: '+15 Days', days: 15 },
                        { label: '+30 Days', days: 30 },
                        { label: '+60 Days', days: 60 },
                        { label: '+90 Days', days: 90 },
                      ].map((d) => (
                        <button
                          key={d.label}
                          type="button"
                          onClick={() => setDeadlineDays(d.days)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-midnight-800 text-slate-600 dark:text-slate-300 hover:text-blue-600"
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Eligible Departments"
                    value={form.department_name}
                    onChange={(e) => setForm({ ...form, department_name: e.target.value })}
                    placeholder="e.g. All Engineering Departments"
                  />
                  <Input
                    label="Eligible Academic Level"
                    value={form.academic_level}
                    onChange={(e) => setForm({ ...form, academic_level: e.target.value })}
                    placeholder="e.g. Undergraduate & Postgraduate (All Years)"
                  />
                </div>

                <Textarea
                  label="Specific Eligibility Requirements"
                  rows={3}
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  placeholder="Enrolled in an accredited program, family income below threshold, no backlogs..."
                />
              </div>
            )}

            {/* STEP 3: CRITERIA & CHECKLIST */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <Textarea
                  label="Program Overview & Mission"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Summary of the scholarship mission and fellowship vision..."
                />

                <Textarea
                  label="Benefits & Award Breakdown"
                  rows={2}
                  value={form.benefits}
                  onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                  placeholder="Annual stipend, mentorship, certificate, laptop grant..."
                />

                {/* Required Documents Tag Builder */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-midnight-950 border border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Required Documents ({form.required_documents.length})
                    </label>
                    <span className="text-[10px] text-slate-400">Click chips to toggle</span>
                  </div>

                  {/* Preset Suggestions */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {DOCUMENT_SUGGESTIONS.map((doc) => {
                      const isSelected = form.required_documents.includes(doc);
                      return (
                        <button
                          key={doc}
                          type="button"
                          onClick={() => toggleDoc(doc)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-white dark:bg-midnight-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-blue-400'
                          }`}
                        >
                          {isSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3 text-slate-400" />}
                          <span>{doc}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Document Input */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-white/5">
                    <input
                      type="text"
                      value={customDocInput}
                      onChange={(e) => setCustomDocInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomDoc();
                        }
                      }}
                      placeholder="Add custom required document..."
                      className="flex-1 px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <Button type="button" size="sm" variant="outline" onClick={handleAddCustomDoc}>
                      Add Tag
                    </Button>
                  </div>
                </div>

                <Textarea
                  label="Step-by-Step Application Process"
                  rows={2}
                  value={form.application_process}
                  onChange={(e) => setForm({ ...form, application_process: e.target.value })}
                  placeholder="1. Online form. 2. Document verification. 3. Interview / Committee review."
                />
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/10">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep((step - 1) as any)}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Previous
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                  Cancel
                </Button>
              )}

              {step < 3 ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setStep((step + 1) as any)}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="submit"
                  isLoading={submitting}
                  leftIcon={<Sparkles className="h-4 w-4" />}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {editingScholarship ? 'Save Changes' : 'Publish Listing Now'}
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Right Side: Live Interactive Student Card Preview */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              Live Student Card Preview
            </h4>
            <span className="text-[10px] text-slate-400">Real-time mock</span>
          </div>

          {/* Rendered Mock Card */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-midnight-900/95 p-5 shadow-lg relative overflow-hidden space-y-3.5">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500" />

            <div className="flex items-center justify-between gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/60">
                {form.category}
              </span>
              <span className="text-[11px] font-bold text-slate-400 font-mono">
                {form.deadline
                  ? `${Math.max(
                      0,
                      Math.ceil((new Date(form.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    )} days left`
                  : '30 days left'}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug line-clamp-2">
                {form.title || 'Scholarship Title Preview...'}
              </h3>
              <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span>{form.provider || 'Sponsoring Organization'}</span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                Scholarship & Grant Amount
              </span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {form.amount || '₹50,000 / Year'}
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-midnight-950 border border-slate-100 dark:border-white/5">
                <span className="text-[11px] text-slate-400">Min CGPA:</span>
                <span className="font-bold font-mono text-xs text-emerald-600 dark:text-emerald-400">
                  ≥ {form.eligibility_cgpa}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-midnight-950 border border-slate-100 dark:border-white/5">
                <span className="text-[11px] text-slate-400">Documents:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {form.required_documents.length} Items Required
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">Details Modal</span>
              <div className="flex items-center gap-1.5">
                <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-midnight-800 text-slate-600 dark:text-slate-300">
                  Save
                </span>
                <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-xs">
                  Apply Now
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-midnight-900/50 border border-slate-200/80 dark:border-white/5 text-[11px] text-slate-500 space-y-1">
            <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Administrative Publishing Guarantee
            </p>
            <p>
              Once published, this listing instantly appears on student dashboards, search indexes, and mobile notifications.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
