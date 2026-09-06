import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { UserRole } from '../types';
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Building2,
  Sparkles,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { AuthLayout } from '../layouts/AuthLayout';

/* ── Error mapper ── */
function mapLoginError(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes('invalid login') || msg.includes('incorrect'))
    return 'Email or password is incorrect.';
  if (msg.includes('email not confirmed') || msg.includes('not been confirmed'))
    return 'Please verify your email before signing in.';
  if (msg.includes('not active') || msg.includes('inactive'))
    return 'Your account is currently inactive. Please contact the administrator.';
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch'))
    return 'Unable to connect right now. Please check your connection and try again.';
  if (msg.includes('rate limit'))
    return 'Too many sign-in attempts. Please wait a moment and try again.';
  if (msg.includes('supabase is not configured'))
    return 'The authentication service is not configured. Please contact support.';
  return message;
}

interface DepartmentOption {
  id: number | string;
  name: string;
  code: string;
}

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  /* ── Dynamic Department Selection on Login ─────────────── */
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [customDept, setCustomDept] = useState<string>('');
  const [showCustomDept, setShowCustomDept] = useState<boolean>(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  /* ── Load Departments dynamically from DB ──────────────── */
  useEffect(() => {
    let isMounted = true;
    authService.getDepartments().then((depts) => {
      if (isMounted && depts) {
        setDepartments(depts);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const validateFields = (): boolean => {
    const errors: typeof fieldErrors = {};
    if (!username.trim()) errors.email = 'Please enter your email address.';
    else if (!username.includes('@')) errors.email = 'Please enter a valid email address.';
    if (!password.trim()) errors.password = 'Please enter your password.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ── Login handler ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFields()) return;
    setLoading(true);

    try {
      const res = await login({ username, password });
      toast.success('Welcome back!', `Signed in as ${res.user.first_name || username}.`);
      finishRedirect(res.user.role);
    } catch (err: any) {
      const friendlyMsg = mapLoginError(err?.message || 'Invalid credentials.');
      toast.error('Sign In Failed', friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Role-based redirect ── */
  const finishRedirect = (role: UserRole) => {
    const routes: Record<UserRole, string> = {
      STUDENT: '/dashboard/student',
      FACULTY: '/dashboard/faculty',
      HOD: '/dashboard/hod',
      PLACEMENT_OFFICER: '/dashboard/placement',
      COORDINATOR: '/dashboard/admin',
      ADMIN: '/admin/dashboard',
      SUPER_ADMIN: '/admin/dashboard',
      ADMINISTRATOR: '/admin/dashboard',
      MENTOR: '/dashboard/student',
      ALUMNI: '/dashboard/student',
      EMPLOYER_VERIFIER: '/dashboard/student',
    };
    navigate(routes[role] || '/dashboard/student');
  };

  return (
    <AuthLayout badge="Secure Portal Access">
      <div>
          {/* Header Title with Gradient Accent */}
          <div className="mb-3.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/30 border border-violet-200/60 dark:border-violet-700/40 text-[10px] font-bold text-violet-700 dark:text-violet-300 mb-1.5">
              <Sparkles className="h-2.5 w-2.5 text-violet-500" />
              <span>Unified Campus Login</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
              Welcome back
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Sign in with your institutional credentials to access your dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3" noValidate>
            {/* Department Selection (Synced with College DB) */}
            <div className="space-y-1">
              <label
                htmlFor="login-dept-select"
                className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
              >
                Department / Branch
              </label>

              <div className="relative">
                <select
                  id="login-dept-select"
                  value={showCustomDept ? 'OTHER' : selectedDept}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'OTHER') {
                      setShowCustomDept(true);
                    } else {
                      setShowCustomDept(false);
                      setSelectedDept(val);
                    }
                  }}
                  className="w-full px-3.5 py-2 sm:py-2.5 pr-9 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="ALL">🏛️ All Departments / Institutional Access</option>
                  <optgroup label="Academic Departments">
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Not Listed?">
                    <option value="OTHER">➕ Other Department (Type manually...)</option>
                  </optgroup>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>

              {/* Show manual typing if "OTHER" selected */}
              {showCustomDept && (
                <div className="mt-1.5">
                  <input
                    type="text"
                    value={customDept}
                    onChange={(e) => setCustomDept(e.target.value)}
                    placeholder="Enter your department name (e.g. Robotics, AI)..."
                    className="w-full px-3 py-2 text-xs rounded-xl border-2 border-amber-300 dark:border-amber-600/50 bg-amber-50/40 dark:bg-amber-950/20 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                </div>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label
                htmlFor="login-email"
                className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
              >
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setFieldErrors((p) => ({ ...p, email: undefined }));
                  }}
                  placeholder="you@campus.edu"
                  className={`w-full pl-10 pr-3.5 py-2 sm:py-2.5 rounded-xl border-2 text-xs sm:text-sm bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    fieldErrors.email
                      ? 'border-rose-400 focus:ring-rose-500/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus:ring-violet-500/20 focus:border-violet-500'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[10.5px] text-rose-500 font-medium flex items-center gap-1 mt-0.5">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[10.5px] text-violet-600 dark:text-violet-400 font-bold hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors((p) => ({ ...p, password: undefined }));
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2 sm:py-2.5 rounded-xl border-2 text-xs sm:text-sm bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    fieldErrors.password
                      ? 'border-rose-400 focus:ring-rose-500/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus:ring-violet-500/20 focus:border-violet-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[10.5px] text-rose-500 font-medium flex items-center gap-1 mt-0.5">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1.5 py-2.5 sm:py-3 px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-700 hover:via-fuchsia-700 hover:to-pink-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-violet-500/25 hover:shadow-violet-500/40"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Registration Navigation */}
          <div className="mt-3.5 pt-2.5 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              New student at campus?{' '}
              <Link
                to="/register"
                className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
    </AuthLayout>
  );
};
