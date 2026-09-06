import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/authService';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { useToast } from '../context/ToastContext';
import { AuthLayout } from '../layouts/AuthLayout';
import { PasswordRequirements } from '../components/PasswordRequirements';

export const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});

  const navigate = useNavigate();
  const toast = useToast();

  /* ── Listen for PASSWORD_RECOVERY event ─────────────── */
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setHasSession(false);
      return;
    }

    // Check if there's already a recovery session from the URL hash
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasSession(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setHasSession(true);
      }
    });

    // Allow a brief window for the event to fire
    const timeout = setTimeout(() => {
      setHasSession((prev) => prev === null ? false : prev);
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  /* ── Validation ─────────────────────────────────────── */
  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};
    if (!password) errors.password = 'Please enter a new password.';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters.';
    if (!confirmPassword) errors.confirm = 'Please confirm your password.';
    else if (password !== confirmPassword) errors.confirm = 'Passwords do not match.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ── Submit handler ─────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await authService.resetPassword(password);
      setSuccess(true);
      toast.success('Password Updated', 'You can now sign in with your new password.');
    } catch (err: any) {
      toast.error('Reset Failed', err?.message || 'Unable to update your password.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Loading state while checking session ───────────── */
  if (hasSession === null) {
    return (
      <AuthLayout title={'Reset Your\nPassword.'}>
        <div className="flex flex-col items-center justify-center py-16">
          <span className="h-6 w-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 mt-4 font-medium">Verifying reset link…</p>
        </div>
      </AuthLayout>
    );
  }

  /* ── Expired/invalid link ───────────────────────────── */
  if (!hasSession && !success) {
    return (
      <AuthLayout title={'Reset Your\nPassword.'}>
        <div className="animate-fade-up text-center">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
              <AlertCircle className="h-7 w-7 text-amber-500" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Invalid or expired link
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            This password reset link has expired or is invalid. Please request a new one.
          </p>
          <div className="mt-8 space-y-3">
            <Link
              to="/forgot-password"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            >
              Request New Link
            </Link>
            <Link
              to="/login"
              className="w-full py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 hover:border-slate-300 dark:hover:border-white/15 transition-all"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={'Reset Your\nPassword.'}>
      <div className="animate-fade-up">
        {success ? (
          /* ── Success state ────────────────────────── */
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Password updated
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <Link
              to="/login"
              className="mt-8 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            >
              Continue to Sign In
            </Link>
          </div>
        ) : (
          /* ── Reset form ──────────────────────────── */
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Create a new password
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                Choose a strong password for your CampusSphere account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* New password */}
              <div className="space-y-1.5">
                <label htmlFor="reset-password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="reset-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }}
                    placeholder="Min. 6 characters"
                    className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm bg-white dark:bg-white/[0.03] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      fieldErrors.password ? 'border-rose-400 focus:ring-rose-500/20' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/15 focus:ring-blue-500/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-0.5 animate-fade-in">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label htmlFor="reset-confirm-password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="reset-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirm: undefined })); }}
                    placeholder="Re-enter password"
                    className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm bg-white dark:bg-white/[0.03] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      fieldErrors.confirm ? 'border-rose-400 focus:ring-rose-500/20' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/15 focus:ring-blue-500/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.confirm && (
                  <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-0.5 animate-fade-in">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {fieldErrors.confirm}
                  </p>
                )}
              </div>

              {/* Password requirements */}
              {password && <PasswordRequirements password={password} />}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating…
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  );
};
