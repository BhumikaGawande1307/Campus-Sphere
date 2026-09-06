import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { AdminSidebar } from '../components/AdminSidebar';

export const AdminLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/20 to-fuchsia-50/10 dark:from-[#080a14] dark:via-[#0e1022] dark:to-[#160e26] text-slate-900 dark:text-slate-100 flex flex-col transition-colors relative selection:bg-violet-600 selection:text-white overflow-x-hidden">
      {/* Subtle ambient atmospheric glow matching Landing Page */}
      <div className="pointer-events-none fixed -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-violet-500/[0.04] dark:bg-violet-500/[0.08] blur-[120px]" />
      <div className="pointer-events-none fixed -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-fuchsia-500/[0.03] dark:bg-fuchsia-500/[0.06] blur-[120px]" />

      <Navbar
        onToggleMobileSidebar={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="flex flex-1 relative z-10 pt-16">
        <AdminSidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 lg:pl-64 flex flex-col min-w-0 transition-all">
          <div className="flex-1 p-3 sm:p-6 lg:p-8 w-full max-w-full mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
