import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles,
  ArrowLeft,
  Calendar,
  Shield,
  FileText,
  Lock,
  Cookie,
  AlertCircle,
  Award,
  ChevronRight,
  Menu,
  X,
  ArrowUp,
  Share2,
  Check,
  Building2,
  Mail,
} from 'lucide-react';
import { useBranding } from '../context/BrandingContext';
import { Footer } from '../components/Footer';

export interface LegalSection {
  id: string;
  title: string;
}

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated?: string;
  version?: string;
  sections: LegalSection[];
  children: React.ReactNode;
}

const LEGAL_PAGES = [
  { path: '/privacy-policy', label: 'Privacy Policy', icon: Shield },
  { path: '/terms', label: 'Terms & Conditions', icon: FileText },
  { path: '/user-agreement', label: 'User Agreement', icon: FileText },
  { path: '/data-protection', label: 'Data Protection & Privacy', icon: Lock },
  { path: '/cookie-policy', label: 'Cookie Policy', icon: Cookie },
  { path: '/grievance-policy', label: 'Grievance / Support Policy', icon: AlertCircle },
  { path: '/certificate-policy', label: 'Certificate Policy', icon: Award },
];

export const LegalLayout: React.FC<LegalLayoutProps> = ({
  title,
  subtitle,
  lastUpdated = 'September 2026',
  version = '1.0',
  sections,
  children,
}) => {
  const { branding } = useBranding();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || '');
  const [copiedLink, setCopiedLink] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);

      const sectionElements = sections.map((sec) => document.getElementById(sec.id));
      const scrollPosition = window.scrollY + 180;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const topOffset = 120;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setActiveSection(id);
      setMobileTocOpen(false);
    }
  };

  const handleCopyPageLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col selection:bg-violet-600 selection:text-white transition-colors duration-200">
      
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 border-b border-gray-200/80 dark:border-gray-800 backdrop-blur-xl bg-white/90 dark:bg-gray-950/90 transition-colors">
        <div className="max-w-7xl mx-auto flex h-16 sm:h-18 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-gray-900 dark:text-white">
                Campus<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">Sphere</span>
              </span>
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 hidden sm:block">
                Legal &amp; Compliance Center
              </p>
            </div>
          </Link>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 px-3 py-2 rounded-xl transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Link>
            <Link
              to="/login"
              className="hidden sm:inline-flex px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-violet-300 dark:hover:border-violet-600 hover:text-violet-600 transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-xs font-bold shadow-md shadow-violet-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO BANNER ── */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gradient-to-b from-violet-50/50 via-fuchsia-50/20 to-transparent dark:from-violet-950/20 dark:via-fuchsia-950/10 dark:to-transparent pt-10 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-bold border border-violet-200/60 dark:border-violet-700/40">
              <Shield className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              Institutional Policy
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[11px] font-medium">
              <Calendar className="h-3 w-3 text-gray-400" />
              Last Updated: {lastUpdated}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[11px] font-mono">
              Version {version}
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              {title}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Quick Switcher Tabs */}
          <div className="pt-2 overflow-x-auto no-scrollbar flex items-center gap-2 pb-1 border-t border-gray-200/60 dark:border-gray-800">
            {LEGAL_PAGES.map((page) => {
              const isActive = location.pathname === page.path;
              const Icon = page.icon;
              return (
                <Link
                  key={page.path}
                  to={page.path}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/25 font-bold'
                      : 'bg-white/80 dark:bg-gray-900/80 text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-300 border border-gray-200/80 dark:border-gray-800'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{page.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MOBILE TOC COLLAPSIBLE ── */}
      <div className="lg:hidden sticky top-16 z-30 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md px-4 py-2.5">
        <button
          onClick={() => setMobileTocOpen(!mobileTocOpen)}
          className="w-full flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300 py-1"
        >
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-violet-500" />
            <span>Table of Contents ({sections.length} sections)</span>
          </span>
          <ChevronRight
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
              mobileTocOpen ? 'rotate-90 text-violet-500' : ''
            }`}
          />
        </button>

        {mobileTocOpen && (
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1 max-h-60 overflow-y-auto">
            {sections.map((sec, idx) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeSection === sec.id
                    ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#171b32]'
                }`}
              >
                {idx + 1}. {sec.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── MAIN CONTENT & SIDEBAR ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT SIDEBAR (Desktop sticky TOC) */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-6">
            <div className="sticky top-24 space-y-6 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 no-scrollbar">
              
              {/* Table of Contents Card */}
              <div className="p-5 rounded-2xl border border-gray-200/80 dark:border-violet-500/15 bg-gray-50/50 dark:bg-[#111425]/70 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-violet-500" />
                    <span>Table of Contents</span>
                  </h3>
                  <button
                    onClick={handleCopyPageLink}
                    title="Copy document link"
                    className="p-1 rounded-md text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <nav className="space-y-1">
                  {sections.map((sec, idx) => {
                    const isActive = activeSection === sec.id;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => scrollToSection(sec.id)}
                        className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-all flex items-start gap-2 ${
                          isActive
                            ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold shadow-xs'
                            : 'text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-gray-100 dark:hover:bg-[#171b32]/60 font-medium'
                        }`}
                      >
                        <span className={`text-[10px] ${isActive ? 'text-white/80' : 'text-gray-400'} font-mono mt-0.5`}>
                          {idx + 1}.
                        </span>
                        <span className="line-clamp-2">{sec.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Institutional Governance Card */}
              <div className="p-4 rounded-2xl border border-gray-200/60 dark:border-gray-800/80 bg-white dark:bg-gray-900/20 text-xs space-y-2.5">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
                  <Building2 className="h-4 w-4 text-violet-500" />
                  <span>Institutional Notice</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  Adopted for {branding.institutionName || 'the Institution'} under official campus administration.
                </p>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                  <Mail className="h-3.5 w-3.5 text-violet-500" />
                  <a
                    href={`mailto:${branding.supportEmail || 'support@campussphere.edu'}`}
                    className="hover:text-violet-600 font-mono text-[11px] truncate"
                  >
                    {branding.supportEmail || 'support@campussphere.edu'}
                  </a>
                </div>
              </div>

            </div>
          </aside>

          {/* RIGHT DOCUMENT BODY */}
          <article className="lg:col-span-8 xl:col-span-9 space-y-12">
            
            {/* Institutional Review Callout Notice */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border-2 border-amber-200/80 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 text-xs sm:text-sm leading-relaxed space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Notice for Institutional Legal &amp; Governance Review</span>
              </div>
              <p className="text-amber-800/90 dark:text-amber-300/80 text-xs leading-relaxed">
                This document describes the factual technical implementation and operational architecture of the {branding.appName || 'CampusSphere'} software platform. Specific institutional retention windows, regional compliance ratifications, and disciplinary sanctions are subject to approval by your university legal authority.
              </p>
            </div>

            {/* Document Content */}
            <div className="space-y-10 text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
              {children}
            </div>

            {/* Document Bottom Navigation */}
            <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
              <p>
                Need assistance regarding this policy? Contact{' '}
                <a
                  href={`mailto:${branding.supportEmail || 'support@campussphere.edu'}`}
                  className="text-violet-600 dark:text-violet-400 font-semibold underline hover:no-underline"
                >
                  {branding.supportEmail || 'support@campussphere.edu'}
                </a>
              </p>
              <button
                onClick={scrollToTop}
                className="inline-flex items-center gap-1.5 font-bold text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                <ArrowUp className="h-3.5 w-3.5" />
                <span>Back to Top</span>
              </button>
            </div>

          </article>
        </div>
      </main>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          title="Back to top"
          aria-label="Back to top"
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-xl shadow-violet-500/25 transition-all hover:scale-110 active:scale-95"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}

      {/* ── FOOTER ── */}
      <Footer />
    </div>
  );
};
