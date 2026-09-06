import React from 'react';
import { Card } from './Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color?: 'blue' | 'emerald' | 'purple' | 'amber' | 'cyan' | 'rose';
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  progress?: number;
  className?: string;
  onClick?: () => void;
  animationDelay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color = 'blue',
  subtitle,
  trend,
  progress,
  className = '',
  onClick,
  animationDelay = 0,
}) => {
  const colorMap = {
    blue: {
      iconBg:   'from-violet-600 to-indigo-600',
      iconText: 'text-white',
      bar:      'from-violet-500 to-indigo-500',
      glow:     'group-hover:shadow-lg group-hover:shadow-violet-500/20',
      accent:   'blue' as const,
    },
    emerald: {
      iconBg:   'from-emerald-500 to-teal-600',
      iconText: 'text-white',
      bar:      'from-emerald-400 to-teal-600',
      glow:     'group-hover:shadow-lg group-hover:shadow-emerald-500/20',
      accent:   'emerald' as const,
    },
    purple: {
      iconBg:   'from-violet-600 to-fuchsia-600',
      iconText: 'text-white',
      bar:      'from-violet-500 to-fuchsia-600',
      glow:     'group-hover:shadow-lg group-hover:shadow-fuchsia-500/20',
      accent:   'indigo' as const,
    },
    amber: {
      iconBg:   'from-amber-400 to-orange-500',
      iconText: 'text-white',
      bar:      'from-amber-400 to-orange-500',
      glow:     'group-hover:shadow-lg group-hover:shadow-amber-500/20',
      accent:   'amber' as const,
    },
    cyan: {
      iconBg:   'from-cyan-500 to-blue-600',
      iconText: 'text-white',
      bar:      'from-cyan-400 to-blue-600',
      glow:     'group-hover:shadow-lg group-hover:shadow-cyan-500/20',
      accent:   'blue' as const,
    },
    rose: {
      iconBg:   'from-rose-500 to-pink-600',
      iconText: 'text-white',
      bar:      'from-rose-400 to-pink-600',
      glow:     'group-hover:shadow-lg group-hover:shadow-rose-500/20',
      accent:   'rose' as const,
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <Card
      onClick={onClick}
      accentColor={scheme.accent}
      className={`group p-4 sm:p-5 flex flex-col justify-between space-y-3 animate-fade-up ${
        onClick ? 'cursor-pointer hover:border-violet-500/30' : ''
      } ${className}`}
      style={{ animationDelay: `${animationDelay}ms` } as React.CSSProperties}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-normal truncate leading-snug">
          {title}
        </span>
        {/* Gradient icon box */}
        <div
          className={`p-2.5 rounded-xl bg-gradient-to-br ${scheme.iconBg} ${scheme.iconText} shadow-md shrink-0 ${scheme.glow} transition-all duration-200 group-hover:scale-105`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-gray-900 dark:text-white tabular-nums animate-count-up">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5 text-[11px] font-semibold">
          {trend.isPositive === true ? (
            <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
              <TrendingUp className="h-3 w-3" /> {trend.value}
            </span>
          ) : trend.isPositive === false ? (
            <span className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full">
              <TrendingDown className="h-3 w-3" /> {trend.value}
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-full">
              <Minus className="h-3 w-3" /> {trend.value}
            </span>
          )}
        </div>
      )}

      {progress !== undefined && (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-medium text-slate-400">
            <span>Progress</span>
            <span>{Math.min(100, Math.max(0, Math.round(progress)))}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-midnight-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full bg-gradient-to-r ${scheme.bar} transition-all duration-700 ease-out`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  );
};
