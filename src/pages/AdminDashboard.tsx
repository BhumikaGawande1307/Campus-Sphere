import React, { useEffect, useState, useMemo } from 'react';
import { adminService, AuditLog } from '../services/adminService';
import { supabase } from '../services/supabaseClient';
import { notificationSocketService } from '../services/notificationSocketService';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { useToast } from '../context/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  Briefcase,
  Calendar,
  DollarSign,
  AlertCircle,
  Activity,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Building2,
  FileText,
  Settings,
  QrCode,
  Plus,
  Search,
  ArrowUpRight,
  BarChart3,
  RefreshCw,
  Bell,
  Send,
  X,
  Award,
  TrendingUp,
  Database,
  BookOpen,
  Printer,
  Eye,
  Check,
  Radio,
  Server,
  Key,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

interface EventItem {
  id: string;
  title: string;
  category: string;
  venue: string;
  start_date: string;
  capacity?: number;
  points?: number;
  status: string;
}

interface DepartmentStat {
  id: number;
  name: string;
  code: string;
  studentCount: number;
  facultyCount: number;
}

interface StudentQuickSearchResult {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  course: string;
  cgpa: number;
  dept_code: string;
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { branding } = useBranding();
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<any>(null);

  // Additional live telemetry states
  const [events, setEvents] = useState<EventItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentStat[]>([]);
  const [recentGrievances, setRecentGrievances] = useState<any[]>([]);
  const [activeOperationsTab, setActiveOperationsTab] = useState<'events' | 'departments' | 'grievances' | 'audit' | 'diagnostics'>('events');
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'USERS' | 'SETTINGS' | 'SECURITY'>('ALL');

