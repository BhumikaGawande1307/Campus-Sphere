import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

/* ── Password requirement definitions ──────────────────────── */
interface Requirement {
  label: string;
  test: (pw: string) => boolean;
}

const requirements: Requirement[] = [
  { label: 'At least 6 characters', test: (pw) => pw.length >= 6 },
  { label: 'Contains uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'Contains lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { label: 'Contains a number', test: (pw) => /\d/.test(pw) },
  { label: 'Contains a special character', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

/* ── Password strength helper ──────────────────────────────── */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  barColor: string;
} {
  if (!password) return { score: 0, label: '', color: '', barColor: 'bg-slate-200 dark:bg-white/10' };

  const score = requirements.filter((r) => r.test(password)).length;

  if (score <= 1) return { score, label: 'Very Weak', color: 'text-rose-500', barColor: 'bg-rose-500' };
  if (score === 2) return { score, label: 'Weak', color: 'text-orange-500', barColor: 'bg-orange-500' };
  if (score === 3) return { score, label: 'Fair', color: 'text-amber-500', barColor: 'bg-amber-500' };
  if (score === 4) return { score, label: 'Good', color: 'text-blue-500', barColor: 'bg-blue-500' };
  return { score, label: 'Strong', color: 'text-emerald-500', barColor: 'bg-emerald-500' };
}

/* ── PasswordRequirements component ────────────────────────── */
interface PasswordRequirementsProps {
  password: string;
  className?: string;
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({
  password,
  className = '',
}) => {
  return (
    <div
      className={`p-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-750/50 ${className}`}
    >
      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
        Password Requirements
      </p>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1" role="list" aria-label="Password requirements">
        {requirements.map((req) => {
          const met = password.length > 0 && req.test(password);
          return (
            <div key={req.label} className="flex items-center gap-1.5 min-w-0">
              {met ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 transition-colors" />
              ) : (
                <Circle className="h-3 w-3 text-gray-300 dark:text-gray-600 shrink-0 transition-colors" />
              )}
              <span
                className={`text-[10.5px] truncate transition-colors ${
                  met
                    ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
                title={req.label}
              >
                {req.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
