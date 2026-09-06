import React, { forwardRef } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  success?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, success, className = '', id, required, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="space-y-1.5 w-full text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center z-10">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            required={required}
            className={`w-full h-10 px-3 py-2 text-sm rounded-xl border bg-white dark:bg-gray-900/80 text-gray-900 dark:text-white transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 ${
              leftIcon ? 'pl-9' : ''
            } ${rightIcon || success ? 'pr-9' : ''} ${
              error
                ? 'border-rose-400 bg-rose-50/40 dark:bg-rose-950/20 focus:border-rose-500 focus:ring-rose-500/20'
                : success
                ? 'border-emerald-400 dark:border-emerald-600 focus:border-emerald-500 focus:ring-emerald-500/20'
                : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 focus:border-violet-500 focus:ring-violet-500/20'
            } ${className}`}
            {...props}
          />

          {/* Right icon or success checkmark */}
          {(rightIcon || success) && (
            <div className="absolute right-3 text-gray-400 flex items-center justify-center">
              {success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 animate-scale-in" />
              ) : (
                rightIcon
              )}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1 animate-fade-in">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-gray-400 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string | number; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className = '', id, required, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="space-y-1.5 w-full text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-gray-700 dark:text-gray-300"
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            required={required}
            className={`w-full h-10 pl-3 pr-10 py-2 text-sm rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all duration-150 focus:outline-none focus:ring-2 appearance-none cursor-pointer ${
              error
                ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/20 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 focus:border-violet-500 focus:ring-violet-500/20'
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100 py-1.5"
              >
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
        </div>

        {error && (
          <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;
  maxLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, showCount, maxLength, className = '', id, required, value, onChange, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const charCount = typeof value === 'string' ? value.length : 0;

    return (
      <div className="space-y-1.5 w-full text-left">
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={textareaId}
              className="block text-xs font-semibold text-gray-700 dark:text-gray-300"
            >
              {label} {required && <span className="text-rose-500">*</span>}
            </label>
            {showCount && maxLength && (
              <span className={`text-[10px] font-medium ${charCount > maxLength * 0.9 ? 'text-amber-500' : 'text-gray-400'}`}>
                {charCount}/{maxLength}
              </span>
            )}
          </div>
        )}

        <textarea
          id={textareaId}
          ref={ref}
          required={required}
          maxLength={maxLength}
          value={value}
          onChange={onChange}
          className={`w-full px-3 py-2.5 text-sm rounded-xl border bg-white dark:bg-gray-900/80 text-gray-900 dark:text-white transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 resize-none ${
            error
              ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/20 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 focus:border-violet-500 focus:ring-violet-500/20'
          } ${className}`}
          {...props}
        />

        {error ? (
          <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-gray-400 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  helperText,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 w-full text-left ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-gray-400 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};
