import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Award,
  QrCode,
  FileCheck,
  Bot,
} from 'lucide-react';
import { useBranding } from '../context/BrandingContext';

/* ── Types ─────────────────────────────────────────────────── */
interface FeatureItem {
  icon: React.ElementType;
  text: string;
  color: string;
}

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  features?: FeatureItem[];
  badge?: string;
  maxWidth?: string;
}

/* ── Default feature list ──────────────────────────────────── */
const defaultFeatures: FeatureItem[] = [
  { icon: QrCode, text: 'Smart QR Attendance', color: 'from-blue-500 to-cyan-500' },
  { icon: FileCheck, text: 'Verified Certificates & Marks', color: 'from-emerald-500 to-teal-500' },
  { icon: Bot, text: 'AI Career Guidance', color: 'from-violet-500 to-purple-500' },
  { icon: Award, text: 'Scholarships & Grants', color: 'from-amber-500 to-orange-500' },
];

/* ── AuthLayout ────────────────────────────────────────────── */
export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title = 'Where Campus\nMeets Future.',
  subtitle = 'Everything you need for your campus life — attendance, marks, certificates, and career tools in one place.',
  features = defaultFeatures,
  badge = 'Campus Portal',
  maxWidth = 'max-w-[450px]',
}) => {
  const { branding } = useBranding();

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-200">

      {/* ── LEFT BRAND PANEL (desktop only) ─────────────── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] lg:sticky lg:top-0 lg:h-screen relative overflow-hidden flex-col justify-between p-10 xl:p-14 selection:bg-white selection:text-violet-700 shrink-0">
        {/* Vivid animated gradient background matching landing page */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600" />
        
        {/* Ambient atmospheric glows */}
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-white/20 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-white/20 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-yellow-300/10 blur-[90px] pointer-events-none" />
        
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.07]" 
          style={{ 
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', 
            backgroundSize: '24px 24px' 
          }} 
        />

        {/* Top Header & Intro */}
        <div className="relative z-10 space-y-8 animate-fade-up">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center shadow-lg shadow-black/10 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tight">
                Campus<span className="text-white/80">Sphere</span>
              </span>
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/70">
                Operating System
              </p>
            </div>
          </Link>

          {/* Hero Statement */}
          <div className="pt-4">
            {badge && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[11px] font-bold text-white mb-6 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                {badge}
              </div>
            )}
            <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight whitespace-pre-line drop-shadow-sm">
              {title}
            </h1>
            <p className="mt-4 text-sm text-white/80 leading-relaxed max-w-sm font-medium">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Live Feature List */}
        <div className="relative z-10 space-y-3.5 animate-fade-up">
          <div className="h-px bg-white/20 mb-6" />
          <div className="space-y-3">
            {features.map(({ icon: Icon, text, color }) => (
              <div key={text} className="flex items-center gap-3.5 group">
                <div className={`h-8 w-8 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0 shadow-md shadow-black/15 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <p className="text-xs text-white/90 font-semibold group-hover:text-white transition-colors">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ───────────────────────────── */}
      <div className="flex-1 h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-2 sm:py-3 relative overflow-y-auto lg:overflow-hidden">
        {/* Subtle background ambient glows matching landing page colors */}
        <div className="absolute -top-40 -right-40 w-[450px] h-[450px] rounded-full bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-transparent blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-cyan-500/10 via-blue-500/5 to-transparent blur-[120px] pointer-events-none" />

        <div className={`w-full ${maxWidth} relative z-10 flex flex-col justify-center`}>
          {/* Mobile-only brand header */}
          <div className="lg:hidden flex items-center justify-between mb-2">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-md shadow-violet-500/25">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-black text-gray-900 dark:text-white tracking-tight">
                Campus<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">Sphere</span>
              </span>
            </Link>
            <Link 
              to="/" 
              className="text-xs font-bold text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400 transition-colors"
            >
              ← Back to site
            </Link>
          </div>

          {/* Form Card Slot */}
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-gray-200/30 dark:shadow-black/30">
            {children}
          </div>

          {/* Institutional Footer Info & Compact Legal Links */}
          <div className="mt-2.5 sm:mt-3 flex flex-col items-center gap-1 text-center text-[10px] text-gray-400 dark:text-gray-500">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link to="/privacy-policy" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                Terms
              </Link>
              <span>•</span>
              <Link to="/cookie-policy" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                Cookies
              </Link>
              <span>•</span>
              <Link to="/data-protection" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                Data Protection
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between w-full pt-1.5 border-t border-gray-100 dark:border-gray-800 gap-1 text-[9.5px]">
              <p>© {new Date().getFullYear()} {branding.appName} · Higher Education</p>
              <div className="flex items-center gap-1 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Secure Connection</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
