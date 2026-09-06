import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 3,
  className = '',
}) => {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 rounded-xl bg-slate-200/70 dark:bg-slate-800/80" />
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="mt-4 h-7 w-20 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="mt-2 h-3 w-32 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      ))}
    </>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 4,
  cols = 4,
}) => {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-3">
      <div className="flex gap-4 border-b border-slate-100 pb-3 dark:border-slate-800">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 flex-1 rounded bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-2">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-4 flex-1 rounded bg-slate-100 dark:bg-slate-800/60" />
          ))}
        </div>
      ))}
    </div>
  );
};
