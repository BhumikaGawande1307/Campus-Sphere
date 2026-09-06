import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { SiteSettings } from '../types';
import { useBranding } from '../context/BrandingContext';
import { Footer } from '../components/Footer';
import {
  Sparkles,
  ShieldCheck,
  QrCode,
  FileCheck,
  Briefcase,
  Bot,
  Calendar,
  ArrowRight,
  ChevronDown,
  GraduationCap,
  IndianRupee,
  CheckCircle2,
  Award,
  Zap,
  TrendingUp,
  Search,
  ExternalLink,
  Layers,
  Building2,
  Compass,
  Check,
  Laptop,
  Users,
  BookOpen,
  Star,
  Rocket,
  Menu,
  X,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { branding, renderBrandName } = useBranding();
  const navigate = useNavigate();

  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [verifyUid, setVerifyUid] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  // Track scroll for parallax
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-cycle through journey steps
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    hero_title: 'The Intelligent Operating System for Higher Education',
    hero_description:
      'Everything you need in one campus platform — fast QR attendance, verified marksheets, easy scholarship applications, and AI career guidance.',
    hero_badge: 'Next-Gen University Platform',
    primary_cta_text: 'Launch Student Hub',
    secondary_cta_text: 'Register Student',
    stats_students: '4,800+',
    stats_attendance: '99.4%',
    stats_placements: '96%',
    stats_scholarships: '₹1.2 Cr+',
    maintenance_mode: false,
    faqs: [
      {
        question: 'How does Anti-Proxy QR Attendance work?',
        answer:
          'Faculty start class check-in with a 30-second rotating QR code on screen. Students scan with their phones to mark attendance, preventing fake check-ins and proxy attendance.',
      },
      {
        question: 'How does document and certificate verification work?',
        answer:
          'When students upload marksheets or certificates, the system generates a verified record and a unique Certificate ID. Employers, colleges, and verifiers can confirm authenticity online in seconds using the public QR seal.',
      },
      {
        question: 'How does the AI Career Assistant help students?',
        answer:
          "CampusSphere AI compares your coursework, uploaded certificates, and projects against requirements for popular roles like Full-Stack Developer, Cloud Engineer, and Data Scientist to show you what skills to learn next.",
      },
      {
        question: 'How do students apply for scholarships and financial fellowships?',
        answer:
          'Students can explore corporate fellowships, government grants, and institutional financial aid with automated eligibility matching based on verified CGPA, track multi-stage applications, and receive deadline reminders.',
      },
    ],
  });

  useEffect(() => {
    adminService.getSiteSettings().then((settings) => {
      if (settings) setSiteSettings(settings);
    });
  }, []);

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyUid.trim()) {
      navigate(`/verify/${encodeURIComponent(verifyUid.trim())}`);
    }
  };

  /* ── Journey Steps ── */
  const journeySteps = [
    {
      icon: GraduationCap,
      color: 'from-violet-500 to-purple-600',
      bgLight: 'bg-violet-50',
      textColor: 'text-violet-600',
      borderColor: 'border-violet-200',
      title: 'Register & Enroll',
      desc: 'Create your verified academic profile with department, batch, and credential details in under 2 minutes.',
      detail: 'One-click onboarding with automatic department sync from college database.',
    },
    {
      icon: QrCode,
      color: 'from-cyan-500 to-blue-600',
      bgLight: 'bg-cyan-50',
      textColor: 'text-cyan-600',
      borderColor: 'border-cyan-200',
      title: 'Attend & Track',
      desc: 'Scan rotating 30-second QR codes in lectures. GPS-verified, proxy-proof, fully automated.',
      detail: 'QR codes refresh every 30 seconds — no proxy attendance possible.',
    },
    {
      icon: FileCheck,
      color: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-200',
      title: 'Certify & Verify',
      desc: 'Upload certificates to your secure vault. Share verifiable QR seals with employers worldwide.',
      detail: 'Secure, tamper-proof records with instant online verification.',
    },
    {
      icon: Rocket,
      color: 'from-orange-500 to-rose-600',
      bgLight: 'bg-orange-50',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      title: 'Launch Career',
      desc: 'AI-powered career guidance, scholarship matching, and direct campus placement opportunities.',
      detail: 'Skills matched against real job requirements from top companies.',
    },
  ];

  /* ── Feature Showcase ── */
  const features = [
    {
      icon: QrCode,
      gradient: 'from-blue-600 via-cyan-500 to-teal-400',
      title: 'Smart Anti-Proxy Attendance',
      desc: 'Rotating 30-second QR codes with optional GPS check-in keep attendance honest and proxy-free.',
      tag: 'Zero Proxy',
    },
    {
      icon: FileCheck,
      gradient: 'from-emerald-600 via-green-500 to-lime-400',
      title: 'Digital Certificate & Document Vault',
      desc: 'Secure certificate storage with online verification and public QR seals for recruiters.',
      tag: 'Verified',
    },
    {
      icon: Bot,
      gradient: 'from-violet-600 via-purple-500 to-fuchsia-400',
      title: 'AI Career Assistant',
      desc: 'Benchmark competencies against live industry requirements and receive personalized career pathways.',
      tag: 'AI Powered',
    },
    {
      icon: IndianRupee,
      gradient: 'from-amber-600 via-orange-500 to-yellow-400',
      title: 'Scholarships & Aid',
      desc: 'Discover verified fellowships, government grants, and research stipends with automatic CGPA matching.',
      tag: 'Auto Match',
    },
    {
      icon: Calendar,
      gradient: 'from-pink-600 via-rose-500 to-red-400',
      title: 'Events & Hackathons',
      desc: 'Participate in campus events with pre-filled credentials and instant digital gate passes.',
      tag: 'Instant Pass',
    },
    {
      icon: ShieldCheck,
      gradient: 'from-indigo-600 via-blue-500 to-sky-400',
      title: 'Governance & CMS',
      desc: 'Central control center for user roles, coordinator permissions, audit logs, and compliance.',
      tag: 'RBAC Secured',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-x-hidden">
      
      {/* ── ANNOUNCEMENT BAR ── */}
      {siteSettings.announcement_banner ? (
        <div className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 px-4 py-2.5 text-center text-xs font-bold text-white flex items-center justify-center gap-2">
          <Zap className="h-3.5 w-3.5 text-yellow-300" />
          <span>{siteSettings.announcement_banner}</span>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 px-4 py-2.5 text-center text-xs font-bold text-white flex items-center justify-center gap-2">
          <Zap className="h-3.5 w-3.5 text-yellow-300" />
          <span>Academic Year 2025–26 Enrollment Open — Anti-Proxy QR Attendance Live</span>
          <Link to="/register" className="underline ml-1 hover:text-yellow-200 transition-colors">
            Enroll →
          </Link>
        </div>
      )}

      {/* ── FLOATING GLASS HEADER ── */}
      <header className="sticky top-0 z-50">
        <div className="mx-4 sm:mx-6 lg:mx-8 mt-3">
          <div className="max-w-7xl mx-auto rounded-2xl border border-gray-200/60 dark:border-white/10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl shadow-lg shadow-gray-200/20 dark:shadow-black/30 px-5 py-3 flex items-center justify-between">
            
            {/* Brand */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:scale-110 transition-transform">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <span className="text-lg sm:text-xl font-black tracking-tight">
                Campus<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">Sphere</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-7 text-[13px] font-semibold text-gray-500 dark:text-gray-400">
              <a href="#features" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Features</a>
              <a href="#journey" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Journey</a>
              <a href="#verify" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center gap-1">
                <FileCheck className="h-3.5 w-3.5 text-emerald-500" /> Verify
              </a>
              <a href="#faqs" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">FAQ</a>
            </nav>

            {/* CTAs */}
            <div className="flex items-center gap-2.5">
              <Link to="/login" className="hidden sm:block">
                <button className="px-4 py-2 rounded-xl text-[13px] font-semibold text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  Sign In
                </button>
              </Link>
              <Link to="/register">
                <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-[13px] font-bold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  Get Started
                </button>
              </Link>
              <button
                className="lg:hidden p-2 text-gray-500 hover:text-violet-600 transition-colors"
                onClick={() => setMobileMenu(!mobileMenu)}
              >
                {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenu && (
            <div className="lg:hidden mt-2 max-w-7xl mx-auto rounded-2xl border border-gray-200/60 dark:border-white/10 bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl shadow-lg p-5 space-y-3 animate-fade-in">
              <a href="#features" onClick={() => setMobileMenu(false)} className="block text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-violet-600 py-2">Features</a>
              <a href="#journey" onClick={() => setMobileMenu(false)} className="block text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-violet-600 py-2">Journey</a>
              <a href="#verify" onClick={() => setMobileMenu(false)} className="block text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-violet-600 py-2">Verify</a>
              <a href="#faqs" onClick={() => setMobileMenu(false)} className="block text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-violet-600 py-2">FAQ</a>
              <Link to="/login" onClick={() => setMobileMenu(false)} className="block text-sm font-semibold text-violet-600 py-2">Sign In</Link>
            </div>
          )}
        </div>
      </header>

      {/* ── HERO — BOLD EDITORIAL SPLIT ── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Art — vivid diagonal color planes */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Large diagonal gradient wash */}
          <div 
            className="absolute -top-32 -right-32 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-violet-400/30 via-fuchsia-400/20 to-pink-400/10 blur-[100px]"
            style={{ transform: `translateY(${scrollY * 0.05}px)` }}
          />
          <div 
            className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-cyan-400/25 via-blue-400/15 to-indigo-400/10 blur-[100px]"
            style={{ transform: `translateY(${-scrollY * 0.03}px)` }}
          />
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-amber-300/10 to-orange-300/10 blur-[120px]"
          />
          {/* Dot pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Column — Editorial Typography */}
          <div className="space-y-8 text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-100 to-fuchsia-100 dark:from-violet-500/15 dark:to-fuchsia-500/15 border border-violet-200/60 dark:border-violet-500/20">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-pulse" />
              <span className="text-xs font-bold text-violet-700 dark:text-violet-300">{siteSettings.hero_badge}</span>
            </div>

            {/* Headline — Big, Bold, Colorful */}
            <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] font-black tracking-tight leading-[1.08]">
              {siteSettings.hero_title.includes('Intelligent') ? (
                <>
                  <span className="block text-gray-900 dark:text-white">Where Campus</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500">Meets Future.</span>
                </>
              ) : (
                siteSettings.hero_title
              )}
            </h1>

            {/* Subtext */}
            <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
              {siteSettings.hero_description}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-start">
              <Link to="/login">
                <button className="group px-7 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-700 hover:via-fuchsia-700 hover:to-pink-700 text-white font-bold text-sm shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-[1.03] active:scale-[0.97] flex items-center gap-2.5">
                  <span>{siteSettings.primary_cta_text}</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link to="/register">
                <button className="px-7 py-4 rounded-2xl bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 text-gray-800 dark:text-gray-200 font-bold text-sm hover:shadow-lg transition-all flex items-center gap-2.5">
                  <GraduationCap className="h-4 w-4 text-violet-500" />
                  <span>{siteSettings.secondary_cta_text}</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Right Column — Floating Glass Cards Stack */}
          <div className="relative h-[420px] sm:h-[480px] lg:h-[520px] mx-auto w-full max-w-lg lg:max-w-none overflow-hidden sm:overflow-visible">
            
            {/* Card 1 — QR Attendance (top-left) */}
            <div 
              className="absolute top-0 left-0 sm:left-4 w-[240px] sm:w-[280px] p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-500 hover:-translate-y-1"
              style={{ transform: `translateY(${scrollY * 0.02}px)` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Live QR Session</p>
                  <p className="text-[10px] text-gray-400">CS-402 · Hall 04</p>
                </div>
              </div>
              <div className="h-24 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center relative overflow-hidden">
                <div className="grid grid-cols-5 grid-rows-5 gap-1 opacity-40">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className={`h-2 w-2 rounded-sm ${Math.random() > 0.4 ? 'bg-blue-600' : 'bg-transparent'}`} />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-white/90 dark:bg-gray-900/90 px-2 py-0.5 rounded-md">Refreshes in 30s</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> 47 Scanned
                </span>
                <span className="text-[10px] font-mono text-gray-400">99.4% Rate</span>
              </div>
            </div>

            {/* Card 2 — Document Vault (middle-right) */}
            <div 
              className="absolute top-32 right-0 sm:right-4 w-[220px] sm:w-[260px] p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 shadow-2xl shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all duration-500 hover:-translate-y-1"
              style={{ transform: `translateY(${scrollY * 0.035}px)` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Credential Vault</p>
                  <p className="text-[10px] text-gray-400">SHA-256 Verified</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                  <span className="text-[10px] font-mono text-gray-500 truncate">hash: 8f4b7a...</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                  <span className="text-[10px] text-gray-600 dark:text-gray-300">B.Tech Marksheet</span>
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded">VERIFIED</span>
                </div>
              </div>
            </div>

            {/* Card 3 — AI Career (bottom-left) */}
            <div 
              className="absolute bottom-0 left-2 sm:left-12 w-[230px] sm:w-[270px] p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 shadow-2xl shadow-violet-500/10 hover:shadow-violet-500/20 transition-all duration-500 hover:-translate-y-1"
              style={{ transform: `translateY(${-scrollY * 0.025}px)` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">AI Career Copilot</p>
                  <p className="text-[10px] text-gray-400">Skill Analysis</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { skill: 'Full-Stack Dev', pct: 87, color: 'from-violet-500 to-purple-500' },
                  { skill: 'Data Science', pct: 72, color: 'from-fuchsia-500 to-pink-500' },
                  { skill: 'Cloud/DevOps', pct: 65, color: 'from-blue-500 to-cyan-500' },
                ].map((s) => (
                  <div key={s.skill}>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="font-semibold text-gray-600 dark:text-gray-300">{s.skill}</span>
                      <span className="font-bold text-gray-900 dark:text-white">{s.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating decorative elements */}
            <div className="absolute top-20 right-20 h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 rotate-12 hover:rotate-0 transition-transform duration-300">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div className="absolute bottom-20 right-16 h-11 w-11 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/30 -rotate-6 hover:rotate-0 transition-transform duration-300">
              <Star className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </section>


      {/* ── FEATURE SHOWCASE — VIVID GRADIENT CARDS ── */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-14">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-violet-100 to-fuchsia-100 dark:from-violet-500/15 dark:to-fuchsia-500/15 border border-violet-200/60 dark:border-violet-500/20">
              <Layers className="h-3.5 w-3.5 text-violet-500" />
              <span className="text-xs font-bold text-violet-700 dark:text-violet-300">Core Modules</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Everything Your Campus{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">Needs</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 leading-relaxed">
              Six powerful modules designed to digitize, secure, and accelerate every aspect of university operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="group relative overflow-hidden rounded-3xl border border-gray-200/80 dark:border-gray-700/40 bg-white dark:bg-gray-900/70 p-7 hover:shadow-2xl hover:border-transparent transition-all duration-500 hover:-translate-y-1"
                >
                  {/* Hover gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feat.gradient} opacity-0 group-hover:opacity-[0.04] dark:group-hover:opacity-[0.08] transition-opacity duration-500`} />
                  
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${feat.gradient} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200/60 dark:border-gray-700/50 group-hover:bg-gradient-to-r group-hover:from-violet-100 group-hover:to-fuchsia-100 dark:group-hover:from-violet-900/30 dark:group-hover:to-fuchsia-900/30 group-hover:text-violet-600 dark:group-hover:text-violet-400 group-hover:border-violet-200/60 dark:group-hover:border-violet-700/50 transition-all">
                        {feat.tag}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                  <div className="relative z-10 mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-xs font-bold text-violet-600 dark:text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Explore Module</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CAMPUS JOURNEY — INTERACTIVE TIMELINE ── */}
      <section id="journey" className="py-24 relative overflow-hidden">
        {/* Colored background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-violet-50/30 to-gray-50 dark:from-gray-900 dark:via-violet-950/20 dark:to-gray-900 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-14">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-500/15 dark:to-blue-500/15 border border-cyan-200/60 dark:border-cyan-500/20">
              <Compass className="h-3.5 w-3.5 text-cyan-500" />
              <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300">Your Journey</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
              From Enrollment to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">Career Launch</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
              A seamless 4-step journey that transforms your academic experience from day one.
            </p>
          </div>

          {/* Step Selector */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {journeySteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                    activeStep === idx
                      ? `bg-gradient-to-r ${step.color} text-white shadow-lg scale-105`
                      : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">Step {idx + 1}:</span>
                  <span>{step.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Step Card */}
          <div className="max-w-3xl mx-auto">
            <div className={`relative overflow-hidden rounded-3xl border-2 ${journeySteps[activeStep].borderColor} dark:border-gray-700 bg-white dark:bg-gray-900 p-8 sm:p-10 shadow-xl transition-all duration-500`}>
              {/* Background decorative gradient */}
              <div className={`absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-to-br ${journeySteps[activeStep].color} opacity-[0.08] blur-[60px]`} />
              
              <div className="relative z-10 space-y-5">
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${journeySteps[activeStep].color} text-white flex items-center justify-center shadow-lg`}>
                    {React.createElement(journeySteps[activeStep].icon, { className: 'h-7 w-7' })}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${journeySteps[activeStep].textColor} uppercase tracking-wider`}>Step {activeStep + 1} of 4</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">{journeySteps[activeStep].title}</h3>
                  </div>
                </div>
                <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                  {journeySteps[activeStep].desc}
                </p>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${journeySteps[activeStep].bgLight} dark:bg-gray-800/50 border ${journeySteps[activeStep].borderColor} dark:border-gray-700`}>
                  <CheckCircle2 className={`h-4 w-4 ${journeySteps[activeStep].textColor}`} />
                  <span className={`text-xs font-semibold ${journeySteps[activeStep].textColor}`}>
                    {journeySteps[activeStep].detail}
                  </span>
                </div>
                
                {/* Progress dots */}
                <div className="flex items-center gap-2 pt-2">
                  {journeySteps.map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 rounded-full transition-all duration-500 ${
                        i === activeStep
                          ? `w-8 bg-gradient-to-r ${journeySteps[activeStep].color}`
                          : 'w-2 bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Journey CTA */}
          <div className="text-center">
            <Link to="/register">
              <button className="px-7 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-2 mx-auto">
                <GraduationCap className="h-4 w-4" />
                <span>Start Your Journey</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PUBLIC CREDENTIAL VERIFICATION ── */}
      <section id="verify" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 sm:p-12 text-white shadow-2xl shadow-emerald-500/20">
            {/* Decorative */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
            
            <div className="relative z-10 space-y-6 text-center">
              <div className="h-14 w-14 mx-auto rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center">
                <FileCheck className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black">
                  Verify Any Credential Instantly
                </h2>
                <p className="text-sm opacity-90 max-w-lg mx-auto">
                  Recruiters, employers, and colleges can verify authentic marksheets and certificates online in seconds.
                </p>
              </div>

              <form onSubmit={handleVerifySubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-200" />
                  <input
                    type="text"
                    value={verifyUid}
                    onChange={(e) => setVerifyUid(e.target.value)}
                    placeholder="e.g. CS-CERT-2026-001"
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-emerald-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-white/40"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-xl bg-white text-emerald-700 font-bold text-sm hover:bg-emerald-50 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Verify Now
                </button>
              </form>

              <p className="text-xs opacity-70">
                Try demo UID:{' '}
                <button
                  type="button"
                  onClick={() => setVerifyUid('CS-CERT-2026-001')}
                  className="font-mono underline hover:no-underline opacity-90"
                >
                  CS-CERT-2026-001
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FREQUENTLY ASKED QUESTIONS ── */}
      <section id="faqs" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-500/15 dark:to-orange-500/15 border border-amber-200/60 dark:border-amber-500/20">
              <BookOpen className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Knowledge Base</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Everything you need to know about QR attendance, verified certificates, and account access.
            </p>
          </div>

          <div className="space-y-3">
            {siteSettings.faqs
              .filter((faq) => faq.question !== '__BRANDING__')
              .map((faq, idx) => {
                const isOpen = activeFaq === idx;
                const headerId = `faq-header-${idx}`;
                const panelId = `faq-panel-${idx}`;
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                      isOpen
                        ? 'border-violet-200 dark:border-violet-500/30 bg-gradient-to-r from-violet-50/50 to-fuchsia-50/50 dark:from-violet-950/20 dark:to-fuchsia-950/20 shadow-lg shadow-violet-500/5'
                        : 'border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/50 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <button
                      id={headerId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full p-5 flex items-center justify-between text-left text-sm font-bold text-gray-900 dark:text-white gap-4"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 transition-transform duration-300 ${
                          isOpen ? 'rotate-180 text-violet-500' : 'text-gray-400'
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={headerId}
                        className="px-5 pb-5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-violet-100 dark:border-violet-900/30 pt-4"
                      >
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA BANNER ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 p-10 sm:p-16 text-center text-white shadow-2xl shadow-violet-500/25">
          {/* Decorative circles */}
          <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-white/10 blur-3xl" />
          
          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Ready to Transform Your<br className="hidden sm:block" /> Campus Experience?
            </h2>
            <p className="text-base sm:text-lg opacity-90 max-w-xl mx-auto">
              Join thousands of students, faculty, and administrators who are already using CampusSphere to revolutionize higher education.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link to="/register">
                <button className="px-8 py-4 rounded-2xl bg-white text-violet-700 font-bold text-sm shadow-xl hover:bg-violet-50 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-2.5">
                  <GraduationCap className="h-5 w-5" />
                  <span>Create Free Account</span>
                </button>
              </Link>
              <Link to="/login">
                <button className="px-8 py-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 text-white font-bold text-sm hover:bg-white/25 transition-all flex items-center gap-2.5">
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <Footer />
    </div>
  );
};
