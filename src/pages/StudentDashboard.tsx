import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { studentService } from '../services/studentService';
import { attendanceService, EventAttendanceOverview } from '../services/attendanceService';
import { eventService } from '../services/eventService';
import { certificateService } from '../services/certificateService';
import { scholarshipService } from '../services/scholarshipService';
import { careerService } from '../services/careerService';
import { grievanceService } from '../services/grievanceService';
import {
  StudentProfile,
  Event,
  Certificate,
  Scholarship,
  JobPosting,
  GrievanceTicket,
} from '../types';
import { QRCameraScanner } from '../components/QRCameraScanner';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import { DynamicEventRegistrationModal } from '../components/DynamicEventRegistrationModal';
import { ScholarshipApplicationModal } from '../components/ScholarshipApplicationModal';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';
import {
  GraduationCap,
  CheckCircle2,
  Award,
  FileCheck,
  Calendar,
  Sparkles,
  Briefcase,
  Bot,
  HelpCircle,
  Camera,
  FileText,
  MapPin,
  ShieldCheck,
  Clock,
  Star,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  ChevronRight,
  BookOpen,
  Sun,
  SunMedium,
  Moon,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

/* ── Section Label ────────────────────────────────────────── */
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
    {children}
  </p>
);

/* ── KPI Metric Card with Clean Light Styling ─────────────── */
interface KpiMetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: 'blue' | 'emerald' | 'violet' | 'amber';
  progress?: number;
  isPrimary?: boolean;
}

const accentConfig = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    iconText: 'text-blue-600 dark:text-blue-400',
    border: 'border-slate-200/80 dark:border-white/10',
    bar: 'bg-blue-600',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-slate-200/80 dark:border-white/10',
    bar: 'bg-emerald-600',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    iconText: 'text-violet-600 dark:text-violet-400',
    border: 'border-slate-200/80 dark:border-white/10',
    bar: 'bg-violet-600',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    iconText: 'text-amber-600 dark:text-amber-400',
    border: 'border-slate-200/80 dark:border-white/10',
    bar: 'bg-amber-600',
  },
};

