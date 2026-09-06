import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { scholarshipService } from '../services/scholarshipService';
import { studentService } from '../services/studentService';
import {
  Scholarship,
  ScholarshipBookmark,
  ScholarshipCategory,
  ScholarshipApplicationStatus,
  StudentProfile,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { Card, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { PublishScholarshipModal } from '../components/PublishScholarshipModal';
import { ScholarshipApplicationModal } from '../components/ScholarshipApplicationModal';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';
import {
  GraduationCap,
  Award,
  IndianRupee,
  Calendar,
  Search,
  Plus,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  FileText,
  Building2,
  Trash2,
  Edit3,
  Filter,
  Check,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  LayoutGrid,
  List,
  X,
  Share2,
  ShieldCheck,
  HelpCircle,
  Briefcase,
  Users,
  Eye,
  Mail,
  RotateCcw,
  Phone,
  MessageSquare,
} from 'lucide-react';

const CATEGORIES: Array<{ name: string }> = [
  { name: 'All' },
  { name: 'Merit-Based' },
  { name: 'Need-Based' },
  { name: 'Women in Tech' },
  { name: 'Research & Innovation' },
  { name: 'Corporate Endowment' },
  { name: 'Government' },
];

const STATUS_OPTIONS: Array<{ value: ScholarshipApplicationStatus; label: string; color: string }> = [
  { value: 'INTERESTED', label: '⭐ Interested / Exploring', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40' },
  { value: 'PREPARING', label: '📝 Preparing Documents & Essays', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40' },
  { value: 'APPLIED', label: '🚀 Applied / Assessment Phase', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40' },
  { value: 'SUBMITTED', label: '📩 Formal Review Submitted', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40' },
  { value: 'SELECTED', label: '🎉 Awarded / Fellowship Won', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40' },
  { value: 'REJECTED', label: '❌ Application Archived', color: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800' },
];

const ADMIN_STATUS_FILTERS = [
  { id: 'ALL', label: 'All Stages' },
  { id: 'PENDING', label: 'Pending Review' },
  { id: 'UNDER_REVIEW', label: 'Under Review' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'AWARDED', label: 'Awarded' },
  { id: 'REJECTED', label: 'Rejected' },
];

export const ScholarshipsPage: React.FC = () => {
  const { user } = useAuth();
  const { branding } = useBranding();
  const toast = useToast();
  const location = useLocation();

  // Role & Route Detection
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAdminUser = ['ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR', 'COORDINATOR', 'PLACEMENT_OFFICER', 'HOD'].includes(
    user?.role || ''
  );
  const showAdminMode = isAdminRoute || isAdminUser;

  // Tabs
  const [activeTab, setActiveTab] = useState<'catalog' | 'applicants' | 'browse' | 'tracked'>(
    showAdminMode ? 'catalog' : 'browse'
  );

  // Data States
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [bookmarks, setBookmarks] = useState<ScholarshipBookmark[]>([]);
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'deadline' | 'amount' | 'newest'>('deadline');
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Admin Pipeline Filters
  const [applicantStatusFilter, setApplicantStatusFilter] = useState('ALL');
  const [applicantScholarshipFilter, setApplicantScholarshipFilter] = useState('ALL');
  const [applicantSearch, setApplicantSearch] = useState('');

  // Modals
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState<Scholarship | null>(null);
  const [selectedScholarshipForView, setSelectedScholarshipForView] = useState<Scholarship | null>(null);
  const [selectedScholarshipForApplication, setSelectedScholarshipForApplication] = useState<Scholarship | null>(null);
  const [selectedApplicantDetails, setSelectedApplicantDetails] = useState<any | null>(null);

  // Inspection & Review Modals
  const [selectedApplicationToInspect, setSelectedApplicationToInspect] = useState<any | null>(null);
  const [selectedApplicantForReview, setSelectedApplicantForReview] = useState<any | null>(null);
  const [reviewModalStatus, setReviewModalStatus] = useState('PENDING');
  const [reviewModalNotes, setReviewModalNotes] = useState('');
  const [reviewModalSubmitting, setReviewModalSubmitting] = useState(false);

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [schRes, bmRes, profRes, allAppsRes] = await Promise.all([
        scholarshipService.getScholarships({
          category: selectedCategory,
          search: searchQuery,
          sortBy,
        }),
        user?.role === 'STUDENT' ? scholarshipService.getMyBookmarks().catch(() => []) : Promise.resolve([]),
        user?.role === 'STUDENT' ? studentService.getMyProfile().catch(() => null) : Promise.resolve(null),
        showAdminMode ? scholarshipService.getAllApplications().catch(() => []) : Promise.resolve([]),
      ]);

      setScholarships(schRes);
      setBookmarks(bmRes);
      if (profRes) setStudentProfile(profRes);
      if (allAppsRes) setAllApplications(allAppsRes);
    } catch (err: any) {
      toast.error('Failed to load scholarships data', err?.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, [selectedCategory, searchQuery, sortBy]);

  // Real-time synchronization via Supabase Postgres Changes Channel
  useEffect(() => {
    const channel = supabase
      .channel('scholarships-realtime-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scholarship_applications' },
        () => {
          fetchData(false);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scholarships' },
        () => {
          fetchData(false);
        }
      )
      .subscribe();

    // Periodic sync fallback every 20 seconds
    const interval = setInterval(() => {
      fetchData(false);
    }, 20000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [showAdminMode, user?.role, selectedCategory, searchQuery, sortBy]);

  // Handle Bookmark (Students)
  const handleBookmarkToggle = async (scholarshipId: number) => {
    const existing = bookmarks.find((b) => b.scholarship_id === scholarshipId);
    try {
      if (existing) {
        await scholarshipService.removeBookmark(scholarshipId);
        toast.info('Application Untracked', 'Removed from your milestone tracking list.');
      } else {
        await scholarshipService.bookmarkScholarship(scholarshipId, 'INTERESTED');
        confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 } });
        toast.success('Scholarship Tracked! ⭐', 'Added to your milestone tracker.');
      }
      fetchData(false);
    } catch (err: any) {
      toast.error('Action Failed', err.message || 'Could not update tracking.');
    }
  };

  // Student Milestone Stage Change
  const handleStudentStageChange = async (scholarshipId: number, newStatus: ScholarshipApplicationStatus) => {
    try {
      await scholarshipService.bookmarkScholarship(scholarshipId, newStatus);
      toast.success('Stage Updated', `Milestone marked as ${newStatus}.`);
      fetchData(false);
    } catch {
      toast.error('Failed to update stage');
    }
  };

  // Admin Review Status Change
  const handleAdminReviewStatus = async (appId: string | number, newStatus: any, notes?: string) => {
    try {
      await scholarshipService.reviewApplication(appId, newStatus, notes);
      toast.success('Candidate Status Updated', `Application status updated to "${newStatus}".`);
      fetchData(false);
      if (selectedApplicantForReview?.id === appId) {
        setSelectedApplicantForReview((prev: any) =>
          prev
            ? {
                ...prev,
                status: newStatus,
                submitted_documents: {
                  ...(prev.submitted_documents || {}),
                  ...(notes !== undefined ? { admin_notes: notes } : {}),
                },
              }
            : null
        );
      }
    } catch (err: any) {
      toast.error('Review Update Failed', err.message);
    }
  };

  // Delete Scholarship
  const handleDeleteScholarship = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete scholarship "${title}"?`)) return;
    try {
      await scholarshipService.deleteScholarship(id);
      toast.success('Scholarship Deleted', `"${title}" has been removed from the registry.`);
      fetchData();
      if (selectedScholarshipForView?.id === id) {
        setSelectedScholarshipForView(null);
      }
    } catch (err: any) {
      toast.error('Failed to delete scholarship', err?.message);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (sch: Scholarship) => {
    setEditingScholarship(sch);
    setIsPublishModalOpen(true);
  };

  // Open New Modal
  const handleOpenNew = () => {
    setEditingScholarship(null);
    setIsPublishModalOpen(true);
  };

  // Filtered Scholarships
  const filteredScholarships = useMemo(() => {
    return scholarships.filter((s) => {
      if (onlyEligible && studentProfile?.cgpa) {
        if (s.eligibility_cgpa && studentProfile.cgpa < s.eligibility_cgpa) {
          return false;
        }
      }
      return true;
    });
  }, [scholarships, onlyEligible, studentProfile]);

  // Filtered Applications for Admin Pipeline
  const filteredApplications = useMemo(() => {
    return allApplications.filter((app) => {
      if (applicantStatusFilter !== 'ALL' && (app.status || '').toUpperCase() !== applicantStatusFilter) {
        return false;
      }
      if (applicantScholarshipFilter !== 'ALL' && String(app.scholarship_id) !== applicantScholarshipFilter) {
        return false;
      }
      if (applicantSearch.trim()) {
        const query = applicantSearch.toLowerCase();
        const candName = (app.candidate_name || `${app.user?.first_name || ''} ${app.user?.last_name || ''}`).toLowerCase();
        const candEmail = (app.candidate_email || app.user?.email || '').toLowerCase();
        const candId = (app.candidate_id || '').toLowerCase();
        const schTitle = (app.scholarship?.title || '').toLowerCase();
        const dept = (app.candidate_department || '').toLowerCase();
        if (
          !candName.includes(query) &&
          !candEmail.includes(query) &&
          !candId.includes(query) &&
          !schTitle.includes(query) &&
          !dept.includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [allApplications, applicantStatusFilter, applicantScholarshipFilter, applicantSearch]);

  return (
    <div className="space-y-6 pb-16 animate-fade-in text-slate-900 dark:text-slate-100 max-w-7xl mx-auto">
      {/* 1. ULTRA-MODERN COMMAND HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-white/10">
        <div className="pointer-events-none absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 -mb-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-xs">
                <Award className="h-3.5 w-3.5 text-emerald-400" />
                {showAdminMode ? 'Scholarships Management' : 'Scholarships & Financial Aid'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                Officially Verified
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Scholarships & Financial Opportunities
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              {showAdminMode
                ? 'Manage college sponsorships, government scholarships, student applications, and award payouts.'
                : 'Accelerate your academic career with verified government stipends, tech scholarships, and corporate grants.'}
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Aid Pool</span>
                <span className="text-base sm:text-lg font-black text-emerald-400">₹1.2 Cr+</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active Programs</span>
                <span className="text-base sm:text-lg font-black text-blue-400">{scholarships.length} Fellowships</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {showAdminMode ? 'Applications Received' : 'Average Grant'}
                </span>
                <span className="text-base sm:text-lg font-black text-teal-300">
                  {showAdminMode ? `${allApplications.length} Submissions` : '₹50,000 / Yr'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {showAdminMode ? 'Review Status' : 'Your CGPA'}
                </span>
                <span className="text-base sm:text-lg font-black text-indigo-300">
                  {showAdminMode
                    ? `${allApplications.filter((a) => (a.status || '').toUpperCase() === 'PENDING').length} Pending`
                    : studentProfile?.cgpa ? `${studentProfile.cgpa} CGPA` : 'Verified'}
                </span>
              </div>
            </div>
          </div>

          {/* Top CTAs */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            {showAdminMode && (
              <Button
                onClick={handleOpenNew}
                leftIcon={<Plus className="h-4 w-4" />}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-600/30 text-xs font-bold py-3"
              >
                Publish New Scholarship
              </Button>
            )}

            {user?.role === 'STUDENT' && (
              <Button
                variant={activeTab === 'tracked' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab(activeTab === 'tracked' ? 'browse' : 'tracked')}
                leftIcon={<BookmarkCheck className="h-4 w-4" />}
                className="rounded-2xl text-xs font-bold py-3 bg-white/10 hover:bg-white/20 text-white border-white/15 backdrop-blur-xs"
              >
                {activeTab === 'tracked' ? 'Browse Opportunities' : `My Tracked Applications (${bookmarks.length})`}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. ADMIN & USER TABS HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-2 gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {showAdminMode ? (
            <>
              <button
                onClick={() => setActiveTab('catalog')}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'catalog'
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-midnight-900'
                }`}
              >
                <Award className="h-4 w-4" />
                <span>Scholarship Registry ({scholarships.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('applicants')}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'applicants'
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-midnight-900'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Candidate Pipeline ({allApplications.length})</span>
                {allApplications.filter((a) => (a.status || '').toUpperCase() === 'PENDING').length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-300 font-black">
                    {allApplications.filter((a) => (a.status || '').toUpperCase() === 'PENDING').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('browse')}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'browse'
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-midnight-900'
                }`}
              >
                <Eye className="h-4 w-4" />
                <span>Student Catalog Preview</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('browse')}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'browse'
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-midnight-900'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Discover Fellowships ({scholarships.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('tracked')}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'tracked'
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-midnight-900'
                }`}
              >
                <BookmarkCheck className="h-4 w-4" />
                <span>My Tracked Grants ({bookmarks.length})</span>
              </button>
            </>
          )}
        </div>

        {/* View Mode Toggle */}
        {(activeTab === 'catalog' || activeTab === 'browse') && (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-midnight-900 border border-slate-200/80 dark:border-white/10 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-midnight-800 text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-midnight-800 text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Table View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 3. TAB 1: SCHOLARSHIPS REGISTRY (FOR ADMINS & EXPLORERS) */}
      {(activeTab === 'catalog' || activeTab === 'browse') && (
        <div className="space-y-6">
          {/* Controls Bar: Search, Categories & Sorter */}
          <div className="space-y-3 p-4 rounded-3xl bg-white dark:bg-midnight-900 border border-slate-200/80 dark:border-white/10 shadow-xs">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by scholarship title, sponsoring corporate, or keyword..."
                  className="w-full pl-9 pr-9 py-2 rounded-2xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-midnight-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Sorter & Smart Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                {user?.role === 'STUDENT' && studentProfile?.cgpa && (
                  <label className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300/60 dark:border-emerald-800/40 text-xs font-bold text-emerald-800 dark:text-emerald-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={onlyEligible}
                      onChange={(e) => setOnlyEligible(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Eligible for me (CGPA {studentProfile.cgpa})</span>
                  </label>
                )}

                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-midnight-950 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="deadline">⏳ Deadline (Ending Soonest)</option>
                    <option value="amount">💰 Grant Value (Highest First)</option>
                    <option value="newest">✨ Newest Listings First</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-violet-500/25 scale-[1.02]'
                        : 'bg-slate-100 dark:bg-midnight-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-midnight-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scholarships Display */}
          {loading ? (
            <LoadingSkeleton rows={6} />
          ) : filteredScholarships.length === 0 ? (
            <EmptyState
              title="No Scholarships Found"
              description="No active grant matches your current search criteria or category filter."
              actionText={showAdminMode ? 'Publish New Scholarship' : 'Reset Filters'}
              onAction={
                showAdminMode
                  ? handleOpenNew
                  : () => {
                      setSelectedCategory('All');
                      setSearchQuery('');
                      setOnlyEligible(false);
                    }
              }
            />
          ) : viewMode === 'grid' ? (
            /* Modern Card Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredScholarships.map((sch) => {
                const userApplication = bookmarks.find((b) => b.scholarship_id === sch.id);
                const isBookmarked = Boolean(userApplication);
                const hasApplied = Boolean(
                  userApplication?.has_applied ||
                  (userApplication?.raw_db_status && userApplication.raw_db_status !== 'INTERESTED')
                );
                const appStatus = (userApplication?.raw_db_status || userApplication?.status || 'PENDING').toUpperCase();

                const deadlineDate = new Date(sch.deadline);
                const daysRemaining = Math.max(
                  0,
                  Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                );

                const minCgpa = sch.eligibility_cgpa || 7.0;
                const studentCgpa = studentProfile?.cgpa || 8.0;
                const isEligible = !studentProfile || studentCgpa >= minCgpa;

                // Application count for this scholarship
                const applicantCount = allApplications.filter((a) => a.scholarship_id === sch.id).length;

                return (
                  <div
                    key={sch.id}
                    className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-midnight-900/90 backdrop-blur-xl p-5 shadow-xs hover:shadow-xl hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-200 overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 opacity-70 group-hover:opacity-100 transition-opacity" />

                    <div className="space-y-3.5">
                      {/* Category & Urgency Beacon */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                          {sch.category}
                        </span>

                        {daysRemaining <= 3 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                            {daysRemaining === 0 ? 'Closing Today' : `${daysRemaining}d Left`}
                          </span>
                        ) : daysRemaining <= 14 ? (
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200/50">
                            ⏳ {daysRemaining} days left
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400 font-mono">
                            {daysRemaining} days left
                          </span>
                        )}
                      </div>

                      {/* Title & Provider */}
                      <div className="space-y-1">
                        <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                          {sch.title}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">{sch.provider}</span>
                        </p>
                      </div>

                      {/* Endowment Value Display Box */}
                      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                          Award Value & Grant
                        </span>
                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                          {sch.amount}
                        </p>
                      </div>

                      {/* Criteria & Applicants Count */}
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-midnight-950 border border-slate-100 dark:border-white/5">
                          <span className="text-[11px] font-medium text-slate-400">Min CGPA Required</span>
                          <span
                            className={`font-black font-mono text-xs px-2 py-0.5 rounded-lg ${
                              isEligible
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            ≥ {minCgpa}
                          </span>
                        </div>

                        {showAdminMode ? (
                          <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-[11px] font-bold text-blue-700 dark:text-blue-300">
                            <span>Applicants in Pipeline:</span>
                            <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-mono text-xs">
                              {applicantCount}
                            </span>
                          </div>
                        ) : user?.role === 'STUDENT' && studentProfile ? (
                          <p
                            className={`text-[11px] font-bold flex items-center gap-1 ${
                              isEligible ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {isEligible ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>You qualify for this fellowship (CGPA {studentCgpa})</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3.5 w-3.5" />
                                <span>Requires {minCgpa} CGPA (Your CGPA: {studentCgpa})</span>
                              </>
                            )}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedScholarshipForView(sch)}
                        className="text-xs font-bold hover:text-blue-600"
                      >
                        Details
                      </Button>

                      <div className="flex items-center gap-1.5">
                        {showAdminMode ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setApplicantScholarshipFilter(String(sch.id));
                                setActiveTab('applicants');
                              }}
                              className="text-xs font-bold rounded-xl"
                            >
                              Applicants ({applicantCount})
                            </Button>

                            <button
                              onClick={() => handleOpenEdit(sch)}
                              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                              title="Edit Scholarship"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteScholarship(sch.id, sch.title)}
                              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                              title="Delete Scholarship"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {hasApplied ? (
                              <>
                                {appStatus === 'AWARDED' || appStatus === 'SELECTED' ? (
                                  <Button
                                    size="sm"
                                    onClick={() => setSelectedApplicationToInspect(userApplication)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs text-xs font-bold flex items-center gap-1"
                                  >
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Awarded 🎉
                                  </Button>
                                ) : appStatus === 'APPROVED' ? (
                                  <Button
                                    size="sm"
                                    onClick={() => setSelectedApplicationToInspect(userApplication)}
                                    className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs text-xs font-bold flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Approved ✓
                                  </Button>
                                ) : appStatus === 'UNDER_REVIEW' ? (
                                  <Button
                                    size="sm"
                                    onClick={() => setSelectedApplicationToInspect(userApplication)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs text-xs font-bold flex items-center gap-1"
                                  >
                                    <Clock className="h-3.5 w-3.5" />
                                    In Review ⏳
                                  </Button>
                                ) : appStatus === 'REJECTED' ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedApplicationToInspect(userApplication)}
                                    className="rounded-xl text-xs font-bold text-slate-500"
                                  >
                                    Archived
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => setSelectedApplicationToInspect(userApplication)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs text-xs font-bold flex items-center gap-1"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                    Applied ✓
                                  </Button>
                                )}
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant={isBookmarked ? 'secondary' : 'outline'}
                                  onClick={() => handleBookmarkToggle(sch.id)}
                                  leftIcon={
                                    isBookmarked ? (
                                      <BookmarkCheck className="h-3.5 w-3.5 text-emerald-600" />
                                    ) : (
                                      <Bookmark className="h-3.5 w-3.5" />
                                    )
                                  }
                                  className="rounded-xl text-xs font-bold"
                                >
                                  {isBookmarked ? 'Tracked' : 'Save'}
                                </Button>

                                <Button
                                  size="sm"
                                  onClick={() => setSelectedScholarshipForApplication(sch)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs text-xs font-bold"
                                >
                                  Apply Now
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* High-Density Administrative Table */
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-midnight-900 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Fellowship & Sponsor</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Grant Value</th>
                      <th className="p-4">Min CGPA</th>
                      <th className="p-4">Deadline</th>
                      {showAdminMode && <th className="p-4 text-center">Applicants</th>}
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredScholarships.map((sch) => {
                      const applicantCount = allApplications.filter((a) => a.scholarship_id === sch.id).length;
                      return (
                        <tr key={sch.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="p-4">
                            <p
                              className="font-bold text-slate-900 dark:text-white text-sm hover:text-blue-600 transition-colors cursor-pointer"
                              onClick={() => setSelectedScholarshipForView(sch)}
                            >
                              {sch.title}
                            </p>
                            <p className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                              <Building2 className="h-3 w-3 text-blue-500" />
                              {sch.provider}
                            </p>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/60">
                              {sch.category}
                            </span>
                          </td>
                          <td className="p-4 font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                            {sch.amount}
                          </td>
                          <td className="p-4 font-bold font-mono">≥ {sch.eligibility_cgpa || 7.0}</td>
                          <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">
                            {new Date(sch.deadline).toLocaleDateString()}
                          </td>
                          {showAdminMode && (
                            <td className="p-4 text-center">
                              <button
                                onClick={() => {
                                  setApplicantScholarshipFilter(String(sch.id));
                                  setActiveTab('applicants');
                                }}
                                className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-100 transition-colors"
                              >
                                {applicantCount} Applicants
                              </button>
                            </td>
                          )}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button size="sm" variant="ghost" onClick={() => setSelectedScholarshipForView(sch)}>
                                View
                              </Button>

                              {showAdminMode ? (
                                <>
                                  <button
                                    onClick={() => handleOpenEdit(sch)}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600"
                                    title="Edit"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteScholarship(sch.id, sch.title)}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              ) : (
                                (() => {
                                  const userApp = bookmarks.find((b) => b.scholarship_id === sch.id);
                                  const hasAppliedTable = Boolean(
                                    userApp?.has_applied ||
                                    (userApp?.raw_db_status && userApp.raw_db_status !== 'INTERESTED')
                                  );
                                  const tableStatus = (userApp?.raw_db_status || userApp?.status || '').toUpperCase();
                                  if (hasAppliedTable) {
                                    return (
                                      <Button
                                        size="sm"
                                        onClick={() => setSelectedApplicationToInspect(userApp)}
                                        className={
                                          tableStatus === 'AWARDED' || tableStatus === 'SELECTED'
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl'
                                            : tableStatus === 'APPROVED'
                                            ? 'bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl'
                                            : tableStatus === 'UNDER_REVIEW'
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl'
                                            : tableStatus === 'REJECTED'
                                            ? 'bg-slate-600 text-white text-xs font-bold rounded-xl'
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl'
                                        }
                                      >
                                        {tableStatus === 'AWARDED' || tableStatus === 'SELECTED'
                                          ? 'Awarded 🎉'
                                          : tableStatus === 'APPROVED'
                                          ? 'Approved ✓'
                                          : tableStatus === 'UNDER_REVIEW'
                                          ? 'In Review ⏳'
                                          : tableStatus === 'REJECTED'
                                          ? 'Archived'
                                          : 'Applied ✓'}
                                      </Button>
                                    );
                                  }
                                  return (
                                    <Button
                                      size="sm"
                                      onClick={() => setSelectedScholarshipForApplication(sch)}
                                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                                    >
                                      Apply
                                    </Button>
                                  );
                                })()
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: CANDIDATE PIPELINE & APPLICANTS REVIEW (FOR ADMINS) */}
      {activeTab === 'applicants' && showAdminMode && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Student Candidate Pipeline & Review
              </h3>
              <p className="text-xs text-slate-500">
                Review submitted scholarship applications, change award status, and track student qualifications.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchData()}
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                className="text-xs font-bold"
              >
                Refresh Pipeline
              </Button>
            </div>
          </div>

          {/* Applicant Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={applicantSearch}
                onChange={(e) => setApplicantSearch(e.target.value)}
                placeholder="Search candidate name or email..."
                className="w-full pl-9 pr-4 py-2 rounded-2xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-midnight-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <select
                value={applicantStatusFilter}
                onChange={(e) => setApplicantStatusFilter(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-midnight-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {ADMIN_STATUS_FILTERS.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={applicantScholarshipFilter}
                onChange={(e) => setApplicantScholarshipFilter(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-midnight-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Scholarships ({scholarships.length})</option>
                {scholarships.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.title} ({s.amount})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Applications Table */}
          {filteredApplications.length === 0 ? (
            <EmptyState
              title="No Candidate Applications"
              description="No student applications match the selected status or scholarship filter."
              actionText="Reset Filters"
              onAction={() => {
                setApplicantStatusFilter('ALL');
                setApplicantScholarshipFilter('ALL');
                setApplicantSearch('');
              }}
            />
          ) : (
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Applicant Candidate</th>
                      <th className="p-4">Applied Scholarship</th>
                      <th className="p-4">Applied Date</th>
                      <th className="p-4">Current Review Stage</th>
                      <th className="p-4 text-right">Update Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredApplications.map((app) => {
                      const schObj = app.scholarship;
                      const currentStatus = (app.status || 'PENDING').toUpperCase();

                      return (
                        <tr key={app.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs shrink-0 shadow-xs">
                                {(app.candidate_name?.[0] || 'C').toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                  <span>{app.candidate_name}</span>
                                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-black border border-blue-200/50">
                                    CGPA: {app.candidate_cgpa}
                                  </span>
                                </p>
                                <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span>ID: <strong className="font-mono text-slate-600 dark:text-slate-300">{app.candidate_id}</strong></span>
                                  <span>&bull;</span>
                                  <span>{app.candidate_department}</span>
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <p className="font-bold text-slate-900 dark:text-white">
                              {schObj?.title || `Scholarship #${app.scholarship_id}`}
                            </p>
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                              {schObj?.amount || 'Award'} • {schObj?.provider || 'Sponsor'}
                            </p>
                          </td>

                          <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">
                            {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recent'}
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                currentStatus === 'AWARDED' || currentStatus === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : currentStatus === 'REJECTED'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : currentStatus === 'UNDER_REVIEW'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {currentStatus}
                            </span>
                            {app.submitted_documents?.admin_notes && (
                              <p className="text-[10px] text-slate-400 italic truncate max-w-xs mt-1">
                                "{app.submitted_documents.admin_notes}"
                              </p>
                            )}
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedApplicantForReview(app);
                                  setReviewModalStatus((app.status || 'PENDING').toUpperCase());
                                  setReviewModalNotes(app.submitted_documents?.admin_notes || '');
                                }}
                                leftIcon={<Eye className="h-3.5 w-3.5 text-blue-500" />}
                                className="text-xs font-bold rounded-xl"
                              >
                                Review Application
                              </Button>

                              <select
                                value={currentStatus}
                                onChange={(e) => handleAdminReviewStatus(app.id, e.target.value)}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 shadow-2xs"
                              >
                                <option value="PENDING">Pending Review</option>
                                <option value="UNDER_REVIEW">Under Review</option>
                                <option value="APPROVED">Approve Application</option>
                                <option value="AWARDED">🎉 Mark Awarded</option>
                                <option value="REJECTED">Reject / Archive</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* 5. TAB 2 (STUDENT): MY TRACKED OPPORTUNITIES & MILESTONES */}
      {activeTab === 'tracked' && !showAdminMode && (
        <Card className="p-6 sm:p-8 space-y-6">
          <CardHeader
            title="My Tracked Opportunities & Milestones"
            subtitle="Manage upcoming scholarship deadlines, track application stages, and record submission notes."
            icon={<BookmarkCheck className="h-5 w-5 text-blue-600" />}
          />

          {bookmarks.length === 0 ? (
            <EmptyState
              title="No Tracked Scholarships"
              description="Save opportunities from the discovery catalog to track your application milestones here."
              actionText="Browse Fellowships"
              onAction={() => setActiveTab('browse')}
            />
          ) : (
            <div className="space-y-4">
              {bookmarks.map((b) => {
                const sch = b.scholarship;
                if (!sch) return null;

                const statusObj = STATUS_OPTIONS.find((s) => s.value === b.status) || STATUS_OPTIONS[0];

                return (
                  <div
                    key={b.id}
                    className="p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-midnight-900/60 flex flex-col gap-4 hover:border-blue-500/40 transition-all shadow-xs"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/60">
                            {sch.category}
                          </span>
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            {sch.amount}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusObj.color}`}>
                            {statusObj.label}
                          </span>
                          {b.raw_db_status && (
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                b.raw_db_status === 'AWARDED'
                                  ? 'bg-emerald-500 text-white'
                                  : b.raw_db_status === 'APPROVED'
                                  ? 'bg-teal-500 text-white'
                                  : b.raw_db_status === 'UNDER_REVIEW'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              Official: {b.raw_db_status}
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-slate-900 dark:text-white">{sch.title}</h4>

                        <p className="text-xs text-slate-500 flex items-center gap-2">
                          <span>Provider: <strong className="text-slate-700 dark:text-slate-300">{sch.provider}</strong></span>
                          <span>&bull;</span>
                          <span>Deadline: <strong className="text-slate-700 dark:text-slate-300">{new Date(sch.deadline).toLocaleDateString()}</strong></span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200/60 dark:border-white/5">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Milestone Stage
                          </span>
                          <select
                            value={b.status}
                            onChange={(e) => handleStudentStageChange(sch.id, e.target.value as ScholarshipApplicationStatus)}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {b.has_applied ? (
                          <Button
                            size="sm"
                            onClick={() => setSelectedApplicationToInspect(b)}
                            leftIcon={<Eye className="h-3.5 w-3.5" />}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold py-2 mt-4"
                          >
                            View Submitted Application
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setSelectedScholarshipForApplication(sch)}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold py-2 mt-4"
                          >
                            Apply Now
                          </Button>
                        )}

                        {sch.official_link && (
                          <a
                            href={sch.official_link}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2.5 rounded-xl bg-white dark:bg-midnight-800 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-blue-600 mt-4 transition-colors"
                            title="Open Sponsor Portal"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}

                        <button
                          onClick={() => handleBookmarkToggle(sch.id)}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500 mt-4 transition-colors"
                          title="Remove from tracking"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Admin / Committee Feedback Banner if available */}
                    {(b.submitted_documents?.admin_notes || b.admin_notes) && (
                      <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/40 flex items-start gap-2.5">
                        <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div className="text-xs space-y-0.5">
                          <span className="font-bold text-blue-900 dark:text-blue-200 block">
                            Official Review Committee Feedback:
                          </span>
                          <p className="text-blue-800 dark:text-blue-300 italic">
                            "{b.submitted_documents?.admin_notes || b.admin_notes}"
                          </p>
                        </div>
                      </div>
                    )}

                    {b.raw_db_status === 'AWARDED' && (
                      <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                        <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Congratulations! You have been awarded this scholarship. Please contact the scholarship committee with your application reference ID for your grant payout.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* 6. DETAILS SLIDE-OVER / MODAL */}
      {selectedScholarshipForView && (
        <Modal
          isOpen={Boolean(selectedScholarshipForView)}
          onClose={() => setSelectedScholarshipForView(null)}
          title={selectedScholarshipForView.title}
          description={`Offered by ${selectedScholarshipForView.provider} • Category: ${selectedScholarshipForView.category}`}
          size="lg"
        >
          <div className="space-y-5 text-xs sm:text-sm">
            {/* Key Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 text-center sm:text-left">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Grant Amount</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                  {selectedScholarshipForView.amount}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Min CGPA</span>
                <span className="font-bold text-slate-900 dark:text-white text-base font-mono">
                  ≥ {selectedScholarshipForView.eligibility_cgpa || 7.5}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Academic Level</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs truncate block mt-0.5">
                  {selectedScholarshipForView.academic_level || 'All Years'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Deadline</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs block mt-0.5">
                  {new Date(selectedScholarshipForView.deadline).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Overview */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-midnight-950 border border-slate-200/80 dark:border-white/5">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-blue-500" />
                Program Mission & Overview
              </h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                {selectedScholarshipForView.description}
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-midnight-950 border border-slate-200/80 dark:border-white/5">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <IndianRupee className="h-4 w-4 text-emerald-500" />
                Financial Award & Fellow Perks
              </h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                {selectedScholarshipForView.benefits}
              </p>
            </div>

            {/* Requirements */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-midnight-950 border border-slate-200/80 dark:border-white/5">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                Eligibility Requirements
              </h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                {selectedScholarshipForView.requirements}
              </p>
            </div>

            {/* Documents Checklist */}
            {selectedScholarshipForView.required_documents && (
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-amber-500" />
                  Required Documents
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedScholarshipForView.required_documents.map((doc) => (
                    <div
                      key={doc}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-midnight-950 border border-slate-200/80 dark:border-white/5 text-xs font-semibold"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step-by-Step Application Roadmap */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-midnight-950 border border-slate-200/80 dark:border-white/5">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ArrowRight className="h-4 w-4 text-purple-500" />
                Application Roadmap
              </h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                {selectedScholarshipForView.application_process}
              </p>
            </div>

            {/* Footer CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-4 border-t border-slate-200 dark:border-white/10">
              <Button variant="outline" size="sm" onClick={() => setSelectedScholarshipForView(null)}>
                Close
              </Button>

              <div className="flex items-center gap-2">
                {showAdminMode ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedScholarshipForView(null);
                      handleOpenEdit(selectedScholarshipForView);
                    }}
                    leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    Edit Listing
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleBookmarkToggle(selectedScholarshipForView.id)}
                      leftIcon={<Bookmark className="h-3.5 w-3.5" />}
                    >
                      {bookmarks.some((b) => b.scholarship_id === selectedScholarshipForView.id)
                        ? 'Tracked ⭐'
                        : 'Track Application'}
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedScholarshipForApplication(selectedScholarshipForView);
                        setSelectedScholarshipForView(null);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                      Apply Now
                    </Button>
                  </>
                )}

                {selectedScholarshipForView.official_link && (
                  <a href={selectedScholarshipForView.official_link} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                      Official Portal
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 7. STUDENT SCHOLARSHIP APPLICATION MODAL */}
      <ScholarshipApplicationModal
        scholarship={selectedScholarshipForApplication}
        studentProfile={studentProfile}
        isOpen={Boolean(selectedScholarshipForApplication)}
        onClose={() => setSelectedScholarshipForApplication(null)}
        onSuccess={fetchData}
      />

      {/* 8. STATE-OF-THE-ART PUBLISH SCHOLARSHIP MODAL */}
      <PublishScholarshipModal
        isOpen={isPublishModalOpen}
        onClose={() => {
          setIsPublishModalOpen(false);
          setEditingScholarship(null);
        }}
        onSuccess={fetchData}
        editingScholarship={editingScholarship}
      />

      {/* 9. STUDENT SUBMISSION DETAILS & STATUS MODAL */}
      {selectedApplicationToInspect && (
        <Modal
          isOpen={Boolean(selectedApplicationToInspect)}
          onClose={() => setSelectedApplicationToInspect(null)}
          title="Scholarship Application Details"
          description={
            (selectedApplicationToInspect.scholarship || scholarships.find((s) => s.id === (selectedApplicationToInspect.scholarship_id || selectedApplicationToInspect.scholarship?.id)))
              ? `${(selectedApplicationToInspect.scholarship || scholarships.find((s) => s.id === (selectedApplicationToInspect.scholarship_id || selectedApplicationToInspect.scholarship?.id)))?.title} • ${(selectedApplicationToInspect.scholarship || scholarships.find((s) => s.id === (selectedApplicationToInspect.scholarship_id || selectedApplicationToInspect.scholarship?.id)))?.provider}`
              : 'Submitted Application Details'
          }
          size="2xl"
        >
          {(() => {
            const b = selectedApplicationToInspect;
            const sch = b.scholarship || scholarships.find((s) => s.id === (b.scholarship_id || b.scholarship?.id));
            const docs = b.submitted_documents || {};
            const status = (b.raw_db_status || b.status || 'PENDING').toUpperCase();
            const adminNotes = docs.admin_notes || b.admin_notes || b.notes;
            const appliedAt = docs.applied_at || b.created_at;

            return (
              <div className="space-y-6">
                {/* Status Callout Banner */}
                {status === 'AWARDED' ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-xs shrink-0">
                        <Award className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-emerald-700 dark:text-emerald-300">
                            🎉 Scholarship Fellowship Awarded!
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                            Official Grant
                          </span>
                        </div>
                        <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed font-medium">
                          Congratulations! The scholarship committee has reviewed your application and awarded you the grant. College payout procedures will follow shortly.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : status === 'APPROVED' ? (
                  <div className="p-4 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-900 dark:text-teal-200">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-teal-500 text-white shadow-xs shrink-0">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-teal-700 dark:text-teal-300">
                          Application Approved by Board
                        </h4>
                        <p className="text-xs text-teal-800/90 dark:text-teal-300/90 leading-relaxed">
                          Your profile has cleared all eligibility criteria and faculty reviews. Final grant payment is in progress.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : status === 'UNDER_REVIEW' ? (
                  <div className="p-4 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-900 dark:text-blue-200">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-blue-500 text-white shadow-xs shrink-0">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300">
                          Application Under Committee Review
                        </h4>
                        <p className="text-xs text-blue-800/90 dark:text-blue-300/90 leading-relaxed">
                          Your application documents and Statement of Purpose are being evaluated by the scholarship selection committee.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : status === 'REJECTED' ? (
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#111425] border border-slate-200 dark:border-violet-500/15 text-slate-700 dark:text-slate-300">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-slate-500 text-white shadow-xs shrink-0">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">Application Archived</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          The selection process for this grant cycle has concluded. We encourage you to explore and apply to other relevant scholarship opportunities.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-900 dark:text-indigo-200">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs shrink-0">
                        <Check className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                          Application Successfully Lodged
                        </h4>
                        <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
                          Your submission has been formally lodged and synchronized with the administrative portal. Committee screening will commence shortly.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Official Reviewer Feedback (if any) */}
                {adminNotes && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
                      <MessageSquare className="h-4 w-4" />
                      <span>Committee Remarks & Evaluation Feedback</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/80 dark:bg-midnight-950/80 border border-amber-200/50 dark:border-amber-900/30 text-slate-800 dark:text-slate-200 font-serif italic text-xs leading-relaxed">
                      "{adminNotes}"
                    </div>
                  </div>
                )}

                {/* Quick Academic & Submission Metric Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-midnight-950 border border-slate-200/70 dark:border-white/5 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Candidate CGPA</span>
                    <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                      {docs.cgpa || studentProfile?.cgpa || 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-midnight-950 border border-slate-200/70 dark:border-white/5 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate block">
                      {docs.department || studentProfile?.department || 'General'}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-midnight-950 border border-slate-200/70 dark:border-white/5 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Roll / Student ID</span>
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-white truncate block">
                      {docs.student_id || studentProfile?.roll_number || 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-midnight-950 border border-slate-200/70 dark:border-white/5 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Annual Income</span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate block">
                      {docs.family_annual_income || 'Unspecified'}
                    </span>
                  </div>
                </div>

                {/* Statement of Purpose */}
                {docs.statement_of_purpose && (
                  <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-midnight-950 border border-slate-200/80 dark:border-white/5">
                    <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <FileText className="h-4 w-4 text-blue-500" />
                      Submitted Statement of Purpose & Intent
                    </h5>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs whitespace-pre-line bg-white dark:bg-midnight-900/60 p-3.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                      {docs.statement_of_purpose}
                    </p>
                  </div>
                )}

                {/* Extracurriculars & Highlights */}
                {docs.extracurricular_highlights && (
                  <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-midnight-950 border border-slate-200/80 dark:border-white/5">
                    <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <Sparkles className="h-4 w-4 text-emerald-500" />
                      Extracurricular & Leadership Highlights
                    </h5>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs whitespace-pre-line bg-white dark:bg-midnight-900/60 p-3.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                      {docs.extracurricular_highlights}
                    </p>
                  </div>
                )}

                {/* Links & Contact */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500 border-t border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    {docs.phone && (
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {docs.phone}
                      </span>
                    )}
                    {docs.portfolio_link && (
                      <a
                        href={docs.portfolio_link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline font-bold"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Portfolio / Work
                      </a>
                    )}
                  </div>
                  {appliedAt && (
                    <span className="font-mono text-[11px] text-slate-400">
                      Applied: {new Date(appliedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/10">
                  <Button variant="outline" size="sm" onClick={() => setSelectedApplicationToInspect(null)}>
                    Close Application
                  </Button>
                  {sch?.official_link && (
                    <a href={sch.official_link} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="secondary" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                        Official Portal
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* 10. ADMIN CANDIDATE EVALUATION & DOSSIER REVIEW MODAL */}
      {selectedApplicantForReview && (
        <Modal
          isOpen={Boolean(selectedApplicantForReview)}
          onClose={() => setSelectedApplicantForReview(null)}
          title={`Applicant Details: ${selectedApplicantForReview.student?.name || selectedApplicantForReview.submitted_documents?.student_name || 'Applicant'}`}
          description={`Evaluation for "${(selectedApplicantForReview.scholarship || scholarships.find((s) => s.id === selectedApplicantForReview.scholarship_id))?.title || 'Scholarship'}"`}
          size="2xl"
        >
          {(() => {
            const app = selectedApplicantForReview;
            const sch = app.scholarship || scholarships.find((s) => s.id === app.scholarship_id);
            const docs = app.submitted_documents || {};
            const candName = app.student?.name || docs.student_name || 'Applicant';
            const candRoll = app.student?.roll_number || docs.student_id || 'N/A';
            const candDept = app.student?.department || docs.department || 'N/A';
            const candCgpa = app.student?.cgpa || docs.cgpa || 'N/A';
            const candEmail = app.student?.email || docs.email || 'N/A';
            const candPhone = docs.phone || 'N/A';

            return (
              <div className="space-y-5 text-xs sm:text-sm">
                {/* Header Profile Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-midnight-950 border border-slate-200/80 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-sm">
                      {candName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white text-base leading-tight">
                        {candName}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-slate-500 dark:text-slate-400 text-xs">
                        <span>{candDept}</span>
                        <span>•</span>
                        <span className="font-mono">Roll: {candRoll}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Candidate CGPA</span>
                      <span className={`text-base font-black font-mono ${
                        Number(candCgpa) >= 8.5 ? 'text-emerald-600 dark:text-emerald-400' :
                        Number(candCgpa) >= 7.0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {candCgpa}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Candidate Contact & Background Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-midnight-900/60 border border-slate-200/60 dark:border-white/5 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Email
                    </span>
                    <span className="font-medium text-xs text-slate-800 dark:text-slate-200 truncate block">
                      {candEmail}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-midnight-900/60 border border-slate-200/60 dark:border-white/5 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Phone
                    </span>
                    <span className="font-mono font-medium text-xs text-slate-800 dark:text-slate-200 truncate block">
                      {candPhone}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-midnight-900/60 border border-slate-200/60 dark:border-white/5 space-y-0.5 col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Family Income</span>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate block">
                      {docs.family_annual_income || 'Not Disclosed'}
                    </span>
                  </div>
                </div>

                {/* Statement of Purpose */}
                {docs.statement_of_purpose && (
                  <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-midnight-950 border border-slate-200/80 dark:border-white/5">
                    <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <FileText className="h-4 w-4 text-blue-500" />
                      Candidate Statement of Purpose & Motivation
                    </h5>
                    <div className="max-h-44 overflow-y-auto pr-1">
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs whitespace-pre-line bg-white dark:bg-midnight-900/60 p-3.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                        {docs.statement_of_purpose}
                      </p>
                    </div>
                  </div>
                )}

                {/* Extracurriculars */}
                {docs.extracurricular_highlights && (
                  <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-midnight-950 border border-slate-200/80 dark:border-white/5">
                    <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <Sparkles className="h-4 w-4 text-emerald-500" />
                      Extracurricular Activities & Awards
                    </h5>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs whitespace-pre-line bg-white dark:bg-midnight-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-white/5">
                      {docs.extracurricular_highlights}
                    </p>
                  </div>
                )}

                {/* Portfolio link */}
                {docs.portfolio_link && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                    <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">Candidate Portfolio Link:</span>
                    <a
                      href={docs.portfolio_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Portfolio
                    </a>
                  </div>
                )}

                {/* Formal Evaluation & Committee Decision */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                      <ShieldCheck className="h-4 w-4 text-blue-600" />
                      Committee Evaluation & Status Pipeline
                    </h5>
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: #{String(app.id).slice(0, 8)}
                    </span>
                  </div>

                  {/* Stage Selector Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { value: 'PENDING', label: 'Pending', icon: Clock },
                      { value: 'UNDER_REVIEW', label: 'Under Review', icon: Eye },
                      { value: 'APPROVED', label: 'Approved', icon: CheckCircle2 },
                      { value: 'AWARDED', label: '🎉 Awarded', icon: Sparkles },
                      { value: 'REJECTED', label: 'Rejected', icon: X },
                    ].map((st) => {
                      const isSelected = reviewModalStatus === st.value;
                      const Icon = st.icon;
                      return (
                        <button
                          key={st.value}
                          type="button"
                          onClick={() => setReviewModalStatus(st.value)}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-transparent shadow-md shadow-violet-500/25 scale-[1.02]'
                              : 'bg-white dark:bg-midnight-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-midnight-900'
                          }`}
                        >
                          <Icon className={`h-4 w-4 mb-1 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                          <span className="text-[11px] truncate">{st.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Review Notes Textarea */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Committee Evaluation Remarks & Student Feedback
                    </label>
                    <textarea
                      value={reviewModalNotes}
                      onChange={(e) => setReviewModalNotes(e.target.value)}
                      placeholder="Add review feedback or payout instructions. These remarks will show in the student's portal..."
                      rows={3}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-midnight-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedApplicantForReview(null)}
                    disabled={reviewModalSubmitting}
                  >
                    Cancel
                  </Button>

                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        setReviewModalSubmitting(true);
                        await handleAdminReviewStatus(app.id, reviewModalStatus, reviewModalNotes);
                        if (reviewModalStatus === 'AWARDED') {
                          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                        }
                        setSelectedApplicantForReview(null);
                      } catch {
                        // Error already handled by toast in handleAdminReviewStatus
                      } finally {
                        setReviewModalSubmitting(false);
                      }
                    }}
                    disabled={reviewModalSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5"
                    leftIcon={reviewModalSubmitting ? <RotateCcw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  >
                    {reviewModalSubmitting ? 'Saving Decision...' : 'Save Evaluation Decision'}
                  </Button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
};
