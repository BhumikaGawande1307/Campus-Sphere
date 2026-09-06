import React, { useEffect, useState, useMemo } from 'react';
import { careerService } from '../services/careerService';
import { studentService } from '../services/studentService';
import { JobPosting, Application, JobType, StudentProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { JobApplicationModal } from '../components/JobApplicationModal';
import { Input, Select, Textarea } from '../components/Input';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import {
  Briefcase,
  Building2,
  MapPin,
  IndianRupee,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
  Plus,
  Search,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Users,
  Award,
  Filter,
  Check,
  AlertCircle,
  Trash2,
  Eye,
  FileText,
  ChevronRight,
  ShieldCheck,
  ArrowUpRight,
  GraduationCap,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';

const COMPANY_PRESETS = [
  { name: 'Google India', location: 'Bengaluru / Hybrid', defaultSalary: '₹85,000 / month', type: 'INTERNSHIP' as JobType },
  { name: 'Microsoft India', location: 'Hyderabad / Remote', defaultSalary: '₹80,000 / month', type: 'INTERNSHIP' as JobType },
  { name: 'Amazon India', location: 'Bengaluru / Hyderabad', defaultSalary: '₹28 - 36 LPA', type: 'FULL_TIME' as JobType },
  { name: 'NVIDIA India', location: 'Pune / Bengaluru', defaultSalary: '₹32 - 44 LPA', type: 'FULL_TIME' as JobType },
  { name: 'Apple India', location: 'Hyderabad / Bengaluru', defaultSalary: '₹30 - 42 LPA', type: 'FULL_TIME' as JobType },
  { name: 'Goldman Sachs', location: 'Bengaluru / Hyderabad', defaultSalary: '₹24 - 32 LPA', type: 'FULL_TIME' as JobType },
  { name: 'Tata Consultancy Services', location: 'Mumbai / Pune / Pan-India', defaultSalary: '₹9 - 14 LPA', type: 'FULL_TIME' as JobType },
  { name: 'Infosys', location: 'Bengaluru / Pune', defaultSalary: '₹9 - 12 LPA', type: 'FULL_TIME' as JobType },
];

const SKILL_SUGGESTIONS = [
  'React',
  'TypeScript',
  'Node.js',
  'Python',
  'Go',
  'Java',
  'AWS',
  'PostgreSQL',
  'Docker',
  'Kubernetes',
  'C++',
  'PyTorch',
  'Tailwind CSS',
  'System Design',
];

export const CareerHubPage: React.FC = () => {
  const { user } = useAuth();
  const isPlacementOfficer = [
    'PLACEMENT_OFFICER',
    'ADMIN',
    'SUPER_ADMIN',
    'ADMINISTRATOR',
    'COORDINATOR',
  ].includes(user?.role || '');

  const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>('jobs');
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('ALL');
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'deadline' | 'cgpa'>('newest');

  // Candidate pipeline filter
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState<string>('ALL');

  const toast = useToast();

  // Application Modal for Students
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

  // New Job Modal for Officers & Admins
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [jobForm, setJobForm] = useState({
    title: '',
    company_name: 'Google India',
    job_type: 'INTERNSHIP' as JobType,
    stipend_salary: '₹85,000 / month',
    location: 'Bengaluru / Hybrid',
    description: '',
    requirements: '',
    required_skills: 'React, TypeScript, Go',
    deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    min_cgpa: 7.5,
    openings: 5,
  });
  const [creatingJob, setCreatingJob] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (jobTypeFilter !== 'ALL') params.job_type = jobTypeFilter;

      const [jobsRes, appsRes, profRes] = await Promise.all([
        careerService.getJobs(params),
        isPlacementOfficer
          ? careerService.getAllApplications()
          : careerService.getMyApplications(),
        user?.role === 'STUDENT' ? studentService.getMyProfile() : Promise.resolve(null),
      ]);
      setJobs(jobsRes);
      setApplications(appsRes);
      if (profRes) setStudentProfile(profRes);
    } catch (err: any) {
      toast.error('Failed to load career data', err?.message || 'Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [jobTypeFilter]);

  // Set of job IDs the current student has already applied to
  const appliedJobIds = useMemo(() => {
    return new Set(
      applications.map((app) => (typeof app.job_id === 'number' ? app.job_id : app.job?.id))
    );
  }, [applications]);

  // Handle Application Status Update
  const handleStatusUpdate = async (appId: number, newStatus: string) => {
    try {
      await careerService.updateApplicationStatus(appId, newStatus);
      toast.success('Status Updated', `Candidate marked as ${newStatus}.`);
      fetchData();
    } catch (err: any) {
      toast.error('Update Failed', err?.message || 'Could not update status.');
    }
  };

  // Handle Recruitment Drive Creation
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.title.trim()) {
      toast.error('Missing Field', 'Please enter a job role title.');
      return;
    }
    if (!jobForm.company_name.trim()) {
      toast.error('Missing Field', 'Please specify the hiring company.');
      return;
    }

    setCreatingJob(true);
    try {
      const created = await careerService.createJobPosting(jobForm);
      toast.success(
        'Recruitment Drive Published! 🚀',
        `${created.title} by ${created.company_name} is now open for applications.`
      );
      setIsNewJobOpen(false);
      setFormStep(1);
      setJobForm({
        title: '',
        company_name: 'Google India',
        job_type: 'INTERNSHIP',
        stipend_salary: '₹85,000 / month',
        location: 'Bengaluru / Hybrid',
        description: '',
        requirements: '',
        required_skills: 'React, TypeScript, Go',
        deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        min_cgpa: 7.5,
        openings: 5,
      });
      fetchData();
    } catch (err: any) {
      toast.error('Failed to create job drive', err?.message || 'Database rejected the request.');
    } finally {
      setCreatingJob(false);
    }
  };

  // Handle Recruitment Drive Deletion
  const handleDeleteJob = async (jobId: number, title: string) => {
    if (!window.confirm(`Are you sure you want to withdraw and remove the recruitment drive "${title}"?`)) {
      return;
    }
    try {
      await careerService.deleteJobPosting(jobId);
      toast.success('Drive Removed', `Recruitment drive "${title}" has been deleted.`);
      fetchData();
    } catch (err: any) {
      toast.error('Delete Failed', err?.message || 'Could not remove drive.');
    }
  };

  // Preset Selection Helper
  const applyPreset = (preset: typeof COMPANY_PRESETS[0]) => {
    setJobForm((prev) => ({
      ...prev,
      company_name: preset.name,
      location: preset.location,
      stipend_salary: preset.defaultSalary,
      job_type: preset.type,
      title: prev.title || `${preset.name} Software Development Engineer`,
    }));
  };

  // Skill toggle helper
  const toggleSkill = (skill: string) => {
    const current = jobForm.required_skills
      ? jobForm.required_skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    let updated: string[];
    if (current.includes(skill)) {
      updated = current.filter((s) => s !== skill);
    } else {
      updated = [...current, skill];
    }
    setJobForm({ ...jobForm, required_skills: updated.join(', ') });
  };

  // Filtered and Sorted Jobs
  const filteredJobs = useMemo(() => {
    return jobs
      .filter((j) => {
        const titleMatch = (j.title || '').toLowerCase().includes(searchQuery.toLowerCase());
        const compMatch = (j.company?.name || j.company_name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const skillMatch = (j.required_skills || '').toLowerCase().includes(searchQuery.toLowerCase());
        const locMatch = (j.location || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesQuery = titleMatch || compMatch || skillMatch || locMatch;

        if (!matchesQuery) return false;

        if (onlyEligible && studentProfile?.cgpa) {
          if ((j.min_cgpa || 0) > studentProfile.cgpa) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'deadline') {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (sortBy === 'cgpa') {
          return (a.min_cgpa || 0) - (b.min_cgpa || 0);
        }
        return b.id - a.id;
      });
  }, [jobs, searchQuery, onlyEligible, studentProfile, sortBy]);

  // Filtered Applications for Candidate Pipeline
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const studentName = `${app.student?.user?.first_name || ''} ${app.student?.user?.last_name || ''}`.toLowerCase();
      const studentEmail = (app.student?.user?.email || '').toLowerCase();
      const jobTitle = (app.job?.title || '').toLowerCase();
      const company = (app.job?.company_name || app.job?.company?.name || '').toLowerCase();

      const searchMatch =
        studentName.includes(candidateSearch.toLowerCase()) ||
        studentEmail.includes(candidateSearch.toLowerCase()) ||
        jobTitle.includes(candidateSearch.toLowerCase()) ||
        company.includes(candidateSearch.toLowerCase());

      if (!searchMatch) return false;
      if (candidateStatusFilter !== 'ALL' && app.status !== candidateStatusFilter) return false;
      return true;
    });
  }, [applications, candidateSearch, candidateStatusFilter]);

  // Telemetry Metrics
  const totalOpenings = useMemo(() => {
    return jobs.reduce((acc, j) => acc + (j.openings || 1), 0);
  }, [jobs]);

  const eligibleCount = useMemo(() => {
    if (!studentProfile?.cgpa) return jobs.length;
    return jobs.filter((j) => (j.min_cgpa || 0) <= studentProfile.cgpa).length;
  }, [jobs, studentProfile]);

  return (
    <div className="space-y-6 pb-16">
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE CAREER & RECRUITMENT COMMAND HERO                             */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950/80 via-gray-950 to-gray-950 p-6 sm:p-8 text-white shadow-2xl border border-violet-500/20">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-80 h-80 rounded-full bg-fuchsia-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              Campus Placement & Career Office
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Campus Recruitment <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-pink-400 bg-clip-text text-transparent">& Placement Hub</span>
            </h1>
            <p className="text-sm text-gray-300 leading-relaxed">
              Explore campus recruitment drives, check your eligibility, apply with your resume in one click, and track your applications.
            </p>

            {/* Student CGPA Eligibility Banner */}
            {user?.role === 'STUDENT' && studentProfile && (
              <div className="inline-flex items-center gap-2 pt-2 text-xs font-medium text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg backdrop-blur-md">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  Your Verified CGPA: <strong className="text-white">{studentProfile.cgpa || 8.92}</strong> • Eligible for <strong className="text-white">{eligibleCount} of {jobs.length}</strong> active recruitment drives.
                </span>
              </div>
            )}
          </div>

          {/* Action CTA */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {isPlacementOfficer ? (
              <Button
                onClick={() => {
                  setFormStep(1);
                  setIsNewJobOpen(true);
                }}
                className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 border-0 font-semibold px-5 py-2.5 rounded-xl text-sm"
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Post Recruitment Drive
              </Button>
            ) : (
              <Button
                onClick={() => setActiveTab(activeTab === 'jobs' ? 'applications' : 'jobs')}
                variant="outline"
                className="border-indigo-400/40 bg-indigo-900/30 hover:bg-indigo-900/60 text-indigo-200"
                leftIcon={<Clock className="h-4 w-4" />}
              >
                {activeTab === 'jobs' ? 'My Applications' : 'Browse Drives'}
              </Button>
            )}
          </div>
        </div>

        {/* Live Telemetry Grid */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-6 border-t border-indigo-800/40">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Active Drives</span>
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1.5">{jobs.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Live campus cohorts</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Open Vacancies</span>
              <Users className="h-3.5 w-3.5 text-indigo-300" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-200 mt-1.5">{totalOpenings}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across all partners</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Applications</span>
              <TrendingUp className="h-3.5 w-3.5 text-sky-300" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-sky-200 mt-1.5">{applications.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">In current pipeline</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Top Package</span>
              <Award className="h-3.5 w-3.5 text-amber-300" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1.5">₹44 LPA</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Tier-1 Core & Tech</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. NAVIGATION TABS & FILTER TOOLBAR                                        */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
          {/* Main Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'jobs'
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#171b32]'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>Explore Recruitment Drives</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'jobs' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-[#171b32] text-slate-600 dark:text-slate-400'
              }`}>
                {jobs.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('applications')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'applications'
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#171b32]'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>{isPlacementOfficer ? 'Candidate Pipeline' : 'My Applications'}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'applications' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-[#171b32] text-slate-600 dark:text-slate-400'
              }`}>
                {applications.length}
              </span>
            </button>
          </div>

          {/* Quick Stats or Add Button */}
          {activeTab === 'jobs' && isPlacementOfficer && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setFormStep(1);
                  setIsNewJobOpen(true);
                }}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
              >
                New Drive
              </Button>
            </div>
          )}
        </div>

        {/* Dynamic Filters for Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-[#111425] border border-slate-200/80 dark:border-violet-500/15 shadow-sm">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by role, company, skills (e.g. React, Python), location..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {['ALL', 'INTERNSHIP', 'FULL_TIME', 'PART_TIME'].map((type) => (
                <button
                  key={type}
                  onClick={() => setJobTypeFilter(type)}
                  className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                    jobTypeFilter === type
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#171b32] border border-transparent'
                  }`}
                >
                  {type === 'ALL' ? 'All Roles' : type.replace('_', ' ')}
                </button>
              ))}

              {/* Student "Eligible Only" Switch */}
              {user?.role === 'STUDENT' && (
                <button
                  onClick={() => setOnlyEligible(!onlyEligible)}
                  className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    onlyEligible
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#171b32]'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Eligible for me</span>
                  {onlyEligible && <Check className="h-3 w-3 text-emerald-600" />}
                </button>
              )}

              {/* Sort Selector */}
              <div className="w-36">
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  options={[
                    { value: 'newest', label: 'Newest First' },
                    { value: 'deadline', label: 'Closing Soon' },
                    { value: 'cgpa', label: 'Lowest CGPA Cutoff' },
                  ]}
                />
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Filters for Candidate Pipeline Tab */}
        {activeTab === 'applications' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-[#111425] border border-slate-200/80 dark:border-violet-500/15 shadow-sm">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                placeholder="Search candidates by name, email, drive role, or company..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              <div className="w-40">
                <Select
                  value={candidateStatusFilter}
                  onChange={(e) => setCandidateStatusFilter(e.target.value)}
                  options={[
                    { value: 'ALL', label: 'All Statuses' },
                    { value: 'APPLIED', label: 'Applied' },
                    { value: 'SHORTLISTED', label: 'Shortlisted' },
                    { value: 'INTERVIEWED', label: 'Interview' },
                    { value: 'SELECTED', label: 'Selected / Offered' },
                    { value: 'REJECTED', label: 'Rejected' },
                  ]}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB CONTENT: EXPLORE RECRUITMENT DRIVES                                */}
      {/* ========================================================================= */}
      {activeTab === 'jobs' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LoadingSkeleton rows={4} />
              <LoadingSkeleton rows={4} />
            </div>
          ) : filteredJobs.length === 0 ? (
            <EmptyState
              title="No Recruitment Drives Found"
              description="No open recruitment drives match your current search criteria or eligibility filters."
              actionText="Clear All Filters"
              onAction={() => {
                setSearchQuery('');
                setJobTypeFilter('ALL');
                setOnlyEligible(false);
              }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {filteredJobs.map((job) => {
                const isApplied = appliedJobIds.has(job.id);
                const meetsCgpa = !job.min_cgpa || !studentProfile?.cgpa || studentProfile.cgpa >= job.min_cgpa;
                const daysRemaining = job.deadline
                  ? Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null;

                const skillsList = job.required_skills
                  ? job.required_skills.split(',').map((s) => s.trim()).filter(Boolean)
                  : [];

                return (
                  <div
                    key={job.id}
                    className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-[#111425] border border-slate-200/80 dark:border-violet-500/15 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-violet-500/40 hover:shadow-violet-500/5 transition-all duration-300"
                  >
                    <div className="space-y-4">
                      {/* Card Header: Company Logo, Badges & Admin Actions */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shrink-0 border border-white/20">
                            {job.company_name?.charAt(0) || 'C'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge
                                variant={job.job_type === 'INTERNSHIP' ? 'primary' : 'success'}
                                size="sm"
                              >
                                {job.job_type.replace('_', ' ')}
                              </Badge>
                              <Badge variant="neutral" size="sm">
                                <MapPin className="h-3 w-3 mr-1 inline" />
                                {job.location || 'Remote'}
                              </Badge>
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                              {job.title}
                            </h3>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              {job.company_name || job.company?.name || 'Recruitment Partner'}
                            </p>
                          </div>
                        </div>

                        {/* Top Right Badges or Delete */}
                        <div className="flex items-center gap-1 shrink-0">
                          {isPlacementOfficer && (
                            <button
                              onClick={() => handleDeleteJob(job.id, job.title)}
                              title="Delete Recruitment Drive"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Compensation Callout Box */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                            <IndianRupee className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400">Package / Stipend</div>
                            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                              {job.stipend_salary || 'Competitive'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Open Positions</div>
                          <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                            {job.openings || 1} {job.openings === 1 ? 'Seat' : 'Seats'}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {job.description || 'No detailed description provided.'}
                      </p>

                      {/* Skills Chips */}
                      {skillsList.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {skillsList.slice(0, 5).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-indigo-50/70 dark:bg-indigo-950/40 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50"
                            >
                              {skill}
                            </span>
                          ))}
                          {skillsList.length > 5 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-500">
                              +{skillsList.length - 5} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Metadata Row: Min CGPA & Deadline Countdown */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-500">Min CGPA:</span>
                          <span
                            className={`font-bold ${
                              user?.role === 'STUDENT'
                                ? meetsCgpa
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {job.min_cgpa || '7.0'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {daysRemaining !== null ? (
                            <span
                              className={`font-medium ${
                                daysRemaining <= 3
                                  ? 'text-rose-600 dark:text-rose-400 font-bold'
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {daysRemaining > 0
                                ? `${daysRemaining} days left`
                                : daysRemaining === 0
                                ? 'Closing Today'
                                : 'Application Closed'}
                            </span>
                          ) : (
                            <span>Open</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Action Footer */}
                    <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Verified Campus Drive</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Student Apply Button */}
                        {user?.role === 'STUDENT' && (
                          isApplied ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 font-bold"
                              leftIcon={<Check className="h-3.5 w-3.5" />}
                            >
                              Applied
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => setSelectedJob(job)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                              leftIcon={<Send className="h-3.5 w-3.5" />}
                            >
                              Apply Now
                            </Button>
                          )
                        )}

                        {/* Officer View Applicants Button */}
                        {isPlacementOfficer && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCandidateSearch(job.title);
                              setActiveTab('applications');
                            }}
                            leftIcon={<Eye className="h-3.5 w-3.5" />}
                          >
                            Applicants
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB CONTENT: CANDIDATE PIPELINE / MY APPLICATIONS                      */}
      {/* ========================================================================= */}
      {activeTab === 'applications' && (
        <>
          {loading ? (
            <LoadingSkeleton rows={5} />
          ) : filteredApplications.length === 0 ? (
            <EmptyState
              title="No Applications Recorded"
              description={
                isPlacementOfficer
                  ? 'No candidates have applied to campus recruitment drives yet matching your search filters.'
                  : 'You have not submitted applications to any recruitment drives yet.'
              }
              actionText="Browse Open Drives"
              onAction={() => setActiveTab('jobs')}
            />
          ) : (
            <div className="space-y-3">
              {filteredApplications.map((app) => {
                const statusVariant =
                  app.status === 'SELECTED'
                    ? 'success'
                    : app.status === 'REJECTED'
                    ? 'danger'
                    : app.status === 'SHORTLISTED'
                    ? 'primary'
                    : app.status === 'INTERVIEWED'
                    ? 'warning'
                    : 'neutral';

                const applicantName = app.student?.user
                  ? `${app.student.user.first_name || ''} ${app.student.user.last_name || ''}`.trim()
                  : 'Student Applicant';

                return (
                  <div
                    key={app.id}
                    className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111425] border border-slate-200/80 dark:border-violet-500/15 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Candidate & Drive Details */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold shrink-0">
                        {applicantName.charAt(0)}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={statusVariant} size="sm" dot>
                            {app.status}
                          </Badge>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {app.job?.title || 'Recruitment Opening'} &bull;{' '}
                            <span className="text-indigo-600 dark:text-indigo-400">
                              {app.job?.company_name || app.job?.company?.name || 'Recruiter'}
                            </span>
                          </h4>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>
                            Candidate:{' '}
                            <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                              {applicantName}
                            </strong>
                          </span>
                          <span>&bull;</span>
                          <span>
                            CGPA:{' '}
                            <strong className="text-indigo-600 dark:text-indigo-400">
                              {app.student?.cgpa || '8.9'}
                            </strong>
                          </span>
                          <span>&bull;</span>
                          <span>
                            Applied:{' '}
                            {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions & Resume Links */}
                    <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
                      {app.resume_url && (
                        <a
                          href={app.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          <span>ATS Resume</span>
                          <ExternalLink className="h-3 w-3 text-slate-400" />
                        </a>
                      )}

                      {/* Placement Officer Inline Status Controls */}
                      {isPlacementOfficer && (
                        <div className="w-36">
                          <Select
                            value={app.status}
                            onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                            options={[
                              { value: 'APPLIED', label: 'Applied' },
                              { value: 'SHORTLISTED', label: 'Shortlist' },
                              { value: 'INTERVIEWED', label: 'Interview' },
                              { value: 'SELECTED', label: 'Offer / Selected' },
                              { value: 'REJECTED', label: 'Reject' },
                            ]}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 5. JOB APPLICATION MODAL FOR STUDENTS                                     */}
      {/* ========================================================================= */}
      <JobApplicationModal
        job={selectedJob}
        studentProfile={studentProfile}
        isOpen={Boolean(selectedJob)}
        onClose={() => setSelectedJob(null)}
        onSuccess={fetchData}
      />

      {/* ========================================================================= */}
      {/* 6. INTERACTIVE RECRUITMENT DRIVE STUDIO MODAL (OFFICER/ADMIN)              */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isNewJobOpen}
        onClose={() => setIsNewJobOpen(false)}
        title="Post Campus Recruitment Drive"
        description="Post a campus recruitment drive with eligibility criteria and applicant tracking."
        size="lg"
      >
        <form onSubmit={handleCreateJob} className="space-y-5">
          {/* Step Indicator */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFormStep(1)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  formStep === 1
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                1. Role & Partner Presets
              </button>
              <button
                type="button"
                onClick={() => setFormStep(2)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  formStep === 2
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                2. Eligibility & Preview
              </button>
            </div>
            <span className="text-xs text-slate-400 font-medium">Step {formStep} of 2</span>
          </div>

          {/* STEP 1: COMPANY & ROLE DETAILS */}
          {formStep === 1 && (
            <div className="space-y-4">
              {/* Company Presets Quick Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Popular Hiring Partner Presets (1-Click Fill)
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMPANY_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                        jobForm.company_name === preset.name
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Hiring Company Name"
                  required
                  value={jobForm.company_name}
                  onChange={(e) => setJobForm({ ...jobForm, company_name: e.target.value })}
                  placeholder="e.g. Google Cloud, Microsoft, Amazon"
                />

                <Input
                  label="Job Role Title"
                  required
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  placeholder="e.g. Software Engineer Intern"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Recruitment Category"
                  value={jobForm.job_type}
                  onChange={(e) => setJobForm({ ...jobForm, job_type: e.target.value as JobType })}
                  options={[
                    { value: 'INTERNSHIP', label: 'Internship (Summer / Winter)' },
                    { value: 'FULL_TIME', label: 'Full-Time (Graduate SDE)' },
                    { value: 'PART_TIME', label: 'Co-Op / Part-Time' },
                  ]}
                />

                <Input
                  label="Compensation / Stipend"
                  required
                  value={jobForm.stipend_salary}
                  onChange={(e) => setJobForm({ ...jobForm, stipend_salary: e.target.value })}
                  placeholder="e.g. ₹85,000 / month or ₹28 - 36 LPA"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Location"
                  value={jobForm.location}
                  onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                  placeholder="e.g. Bengaluru / Hybrid, Pune, Remote"
                />

                <Input
                  label="Application Deadline"
                  type="date"
                  required
                  value={jobForm.deadline}
                  onChange={(e) => setJobForm({ ...jobForm, deadline: e.target.value })}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={() => setFormStep(2)}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Next: Eligibility & Preview
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: ELIGIBILITY, SKILLS & LIVE PREVIEW */}
          {formStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Minimum CGPA Cutoff"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  required
                  value={jobForm.min_cgpa}
                  onChange={(e) => setJobForm({ ...jobForm, min_cgpa: Number(e.target.value) })}
                />

                <Input
                  label="Total Available Openings / Seats"
                  type="number"
                  min="1"
                  required
                  value={jobForm.openings}
                  onChange={(e) => setJobForm({ ...jobForm, openings: Number(e.target.value) })}
                />
              </div>

              {/* Skills Tag Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Required Skills & Technologies (Click to toggle tags)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {SKILL_SUGGESTIONS.map((s) => {
                    const selected = jobForm.required_skills.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSkill(s)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors border ${
                          selected
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {selected ? `✓ ${s}` : `+ ${s}`}
                      </button>
                    );
                  })}
                </div>
                <Input
                  value={jobForm.required_skills}
                  onChange={(e) => setJobForm({ ...jobForm, required_skills: e.target.value })}
                  placeholder="Comma-separated: React, TypeScript, Python, AWS"
                />
              </div>

              <Textarea
                label="Role Description & Responsibilities"
                required
                value={jobForm.description}
                onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                placeholder="Describe team mission, core technical problems to solve, and work culture..."
                rows={3}
              />

              {/* LIVE CARD PREVIEW */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Student Card Live Preview</span>
                  <Badge variant="primary" size="sm">Preview Mode</Badge>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#111425] border border-slate-200 dark:border-violet-500/15 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center">
                      {jobForm.company_name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {jobForm.title || 'Role Title Preview'}
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold">
                        {jobForm.company_name || 'Hiring Partner'} &bull; {jobForm.location}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      {jobForm.stipend_salary || '₹85,000 / month'}
                    </span>
                    <span className="text-slate-400">
                      Min CGPA: <strong>{jobForm.min_cgpa}</strong> &bull; {jobForm.openings} Seats
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormStep(1)}
                >
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsNewJobOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={creatingJob} leftIcon={<Send className="h-4 w-4" />}>
                    Publish Recruitment Drive
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};
