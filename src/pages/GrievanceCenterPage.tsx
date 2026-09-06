import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { grievanceService } from '../services/grievanceService';
import { notificationSocketService } from '../services/notificationSocketService';
import {
  GrievanceTicket,
  GrievanceCategory,
  GrievancePriority,
  GrievanceStatus,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  User as UserIcon,
  Building2,
  MessageSquare,
  Star,
  ShieldCheck,
  Paperclip,
  Check,
  X,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  Download,
  AlertCircle,
  CheckCircle,
  FileText,
} from 'lucide-react';

const CATEGORIES: GrievanceCategory[] = [
  'Academic',
  'Examination',
  'Attendance',
  'Scholarship',
  'Finance',
  'Placement',
  'Events',
  'Documents',
  'Hostel & Facilities',
  'Technical',
  'Other',
];

export const GrievanceCenterPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const userRole = (user?.role || '').toUpperCase();
  const isStaff =
    isAdminRoute ||
    ['ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR', 'COORDINATOR', 'HOD', 'FACULTY', 'PLACEMENT_OFFICER', 'MENTOR'].includes(
      userRole
    );
  const toast = useToast();

  const [tickets, setTickets] = useState<GrievanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, avgResolutionTimeHours: 24 });

  // Track if user explicitly clicked between tabs
  const hasUserSelectedView = useRef(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [filterView, setFilterView] = useState<'ALL' | 'MY_TICKETS'>(
    isAdminRoute || isStaff ? 'ALL' : 'MY_TICKETS'
  );

  // Ensure filterView defaults to ALL for admin/staff once auth loads
  useEffect(() => {
    if (!hasUserSelectedView.current) {
      if (isAdminRoute || isStaff) {
        setFilterView('ALL');
      } else if (user) {
        setFilterView('MY_TICKETS');
      }
    }
  }, [isAdminRoute, isStaff, user]);

  // Modals & Drawers
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<GrievanceTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [ratingVal, setRatingVal] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [resolutionSummaryInput, setResolutionSummaryInput] = useState('');
  const [resolvingTicket, setResolvingTicket] = useState(false);

  // Proof & Photo upload state in creation form
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reply photo upload state
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [replyFilePreview, setReplyFilePreview] = useState<string | null>(null);
  const replyFileInputRef = useRef<HTMLInputElement | null>(null);

  // Lightbox Image Preview Modal
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // New Ticket Form State
  const [newTicketForm, setNewTicketForm] = useState({
    category: 'Academic' as GrievanceCategory,
    subcategory: '',
    title: '',
    description: '',
    priority: 'MEDIUM' as GrievancePriority,
    preferred_contact: 'EMAIL' as 'EMAIL' | 'PHONE' | 'IN_PERSON',
    reference_number: '',
  });
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Helper functions for names
  const getStudentName = (t?: GrievanceTicket | null) => {
    if (!t) return 'Unknown Student';
    const s = t.student;
    if (!s) return 'Anonymous Student';
    const first = s.first_name || s.user?.first_name || '';
    const last = s.last_name || s.user?.last_name || '';
    const full = `${first} ${last}`.trim();
    if (full) return full;
    return s.username || s.user?.username || s.email || s.user?.email || 'Student';
  };

  const getStudentEmail = (t?: GrievanceTicket | null) => {
    if (!t?.student) return '';
    const s = t.student;
    return s.email || s.user?.email || '';
  };

  const getAssigneeName = (t?: GrievanceTicket | null) => {
    const staff = t?.assigned || t?.assigned_to;
    if (!staff || typeof staff !== 'object') return 'Unassigned';
    const first = staff.first_name || '';
    const last = staff.last_name || '';
    const full = `${first} ${last}`.trim();
    return full || staff.username || staff.email || 'Assigned Staff';
  };

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {
        category: selectedCategory,
        status: selectedStatus,
        search: searchQuery,
      };

      // Only filter by own user ID if explicitly viewing "MY_TICKETS" or student on student portal
      if (filterView === 'MY_TICKETS' || (!isStaff && !isAdminRoute)) {
        if (user?.id) {
          filters.userId = String(user.id);
        }
      }

      const data = await grievanceService.getTickets(filters);
      setTickets(data);
      const s = await grievanceService.getStats();
      setStats(s);

      if (activeTicket) {
        const refreshed = await grievanceService.getTicketById(activeTicket.id);
        if (refreshed) {
          setActiveTicket(refreshed);
        }
      } else if (data.length > 0) {
        setActiveTicket(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedStatus, searchQuery, filterView, isStaff, isAdminRoute, user?.id, activeTicket?.id]);

  useEffect(() => {
    fetchTickets();

    // Subscribe to realtime grievance updates so admin portal auto-refreshes
    const unsubscribe = notificationSocketService.subscribeGrievance(() => {
      fetchTickets();
    });
    return () => unsubscribe();
  }, [fetchTickets]);

  // Handle proof file selection in create modal
  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.warning('File size must be under 5MB.');
      return;
    }

    setProofFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setProofPreview(null);
    }
  };

  const removeProof = () => {
    setProofFile(null);
    setProofPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle reply file selection
  const handleReplyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Attachment size must be under 5MB.');
      return;
    }

    setReplyFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setReplyFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setReplyFilePreview(null);
    }
  };

  const removeReplyFile = () => {
    setReplyFile(null);
    setReplyFilePreview(null);
    if (replyFileInputRef.current) {
      replyFileInputRef.current.value = '';
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketForm.title.trim() || !newTicketForm.description.trim()) {
      toast.warning('Please enter a subject and detailed description.');
      return;
    }

    setSubmittingTicket(true);
    try {
      const created = await grievanceService.createTicket({
        ...newTicketForm,
        attachment_file: proofFile,
      });

      confetti({ particleCount: 70, spread: 60 });
      toast.success('Grievance Ticket Lodged! 🎫', `Tracking ID: ${created.ticket_uid}`);
      setCreateModalOpen(false);
      removeProof();
      setNewTicketForm({
        category: 'Academic',
        subcategory: '',
        title: '',
        description: '',
        priority: 'MEDIUM',
        preferred_contact: 'EMAIL',
        reference_number: '',
      });

      await fetchTickets();
      setActiveTicket(created);
    } catch (err: any) {
      toast.error('Failed to create ticket', err.message);
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || (!replyMessage.trim() && !replyFile)) return;

    setSendingReply(true);
    try {
      await grievanceService.addReply(
        activeTicket.id,
        replyMessage.trim() || (replyFile ? `Attached file: ${replyFile.name}` : ''),
        isInternalNote,
        replyFile
      );

      setReplyMessage('');
      removeReplyFile();
      setIsInternalNote(false);
      toast.success(isInternalNote ? 'Internal note added' : 'Message dispatched to thread');

      const refreshed = await grievanceService.getTicketById(activeTicket.id);
      if (refreshed) {
        setActiveTicket(refreshed);
      }
      fetchTickets();
    } catch {
      toast.error('Failed to dispatch reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleOpenResolveModal = () => {
    setResolutionSummaryInput(activeTicket?.resolution_summary || '');
    setResolveModalOpen(true);
  };

  const handleConfirmResolve = async () => {
    if (!activeTicket) return;
    setResolvingTicket(true);
    try {
      const updated = await grievanceService.updateTicketStatus(
        activeTicket.id,
        'RESOLVED',
        resolutionSummaryInput.trim() || 'Issue resolved successfully by grievance desk staff.'
      );
      setActiveTicket(updated);
      setResolveModalOpen(false);
      toast.success('Ticket marked as RESOLVED! Notification sent to student.');
      fetchTickets();
    } catch {
      toast.error('Failed to resolve ticket');
    } finally {
      setResolvingTicket(false);
    }
  };

  const handleReopenTicket = async () => {
    if (!activeTicket) return;
    try {
      const updated = await grievanceService.updateTicketStatus(activeTicket.id, 'IN_PROGRESS');
      setActiveTicket(updated);
      toast.success('Ticket reopened for investigation.');
      fetchTickets();
    } catch {
      toast.error('Failed to reopen ticket');
    }
  };

  const handleRateResolution = async () => {
    if (!activeTicket) return;
    try {
      await grievanceService.rateResolution(activeTicket.id, ratingVal, ratingFeedback);
      toast.success('Thank you for your feedback! ⭐');
      const refreshed = await grievanceService.getTicketById(activeTicket.id);
      if (refreshed) {
        setActiveTicket(refreshed);
      }
      fetchTickets();
    } catch {
      toast.error('Failed to save rating');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={isStaff ? 'Student Grievances & Support Requests' : 'Student Help & Support Center'}
        subtitle="Submit academic questions, attendance issues, fee queries, and get answers within 72 hours"
        badge={
          <Badge variant="primary" size="sm" dot>
            72-Hour Response Time
          </Badge>
        }
        action={
          <div className="flex items-center gap-2">
            {isStaff && (
              <div className="flex bg-slate-100 dark:bg-midnight-800 p-1 rounded-2xl border border-slate-200 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    hasUserSelectedView.current = true;
                    setFilterView('ALL');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterView === 'ALL'
                      ? 'bg-white dark:bg-midnight-950 text-blue-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All Campus Grievances
                </button>
                <button
                  type="button"
                  onClick={() => {
                    hasUserSelectedView.current = true;
                    setFilterView('MY_TICKETS');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterView === 'MY_TICKETS'
                      ? 'bg-white dark:bg-midnight-950 text-blue-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  My Filed Tickets
                </button>
              </div>
            )}
            <Button onClick={() => setCreateModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
              File a Grievance
            </Button>
          </div>
        }
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Total Tickets"
          value={stats.total}
          icon={MessageSquare}
          color="blue"
          subtitle="Official Inquiries"
        />
        <StatCard
          title="Open Tickets"
          value={stats.open}
          icon={Clock}
          color="amber"
          subtitle="Awaiting Resolution"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={AlertTriangle}
          color="purple"
          subtitle="Under Investigation"
        />
        <StatCard
          title="Resolved"
          value={stats.resolved}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Successfully Closed"
          trend={{ value: `${stats.avgResolutionTimeHours}h avg turnaround`, isPositive: true }}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-midnight-900 border border-slate-200 dark:border-white/5 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket ID (GRV-...), subject or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-midnight-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-midnight-950 text-slate-900 dark:text-white shrink-0 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-midnight-950 text-slate-900 dark:text-white shrink-0 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_STUDENT">Waiting for Student</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Split View: Ticket List & Live Thread Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tickets List (Left 5 cols on lg) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {tickets.length} Grievance Ticket{tickets.length === 1 ? '' : 's'}
            </span>
            <span className="text-[11px] text-slate-400">Click ticket to view thread & proof</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <LoadingSkeleton key={i} className="h-32 rounded-3xl" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <EmptyState
              title="No Grievance Tickets Found"
              description={
                searchQuery
                  ? 'Try clearing your search query or filters.'
                  : 'There are no grievance tickets matching your criteria.'
              }
              icon={HelpCircle}
            />
          ) : (
            tickets.map((t) => {
              const studentName = getStudentName(t);
              const hasAttachments = Boolean(
                (t.attachments && t.attachments.length > 0) || t.attachment_url
              );

              return (
                <div
                  key={t.id}
                  onClick={() => setActiveTicket(t)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer shadow-2xs hover:shadow-md ${
                    activeTicket?.id === t.id
                      ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                      : 'border-slate-200/80 dark:border-white/5 bg-white dark:bg-midnight-900 hover:border-slate-300 dark:hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
                        {t.ticket_uid}
                      </span>
                      <Badge
                        variant={
                          t.priority === 'URGENT' || t.priority === 'HIGH'
                            ? 'danger'
                            : t.priority === 'MEDIUM'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {t.priority}
                      </Badge>
                      {hasAttachments && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                          <ImageIcon className="h-2.5 w-2.5" /> Proof
                        </span>
                      )}
                    </div>
                    <Badge
                      variant={
                        t.status === 'RESOLVED' || t.status === 'CLOSED'
                          ? 'success'
                          : t.status === 'IN_PROGRESS'
                          ? 'primary'
                          : 'warning'
                      }
                      size="sm"
                      dot
                    >
                      {t.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2 line-clamp-1">
                    {t.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {t.description}
                  </p>

                  {/* Submitter Name & Department Row */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                      <div className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {studentName.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{studentName}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 shrink-0">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {t.category}
                      </span>
                      <span>&bull;</span>
                      <span>{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Live Conversation Thread & Ticket Detail (Right 7 cols on lg) */}
        <div className="lg:col-span-7">
          {activeTicket ? (
            <Card className="p-5 sm:p-6 space-y-5 sticky top-20 shadow-md">
              {/* Thread Header */}
              <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {activeTicket.ticket_uid}
                    </span>
                    <Badge variant="primary" size="sm">
                      {activeTicket.category}
                    </Badge>
                    <Badge
                      variant={
                        activeTicket.status === 'RESOLVED' || activeTicket.status === 'CLOSED'
                          ? 'success'
                          : activeTicket.status === 'IN_PROGRESS'
                          ? 'primary'
                          : 'warning'
                      }
                      size="sm"
                      dot
                    >
                      {activeTicket.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {/* Staff Status Change Actions */}
                  {isStaff && (
                    <div className="flex items-center gap-1.5">
                      {activeTicket.status !== 'RESOLVED' && activeTicket.status !== 'CLOSED' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={handleOpenResolveModal}
                          leftIcon={<CheckCircle className="h-3.5 w-3.5" />}
                        >
                          Resolve Grievance
                        </Button>
                      )}
                      {(activeTicket.status === 'RESOLVED' || activeTicket.status === 'CLOSED') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleReopenTicket}
                        >
                          Reopen Ticket
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {activeTicket.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <UserIcon className="h-3.5 w-3.5 text-blue-500" />
                      Filed by{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {getStudentName(activeTicket)}
                      </strong>
                      {getStudentEmail(activeTicket) && ` (${getStudentEmail(activeTicket)})`}
                    </span>
                    <span>&bull;</span>
                    <span>
                      Assigned to:{' '}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {getAssigneeName(activeTicket)}
                      </strong>
                    </span>
                    <span>&bull;</span>
                    <span>{new Date(activeTicket.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Primary Ticket Description & Attached Proof Details Card */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-midnight-950/60 border border-slate-200/80 dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Original Grievance Statement
                  </span>
                  {activeTicket.preferred_contact && (
                    <span className="text-[11px] font-semibold text-slate-500">
                      Preferred Contact: <span className="text-blue-600">{activeTicket.preferred_contact}</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {activeTicket.description}
                </p>

                {activeTicket.reference_number && (
                  <div className="text-[11px] text-slate-500 pt-1">
                    Reference / Roll / Transaction ID:{' '}
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {activeTicket.reference_number}
                    </span>
                  </div>
                )}

                {/* Uploaded Proof / Attached Photo Section */}
                {((activeTicket.attachments && activeTicket.attachments.length > 0) || activeTicket.attachment_url) && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <ImageIcon className="h-3.5 w-3.5 text-blue-500" />
                      <span>Uploaded Proof / Verification Photo:</span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {(activeTicket.attachments && activeTicket.attachments.length > 0
                        ? activeTicket.attachments
                        : [{ url: activeTicket.attachment_url!, name: 'Proof Photo' }]
                      ).map((att, idx) => {
                        const isImage =
                          att.url.startsWith('data:image') ||
                          att.url.match(/\.(jpeg|jpg|png|gif|webp)(\?.*)?$/i) ||
                          att.type?.startsWith('image/');

                        return isImage ? (
                          <div
                            key={idx}
                            onClick={() =>
                              setPreviewImage({ url: att.url, title: att.name || 'Grievance Proof Photo' })
                            }
                            className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black/5 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all max-w-[200px]"
                          >
                            <img
                              src={att.url}
                              alt={att.name || 'Grievance Proof'}
                              className="h-28 w-40 object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-white text-xs font-semibold transition-opacity">
                              <Eye className="h-4 w-4" /> View Full
                            </div>
                            {att.name && (
                              <div className="p-1 bg-white/90 dark:bg-midnight-900/90 text-[10px] truncate text-slate-700 dark:text-slate-300 px-2 font-medium">
                                {att.name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <a
                            key={idx}
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 hover:bg-slate-50 text-xs font-semibold text-blue-600 dark:text-blue-400 transition-colors"
                          >
                            <FileText className="h-4 w-4 text-blue-500" />
                            <span>{att.name || 'View Attached Proof Document'}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Official Staff Resolution Summary Banner if Resolved */}
              {(activeTicket.status === 'RESOLVED' || activeTicket.status === 'CLOSED') && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Official Resolution Summary</span>
                  </div>
                  <p className="text-emerald-900 dark:text-emerald-100 leading-relaxed pl-5">
                    {activeTicket.resolution_summary ||
                      'The grievance has been reviewed and resolved by the support committee in accordance with university guidelines.'}
                  </p>
                </div>
              )}

              {/* Message Thread History */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-1">
                  Messages & Discussion ({activeTicket.messages?.length || 0})
                </div>

                {(!activeTicket.messages || activeTicket.messages.length === 0) ? (
                  <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    No replies yet. Use the message box below to ask follow-up questions or post updates.
                  </div>
                ) : (
                  activeTicket.messages.map((msg) => {
                    const isStaffMsg = msg.sender_role !== 'STUDENT';
                    return (
                      <div
                        key={msg.id}
                        className={`p-3.5 rounded-2xl text-xs space-y-1.5 ${
                          msg.is_internal_note
                            ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200'
                            : isStaffMsg
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/30'
                            : 'bg-slate-50 dark:bg-midnight-800/80 border border-slate-100 dark:border-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                            <UserIcon className="h-3 w-3 text-blue-500" />
                            {msg.sender_name}
                            {msg.is_internal_note && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                STAFF INTERNAL NOTE
                              </span>
                            )}
                            {isStaffMsg && !msg.is_internal_note && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                Staff
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {msg.message}
                        </p>

                        {/* Reply Attachment */}
                        {msg.attachment_url && (
                          <div className="pt-1.5">
                            {msg.attachment_url.startsWith('data:image') ||
                            msg.attachment_url.match(/\.(jpeg|jpg|png|gif|webp)(\?.*)?$/i) ? (
                              <div
                                onClick={() =>
                                  setPreviewImage({
                                    url: msg.attachment_url!,
                                    title: `Attachment from ${msg.sender_name}`,
                                  })
                                }
                                className="cursor-pointer inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold hover:underline"
                              >
                                <Paperclip className="h-3 w-3" /> View Attached Photo
                              </div>
                            ) : (
                              <a
                                href={msg.attachment_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <Paperclip className="h-3 w-3" /> View Attachment
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Student Rating Box if Resolved */}
              {activeTicket.status === 'RESOLVED' && (
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2 text-xs">
                  {activeTicket.rating ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <span>Resolution Rating:</span>
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3.5 w-3.5 ${
                                (activeTicket.rating || 0) >= star ? 'fill-current' : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-slate-500 font-normal">({activeTicket.rating}/5)</span>
                      </div>
                      {activeTicket.rating_feedback && (
                        <p className="text-slate-600 dark:text-slate-300 italic">
                          "{activeTicket.rating_feedback}"
                        </p>
                      )}
                    </div>
                  ) : !isStaff ? (
                    <div className="space-y-2">
                      <p className="font-bold text-amber-900 dark:text-amber-200">
                        This grievance is marked Resolved. How would you rate the speed and support experience?
                      </p>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingVal(star)}
                            className={`p-1 transition-transform hover:scale-110 ${
                              ratingVal >= star ? 'text-amber-400' : 'text-slate-300'
                            }`}
                          >
                            <Star className="h-5 w-5 fill-current" />
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Optional feedback comment..."
                          value={ratingFeedback}
                          onChange={(e) => setRatingFeedback(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-xl text-xs border border-amber-200 dark:border-amber-900 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white"
                        />
                        <Button size="sm" onClick={handleRateResolution}>
                          Submit Feedback
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Reply Input Form */}
              <form onSubmit={handleSendReply} className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-white/5">
                {isStaff && (
                  <label className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded text-amber-500"
                    />
                    <span>Post as Internal Staff Note (Invisible to Student)</span>
                  </label>
                )}

                {replyFile && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="font-semibold text-blue-800 dark:text-blue-300 truncate">
                        {replyFile.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removeReplyFile}
                      className="p-1 text-slate-400 hover:text-rose-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    ref={replyFileInputRef}
                    onChange={handleReplyFileChange}
                    accept="image/*,.pdf"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => replyFileInputRef.current?.click()}
                    className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-midnight-800 text-slate-500 transition-colors"
                    title="Attach screenshot or document"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>

                  <textarea
                    rows={2}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply, explanation, or question..."
                    className="flex-1 px-3 py-2 rounded-2xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-midnight-950 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />

                  <Button
                    type="submit"
                    size="sm"
                    isLoading={sendingReply}
                    leftIcon={<Send className="h-3.5 w-3.5" />}
                  >
                    Send
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <div className="h-80 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center p-6 text-slate-400">
              <MessageSquare className="h-10 w-10 mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No Ticket Selected</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Select a ticket from the left panel to review submitter details, verify uploaded proofs, and collaborate in the resolution thread.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* File a Grievance Modal with Photo / Proof Upload */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Lodge an Official Grievance / Inquiry"
        size="lg"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Grievance Category *
              </label>
              <select
                value={newTicketForm.category}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, category: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Priority Level
              </label>
              <select
                value={newTicketForm.priority}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, priority: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="LOW">Low (General Question)</option>
                <option value="MEDIUM">Medium (Standard Request - 72h reply)</option>
                <option value="HIGH">High (Important Academic Issue)</option>
                <option value="URGENT">Urgent (Immediate Attention Needed)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Subject Line *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Attendance sync error in CS301 on Sep 2nd..."
              value={newTicketForm.title}
              onChange={(e) => setNewTicketForm({ ...newTicketForm, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Preferred Contact Method
              </label>
              <select
                value={newTicketForm.preferred_contact}
                onChange={(e) =>
                  setNewTicketForm({ ...newTicketForm, preferred_contact: e.target.value as any })
                }
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="EMAIL">Email Update</option>
                <option value="PHONE">Phone Call</option>
                <option value="IN_PERSON">In-Person Meeting at Desk</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Reference / Exam Roll / ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Roll No: CS-2024-042 or Txn ID"
                value={newTicketForm.reference_number}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, reference_number: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Detailed Description & Facts *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Provide complete facts, dates, affected course/faculty, and specific resolution sought..."
              value={newTicketForm.description}
              onChange={(e) => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white resize-none focus:outline-none"
            />
          </div>

          {/* Upload Proof / Photo Feature */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Upload Proof or Screenshot (Image / PDF)</span>
              <span className="text-[11px] text-slate-400 font-normal">Max size: 5MB</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleProofChange}
              accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
              className="hidden"
            />

            {!proofFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/20 transition-all text-center"
              >
                <Upload className="h-6 w-6 text-slate-400 mb-1" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Click to upload screenshot, receipt, or attendance sheet proof
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Supports PNG, JPG, WEBP, or PDF</p>
              </div>
            ) : (
              <div className="p-3 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {proofPreview ? (
                    <img
                      src={proofPreview}
                      alt="Proof Preview"
                      className="h-12 w-12 object-cover rounded-xl border border-blue-200 shadow-2xs"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-blue-600">
                      <FileText className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {proofFile.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {(proofFile.size / 1024).toFixed(1)} KB &bull; Ready to submit
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={removeProof}
                  className="text-rose-600 hover:bg-rose-50 border-rose-200"
                >
                  <X className="h-4 w-4 mr-1" /> Remove
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={submittingTicket}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Submit Grievance
            </Button>
          </div>
        </form>
      </Modal>

      {/* Staff Resolve Grievance Modal */}
      <Modal
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        title={`Resolve Grievance ${activeTicket?.ticket_uid || ''}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Please enter an official resolution summary. This will be visible to the student and recorded in university audit records.
          </p>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Official Resolution Action & Notes *
            </label>
            <textarea
              rows={4}
              value={resolutionSummaryInput}
              onChange={(e) => setResolutionSummaryInput(e.target.value)}
              placeholder="e.g. Discrepancy investigated with Course Coordinator Prof. Sharma. Attendance records for 14th Feb updated to Present. Marks verified in ERP."
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white resize-none focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResolveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={resolvingTicket}
              onClick={handleConfirmResolve}
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              Confirm & Resolve
            </Button>
          </div>
        </div>
      </Modal>

      {/* Full Size Image Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-[#0a0c16]/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-midnight-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-violet-500/15 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-950">
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-md">
                {previewImage.title}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewImage.url}
                  download="grievance_proof.png"
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-midnight-800 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Download / Open Full Image"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-midnight-800 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="overflow-auto p-4 flex items-center justify-center max-h-[calc(90vh-70px)] bg-[#0a0c16]/30">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[75vh] w-auto object-contain rounded-xl shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
