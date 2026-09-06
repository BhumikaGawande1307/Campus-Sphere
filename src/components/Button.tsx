import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient' | 'success';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none overflow-hidden';

  const sizeStyles: Record<ButtonSize, string> = {
    xs:  'text-[11px] px-2.5 py-1 gap-1.5 rounded-lg',
    sm:  'text-xs px-3 py-1.5 gap-1.5 rounded-xl',
    md:  'text-xs sm:text-sm px-4 py-2 gap-2 rounded-xl shadow-2xs',
    lg:  'text-sm sm:text-base px-5 py-2.5 gap-2.5 rounded-2xl shadow-xs',
    xl:  'text-base px-7 py-3.5 gap-3 rounded-2xl shadow-sm',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 active:from-violet-700 active:to-fuchsia-700 text-white font-bold shadow-md shadow-violet-500/25 hover:shadow-violet-500/40 border border-violet-400/30',
    gradient:
      'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-500 hover:via-fuchsia-500 hover:to-pink-500 text-white font-bold shadow-md shadow-fuchsia-500/25 hover:shadow-fuchsia-500/40 border border-white/20',
    secondary:
      'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-200/90 dark:border-white/10 hover:bg-violet-50/50 dark:hover:bg-white/5 hover:border-violet-300 dark:hover:border-violet-500/30 shadow-2xs',
    outline:
      'bg-transparent text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 hover:bg-violet-50/60 dark:hover:bg-white/5 hover:border-violet-400 dark:hover:border-violet-500/50 hover:text-violet-700 dark:hover:text-violet-300',
    ghost:
      'bg-transparent text-gray-600 dark:text-gray-400 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-50/70 dark:hover:bg-white/5',
    danger:
      'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold shadow-md shadow-rose-500/25 hover:shadow-rose-500/40 border border-rose-500/30',
    success:
      'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 border border-emerald-500/30',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Shine overlay for gradient/primary */}
      {(variant === 'gradient' || variant === 'primary') && (
        <span className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/8 to-transparent pointer-events-none" />
      )}

      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-current shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span className="truncate">{children}</span>
      {!isLoading && rightIcon && (
        <span className="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5">
          {rightIcon}
        </span>
      )}
    </button>
  );
};