const KpiMetricCard: React.FC<KpiMetricCardProps> = ({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  progress,
  isPrimary = false,
}) => {
  const cfg = accentConfig[accent];
  return (
    <div
      className={`bg-white dark:bg-[#111425] border ${
        isPrimary
          ? 'border-violet-300 dark:border-violet-600/50 shadow-sm ring-1 ring-violet-500/10'
          : cfg.border
      } rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-sm`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${cfg.bg}`}>
          <Icon className={`h-4 w-4 ${cfg.iconText}`} />
        </div>
        {progress !== undefined && (
          <span className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400">
            {progress}%
          </span>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          {value}
        </p>
        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</p>
        {sub && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate leading-relaxed">
            {sub}
          </p>
        )}
      </div>

      {progress !== undefined && (
        <div className="mt-3.5 h-1.5 w-full bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

/* ── Circular Metric Gauge for Hero ───────────────────────── */
interface HeroGaugeProps {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  color?: string;
  label: string;
  detail: string;
  sub: string;
}

const HeroGauge: React.FC<HeroGaugeProps> = ({
  value,
  max = 100,
  size = 46,
  stroke = 4.5,
  color = '#2563eb',
  label,
  detail,
  sub,
}) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(value / max, 0), 1);

  return (
    <div className="flex items-center gap-3 p-2 rounded-xl">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-slate-100 dark:text-gray-800"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-800 dark:text-white font-mono">
          {Math.round(value)}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <p className="text-xs font-black text-slate-900 dark:text-white truncate">{detail}</p>
        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">{sub}</p>
      </div>
    </div>
  );
};

/* ── Main Component ───────────────────────────────────────── */
export const StudentDashboard: React.FC = () => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [eventOverview, setEventOverview] = useState<EventAttendanceOverview | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recommendedScholarships, setRecommendedScholarships] = useState<Scholarship[]>([]);
  const [featuredJobs, setFeaturedJobs] = useState<JobPosting[]>([]);
  const [recentCertificates, setRecentCertificates] = useState<Certificate[]>([]);
  const [recentTickets, setRecentTickets] = useState<GrievanceTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedCertForView, setSelectedCertForView] = useState<Certificate | null>(null);
  const [selectedEventForReg, setSelectedEventForReg] = useState<Event | null>(null);
  const [selectedScholarshipForApp, setSelectedScholarshipForApp] = useState<Scholarship | null>(null);
  const toast = useToast();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [profRes, attRes, evRes, schRes, jobsRes, certRes, ticketsRes] = await Promise.all([
        studentService.getMyProfile(),
        attendanceService.getMyEventAttendance(),
        eventService.getEvents(),
        scholarshipService.getScholarships({ minCgpa: 8.5 }),
        careerService.getJobs(),
        certificateService.getMyCertificates(),
        grievanceService.getTickets(),
      ]);
      setProfile(profRes);
      setEventOverview(attRes);
      setUpcomingEvents(evRes.slice(0, 4));
      setRecommendedScholarships(schRes.slice(0, 3));
      setFeaturedJobs(jobsRes.slice(0, 2));
      setRecentCertificates(certRes.slice(0, 3));
      setRecentTickets(ticketsRes.slice(0, 2));
    } catch (err: any) {
      toast.error('Could not load dashboard data', err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleScanSuccess = async (payload: {
    token: string;
    latitude?: number;
    longitude?: number;
  }) => {
    try {
      const res = await attendanceService.markAttendanceSecure({
        token: payload.token,
        latitude: payload.latitude,
        longitude: payload.longitude,
      });
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      toast.success('Event Check-In Verified!', res.message);
      setIsScannerOpen(false);
      fetchDashboardData();
    } catch (err: any) {
      toast.error('Scan Failed', err.message || 'Invalid or expired token.');
    }
  };

  if (loading) return <LoadingSkeleton rows={6} />;

  const studentName = profile?.user?.first_name || 'Student';
  const studentLastName = profile?.user?.last_name || '';
  const attendanceRate = eventOverview?.attendance_rate ?? 100;
  const eventsAttended = eventOverview?.total_events_attended ?? 0;
  const activityPoints = eventOverview?.activity_points_earned ?? 0;
  const cgpa = Number(profile?.cgpa || 8.92);
  const placementScore = profile?.placement_readiness_score || 96;

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const TimeIcon = hour < 12 ? Sun : hour < 17 ? SunMedium : Moon;

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const hasOpenTickets = recentTickets.some((t) => t.status !== 'RESOLVED');

  return (
    <div className="space-y-6 pb-16">
      {/* ── TOP CONTEXT STRIP ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <TimeIcon className="h-4 w-4 text-amber-500 shrink-0" />
          <span>{todayFormatted}</span>
          <span className="text-slate-300 dark:text-gray-700">·</span>
          <span>Semester {profile?.semester || 6} (Spring 2026)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/40">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active Student
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
            ID: {profile?.student_id || 'CS-2022-0147'}
          </span>
        </div>
      </div>

      {/* ── HERO AREA: BRIGHT, CLEAN, PREMIUM THEME ───────── */}
      <div className="relative overflow-hidden rounded-2xl bg-white/95 dark:bg-[#111425]/95 border border-slate-200/90 dark:border-violet-500/15 p-6 sm:p-7 shadow-xs">
        {/* Signature top brand accent gradient line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Identity & Status */}
          <div className="flex items-start sm:items-center gap-4">
            {/* Avatar with Initials */}
            <div className="relative shrink-0">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-md shadow-violet-500/25">
                {studentName[0]}
                {studentLastName[0] || ''}
              </div>
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#111425]" />
            </div>

            <div className="space-y-1 min-w-0">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {timeGreeting}, {studentName}
              </p>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                {studentName} {studentLastName}
              </h1>

              {/* Badges line with proper wrapping */}
              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#171b32] px-2.5 py-0.5 rounded-lg border border-slate-200/70 dark:border-white/5">
                  <BookOpen className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                  Sem {profile?.semester || 6} · Div {profile?.division || 'A'}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#171b32] px-2.5 py-0.5 rounded-lg border border-slate-200/70 dark:border-white/5">
                  <GraduationCap className="h-3 w-3 text-fuchsia-600 dark:text-fuchsia-400" />
                  {profile?.department?.name || 'Computer Engineering'}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-0.5 rounded-lg border border-emerald-200/70 dark:border-emerald-800/40">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  Campus Pass Verified
                </span>
              </div>
            </div>
          </div>

          {/* Primary Contextual Action & Shortcuts */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-xs font-bold transition-all shadow-md shadow-violet-500/25 active:scale-[0.98]"
            >
              <Camera className="h-3.5 w-3.5" />
              Scan Event QR
            </button>
            <Link to="/attendance">
              <button className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-violet-50/50 dark:bg-[#111425] dark:hover:bg-[#171b32] text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 hover:border-violet-300 dark:border-violet-500/20 transition-all shadow-2xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Attendance
              </button>
            </Link>
            <Link to="/exam-results">
              <button className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-violet-50/50 dark:bg-[#111425] dark:hover:bg-[#171b32] text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 hover:border-violet-300 dark:border-violet-500/20 transition-all shadow-2xs">
                <BarChart3 className="h-3.5 w-3.5 text-indigo-600" />
                Results
              </button>
            </Link>
            <Link to="/ai-assistant">
              <button className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-violet-50/50 dark:bg-[#111425] dark:hover:bg-[#171b32] text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 hover:border-violet-300 dark:border-violet-500/20 transition-all shadow-2xs">
                <Bot className="h-3.5 w-3.5 text-violet-600" />
                AI Assistant
              </button>
            </Link>
          </div>
        </div>

        {/* Highlight Progress Gauges Strip */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <HeroGauge
            value={Math.round(cgpa * 10)}
            max={100}
            color="#7c3aed"
            label="Academic Standing"
            detail={`${cgpa} / 10.0`}
            sub="First Class Distinction"
          />
          <HeroGauge
            value={attendanceRate}
            max={100}
            color="#059669"
            label="Verified Attendance"
            detail={`${eventsAttended} Sessions`}
            sub={`${attendanceRate}% Completion`}
          />
          <HeroGauge
            value={Math.min(activityPoints, 500)}
            max={500}
            color="#7c3aed"
            label="Activity Points"
            detail={`${activityPoints} pts`}
            sub="Co-curricular XP"
          />
          <HeroGauge
            value={placementScore}
            max={100}
            color="#d97706"
            label="Placement Readiness"
            detail={`${placementScore}%`}
            sub="Tier-1 Profile"
          />
        </div>
      </div>

      {/* ── ASYMMETRIC MAIN GRID: 8 COLS + 4 COLS ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── LEFT COLUMN: PRIMARY CONTENT (8 cols) ────────── */}
        <div className="lg:col-span-8 space-y-6">
          {/* Quick Status Strip (KPI Cards with Visual Hierarchy) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <KpiMetricCard
              label="Cumulative CGPA"
              value={cgpa}
              sub="101 Academic Credits"
              icon={GraduationCap}
              accent="blue"
              progress={Math.round(cgpa * 10)}
              isPrimary
            />
            <KpiMetricCard
              label="Events Attended"
              value={eventsAttended}
              sub={`${eventOverview?.masterclasses_attended || 0} workshops completed`}
              icon={CheckCircle2}
              accent="emerald"
              progress={attendanceRate}
            />
            <KpiMetricCard
              label="Activity XP"
              value={`${activityPoints} pts`}
              sub="Campus event credits"
              icon={Sparkles}
              accent="violet"
            />
            <KpiMetricCard
              label="Placement Score"
              value={`${placementScore}%`}
              sub="Resume & skill benchmark"
              icon={Briefcase}
              accent="amber"
              progress={placementScore}
            />
          </div>

          {/* Upcoming Events & Certified Workshops */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-white/5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Upcoming Events & Workshops
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Hackathons, expert seminars, and certified workshops
                </p>
              </div>
              <Link
                to="/events"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {upcomingEvents.length === 0 ? (
                <div className="px-5 py-10 text-center space-y-2">
                  <div className="mx-auto h-10 w-10 rounded-xl bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No upcoming events right now
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Check back soon for new campus workshops and hackathons.
                  </p>
                </div>
              ) : (
                upcomingEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-1 h-9 w-9 shrink-0 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded-md">
                            {ev.category || 'Workshop'}
                          </span>
                          {ev.points_reward ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-md font-mono">
                              +{ev.points_reward} XP
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {ev.title}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {new Date(ev.start_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {ev.venue || 'Campus Auditorium'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => setSelectedEventForReg(ev)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-xs font-bold transition-all shadow-xs"
                      >
                        Register
                      </button>
                      <button
                        onClick={() => setIsScannerOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-violet-50/50 dark:hover:bg-[#171b32] transition-colors"
                      >
                        QR Check-in
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Verified Attendance Records */}
          <div className="bg-white/95 dark:bg-[#111425]/95 border border-slate-200/80 dark:border-violet-500/15 rounded-2xl overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-white/5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Verified Attendance Records
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Recent check-in history and activity points earned
                </p>
              </div>
              <Link
                to="/attendance"
                className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline shrink-0"
              >
                All records
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {!eventOverview || eventOverview.records.length === 0 ? (
              <div className="px-5 py-10 text-center space-y-3">
                <div className="mx-auto h-10 w-10 rounded-xl bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No attendance records yet
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Scan event QR codes at college sessions to record your attendance and earn credits.
                </p>
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                >
                  Scan QR Now
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {eventOverview.records.slice(0, 5).map((rec) => {
                  const isVerified =
                    rec.status === 'CHECKED_IN' || rec.status === 'ATTENDED';
                  return (
                    <div
                      key={rec.id}
                      className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-8 w-8 shrink-0 rounded-xl flex items-center justify-center ${
                            isVerified
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-400 dark:bg-gray-800'
                          }`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {rec.event?.title || 'Campus Session'}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {rec.checked_in_at
                              ? `Checked in on ${new Date(rec.checked_in_at).toLocaleDateString(
                                  'en-IN'
                                )}`
                              : `Registered on ${new Date(rec.registered_at).toLocaleDateString(
                                  'en-IN'
                                )}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isVerified
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                              : 'bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-slate-300'
                          }`}
                        >
                          {rec.status}
                        </span>
                        <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                          +{rec.points_reward || 15} XP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Semester Exam Results Snapshot Banner */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Semester Exam Results & Grades
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                    PASSED
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Current SGPA {cgpa} · {profile?.semester || 5} Semesters Completed · First Class
                </p>
              </div>
            </div>

            <Link to="/exam-results">
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-violet-500/20 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 transition-colors shrink-0">
                <BarChart3 className="h-3.5 w-3.5" />
                View Marksheets
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>

          {/* Featured Placement Opportunities */}
          {featuredJobs.length > 0 && (
            <div className="bg-white dark:bg-[#111425] border border-slate-200/80 dark:border-violet-500/15 rounded-2xl overflow-hidden shadow-xs">
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-white/5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Featured Opportunities
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Curated placements and internships from Campus Placement Cell
                  </p>
                </div>
                <Link
                  to="/career"
                  className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline shrink-0"
                >
                  Career Hub
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {featuredJobs.map((job: any) => (
                  <div
                    key={job.id}
                    className="px-5 py-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-[#171b32] flex items-center justify-center shrink-0 font-black text-sm text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-violet-500/15">
                        {(job.company_name || job.company || 'C')[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {job.title || job.position}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {job.company_name || job.company} · {job.location || 'On-Campus'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {job.package && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-md font-mono border border-emerald-200 dark:border-emerald-800/40">
                          {job.package} LPA
                        </span>
                      )}
                      <Link to="/career">
                        <button className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-violet-500/20 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                          Apply
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: SUPPORTING PANELS (4 cols) ───────── */}
        <div className="lg:col-span-4 space-y-6">
          {/* Academic ID Card — Bright, Premium White Card */}
          <div className="rounded-2xl bg-white/95 dark:bg-[#111425]/95 border border-slate-200/80 dark:border-violet-500/15 p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Campus Student Pass
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white flex items-center justify-center font-black text-base shrink-0 shadow-md shadow-violet-500/20">
                {studentName[0]}
                {studentLastName[0] || ''}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {studentName} {studentLastName}
                </h3>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {profile?.student_id || (profile as any)?.roll_number || 'CS-2022-0147'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[11px] pt-3.5 border-t border-slate-100 dark:border-white/5">
              <div>
                <p className="text-slate-400 font-medium">Department</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                  {profile?.department?.name || 'Computer Engineering'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Semester</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  Sem {profile?.semester || 6} · Div {profile?.division || 'A'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Current CGPA</p>
                <p className="font-mono font-bold text-violet-600 dark:text-violet-400 mt-0.5">
                  {cgpa} / 10.0
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Activity Points</p>
                <p className="font-mono font-bold text-fuchsia-600 dark:text-fuchsia-400 mt-0.5">
                  {activityPoints} XP
                </p>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines & Scholarships */}
          <div className="bg-white/95 dark:bg-[#111425]/95 border border-slate-200/80 dark:border-violet-500/15 rounded-2xl overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Upcoming Deadlines
              </h3>
              <Link
                to="/scholarships"
                className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {recommendedScholarships.slice(0, 2).map((sch, i) => {
                const daysLeft = sch.deadline
                  ? Math.max(0, Math.ceil((new Date(sch.deadline).getTime() - Date.now()) / 86400000))
                  : i === 0
                  ? 18
                  : 5;
                const isUrgent = daysLeft <= 7;

                return (
                  <div
                    key={sch.id}
                    onClick={() => setSelectedScholarshipForApp(sch)}
                    className="px-5 py-4 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-md">
                        Scholarship
                      </span>
                      <span
                        className={`text-[10px] font-bold font-mono inline-flex items-center gap-1 ${
                          isUrgent
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {isUrgent && <AlertTriangle className="h-3 w-3" />}
                        {daysLeft}d left
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {sch.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Min CGPA {(sch as any).min_cgpa || '8.0'} ·{' '}
                      {(sch as any).amount
                        ? `₹${Number((sch as any).amount).toLocaleString('en-IN')}`
                        : 'Official Grant'}
                    </p>
                  </div>
                );
              })}

              {upcomingEvents[0] && (
                <div
                  onClick={() => setSelectedEventForReg(upcomingEvents[0])}
                  className="px-5 py-4 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded-md">
                      Event
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 inline-flex items-center gap-1">
                      Register
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {upcomingEvents[0].title}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {upcomingEvents[0].venue || 'Campus'} · +{upcomingEvents[0].points_reward} XP
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Help Desk & Grievance Tickets */}
          <div className="bg-white/95 dark:bg-[#111425]/95 border border-slate-200/80 dark:border-violet-500/15 rounded-2xl overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <HelpCircle
                  className={`h-4 w-4 ${hasOpenTickets ? 'text-amber-500' : 'text-emerald-500'}`}
                />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Help Desk</h3>
              </div>
              <Link
                to="/grievances"
                className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
              >
                + New Ticket
              </Link>
            </div>

            {recentTickets.length === 0 ? (
              <div className="px-5 py-6 text-center space-y-1">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  No open tickets
                </p>
                <p className="text-[11px] text-slate-400">All campus support tickets are resolved.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {recentTickets.map((t) => (
                  <Link
                    key={t.id}
                    to="/grievances"
                    className="block px-5 py-3.5 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                        {t.ticket_uid}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          t.status === 'RESOLVED'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-1">
                      {t.title}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action Tools */}
          <div>
            <SectionLabel>Quick Tools</SectionLabel>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  to: '/certificates',
                  label: 'Documents',
                  icon: FileCheck,
                  color: 'text-blue-600 dark:text-blue-400',
                  bg: 'bg-blue-50 dark:bg-blue-950/40',
                },
                {
                  to: '/resume-builder',
                  label: 'Resume Builder',
                  icon: FileText,
                  color: 'text-indigo-600 dark:text-indigo-400',
                  bg: 'bg-indigo-50 dark:bg-indigo-950/40',
                },
                {
                  to: '/ai-assistant',
                  label: 'AI Assistant',
                  icon: Bot,
                  color: 'text-violet-600 dark:text-violet-400',
                  bg: 'bg-violet-50 dark:bg-violet-950/40',
                },
                {
                  to: '/security',
                  label: 'Security & 2FA',
                  icon: ShieldCheck,
                  color: 'text-emerald-600 dark:text-emerald-400',
                  bg: 'bg-emerald-50 dark:bg-emerald-950/40',
                },
                {
                  to: '/skills',
                  label: 'Skills & Projects',
                  icon: Star,
                  color: 'text-amber-600 dark:text-amber-400',
                  bg: 'bg-amber-50 dark:bg-amber-950/40',
                },
                {
                  to: '/career',
                  label: 'Career Hub',
                  icon: TrendingUp,
                  color: 'text-rose-600 dark:text-rose-400',
                  bg: 'bg-rose-50 dark:bg-rose-950/40',
                },
              ].map(({ to, label, icon: Icon, color, bg }) => (
                <Link
                  key={to}
                  to={to}
                  className="group flex items-center gap-2.5 p-3 rounded-xl border border-slate-200/80 dark:border-violet-500/15 bg-white dark:bg-[#111425] hover:border-violet-300 dark:hover:border-violet-500/40 hover:shadow-violet-500/5 hover:shadow-md transition-all"
                >
                  <div
                    className={`h-7 w-7 rounded-lg ${bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Verified Certificates */}
          {recentCertificates.length > 0 && (
            <div className="bg-white dark:bg-[#111425] border border-slate-200/80 dark:border-violet-500/15 rounded-2xl overflow-hidden shadow-xs">
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-white/5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Certificates & Documents
                </h3>
                <Link
                  to="/certificates"
                  className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
                >
                  View all
                </Link>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {recentCertificates.map((cert) => (
                  <div
                    key={cert.id}
                    onClick={() => setSelectedCertForView(cert)}
                    className="px-5 py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Award className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {cert.title || (cert as any).certificate_type}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {(cert as any).issuer || 'Campus Authority'}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-md shrink-0 border border-emerald-200/80 dark:border-emerald-800/40">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      Verified
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Interactive Modals (Preserved with 100% functionality) ── */}
      <QRCameraScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
      <DocumentViewerModal
        certificate={selectedCertForView}
        isOpen={Boolean(selectedCertForView)}
        onClose={() => setSelectedCertForView(null)}
      />
      <DynamicEventRegistrationModal
        event={selectedEventForReg}
        studentProfile={profile}
        isOpen={Boolean(selectedEventForReg)}
        onClose={() => setSelectedEventForReg(null)}
        onSuccess={fetchDashboardData}
      />
      <ScholarshipApplicationModal
        scholarship={selectedScholarshipForApp}
        studentProfile={profile}
        isOpen={Boolean(selectedScholarshipForApp)}
        onClose={() => setSelectedScholarshipForApp(null)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};
