import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, RefreshCw, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { AuthLayout } from '../layouts/AuthLayout';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const toast = useToast();

  const handleResend = async () => {
    if (!email) {
      toast.warning('No email address available to resend verification.');
      return;
    }
    setResending(true);
    try {
      await authService.resendVerificationEmail(email);
      setResent(true);
      toast.success('Verification email sent', 'Please check your inbox.');
    } catch (err: any) {
      toast.error('Unable to resend', err?.message || 'Please try again later.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title={'Almost There.\nVerify Your Email.'}
      subtitle="Check your inbox to complete your CampusSphere registration."
    >
      <div className="animate-fade-up text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-blue-600/10 border border-blue-500/15 flex items-center justify-center">
            <Mail className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Verify your email
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          We've sent a verification link to
        </p>
        {email && (
          <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
            {email}
          </p>
        )}

        {/* Status card */}
        <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Verification Status</span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Pending
            </span>
          </div>
          {email && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Email</span>
              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[60%]">
                {email}
              </span>
            </div>
          )}
        </div>

        {/* Instructions */}
        <p className="mt-6 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
          Click the link in the email to activate your account.
          If you don't see it, check your spam folder.
        </p>

        {/* Actions */}
        <div className="mt-8 space-y-3">
          {/* Resend button */}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || resent}
            className="w-full py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:border-slate-300 dark:hover:border-white/15 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            {resending ? (
              <>
                <span className="h-4 w-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                Sending…
              </>
            ) : resent ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Verification email resent
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Resend Verification Email
              </>
            )}
          </button>

          {/* Back to login */}
          <Link
            to="/login"
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};
