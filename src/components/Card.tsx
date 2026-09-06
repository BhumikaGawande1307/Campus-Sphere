import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  glass?: boolean;
  glow?: 'blue' | 'purple' | 'emerald' | 'amber' | 'none';
  variant?: 'default' | 'elevated' | 'bordered' | 'glass';
  accentColor?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'none';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  hover = false,
  glass = true,
  glow = 'none',
  variant = 'default',
  accentColor = 'none',
  className = '',
  ...props
}) => {
  const glowStyles = {
    none:    '',
    blue:    'hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/10',
    purple:  'hover:border-fuchsia-500/40 hover:shadow-lg hover:shadow-fuchsia-500/10',
    emerald: 'hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10',
    amber:   'hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10',
  };

  const variantStyles = {
    default:  glass
      ? 'bg-white/95 dark:bg-[#111425]/95 border-gray-200/80 dark:border-violet-500/15 shadow-xs backdrop-blur-xl'
      : 'bg-white dark:bg-[#111425] border-gray-200/80 dark:border-violet-500/20 shadow-xs',
    elevated: 'bg-white dark:bg-[#111425] border-gray-200/80 dark:border-violet-500/20 shadow-xl shadow-gray-200/40 dark:shadow-violet-950/40',
    bordered: 'bg-white/80 dark:bg-[#111425]/80 border-gray-200/90 dark:border-violet-500/25 shadow-xs backdrop-blur-lg',
    glass:    'backdrop-blur-2xl bg-white/85 dark:bg-[#111425]/85 border-gray-200/80 dark:border-violet-500/20 shadow-sm',
  };

  const accentStyles = {
    none:    '',
    blue:    'border-t-2 border-t-violet-500',
    indigo:  'border-t-2 border-t-fuchsia-500',
    emerald: 'border-t-2 border-t-emerald-500',
    amber:   'border-t-2 border-t-amber-500',
    rose:    'border-t-2 border-t-rose-500',
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${variantStyles[variant]} ${
        hover ? 'card-hover cursor-pointer hover:border-violet-300 dark:hover:border-violet-500/40 hover:shadow-md hover:shadow-violet-500/5' : ''
      } ${glowStyles[glow]} ${accentStyles[accentColor]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  badge,
  icon,
  className = '',
}) => {
  return (
    <div
      className={`flex items-start justify-between gap-3 border-b border-gray-100 dark:border-white/10 pb-3 mb-3.5 ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <div className="shrink-0 text-violet-600 dark:text-violet-400">{icon}</div>
        )}
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
              {title}
            </h3>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
