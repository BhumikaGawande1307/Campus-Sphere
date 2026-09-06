import React, { useState } from 'react';
import { Link as LinkIcon, Check } from 'lucide-react';

interface LegalSectionBlockProps {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}

export const LegalSectionBlock: React.FC<LegalSectionBlockProps> = ({ id, number, title, children }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAnchor = () => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id={id} className="scroll-mt-32 space-y-4 pt-4 first:pt-0">
      <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 dark:border-violet-500/15">
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-baseline gap-2.5">
          <span className="text-violet-600 dark:text-violet-400 font-mono text-sm sm:text-base font-bold">
            {number}
          </span>
          <span>{title}</span>
        </h2>
        <button
          onClick={handleCopyAnchor}
          title="Copy link to this section"
          className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100 dark:hover:bg-[#171b32] transition-colors"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <LinkIcon className="h-4 w-4" />}
        </button>
      </div>
      <div className="space-y-3.5 text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-[15px]">
        {children}
      </div>
    </section>
  );
};
