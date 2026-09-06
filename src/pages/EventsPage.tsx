import React, { useEffect, useState, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { eventService } from '../services/eventService';
import { studentService } from '../services/studentService';
import { Event, EventCategory, StudentProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { DynamicEventRegistrationModal } from '../components/DynamicEventRegistrationModal';
import { EventParticipantsModal } from '../components/EventParticipantsModal';
import { QRCameraScanner } from '../components/QRCameraScanner';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { Modal } from '../components/Modal';
import { Input, Select, Textarea } from '../components/Input';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import QRCode from 'react-qr-code';
import confetti from 'canvas-confetti';
import {
  Calendar,
  MapPin,
  Users,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Sparkles,
  Award,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Trash2,
  Upload,
  Image as ImageIcon,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Download,
  ExternalLink,
  X,
  Share2,
  Camera,
  Layers,
  Activity,
  BarChart3,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Technical Workshop',
  'Hackathon',
  'Guest Lecture',
  'Seminar',
  'Competition',
  'Sports Competition',
  'Cultural Event',
  'Academic',
  'Industrial Visit',
];

export const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

  // Modals & Popups
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<Event | null>(null);
  const [selectedEventForRegistration, setSelectedEventForRegistration] = useState<Event | null>(null);
  const [selectedEventForRoster, setSelectedEventForRoster] = useState<Event | null>(null);
  const [selectedEventForQR, setSelectedEventForQR] = useState<Event | null>(null);
  const [selectedEventForCheckIn, setSelectedEventForCheckIn] = useState<Event | null>(null);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [targetEventForScanner, setTargetEventForScanner] = useState<Event | null>(null);

  const [checkInCodeInput, setCheckInCodeInput] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isProjectorMode, setIsProjectorMode] = useState(false);

  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormStep, setCreateFormStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Poster / Banner upload state
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  const canManageEvents =
    ['ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR', 'HOD', 'FACULTY', 'COORDINATOR'].includes(user?.role || '') ||
    Boolean(user?.permissions?.includes('events.manage')) ||
    Boolean(user?.permissions?.includes('events.edit'));

  // Create Form State
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    category: 'Technical Workshop' as EventCategory,
    venue: '',
    start_date: '',
    end_date: '',
    registration_deadline: '',
    max_participants: 100,
    contact_person: user?.first_name ? `${user.first_name} ${user.last_name}` : 'Event Coordinator',
    contact_email: user?.email || '',
    points_reward: 50,
    eligibility: 'Open to all students',
    rules: '',
  });

  const fetchEvents = async () => {
    try {
      const params: any = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;

      const [evRes, profRes] = await Promise.all([
        eventService.getEvents(params),
        user?.role === 'STUDENT' ? studentService.getMyProfile() : Promise.resolve(null),
      ]);

      setEvents(evRes);
      if (profRes) setStudentProfile(profRes);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchEvents();
  }, [selectedCategory, searchQuery]);

  // Real-time synchronization for instant card counter and roster updates
  useEffect(() => {
    let channel: any;
    if (isSupabaseConfigured) {
      try {
        channel = supabase
          .channel('public_event_registrations_realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'event_registrations' },
            () => {
              fetchEvents();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'events' },
            () => {
              fetchEvents();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Realtime subscription note:', err);
      }
    }

    const handleSync = () => {
      fetchEvents();
    };

    window.addEventListener('campus:event_registered', handleSync);
    window.addEventListener('campus:event_unregistered', handleSync);
    window.addEventListener('campus:attendance_updated', handleSync);
    window.addEventListener('campus:event_deleted', handleSync);

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('campus_events_sync');
        bc.onmessage = () => {
          fetchEvents();
        };
      } catch {
        // Ignore BroadcastChannel errors
      }
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
      window.removeEventListener('campus:event_registered', handleSync);
      window.removeEventListener('campus:event_unregistered', handleSync);
      window.removeEventListener('campus:attendance_updated', handleSync);
      window.removeEventListener('campus:event_deleted', handleSync);
      if (bc) bc.close();
    };
  }, []);

  // Handle URL Query Params for Quick Check-In (e.g. ?checkin=EVT-123456)
  useEffect(() => {
    if (events.length === 0) return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const checkinParam = urlParams.get('checkin') || urlParams.get('code');
      if (checkinParam) {
        const cleanParam = checkinParam.trim().toUpperCase();
        const matched = events.find(
          (e) =>
            e.attendance_code?.toUpperCase() === cleanParam ||
            String(e.id).toUpperCase() === cleanParam
        );
        if (matched) {
          setSelectedEventForCheckIn(matched);
          setCheckInCodeInput(matched.attendance_code || cleanParam);
        }
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, [events]);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Event poster image must be under 5MB.');
      return;
    }

    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setBannerPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
    if (bannerInputRef.current) {
      bannerInputRef.current.value = '';
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await eventService.createEvent({
        ...createForm,
        banner_file: bannerFile,
      });

      confetti({ particleCount: 70, spread: 60 });
      toast.success('Event Published Successfully! 🎉', `Attendance Code: ${created.attendance_code}`);
      setIsCreateModalOpen(false);
      removeBanner();
      setCreateFormStep(1);
      setCreateForm({
        title: '',
        description: '',
        category: 'Technical Workshop',
        venue: '',
        start_date: '',
        end_date: '',
        registration_deadline: '',
        max_participants: 100,
        contact_person: user?.first_name ? `${user.first_name} ${user.last_name}` : 'Event Coordinator',
        contact_email: user?.email || '',
        points_reward: 50,
        eligibility: 'Open to all students',
        rules: '',
      });
      fetchEvents();
    } catch (err: any) {
      console.error('Create event error:', err);
      toast.error('Creation Failed', err?.message || 'Could not publish new event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRegistration = async (eventId: number | string) => {
    try {
      await eventService.cancelRegistration(eventId);
      toast.success('Registration Cancelled', 'You have been unenrolled.');
      fetchEvents();
      if (selectedEventForDetails && selectedEventForDetails.id === eventId) {
        setSelectedEventForDetails(null);
      }
    } catch {
      toast.error('Failed to cancel registration');
    }
  };

  const handleStudentCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventForCheckIn || !checkInCodeInput.trim()) return;

    setIsCheckingIn(true);
    try {
      const res = await eventService.markAttendanceByCode(
        selectedEventForCheckIn.id,
        checkInCodeInput.trim()
      );

      confetti({ particleCount: 80, spread: 70 });
      toast.success('Attendance Confirmed! 🎉', res.message);
      setSelectedEventForCheckIn(null);
      setCheckInCodeInput('');
      fetchEvents();
    } catch (err: any) {
      toast.error('Check-In Failed', err.message || 'Invalid code or already checked in.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCameraScanSuccess = async (payload: { token: string; latitude?: number; longitude?: number }) => {
    setIsCameraScannerOpen(false);
    try {
      let code = payload.token.trim();
      let evtId = targetEventForScanner?.id;

      if (code.startsWith('CAMPUS_EVENT:')) {
        const parts = code.split(':');
        if (parts.length >= 3) {
          evtId = parts[1];
          code = parts[2];
        } else if (parts.length === 2) {
          code = parts[1];
        }
      }

      if (!evtId && events.length > 0) {
        const matched = events.find(
          (e) => e.attendance_code?.toUpperCase() === code.toUpperCase()
        );
        if (matched) evtId = matched.id;
      }

      if (!evtId) {
        toast.error('Could not identify matching event for scanned QR code.');
        return;
      }

      const res = await eventService.markAttendanceByCode(evtId, code);
      confetti({ particleCount: 90, spread: 80 });
      toast.success('Attendance Verified via Camera! 🎉', res.message);
      fetchEvents();
    } catch (err: any) {
      toast.error('Camera Check-In Failed', err?.message || 'Invalid QR code.');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success('Attendance Code Copied to Clipboard!');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyShareLink = (ev: Event) => {
    const url = `${window.location.origin}/events?checkin=${ev.attendance_code || ev.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success('Direct Check-In Link Copied! 🔗', 'Share with students for 1-click check-in.');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareEvent = async (ev: Event) => {
    const url = `${window.location.origin}/events?checkin=${ev.attendance_code || ev.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: ev.title,
          text: `Join "${ev.title}"! Attendance Code: ${ev.attendance_code}`,
          url,
        });
        toast.success('Shared successfully!');
      } catch {
        // Dismissed
      }
    } else {
      handleCopyShareLink(ev);
    }
  };

  const handleDownloadQR = (eventTitle: string) => {
    const svg = document.getElementById('campus-event-qr-svg') as unknown as SVGSVGElement | null;
    if (!svg) {
      toast.error('QR code element not found.');
      return;
    }

    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width + 80;
        canvas.height = img.height + 80;
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 40, 40);
          const pngFile = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = `${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_QRCode.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
          toast.success('QR Code Downloaded as PNG! 📥');
        }
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch {
      toast.error('Could not export QR Code image.');
    }
  };

  // Top Metrics Calculation
  const totalEvents = events.length;
  const totalEnrolled = events.reduce((sum, e) => sum + (e.registered_count || 0), 0);
  const totalCheckedIn = events.reduce((sum, e) => sum + (e.checked_in_count || 0), 0);
  const totalPointsPool = events.reduce((sum, e) => sum + (e.points_reward || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Campus Events & Masterclasses"
        subtitle="Discover technical hackathons, guest lectures, and workshops. Complete registration to participate and log verified activity points."
        action={
          <div className="flex items-center gap-2">
            {user?.role === 'STUDENT' && (
              <Button
                variant="secondary"
                onClick={() => {
                  setTargetEventForScanner(null);
                  setIsCameraScannerOpen(true);
                }}
                leftIcon={<Camera className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
              >
                Scan Attendance
              </Button>
            )}
            {canManageEvents && (
              <Button onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
                Publish Event
              </Button>
            )}
          </div>
        }
      />

      {/* Top Analytics Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-midnight-900/80 backdrop-blur-xl shadow-2xs flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Active Events
            </span>
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {totalEvents}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-midnight-900/80 backdrop-blur-xl shadow-2xs flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Total Enrolled
            </span>
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {totalEnrolled}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-midnight-900/80 backdrop-blur-xl shadow-2xs flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Verified Present
            </span>
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {totalCheckedIn}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-midnight-900/80 backdrop-blur-xl shadow-2xs flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Activity Points
            </span>
            <span className="text-xl font-bold font-mono text-amber-500">
              +{totalPointsPool} pts
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar: Categories & Search */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, topic, or venue..."
              className="w-full pl-9 pr-4 py-2 rounded-2xl text-xs sm:text-sm border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-midnight-900/80 text-slate-900 dark:text-white backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-glow-sm'
                    : 'bg-white/80 dark:bg-midnight-900/80 border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Event Cards Grid */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : events.length === 0 ? (
        <EmptyState
          title="No Campus Events Found"
          description="Try broadening your category filter or search query to find upcoming activities."
          actionText={canManageEvents ? 'Create New Event' : undefined}
          onAction={canManageEvents ? () => setIsCreateModalOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((ev) => {
            const isFull = ev.registered_count >= ev.max_participants;
            const hasBanner = Boolean(ev.banner_url || ev.banner);

            return (
              <div
                key={ev.id}
                className="group flex flex-col justify-between rounded-3xl border border-slate-200/90 dark:border-white/10 backdrop-blur-xl bg-white/85 dark:bg-midnight-900/85 overflow-hidden shadow-2xs hover:-translate-y-1 hover:shadow-md transition-all duration-200"
              >
                {/* Event Banner Image or Aesthetic Header */}
                <div className="relative h-44 w-full bg-slate-100 dark:bg-midnight-950 overflow-hidden">
                  {hasBanner ? (
                    <img
                      src={ev.banner_url || ev.banner}
                      alt={ev.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600/80 via-indigo-600/70 to-purple-700/80 flex flex-col items-center justify-center text-white p-4 text-center">
                      <Sparkles className="h-8 w-8 text-blue-200 mb-1" />
                      <span className="text-xs font-mono font-bold tracking-widest uppercase opacity-80">
                        {ev.category}
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                  {/* Badges on Banner */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <Badge variant="primary" size="sm" className="backdrop-blur-md shadow-xs">
                      {ev.category}
                    </Badge>
                    <span className="inline-flex items-center gap-1 text-xs font-bold font-mono px-2 py-0.5 rounded-lg bg-emerald-500 text-white shadow-xs">
                      <Sparkles className="h-3 w-3" />
                      +{ev.points_reward} pts
                    </span>
                  </div>

                  {/* Attendance Code Tag on Banner */}
                  {ev.attendance_code && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-[11px] font-mono font-bold border border-white/20">
                      <QrCode className="h-3 w-3 text-blue-400" />
                      <span>Code: {ev.attendance_code}</span>
                    </div>
                  )}
                </div>

                {/* Card Content Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {ev.description}
                    </p>

                    {/* Venue & Dates */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 truncate">
                        <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span>
                          {new Date(ev.start_date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{ev.venue}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                          <span>
                            {ev.registered_count} / {ev.max_participants} Registered
                          </span>
                        </span>

                        {ev.checked_in_count !== undefined && ev.checked_in_count > 0 && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> {ev.checked_in_count} Checked In
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedEventForDetails(ev)}
                      >
                        Details
                      </Button>
                      <button
                        type="button"
                        onClick={() => handleShareEvent(ev)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-midnight-800 transition-colors"
                        title="Share Event & Link"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Admin / Faculty Actions */}
                      {canManageEvents && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectedEventForQR(ev)}
                            leftIcon={<QrCode className="h-3.5 w-3.5 text-blue-600" />}
                            title="Open Scannable QR Code & Attendance Desk"
                          >
                            QR Code
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedEventForRoster(ev)}
                            leftIcon={<UserCheck className="h-3.5 w-3.5" />}
                          >
                            Roster
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2"
                            title="Delete Event"
                            onClick={() => setEventToDelete(ev)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}

                      {/* Student Registration & Check-In Actions */}
                      {user?.role === 'STUDENT' && (
                        ev.is_checked_in ? (
                          <Badge variant="success" size="md">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Attended (+{ev.points_reward} pts)
                          </Badge>
                        ) : ev.is_registered ? (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                setTargetEventForScanner(ev);
                                setIsCameraScannerOpen(true);
                              }}
                              leftIcon={<Camera className="h-3.5 w-3.5" />}
                              title="Scan QR Code with Camera"
                            >
                              Scan
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setSelectedEventForCheckIn(ev)}
                              leftIcon={<QrCode className="h-3.5 w-3.5" />}
                              title="Enter Attendance Code"
                            >
                              Code
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-slate-400 text-xs hover:text-rose-500 px-2"
                              onClick={() => handleCancelRegistration(ev.id)}
                            >
                              Unenroll
                            </Button>
                          </div>
                        ) : isFull ? (
                          <Badge variant="danger" size="md">
                            Full
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => setSelectedEventForRegistration(ev)}
                          >
                            Register
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dynamic Registration Modal */}
      <DynamicEventRegistrationModal
        event={selectedEventForRegistration}
        studentProfile={studentProfile}
        isOpen={Boolean(selectedEventForRegistration)}
        onClose={() => setSelectedEventForRegistration(null)}
        onSuccess={() => {
          fetchEvents();
        }}
      />

      {/* Coordinator Participant Roster Modal */}
      <EventParticipantsModal
        event={selectedEventForRoster}
        isOpen={Boolean(selectedEventForRoster)}
        onClose={() => {
          setSelectedEventForRoster(null);
          fetchEvents();
        }}
      />

      {/* Admin Event Attendance QR Code & Check-in Desk Modal */}
      {selectedEventForQR && (() => {
        const checkedCount = selectedEventForQR.checked_in_count || 0;
        const regCount = selectedEventForQR.registered_count || 0;
        const percent = regCount > 0 ? Math.min(100, Math.round((checkedCount / regCount) * 100)) : 0;
        const qrPayload =
          selectedEventForQR.qr_code ||
          `CAMPUS_EVENT:${selectedEventForQR.id}:${selectedEventForQR.attendance_code}`;

        return (
          <Modal
            isOpen={Boolean(selectedEventForQR)}
            onClose={() => {
              setSelectedEventForQR(null);
              setIsProjectorMode(false);
            }}
            title={isProjectorMode ? '' : `Event Attendance QR Code & Check-In Desk`}
            size={isProjectorMode ? 'xl' : 'md'}
          >
            <div
              className={`space-y-4 text-center ${
                isProjectorMode ? 'p-6 bg-[#0a0c16] border border-violet-500/25 text-white rounded-3xl min-h-[520px] flex flex-col justify-center shadow-2xl shadow-violet-500/10' : ''
              }`}
            >
              <div>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                  {selectedEventForQR.category}
                </span>
                <h3
                  className={`font-bold mt-2 ${
                    isProjectorMode ? 'text-2xl sm:text-3xl text-white' : 'text-lg text-slate-900 dark:text-white'
                  }`}
                >
                  {selectedEventForQR.title}
                </h3>
                <p className={`text-xs mt-1 ${isProjectorMode ? 'text-slate-300' : 'text-slate-500'}`}>
                  {selectedEventForQR.venue} &bull; {new Date(selectedEventForQR.start_date).toLocaleDateString()}
                </p>
              </div>

              {/* QR Code Container with High Contrast & Export ID */}
              <div className="flex flex-col items-center justify-center p-3">
                <div className="p-4 bg-white rounded-3xl shadow-xl border border-slate-200 inline-block transition-transform hover:scale-102">
                  <QRCode
                    id="campus-event-qr-svg"
                    value={qrPayload}
                    size={isProjectorMode ? 280 : 210}
                    level="H"
                  />
                </div>
                <p
                  className={`text-xs font-semibold mt-2.5 ${
                    isProjectorMode ? 'text-slate-200' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Students can scan this QR code with their camera to instantly record verified attendance.
                </p>
              </div>

              {/* 6-Character Attendance Code Display Box */}
              <div
                className={`p-4 rounded-2xl border ${
                  isProjectorMode
                    ? 'bg-[#111425] border-violet-500/20 text-white'
                    : 'bg-slate-50 dark:bg-midnight-900/60 border-slate-200 dark:border-white/5'
                }`}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Manual 6-Character Attendance Code
                </span>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl sm:text-3xl font-mono font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400">
                    {selectedEventForQR.attendance_code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(selectedEventForQR.attendance_code || '')}
                    className="p-2 rounded-xl bg-white dark:bg-midnight-800 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors shadow-2xs"
                    title="Copy Attendance Code"
                  >
                    {copiedCode ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Announce this code or display it on screen for students entering manually.
                </p>
              </div>

              {/* Quick Share & Export Actions */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDownloadQR(selectedEventForQR.title)}
                  leftIcon={<Download className="h-3.5 w-3.5" />}
                >
                  Download PNG
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyShareLink(selectedEventForQR)}
                  leftIcon={copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <ExternalLink className="h-3.5 w-3.5" />}
                >
                  {copiedLink ? 'Link Copied!' : 'Copy Check-In Link'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShareEvent(selectedEventForQR)}
                  leftIcon={<Share2 className="h-3.5 w-3.5" />}
                >
                  Share
                </Button>
              </div>

              {/* Live Attendance Progress & Meter */}
              <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-midnight-900/60 border border-slate-200/80 dark:border-white/5 space-y-2 text-left">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className={isProjectorMode ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}>
                    Live Verified Attendance:
                  </span>
                  <span className="text-emerald-500 font-bold font-mono">
                    {checkedCount} / {regCount} Checked In ({percent}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Modal Bottom Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/10">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsProjectorMode(!isProjectorMode)}
                  leftIcon={isProjectorMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                >
                  {isProjectorMode ? 'Exit Projector' : 'Auditorium Projector View'}
                </Button>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setSelectedEventForQR(null);
                    setIsProjectorMode(false);
                  }}
                >
                  Done
                </Button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Student Check-In Modal */}
      {selectedEventForCheckIn && (
        <Modal
          isOpen={Boolean(selectedEventForCheckIn)}
          onClose={() => setSelectedEventForCheckIn(null)}
          title={`Check In to ${selectedEventForCheckIn.title}`}
          size="sm"
        >
          <form onSubmit={handleStudentCheckIn} className="space-y-4">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
              <p className="font-semibold">
                Enter the 6-character attendance code announced by the organizer or displayed on the auditorium screen.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Attendance Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. EVT-491823"
                value={checkInCodeInput}
                onChange={(e) => setCheckInCodeInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-center font-mono font-bold text-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setSelectedEventForCheckIn(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={isCheckingIn}
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
              >
                Confirm Attendance
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Event Details Slide-over / Modal */}
      {selectedEventForDetails && (
        <Modal
          isOpen={Boolean(selectedEventForDetails)}
          onClose={() => setSelectedEventForDetails(null)}
          title={selectedEventForDetails.title}
          description={`${selectedEventForDetails.category} • Venue: ${selectedEventForDetails.venue}`}
          size="lg"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            {/* Banner in details modal if available */}
            {(selectedEventForDetails.banner_url || selectedEventForDetails.banner) && (
              <div className="rounded-2xl overflow-hidden h-48 w-full">
                <img
                  src={selectedEventForDetails.banner_url || selectedEventForDetails.banner}
                  alt={selectedEventForDetails.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-midnight-900/80 border border-slate-200/80 dark:border-white/5">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Points Reward</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                  +{selectedEventForDetails.points_reward} CampusPoints
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Enrollment Capacity</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedEventForDetails.registered_count} / {selectedEventForDetails.max_participants} Registered
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white">Overview</h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedEventForDetails.description}
              </p>
            </div>

            {selectedEventForDetails.eligibility && (
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white">Eligibility Criteria</h4>
                <p className="text-slate-600 dark:text-slate-300">
                  {selectedEventForDetails.eligibility}
                </p>
              </div>
            )}

            {selectedEventForDetails.rules && (
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white">Guidelines & Rules</h4>
                <p className="text-slate-600 dark:text-slate-300">
                  {selectedEventForDetails.rules}
                </p>
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-midnight-900/60 border border-slate-200/80 dark:border-white/5 space-y-1 text-xs">
              <p className="font-bold text-slate-900 dark:text-white">Contact & Organizing Faculty:</p>
              <p className="text-slate-500">
                {selectedEventForDetails.contact_person} &bull; {selectedEventForDetails.contact_email}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/5">
              <Button variant="outline" onClick={() => setSelectedEventForDetails(null)}>
                Close
              </Button>
              {user?.role === 'STUDENT' && !selectedEventForDetails.is_registered && (
                <Button
                  onClick={() => {
                    const ev = selectedEventForDetails;
                    setSelectedEventForDetails(null);
                    setSelectedEventForRegistration(ev);
                  }}
                >
                  Register Now
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Create Event Modal with Image Upload */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Publish Campus Event / Masterclass"
          description="Create a technical session, hackathon, or masterclass with poster and automated attendance tracking."
          size="lg"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {/* Step Indicators */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className={`h-1.5 flex-1 rounded-full ${
                  createFormStep >= 1 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
              <div
                className={`h-1.5 flex-1 rounded-full ${
                  createFormStep >= 2 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            </div>

            {createFormStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Step 1: Event Details & Poster</h3>

                {/* Poster / Banner Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Event Poster / Banner Image</span>
                    <span className="text-[11px] text-slate-400 font-normal">Max: 5MB (PNG, JPG, WEBP)</span>
                  </label>

                  <input
                    type="file"
                    ref={bannerInputRef}
                    onChange={handleBannerChange}
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                  />

                  {!bannerFile ? (
                    <div
                      onClick={() => bannerInputRef.current?.click()}
                      className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/20 transition-all text-center"
                    >
                      <Upload className="h-6 w-6 text-slate-400 mb-1" />
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Click to upload event banner or poster image
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Recommended 16:9 aspect ratio</p>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden border border-blue-200 dark:border-blue-900/40">
                      <img
                        src={bannerPreview || ''}
                        alt="Banner Preview"
                        className="h-36 w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-between p-3">
                        <span className="text-xs text-white font-bold truncate max-w-xs">
                          {bannerFile.name} ({(bannerFile.size / 1024).toFixed(1)} KB)
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={removeBanner}
                          className="text-rose-400 hover:bg-rose-500 hover:text-white border-rose-400/50"
                        >
                          <X className="h-3.5 w-3.5 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <Input
                  label="Event Title"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. National Masterclass: Cloud Systems Architecture 2026"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Category"
                    value={createForm.category}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, category: e.target.value as EventCategory })
                    }
                    options={CATEGORIES.filter((c) => c !== 'All').map((c) => ({ value: c, label: c }))}
                  />
                  <Input
                    label="Venue / Location"
                    required
                    value={createForm.venue}
                    onChange={(e) => setCreateForm({ ...createForm, venue: e.target.value })}
                    placeholder="e.g. Main Auditorium / Complex B"
                  />
                </div>

                <Textarea
                  label="Description"
                  required
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Detailed description of topics, masterclass syllabus, speaker bio, and agenda..."
                />

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/5">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (!createForm.title || !createForm.venue || !createForm.description) {
                        toast.warning('Please fill in all required fields in Step 1');
                        return;
                      }
                      setCreateFormStep(2);
                    }}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Next Step
                  </Button>
                </div>
              </div>
            )}

            {createFormStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Step 2: Logistics, Points & Attendance Tracking
                </h3>

                <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 text-xs text-blue-900 dark:text-blue-300">
                  <span className="font-bold block">✓ Automated QR Attendance Generation</span>
                  Upon publishing, a secure attendance QR code and 6-digit check-in code will be automatically generated and linked to this event.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Start Date & Time"
                    type="datetime-local"
                    required
                    value={createForm.start_date}
                    onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })}
                  />
                  <Input
                    label="End Date & Time"
                    type="datetime-local"
                    required
                    value={createForm.end_date}
                    onChange={(e) => setCreateForm({ ...createForm, end_date: e.target.value })}
                  />
                  <Input
                    label="Max Participants"
                    type="number"
                    min="1"
                    value={createForm.max_participants}
                    onChange={(e) => setCreateForm({ ...createForm, max_participants: Number(e.target.value) })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Contact Email"
                    type="email"
                    required
                    value={createForm.contact_email}
                    onChange={(e) => setCreateForm({ ...createForm, contact_email: e.target.value })}
                  />
                  <Input
                    label="Points Reward"
                    type="number"
                    min="0"
                    value={createForm.points_reward}
                    onChange={(e) => setCreateForm({ ...createForm, points_reward: Number(e.target.value) })}
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                  <Button type="button" variant="ghost" onClick={() => setCreateFormStep(1)}>
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={isSubmitting} leftIcon={<Plus className="h-4 w-4" />}>
                      Publish Event & Generate QR
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </Modal>
      )}

      {/* Delete Event Confirmation Modal */}
      {eventToDelete && (
        <Modal
          isOpen={Boolean(eventToDelete)}
          onClose={() => setEventToDelete(null)}
          title="Delete Event"
          description={`Are you sure you want to permanently delete "${eventToDelete.title}"? All registrations and attendance logs will also be removed.`}
          size="sm"
        >
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
            <Button variant="outline" size="sm" onClick={() => setEventToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-500"
              onClick={async () => {
                setIsDeleting(true);
                try {
                  await eventService.deleteEvent(eventToDelete.id);
                  toast.info('Event Deleted', `"${eventToDelete.title}" has been removed.`);
                  setEventToDelete(null);
                  fetchEvents();
                } catch {
                  toast.error('Failed to delete event');
                } finally {
                  setIsDeleting(false);
                }
              }}
            >
              Delete Event
            </Button>
          </div>
        </Modal>
      )}

      {/* Camera Attendance QR Scanner */}
      <QRCameraScanner
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={handleCameraScanSuccess}
      />
    </div>
  );
};
