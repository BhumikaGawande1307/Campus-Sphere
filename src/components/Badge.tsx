import React from 'react';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'gradient'
  | 'live';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  dot = false,
  pulse = false,
  children,
  className = '',
}) => {
  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-[10px] px-2 py-0.5 font-semibold gap-1 rounded-md',
    md: 'text-xs px-2.5 py-0.5 font-semibold gap-1.5 rounded-lg',
    lg: 'text-xs sm:text-sm px-3 py-1 font-semibold gap-2 rounded-xl',
  };

  const variantStyles: Record<BadgeVariant, string> = {
    primary:
      'bg-violet-50 text-violet-700 border border-violet-200/80 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-700/40',
    secondary:
      'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200/80 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 dark:border-fuchsia-700/40',
    success:
      'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/40',
    warning:
      'bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/40',
    danger:
      'bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700/40',
    neutral:
      'bg-gray-100 text-gray-700 border border-gray-200/80 dark:bg-gray-800/70 dark:text-gray-300 dark:border-gray-700/50',
    gradient:
      'bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-pink-600/10 text-violet-700 dark:text-violet-300 border border-violet-500/25 dark:border-violet-500/30',
    live:
      'bg-emerald-500 text-white border border-emerald-400/50 shadow-sm',
  };

  const dotColors: Record<BadgeVariant, string> = {
    primary:   'bg-violet-500',
    secondary: 'bg-fuchsia-500',
    success:   'bg-emerald-500',
    warning:   'bg-amber-500',
    danger:    'bg-rose-500',
    neutral:   'bg-gray-400',
    gradient:  'bg-violet-500',
    live:      'bg-white',
  };

  return (
    <span
      className={`inline-flex items-center tracking-tight transition-colors ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {(dot || pulse) && (
        <span className="relative flex shrink-0 h-1.5 w-1.5">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${dotColors[variant]}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColors[variant]}`} />
        </span>
      )}
      <span className="whitespace-nowrap shrink-0">{children}</span>
    </span>
  );
};