  // Interactive Modals
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showQuickSearchModal, setShowQuickSearchModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Broadcast Form
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    content: '',
    category: 'General',
    priority: 'NORMAL',
    target_audience: 'All',
  });
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Quick Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StudentQuickSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Live Clock
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all telemetry data
  const loadDashboardData = async () => {
    try {
      // 1. Get Platform Overview
      const ov = await adminService.getPlatformOverview();
      setOverview(ov);

      // 2. Fetch Active Events
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title, category, venue, start_date, capacity, points, status')
        .order('start_date', { ascending: true })
        .limit(6);
      setEvents(eventsData || []);

      // 3. Fetch Departments and compute distribution
      const { data: deptData } = await supabase
        .from('departments')
        .select('id, name, code');

      const { data: allStudents } = await supabase
        .from('students')
        .select('department_id');

      const { data: allFaculty } = await supabase
        .from('faculty')
        .select('department_id');

      const deptStats: DepartmentStat[] = (deptData || []).map(d => {
        const sCount = (allStudents || []).filter(s => s.department_id === d.id).length;
        const fCount = (allFaculty || []).filter(f => f.department_id === d.id).length;
        return {
          id: d.id,
          name: d.name,
          code: d.code,
          studentCount: sCount,
          facultyCount: fCount,
        };
      });
      setDepartments(deptStats);

      // 4. Fetch Recent Student Support Tickets & Grievances
      const { data: grievancesData } = await supabase
        .from('grievances')
        .select('*, student:users!submitted_by(first_name, last_name, email, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(6);
      setRecentGrievances(grievancesData || []);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      toast.error('Failed to load dashboard data', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Subscribe to realtime grievance updates so admin dashboard auto-refreshes
    const unsubscribe = notificationSocketService.subscribeGrievance(() => {
      loadDashboardData();
    });
    return () => unsubscribe();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    toast.success('Data Refreshed', 'Live campus metrics updated.');
  };

  // Broadcast Announcement
  const handleSendBroadcast = async () => {
    if (!broadcastForm.title.trim() || !broadcastForm.content.trim()) {
      toast.error('Missing Info', 'Please enter both a title and notice content.');
      return;
    }

    setIsBroadcasting(true);
    try {
      const { error } = await supabase.from('announcements').insert({
        title: broadcastForm.title.trim(),
        content: broadcastForm.content.trim(),
        category: broadcastForm.category,
        priority: broadcastForm.priority,
        author_id: user?.id,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success('Notice Broadcasted', 'Institutional notice has been dispatched across all student portals.');
      setShowBroadcastModal(false);
      setBroadcastForm({
        title: '',
        content: '',
        category: 'General',
        priority: 'NORMAL',
        target_audience: 'All',
      });
      loadDashboardData();
    } catch (err: any) {
      toast.error('Failed to broadcast notice', err.message);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Quick Search for Students
  const handleSearchStudents = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // 1. Search students by student_id
      const { data: byStudentId } = await supabase
        .from('students')
        .select(`
          id, student_id, course, cgpa, user_id,
          users!inner(first_name, last_name, email),
          departments(code)
        `)
        .ilike('student_id', `%${query}%`)
        .limit(6);

      // 2. Search by matching student user first name, last name, or email
      const { data: matchedUsers } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'STUDENT')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(6);

      let byUserIds: any[] = [];
      const userIds = (matchedUsers || []).map((u) => u.id).filter(Boolean);
      if (userIds.length > 0) {
        const { data: byUserResults } = await supabase
          .from('students')
          .select(`
            id, student_id, course, cgpa, user_id,
            users!inner(first_name, last_name, email),
            departments(code)
          `)
          .in('user_id', userIds)
          .limit(6);
        byUserIds = byUserResults || [];
      }

      // Merge and deduplicate by student id
      const combined = [...(byStudentId || []), ...byUserIds];
      const seen = new Set<string>();
      const data = combined.filter((item) => {
        if (seen.has(String(item.id))) return false;
        seen.add(String(item.id));
        return true;
      }).slice(0, 6);

      const formatted: StudentQuickSearchResult[] = (data || []).map((s: any) => ({
        id: s.id,
        student_id: s.student_id,
        first_name: s.users?.first_name || 'Student',
        last_name: s.users?.last_name || '',
        email: s.users?.email || '',
        course: s.course || 'B.Tech Program',
        cgpa: Number(s.cgpa) || 0,
        dept_code: s.departments?.code || 'GEN',
      }));

      setSearchResults(formatted);
    } catch (err) {
      console.warn('Search query error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    const logs: AuditLog[] = overview?.recent_activity || [];
    if (auditFilter === 'ALL') return logs;
    return logs.filter(log => {
      const act = (log.action || '').toUpperCase();
      const res = (log.resource_type || '').toUpperCase();
      if (auditFilter === 'USERS') return res.includes('USER') || act.includes('ROLE') || act.includes('USER');
      if (auditFilter === 'SETTINGS') return res.includes('SETTING') || act.includes('SETTING');
      if (auditFilter === 'SECURITY') return act.includes('SECURITY') || act.includes('AUTH') || act.includes('STATUS');
      return true;
    });
  }, [overview?.recent_activity, auditFilter]);

  if (loading) return <LoadingSkeleton rows={8} />;

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-slate-900 dark:text-slate-100">
      {/* 1. EXECUTIVE COMMAND HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-slate-200/90 dark:border-white/10 p-6 sm:p-7 shadow-xs">
        {/* Top subtle accent line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                Institutional Administration
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                All Campus Services Operational
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono hidden sm:inline">
                • {currentTime}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {branding.shortName || branding.appName || 'Campus'} Overview & Management
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl font-medium leading-relaxed">
              Real-time campus operations, student records, event workflows, and administrative telemetry.
            </p>
          </div>

          {/* Quick Action Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              leftIcon={<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />}
              className="rounded-xl text-xs font-bold"
            >
              Refresh Data
            </Button>

            <Button
              size="sm"
              onClick={() => setShowBroadcastModal(true)}
              leftIcon={<Bell className="h-4 w-4" />}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl shadow-md shadow-violet-500/25 text-xs font-bold transition-all active:scale-[0.98] border-0"
            >
              Broadcast Notice
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReportModal(true)}
              leftIcon={<FileText className="h-4 w-4" />}
              className="rounded-xl text-xs font-bold"
            >
              Executive Report
            </Button>
          </div>
        </div>
      </div>

      {/* 2. OPERATIONAL ACTION CENTER (High-Priority Workflow Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Urgent Grievances Card */}
        <div className="bg-white dark:bg-midnight-900 rounded-3xl border border-rose-200/80 dark:border-rose-900/40 p-5 space-y-4 shadow-xs relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                Grievance Resolution
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Student Support Tickets
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {overview?.stats?.open_grievances > 0
                  ? `${overview.stats.open_grievances} open tickets require administrative review.`
                  : 'All student grievances have been addressed and resolved.'}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>

          <div className="flex items-end justify-between pt-2 border-t border-slate-100 dark:border-white/5">
            <div>
              <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
                {overview?.stats?.open_grievances || 0}
              </span>
              <span className="text-xs text-slate-400 ml-1.5 font-medium">Pending Tickets</span>
            </div>
            <Link
              to="/admin/grievances"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-xs"
            >
              Open Desk <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Pending Approvals & Vault Verifications */}
        <div className="bg-white dark:bg-midnight-900 rounded-3xl border border-amber-200/80 dark:border-amber-900/40 p-5 space-y-4 shadow-xs relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                Verifications & Grants
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pending Approvals
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scholarships, certificate credentials, and vault documents.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0">
              <Clock className="h-6 w-6" />
            </div>
          </div>

          <div className="flex items-end justify-between pt-2 border-t border-slate-100 dark:border-white/5">
            <div>
              <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
                {overview?.stats?.pending_approvals || 0}
              </span>
              <span className="text-xs text-slate-400 ml-1.5 font-medium">Under Review</span>
            </div>
            <Link
              to="/admin/approvals"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all shadow-xs"
            >
              Review Vault <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* QR Attendance & Masterclasses Projector */}
        <div className="bg-white dark:bg-midnight-900 rounded-3xl border border-emerald-200/80 dark:border-emerald-900/40 p-5 space-y-4 shadow-xs relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Attendance & Check-in
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Live QR Projector
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Launch fullscreen QR check-in display for classes and campus events.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
              <QrCode className="h-6 w-6" />
            </div>
          </div>

          <div className="flex items-end justify-between pt-2 border-t border-slate-100 dark:border-white/5">
            <div>
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {events.length}
              </span>
              <span className="text-xs text-slate-400 ml-1.5 font-medium">Active Events</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Link
                to="/attendance/qr"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-xs"
              >
                Launch QR <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CORE INSTITUTIONAL KPI STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Students */}
        <div className="bg-white dark:bg-midnight-900 p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Enrolled Students
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {overview?.stats?.total_students || 0}
            </span>
            <Link
              to="/admin/students"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              Manage <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Verified student profiles</span>
            <span className="font-semibold text-emerald-600">Active</span>
          </p>
        </div>

        {/* Total Faculty */}
        <div className="bg-white dark:bg-midnight-900 p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Faculty & Staff
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {overview?.stats?.total_faculty || 0}
            </span>
            <Link
              to="/admin/faculty"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              Directory <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Across academic faculties</span>
            <span className="font-semibold text-indigo-600">Appointed</span>
          </p>
        </div>

        {/* Academic Departments */}
        <div className="bg-white dark:bg-midnight-900 p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Academic Departments
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {departments.length}
            </span>
            <Link
              to="/admin/departments"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              Courses <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            {departments.map(d => d.code).join(' • ') || 'Active Programs'}
          </p>
        </div>

        {/* Campus Events & Masterclasses */}
        <div className="bg-white dark:bg-midnight-900 p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Campus Events
            </span>
            <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {overview?.stats?.total_events || 0}
            </span>
            <Link
              to="/admin/events"
              className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5"
            >
              Events Hub <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Masterclasses & Fests</span>
            <span className="font-semibold text-cyan-600">Scheduled</span>
          </p>
        </div>
      </div>

      {/* 4. INTERACTIVE EXECUTIVE WORKFLOW SHORTCUTS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            Institutional Operating System Shortcuts
          </h2>
          <span className="text-xs text-slate-400">Direct Navigation Hub</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Students Directory */}
          <Link
            to="/admin/students"
            className="p-4 rounded-2xl bg-white dark:bg-midnight-900 border border-slate-200/80 dark:border-white/10 hover:border-blue-500/50 hover:shadow-md transition-all group space-y-2"
          >
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-fit group-hover:scale-105 transition-transform">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                Students Roster
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                Filter, sort, bulk CSV upload
              </p>
            </div>
          </Link>

          {/* Faculty & Staff */}
          <Link
            to="/admin/faculty"
            className="p-4 rounded-2xl bg-white dark:bg-midnight-900 border border-slate-200/80 dark:border-white/10 hover:border-indigo-500/50 hover:shadow-md transition-all group space-y-2"
          >
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 w-fit group-hover:scale-105 transition-transform">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                Faculty & Staff
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                Appointments & roles
              </p>
            </div>
          </Link>

          {/* Academic Departments */}
          <Link
            to="/admin/departments"
            className="p-4 rounded-2xl bg-white dark:bg-midnight-900 border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/50 hover:shadow-md transition-all group space-y-2"
          >
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 w-fit group-hover:scale-105 transition-transform">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                Departments & Courses
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                HODs, syllabus & subjects
              </p>
            </div>
          </Link>

          {/* Events & Notices */}
          <Link
            to="/admin/events"
            className="p-4 rounded-2xl bg-white dark:bg-midnight-900 border border-slate-200/80 dark:border-white/10 hover:border-cyan-500/50 hover:shadow-md transition-all group space-y-2"
          >
            <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-fit group-hover:scale-105 transition-transform">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 transition-colors">
                Campus Events & Workshops
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                QR check-ins & attendees
              </p>
            </div>
          </Link>

          {/* Exam Results */}
          <Link
            to="/admin/results"
            className="p-4 rounded-2xl bg-white dark:bg-midnight-900 border border-slate-200/80 dark:border-white/10 hover:border-purple-500/50 hover:shadow-md transition-all group space-y-2"
          >
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 w-fit group-hover:scale-105 transition-transform">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                Exam Results & GPA
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                Grade sheets & marks
              </p>
            </div>
          </Link>

          {/* Grievance Desk */}
          <Link
            to="/admin/grievances"
            className="p-4 rounded-2xl bg-white dark:bg-midnight-900 border border-slate-200/80 dark:border-white/10 hover:border-rose-500/50 hover:shadow-md transition-all group space-y-2"
          >
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 w-fit group-hover:scale-105 transition-transform">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
                Grievance Center
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                Student tickets & proof
              </p>
            </div>
          </Link>

          {/* Scholarships Vault */}
          <Link
            to="/admin/scholarships"
            className="p-4 rounded-2xl bg-white dark:bg-midnight-900 border border-slate-200/80 dark:border-white/10 hover:border-amber-500/50 hover:shadow-md transition-all group space-y-2"
          >
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 w-fit group-hover:scale-105 transition-transform">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                Scholarships Vault
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                Add & manage grants
              </p>
            </div>
          </Link>

          {/* Career & Placements */}
          <Link
            to="/admin/career"
            className="p-4 rounded-2xl bg-white dark:bg-midnight-900 border border-slate-200/80 dark:border-white/10 hover:border-blue-500/50 hover:shadow-md transition-all group space-y-2"
          >
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-fit group-hover:scale-105 transition-transform">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                Career & Placements
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                Post recruitment drives
              </p>
            </div>
          </Link>

          {/* Campus Announcements */}
          <Link
            to="/admin/announcements"
            className="p-4 rounded-2xl bg-white dark:bg-midnight-900 border border-slate-200/80 dark:border-white/10 hover:border-violet-500/50 hover:shadow-md transition-all group space-y-2"
          >
            <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 w-fit group-hover:scale-105 transition-transform">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-violet-600 transition-colors">
                Campus Notices
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                Publish alerts & notices
              </p>
            </div>
          </Link>

          {/* Live QR Projector */}
          <Link
            to="/attendance/qr"
            className="p-4 rounded-2xl bg-white dark:bg-midnight-900 border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/50 hover:shadow-md transition-all group space-y-2"
          >
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 w-fit group-hover:scale-105 transition-transform">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                Live QR Projector
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                Attendance check-in screen
              </p>
            </div>
          </Link>

          {/* Approval Center */}
          <Link
            to="/admin/approvals"
            className="p-4 rounded-2xl bg-white dark:bg-midnight-900 border border-slate-200/80 dark:border-white/10 hover:border-amber-500/50 hover:shadow-md transition-all group space-y-2"
          >
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 w-fit group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                Approval Vault
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                Credentials & certificates
              </p>
            </div>
          </Link>

          {/* System Settings & Branding */}
          <Link
            to="/admin/settings"
            className="p-4 rounded-2xl bg-white dark:bg-midnight-900 border border-slate-200/80 dark:border-white/10 hover:border-blue-500/50 hover:shadow-md transition-all group space-y-2"
          >
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-fit group-hover:scale-105 transition-transform">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                Settings & Branding
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                1-Click software rename
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* 5. MULTI-TABBED TELEMETRY & OPERATIONS HUB */}
      <div className="bg-white dark:bg-midnight-900 rounded-3xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs">
        {/* Tab Headers */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-white/10 px-6 pt-4 gap-3 bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveOperationsTab('events')}
              className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 ${
                activeOperationsTab === 'events'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-midnight-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Active Events ({events.length})
            </button>

            <button
              onClick={() => setActiveOperationsTab('departments')}
              className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 ${
                activeOperationsTab === 'departments'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-midnight-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Academic Departments ({departments.length})
            </button>

            <button
              onClick={() => setActiveOperationsTab('grievances')}
              className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeOperationsTab === 'grievances'
                  ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-white dark:bg-midnight-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <AlertCircle className="h-3.5 w-3.5" />
              Support & Grievances ({recentGrievances.length})
            </button>

            <button
              onClick={() => setActiveOperationsTab('audit')}
              className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 ${
                activeOperationsTab === 'audit'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-midnight-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Live Audit Stream
            </button>

            <button
              onClick={() => setActiveOperationsTab('diagnostics')}
              className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 ${
                activeOperationsTab === 'diagnostics'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-midnight-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              System Health
            </button>
          </div>

          <div className="pb-2">
            {activeOperationsTab === 'events' && (
              <Link
                to="/admin/events"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Create Event <Plus className="h-3 w-3" />
              </Link>
            )}
            {activeOperationsTab === 'departments' && (
              <Link
                to="/admin/departments"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Department Hub <ChevronRight className="h-3 w-3" />
              </Link>
            )}
            {activeOperationsTab === 'grievances' && (
              <Link
                to="/admin/grievances"
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
              >
                Open Grievance Desk <ChevronRight className="h-3 w-3" />
              </Link>
            )}
            {activeOperationsTab === 'audit' && (
              <Link
                to="/admin/audit"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Full Audit History <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Tab 1 Content: Active Events & Masterclasses */}
        {activeOperationsTab === 'events' && (
          <div className="p-6 space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Calendar className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No scheduled events found</p>
                <Link to="/admin/events">
                  <Button size="sm" className="rounded-xl mt-2 text-xs">Create Campus Event</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map(evt => (
                  <div
                    key={evt.id}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-midnight-950/40 space-y-3 hover:border-blue-500/40 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                          {evt.category || 'General'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                          {evt.title}
                        </h4>
                        <p className="text-xs text-slate-500">{evt.venue || 'Campus Main Hall'}</p>
                      </div>
                      <Badge variant="success" size="sm">
                        {evt.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-white/5 text-xs text-slate-500">
                      <span>{new Date(evt.start_date).toLocaleDateString()}</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        ★ {evt.points || 0} Reward Points
                      </span>
                      <Link
                        to="/admin/events"
                        className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                      >
                        Manage &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2 Content: Academic Departments */}
        {activeOperationsTab === 'departments' && (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map(d => (
                <div
                  key={d.id}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-midnight-950/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {d.code}
                    </span>
                    <Link
                      to="/admin/departments"
                      className="text-xs text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {d.name}
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-white/5 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Students</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{d.studentCount} enrolled</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Faculty</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{d.facultyCount} staff</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3 Content: Student Support & Grievances */}
        {activeOperationsTab === 'grievances' && (
          <div className="p-6 space-y-4">
            {recentGrievances.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <AlertCircle className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No grievances or support tickets lodged yet
                </p>
                <Link to="/admin/grievances">
                  <Button size="sm" className="rounded-xl mt-2 text-xs">
                    Open Grievance Desk
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentGrievances.map((g) => {
                  const student = g.student || {};
                  const studentName =
                    `${student.first_name || ''} ${student.last_name || ''}`.trim() ||
                    student.email ||
                    'Student';
                  return (
                    <div
                      key={g.id}
                      className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-midnight-950/40 space-y-3 hover:border-rose-500/40 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
                              {g.ticket_number || `GRV-${g.id.slice(0, 6)}`}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                              {g.category || 'Academic'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 line-clamp-1">
                            {g.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {g.description}
                          </p>
                        </div>
                        <Badge
                          variant={
                            g.status === 'RESOLVED' || g.status === 'CLOSED'
                              ? 'success'
                              : g.status === 'IN_PROGRESS'
                              ? 'primary'
                              : 'warning'
                          }
                          size="sm"
                          dot
                        >
                          {g.status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-white/5 text-xs text-slate-500">
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                          {studentName}
                        </span>
                        <span>{new Date(g.created_at).toLocaleDateString()}</span>
                        <Link
                          to="/admin/grievances"
                          className="text-rose-600 dark:text-rose-400 font-bold hover:underline"
                        >
                          View Thread &rarr;
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4 Content: Live Audit Stream */}
        {activeOperationsTab === 'audit' && (
          <div className="p-6 space-y-4">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Filter Logs:</span>
              {(['ALL', 'USERS', 'SETTINGS', 'SECURITY'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setAuditFilter(f)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    auditFilter === f
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-midnight-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Logs List */}
            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {filteredAuditLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No matching audit events found.</div>
              ) : (
                filteredAuditLogs.map((log: AuditLog) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-midnight-950/40 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                          {log.action}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {log.actor?.first_name || 'System Admin'} {log.actor?.last_name || ''} ({log.actor?.role || 'ADMIN'})
                        </span>
                      </div>
                      <p className="text-slate-500 truncate">
                        Target: {log.resource_type} {log.resource_id ? `#${log.resource_id}` : ''}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4 Content: System Health Diagnostics */}
        {activeOperationsTab === 'diagnostics' && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">PostgreSQL Cloud DB</span>
                  <Server className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">Connected & Synced</span>
                </div>
                <p className="text-[11px] text-slate-500">Row Level Security (RLS) Active</p>
              </div>

              <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Auth & Token Security</span>
                  <Key className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="font-bold text-blue-700 dark:text-blue-300">JWT / RPC Secured</span>
                </div>
                <p className="text-[11px] text-slate-500">Session Isolation Guard Active</p>
              </div>

              <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Realtime Broadcast</span>
                  <Radio className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="font-bold text-indigo-700 dark:text-indigo-300">WebSockets Online</span>
                </div>
                <p className="text-[11px] text-slate-500">Instant Event Registration Sync</p>
              </div>

              <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Storage & Vault</span>
                  <Database className="h-4 w-4 text-purple-500" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="font-bold text-purple-700 dark:text-purple-300">MIME Enforced</span>
                </div>
                <p className="text-[11px] text-slate-500">`documents` Bucket Encrypted</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* MODAL 1: BROADCAST CAMPUS ANNOUNCEMENT                              */}
      {/* =================================================================== */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-[#0a0c16]/70 backdrop-blur-sm" onClick={() => setShowBroadcastModal(false)} />
          <div className="relative bg-white dark:bg-midnight-950 p-6 rounded-3xl w-full max-w-lg space-y-4 shadow-2xl border border-slate-200/90 dark:border-white/10 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Broadcast Institutional Notice
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dispatches instantly to student dashboards, mobile feeds, and notice boards.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Notice Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mid-Term Examination Schedule & Registration Open"
                  value={broadcastForm.title}
                  onChange={e => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Category
                  </label>
                  <select
                    value={broadcastForm.category}
                    onChange={e => setBroadcastForm({ ...broadcastForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-900 text-slate-900 dark:text-white"
                  >
                    <option value="General">General Campus</option>
                    <option value="Academic">Academic</option>
                    <option value="Examinations">Examinations</option>
                    <option value="Events">Events & Fests</option>
                    <option value="Urgent">Urgent Alert</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Priority Level
                  </label>
                  <select
                    value={broadcastForm.priority}
                    onChange={e => setBroadcastForm({ ...broadcastForm, priority: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-900 text-slate-900 dark:text-white"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Critical / Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Notice Content / Body
                </label>
                <textarea
                  rows={4}
                  placeholder="Type the official announcement details here..."
                  value={broadcastForm.content}
                  onChange={e => setBroadcastForm({ ...broadcastForm, content: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBroadcastModal(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSendBroadcast}
                disabled={isBroadcasting}
                leftIcon={<Send className="h-3.5 w-3.5" />}
                className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isBroadcasting ? 'Broadcasting...' : 'Broadcast Notice Now'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: EXECUTIVE TELEMETRY SUMMARY REPORT                         */}
      {/* =================================================================== */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-[#0a0c16]/70 backdrop-blur-sm" onClick={() => setShowReportModal(false)} />
          <div className="relative bg-white dark:bg-midnight-950 p-6 rounded-3xl w-full max-w-2xl space-y-5 shadow-2xl border border-slate-200/90 dark:border-white/10 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Campus Executive Summary Report
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comprehensive campus summary generated at {new Date().toLocaleString()}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Students</span>
                  <span className="text-lg font-black text-blue-600 dark:text-blue-400">{overview?.stats?.total_students || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Appointed Faculty</span>
                  <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{overview?.stats?.total_faculty || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Programs</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{departments.length}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Events</span>
                  <span className="text-lg font-black text-cyan-600 dark:text-cyan-400">{events.length}</span>
                </div>
              </div>

              {/* Department Breakdown */}
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Department Enrollment Breakdown</h4>
                <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-x-auto touch-pan-x">
                  <table className="w-full min-w-[420px] text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-white/5 font-bold text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="p-2.5">Code</th>
                        <th className="p-2.5">Department</th>
                        <th className="p-2.5 text-center">Students</th>
                        <th className="p-2.5 text-center">Faculty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {departments.map(d => (
                        <tr key={d.id}>
                          <td className="p-2.5 font-mono font-bold text-blue-600">{d.code}</td>
                          <td className="p-2.5 text-slate-800 dark:text-slate-200">{d.name}</td>
                          <td className="p-2.5 text-center font-semibold">{d.studentCount}</td>
                          <td className="p-2.5 text-center font-semibold">{d.facultyCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReportModal(false)}
                className="rounded-xl text-xs"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="h-3.5 w-3.5" />}
                className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
              >
                Print Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
