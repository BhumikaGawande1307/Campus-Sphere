import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, ShieldCheck, FileCheck } from 'lucide-react';
import { useBranding } from '../context/BrandingContext';

export const Footer: React.FC = () => {
  const { branding } = useBranding();
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-sm transition-colors text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-10 border-b border-gray-200 dark:border-gray-800">
          
          {/* Brand & Purpose (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <span className="text-xl font-black tracking-tight">
                Campus<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">Sphere</span>
              </span>
            </Link>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 italic">
              "Your Campus. One Connected Experience."
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm">
              Unified campus platform for secure attendance, verified student credentials, and academic management.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                All Campus Services Operational
              </span>
            </div>
          </div>

          {/* Platform Links (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-600 dark:text-gray-400">
              <li>
                {isLanding ? (
                  <a href="#features" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                    About
                  </a>
                ) : (
                  <Link to="/#features" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                    About
                  </Link>
                )}
              </li>
              <li>
                <a 
                  href={`mailto:${branding.supportEmail || 'support@campussphere.edu'}`}
                  className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                >
                  Contact
                </a>
              </li>
              <li>
                <Link to="/grievance-policy" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  Portal Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  Student Enrollment
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Pages (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Legal &amp; Policy
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs text-gray-600 dark:text-gray-400">
              <Link to="/privacy-policy" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                Terms &amp; Conditions
              </Link>
              <Link to="/user-agreement" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                User Agreement
              </Link>
              <Link to="/data-protection" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                Data Protection &amp; Privacy
              </Link>
              <Link to="/cookie-policy" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                Cookie Policy
              </Link>
              <Link to="/grievance-policy" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                Grievance / Support Policy
              </Link>
              <Link to="/certificate-policy" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors sm:col-span-2">
                Certificate Policy
              </Link>
            </div>
          </div>

          {/* Security / Verification (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Security / Verification
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-600 dark:text-gray-400">
              <li>
                <Link to="/data-protection" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Security</span>
                </Link>
              </li>
              <li>
                {isLanding ? (
                  <a href="#verify" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center gap-1.5">
                    <FileCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span>Certificate Verification</span>
                  </a>
                ) : (
                  <Link to="/#verify" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center gap-1.5">
                    <FileCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span>Certificate Verification</span>
                  </Link>
                )}
              </li>
              <li>
                <Link to="/certificate-policy" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors text-[11px] text-gray-500">
                  Verification Standards
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} {branding.appName || 'CampusSphere'}. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <Link to="/privacy-policy" className="hover:underline">Privacy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:underline">Terms</Link>
            <span>•</span>
            <Link to="/cookie-policy" className="hover:underline">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
