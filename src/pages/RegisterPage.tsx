import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  GraduationCap,
  Hash,
  CheckCircle2,
  AlertCircle,
  Building2,
  Edit3,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { AuthLayout } from '../layouts/AuthLayout';
import { PasswordRequirements, getPasswordStrength } from '../components/PasswordRequirements';

/* ── Step definitions ──────────────────────────────────────── */
const steps = ['Account Credentials', 'Academic Profile'] as const;

interface DepartmentItem {
  id: number | string;
  name: string;
  code: string;
}

/* ── Field errors type ─────────────────────────────────────── */
interface FieldErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  student_id?: string;
  custom_department?: string;
}

export const RegisterPage: React.FC = () => {
  const [step, setStep] = useState(0);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    student_id: '',
    department: '1',
    custom_department: '',
    course: 'B.Tech in Computer Science',
    year: 1,
    semester: 1,
    division: 'A',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  /* ── Load Dynamic Departments from Supabase ───────────────── */
  useEffect(() => {
    let isMounted = true;
    const fetchDepartments = async () => {
      setLoadingDepts(true);
      try {
        const list = await authService.getDepartments();
        if (isMounted && list && list.length > 0) {
          setDepartments(list);
          setFormData((prev) => ({
            ...prev,
            department: prev.department === '1' ? String(list[0].id) : prev.department,
          }));
        }
      } catch (err) {
        console.warn('Could not load departments dynamically:', err);
      } finally {
        if (isMounted) setLoadingDepts(false);
      }
    };

    fetchDepartments();
    return () => {
      isMounted = false;
    };
  }, []);

  /* ── Handlers ─────────────────────────────────────────── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const passwordStrength = getPasswordStrength(formData.password);

  /* ── Step 1 validation ────────────────────────────────── */
  const validateStep1 = (): boolean => {
    const errors: FieldErrors = {};
    if (!formData.first_name.trim()) errors.first_name = 'First name is required.';
    if (!formData.last_name.trim()) errors.last_name = 'Last name is required.';
    if (!formData.email.trim()) errors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = 'Please enter a valid email address.';
    if (!formData.password) errors.password = 'Password is required.';
    else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters.';
    if (!formData.confirmPassword) errors.confirmPassword = 'Please confirm your password.';
    else if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = 'Passwords do not match.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ── Step 2 validation ────────────────────────────────── */
  const validateStep2 = (): boolean => {
    const errors: FieldErrors = {};
    if (!formData.student_id.trim()) errors.student_id = 'Student ID / Roll Number is required.';

    if (formData.department === 'OTHER' && !formData.custom_department.trim()) {
      errors.custom_department = 'Please enter your department name.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const goNext = () => {
    if (step === 0 && validateStep1()) setStep(1);
  };

  /* ── Register handler ────────────────────────────────── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const regData = {
        username: formData.email.split('@')[0],
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: 'STUDENT' as const,
        student_id: formData.student_id,
        department: formData.department,
        custom_department: formData.department === 'OTHER' ? formData.custom_department.trim() : undefined,
        course:
          formData.course ||
          (formData.department === 'OTHER' && formData.custom_department
            ? `B.Tech in ${formData.custom_department.trim()}`
            : undefined),
        year: Number(formData.year),
        semester: Number(formData.semester),
        division: formData.division,
      };

      const res = await register(regData);

      if (res.access?.startsWith('pending-')) {
        toast.success('Account Created!', 'Check your email to verify your account.');
        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
        return;
      }

      toast.success('Welcome to CampusSphere!');
      navigate('/dashboard/student');
    } catch (err: any) {
      const msg = err?.message || 'Could not create your account.';
      if (msg.toLowerCase().includes('already')) {
        toast.error('Email Already Registered', 'An account with this email already exists. Please sign in instead.');
      } else {
        toast.error('Registration Failed', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Inline error display helper ──────────────────────── */
  const FieldError: React.FC<{ error?: string }> = ({ error }) =>
    error ? (
      <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-0.5 animate-fade-in">
        <AlertCircle className="h-3 w-3 shrink-0" />
        {error}
      </p>
    ) : null;

  /* ── Input class helper ───────────────────────────────── */
  const inputClass = (hasError: boolean) =>
    `w-full pl-9 pr-3.5 py-1.5 sm:py-2 rounded-xl border-2 text-xs sm:text-sm bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
      hasError
        ? 'border-rose-400 focus:ring-rose-500/20'
        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus:ring-violet-500/20 focus:border-violet-500'
    }`;

  /* ── Select component with consistent styling ─────────── */
  const StyledSelect: React.FC<{
    label: string;
    name: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: Array<{ value: string | number; label: string }>;
    id: string;
  }> = ({ label, name, value, onChange, options, id }) => (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full px-3 py-1.5 sm:py-2 pr-7 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all appearance-none cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );

  return (
    <AuthLayout
      title={'Join Your Campus\nDigital Workspace.'}
      subtitle="Create your student account to manage your classes, attendance, marks, and career tools."
      badge="Student Enrollment Open"
      maxWidth="max-w-[450px]"
    >
      <div>
        {/* Heading */}
        <div className="mb-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/30 border border-violet-200/60 dark:border-violet-700/40 text-[10px] font-bold text-violet-700 dark:text-violet-300 mb-1.5">
            <Sparkles className="h-2.5 w-2.5 text-violet-500" />
            <span>New Student Onboarding</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
            Create your profile
          </h2>
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Step {step + 1} of {steps.length} —{' '}
            <span className="font-bold text-violet-600 dark:text-violet-400">
              {steps[step]}
            </span>
          </p>
        </div>

        {/* Step progress indicator */}
        <div className="flex items-center gap-2 mb-3">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-1.5 shrink-0 ${i <= step ? 'opacity-100' : 'opacity-40'}`}>
                <div
                  className={`h-5 w-5 sm:h-5.5 sm:w-5.5 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all shrink-0 ${
                    i < step
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm'
                      : i === step
                      ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white ring-2 ring-violet-500/25 shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {i < step ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                </div>
                <span
                  className={`text-[10.5px] font-bold whitespace-nowrap ${
                    i === step ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                  }`}
                >
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 rounded-full transition-all min-w-[16px] ${
                    i < step ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── STEP 1: Account ──────────────────────────── */}
        {step === 0 && (
          <div className="space-y-2">
            {/* Name fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="reg-first-name" className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                  <input
                    id="reg-first-name"
                    type="text"
                    name="first_name"
                    autoComplete="given-name"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Aarav"
                    className={inputClass(!!fieldErrors.first_name)}
                  />
                </div>
                <FieldError error={fieldErrors.first_name} />
              </div>
              <div className="space-y-1">
                <label htmlFor="reg-last-name" className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                  <input
                    id="reg-last-name"
                    type="text"
                    name="last_name"
                    autoComplete="family-name"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Sharma"
                    className={inputClass(!!fieldErrors.last_name)}
                  />
                </div>
                <FieldError error={fieldErrors.last_name} />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label htmlFor="reg-email" className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Institutional Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input
                  id="reg-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@university.edu"
                  className={inputClass(!!fieldErrors.email)}
                />
              </div>
              <FieldError error={fieldErrors.email} />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label htmlFor="reg-password" className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className={`w-full pl-9 pr-9 py-1.5 sm:py-2 rounded-xl border-2 text-xs sm:text-sm bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    fieldErrors.password
                      ? 'border-rose-400 focus:ring-rose-500/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus:ring-violet-500/20 focus:border-violet-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <FieldError error={fieldErrors.password} />

              {/* Password strength bar */}
              {formData.password && (
                <div className="space-y-0.5 pt-0.5">
                  <div className="h-1 w-full bg-gray-150 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${passwordStrength.barColor}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  <p className={`text-[9px] font-bold ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label htmlFor="reg-confirm-password" className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className={`w-full pl-9 pr-9 py-1.5 sm:py-2 rounded-xl border-2 text-xs sm:text-sm bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    fieldErrors.confirmPassword
                      ? 'border-rose-400 focus:ring-rose-500/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus:ring-violet-500/20 focus:border-violet-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors p-1"
                >
                  {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <FieldError error={fieldErrors.confirmPassword} />
            </div>

            {/* Password requirements helper */}
            {formData.password && <PasswordRequirements password={formData.password} />}

            {/* Continue button */}
            <button
              type="button"
              onClick={goNext}
              className="w-full mt-2 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
            >
              <span>Continue to Academic Details</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ── STEP 2: Academic ─────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleRegister} className="space-y-2">
            {/* Student ID */}
            <div className="space-y-1">
              <label htmlFor="reg-student-id" className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Student ID / Roll No <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input
                  id="reg-student-id"
                  type="text"
                  name="student_id"
                  required
                  value={formData.student_id}
                  onChange={handleChange}
                  placeholder="e.g. CS2026001"
                  className={inputClass(!!fieldErrors.student_id)}
                />
              </div>
              <FieldError error={fieldErrors.student_id} />
            </div>

            {/* Department Dropdown (Dynamically loaded from Supabase) */}
            <div className="space-y-1">
              <label htmlFor="reg-department" className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Department <span className="text-rose-500">*</span>
              </label>

              <div className="relative">
                <select
                  id="reg-department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 sm:py-2 pr-7 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all appearance-none cursor-pointer"
                >
                  <optgroup label="Academic Departments">
                    {departments.map((d) => (
                      <option key={d.id} value={String(d.id)}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Not Listed?">
                    <option value="OTHER">➕ Other Department (Type manually...)</option>
                  </optgroup>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Custom Department Input Field (Shown when "OTHER" selected) */}
            {formData.department === 'OTHER' && (
              <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700/50 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 text-[10.5px] font-bold">
                  <Edit3 className="h-3 w-3 text-amber-600 shrink-0" />
                  <span>Enter Custom Department Name</span>
                </div>
                <input
                  type="text"
                  name="custom_department"
                  required
                  value={formData.custom_department}
                  onChange={handleChange}
                  placeholder="e.g. Mechatronics, Bio-Informatics, Aerospace..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
                <FieldError error={fieldErrors.custom_department} />
              </div>
            )}

            {/* Year / Semester / Division */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <StyledSelect
                id="reg-year"
                label="Year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                options={[1, 2, 3, 4].map((y) => ({ value: y, label: `Year ${y}` }))}
              />
              <StyledSelect
                id="reg-semester"
                label="Semester"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                options={[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({ value: s, label: `Sem ${s}` }))}
              />
              <StyledSelect
                id="reg-division"
                label="Division"
                name="division"
                value={formData.division}
                onChange={handleChange}
                options={['A', 'B', 'C', 'D'].map((d) => ({ value: d, label: d }))}
              />
            </div>

            {/* Account Summary preview */}
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-violet-50/50 via-fuchsia-50/30 to-pink-50/30 dark:from-violet-950/20 dark:via-fuchsia-950/10 dark:to-pink-950/10 border border-violet-100 dark:border-violet-500/15 space-y-1">
              <p className="text-[9.5px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                Registration Overview
              </p>
              {[
                { label: 'Student', val: `${formData.first_name} ${formData.last_name}` },
                { label: 'Email', val: formData.email },
                { label: 'Student ID', val: formData.student_id || 'Pending input' },
                {
                  label: 'Department',
                  val:
                    formData.department === 'OTHER'
                      ? formData.custom_department || 'Custom'
                      : departments.find((d) => String(d.id) === String(formData.department))?.name || 'Department',
                },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">{label}</span>
                  <span className="text-[10px] font-bold text-gray-900 dark:text-white truncate max-w-[60%] text-right">
                    {val}
                  </span>
                </div>
              ))}
            </div>

            {/* Legal Consent Acknowledgment */}
            <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center leading-snug px-1">
              By creating an account, you acknowledge and agree to CampusSphere{' '}
              <Link to="/terms" target="_blank" className="text-violet-600 dark:text-violet-400 font-semibold underline hover:no-underline">
                Terms of Use
              </Link>
              {', '}
              <Link to="/privacy-policy" target="_blank" className="text-violet-600 dark:text-violet-400 font-semibold underline hover:no-underline">
                Privacy Policy
              </Link>
              {', and '}
              <Link to="/user-agreement" target="_blank" className="text-violet-600 dark:text-violet-400 font-semibold underline hover:no-underline">
                Acceptable Use Policy
              </Link>
              .
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="w-1/3 py-2 sm:py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs hover:border-gray-300 dark:hover:border-violet-500/40 flex items-center justify-center gap-1.5 transition-all hover:bg-gray-50 dark:hover:bg-[#171b32]"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-2 sm:py-2.5 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
              >
                {loading ? (
                  <>
                    <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Enrolling…</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>Complete Registration</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer links */}
        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:underline"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};
