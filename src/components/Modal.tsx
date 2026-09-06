import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth,
  size = 'lg',
}) => {
  const finalSize = maxWidth || size || 'lg';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  }[finalSize];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0a0c16]/70 backdrop-blur-md transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog container */}
      <div
        className={`relative z-10 w-full ${maxWidthClass} my-auto sm:my-8 max-h-[calc(100dvh-1.5rem)] flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-white/95 shadow-2xl backdrop-blur-2xl transition-all dark:bg-[#111425]/95 border border-gray-200/90 dark:border-violet-500/15 animate-in fade-in-0 zoom-in-95 duration-150`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 px-4 sm:px-6 py-3.5 sm:py-4.5 bg-gray-50/50 dark:bg-[#171b32]/40 shrink-0">
          <div className="min-w-0 pr-2">
            <h3 className="text-base sm:text-lg font-black tracking-tight text-gray-900 dark:text-white truncate">
              {title}
            </h3>
            {description && (
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-1 sm:line-clamp-2">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl p-1.5 text-gray-400 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-white/5 dark:hover:text-violet-300 transition-colors touch-manipulation shrink-0"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1 overscroll-contain">{children}</div>
      </div>
    </div>
  );
};
