import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center gap-1.5 p-1.5 rounded-2xl bg-gray-100/80 dark:bg-[#111425] border border-gray-200/80 dark:border-violet-500/15 backdrop-blur-md overflow-x-auto touch-pan-x no-scrollbar ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const IconComponent =
          typeof tab.icon === 'function'
            ? (tab.icon as React.ComponentType<{ className?: string }>)
            : null;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
              isActive
                ? 'bg-white text-violet-700 shadow-xs dark:bg-[#171b32] dark:text-violet-300 font-bold border border-gray-200/60 dark:border-violet-500/30'
                : 'text-gray-600 hover:text-violet-700 hover:bg-white/60 dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#171b32]/60'
            }`}
          >
            {IconComponent ? (
              <IconComponent className="h-3.5 w-3.5 shrink-0" />
            ) : React.isValidElement(tab.icon) ? (
              <span className="shrink-0">{tab.icon}</span>
            ) : null}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive
                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/80 dark:text-violet-300'
                    : 'bg-gray-200 text-gray-700 dark:bg-[#171b32] dark:text-gray-300'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
