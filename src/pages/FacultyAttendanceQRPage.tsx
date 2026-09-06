import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { attendanceService } from '../services/attendanceService';
import {
  AttendanceSession,
  AttendanceRecord,
  AttendanceStatus,
  Event,
} from '../types';
import QRCode from 'react-qr-code';
import { Badge } from '../components/Badge';
import { Card, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { Select, Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import {
  QrCode,
  RefreshCw,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  Plus,
  Download,
  ShieldCheck,
  MapPin,
  Maximize2,
  Minimize2,
  Trash2,
  History,
  Sparkles,
  Award,
  Calendar,
} from 'lucide-react';

export const FacultyAttendanceQRPage: React.FC = () => {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [attendees, setAttendees] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Token Rotation & Countdown
  const [tokenTimeLeft, setTokenTimeLeft] = useState<number>(30); // 30s rotation
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Event & Student Metadata
  const [events, setEvents] = useState<Event[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Modals
  const [isNewSessionOpen, setIsNewSessionOpen] = useState(false);
  const [isManualOverrideOpen, setIsManualOverrideOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // New Session Form
  const [newSessionForm, setNewSessionForm] = useState({
    event_id: '' as string | number,
    duration_minutes: 60,
    enable_geofence: false,
    latitude: 18.5204,
    longitude: 73.8567,
    location_radius: 100,
  });
  const [creatingSession, setCreatingSession] = useState(false);

  // Manual Override Form
  const [manualForm, setManualForm] = useState({
    student_id: '',
    status: 'present' as AttendanceStatus,
    reason: '',
  });
  const [overriding, setOverriding] = useState(false);

  const toast = useToast();

  // Load Sessions and Events
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const { supabase } = await import('../services/supabaseClient');
      const { data: stus } = await supabase.from('users').select('id, first_name, last_name, email').eq('role', 'STUDENT');
      if (stus) setStudents(stus);

      const [sessList, eventList] = await Promise.all([
        attendanceService.getActiveSessions(),
        attendanceService.getEventsForAttendance(),
      ]);

      setSessions(sessList);
      setEvents(eventList);

      if (eventList.length > 0 && !newSessionForm.event_id) {
        setNewSessionForm((prev) => ({ ...prev, event_id: eventList[0].id }));
      }

      if (sessList.length > 0) {
        const firstActive = sessList.find((s) => s.status === 'active') || sessList[0];
        setSelectedSessionId(firstActive.id);
      }
    } catch {
      toast.error('Failed to load event attendance data');
    } finally {
      setLoading(false);
    }
  }, [toast, newSessionForm.event_id]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Load Selected Session & Attendees
  const loadSelectedSession = useCallback(async () => {
    if (!selectedSessionId) return;
    try {
      const session = await attendanceService.getSessionById(selectedSessionId);
      setActiveSession(session);

      if (session) {
        const recs = await attendanceService.getSessionAttendees(session.id);
        setAttendees(recs);

        // Calculate session time left
        const exp = new Date(session.end_time || session.session_date).getTime();
        const now = new Date().getTime();
        setSessionTimeLeft(Math.max(0, Math.floor((exp - now) / 1000)));
      }
    } catch {
      // Ignore
    }
  }, [selectedSessionId]);

  useEffect(() => {
    loadSelectedSession();
  }, [selectedSessionId, loadSelectedSession]);

  // Listen for Cross-Tab / Real-time updates
  useEffect(() => {
    // Supabase Realtime Subscription for Live Attendance Roster
    const channel = supabase
      .channel('public:attendance_records')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_records' },
        (payload) => {
          // If the change belongs to the currently active session (or just reload anyway for safety)
          const newRecord = payload.new as any;
          if (activeSession && newRecord && newRecord.session_id === activeSession.id) {
             loadSelectedSession();
          } else if (payload.eventType === 'DELETE') {
             loadSelectedSession();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadSelectedSession]);

  // 30-Second Token Rotation Interval
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'active') return;

    const timer = setInterval(() => {
      setTokenTimeLeft((prev) => {
        if (prev <= 1) {
          // Trigger token rotation
          attendanceService.rotateSessionToken(activeSession.id).then((res) => {
            setActiveSession((s) =>
              s
                ? {
                    ...s,
                    topic_covered: res.token,
                    current_token_hash: res.token,
                    token_version: res.token_version,
                  }
                : null
            );
          });
          return 30; // reset 30s
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSession]);

  // Session Time Left Countdown
  useEffect(() => {
    if (sessionTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setSessionTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionTimeLeft]);

  // Start New Event Session
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionForm.event_id) {
      toast.error('Select an Event or Masterclass first');
      return;
    }
    setCreatingSession(true);
    try {
      const created = await attendanceService.createEventSession({
        event_id: newSessionForm.event_id,
        duration_minutes: Number(newSessionForm.duration_minutes),
        latitude: newSessionForm.enable_geofence ? newSessionForm.latitude : undefined,
        longitude: newSessionForm.enable_geofence ? newSessionForm.longitude : undefined,
        location_radius: newSessionForm.enable_geofence ? newSessionForm.location_radius : undefined,
      });

      toast.success('Live Check-In Projector Active', `${created.event?.title || 'Event'} attendance is live.`);
      setIsNewSessionOpen(false);
      await fetchInitialData();
      setSelectedSessionId(created.id);
    } catch (err: any) {
      toast.error('Failed to create session', err.message);
    } finally {
      setCreatingSession(false);
    }
  };

  // Manual Token Refresh
  const handleManualRotate = async () => {
    if (!activeSession) return;
    try {
      const res = await attendanceService.rotateSessionToken(activeSession.id);
      setActiveSession((prev) =>
        prev
          ? {
              ...prev,
              topic_covered: res.token,
              current_token_hash: res.token,
              token_version: res.token_version,
            }
          : null
      );
      setTokenTimeLeft(30);
      toast.success('QR Code Rotated', `Generated token: ${res.token}`);
    } catch (err: any) {
      toast.error('Failed to rotate token', err.message);
    }
  };

  // Close Session
  const handleCloseSession = async () => {
    if (!activeSession) return;
    try {
      const closed = await attendanceService.closeSession(activeSession.id);
      setActiveSession(closed);
      toast.success('Session Closed', 'No further event check-ins will be accepted.');
      fetchInitialData();
    } catch (err: any) {
      toast.error('Failed to close session', err.message);
    }
  };

  // Manual Student Attendance Override
  const handleManualOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    setOverriding(true);
    try {
      await attendanceService.manualOverrideAttendance({
        sessionId: activeSession.id,
        studentId: String(manualForm.student_id),
        status: manualForm.status,
        reason: manualForm.reason,
        eventId: activeSession.event_id,
      });
      toast.success('Attendee Verified', 'Manual check-in recorded successfully.');
      setIsManualOverrideOpen(false);
      setManualForm({ student_id: '', status: 'present', reason: '' });
      loadSelectedSession();
    } catch (err: any) {
      toast.error('Check-in failed', err.message);
    } finally {
      setOverriding(false);
    }
  };

  const [recordToDelete, setRecordToDelete] = useState<number | string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Trigger Delete Prompt
  const handleDeleteRecordPrompt = (recordId: number | string) => {
    setRecordToDelete(recordId);
    setDeleteReason('');
  };

  // Execute Delete
  const confirmDeleteRecord = async () => {
    if (!recordToDelete || !deleteReason.trim()) {
      toast.warning('Please provide a reason for removal.');
      return;
    }

    setIsDeleting(true);
    try {
      await attendanceService.deleteAttendanceRecord(recordToDelete, deleteReason);
      toast.success('Record Removed', 'Attendee check-in invalidated.');
      loadSelectedSession();
      setRecordToDelete(null);
    } catch (err: any) {
      toast.error('Failed to remove record', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!activeSession) return;
    const csvContent = attendanceService.exportAttendanceCSV(
      attendees,
      activeSession.event?.title || 'Event Check-In Report'
    );
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `event_checkin_${activeSession.event_id || 'session'}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // View Audit Logs
  const handleViewAuditLogs = async () => {
    if (!activeSession) return;
    const logs = await attendanceService.getAttendanceAuditLogs(activeSession.id);
    setAuditLogs(logs);
    setIsAuditModalOpen(true);
  };

  const sessionMinutes = Math.floor(sessionTimeLeft / 60);
  const sessionSeconds = sessionTimeLeft % 60;
  const isSessionActive = activeSession?.status === 'active' || (activeSession && !activeSession.end_time);
  const currentToken = activeSession?.topic_covered || activeSession?.current_token_hash || 'EVT-CHECKIN';
  const eventData = activeSession?.event;
  const maxCap = eventData?.max_participants || 100;
  const checkinRate = Math.min(100, Math.round((attendees.length / maxCap) * 100));

  return (
    <div className={`space-y-6 pb-12 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0a0c16] p-6 overflow-y-auto' : ''}`}>
      <PageHeader
        title="Event & Masterclass Check-In Projector"
        subtitle="Dynamic anti-proxy QR projector for campus keynotes, workshops, and verified activity point (XP) awards"
        badge={
          <Badge variant={isSessionActive ? 'success' : 'neutral'} size="sm" dot>
            {isSessionActive ? 'Live Check-In Active' : 'Projector Standby'}
          </Badge>
        }
        action={
          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => setIsNewSessionOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Launch Event Session
            </Button>
          </div>
        }
      />

      {/* Session Controls Bar */}
      <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <Select
            label="Active Event Check-In Session"
            value={selectedSessionId || ''}
            onChange={(e) => setSelectedSessionId(Number(e.target.value))}
            options={sessions.map((s) => ({
              value: s.id,
              label: `${s.event?.title || 'Campus Event'} — ${s.topic_covered || 'Active'} (${(s.status || 'ACTIVE').toUpperCase()})`,
            }))}
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-end flex-wrap">
          {isSessionActive && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleManualRotate}
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              >
                Rotate Token ({tokenTimeLeft}s)
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleCloseSession}
                leftIcon={<Square className="h-3.5 w-3.5" />}
              >
                Close Check-In
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="h-3.5 w-3.5" />}
          >
            Export Roster
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewAuditLogs}
            leftIcon={<History className="h-3.5 w-3.5" />}
          >
            Audit Log
          </Button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl border border-slate-200/80 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            title="Toggle Projector Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </Card>

      {/* Main Grid: Holographic QR Screen & Live Attendee Telemetry */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 7 Cols: High-Contrast Dynamic QR Projector */}
        <Card className="lg:col-span-7 flex flex-col items-center justify-center p-8 sm:p-12 text-center space-y-6 relative overflow-hidden">
          {/* Ambient Lighting Accents */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-600/20 blur-3xl" />

          {/* Session Header Information */}
          {activeSession ? (
            <div className="space-y-2 relative z-10">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Badge variant="primary" size="md">
                  <Calendar className="h-3.5 w-3.5 mr-1 inline" />
                  {eventData?.category || 'EVENT / MASTERCLASS'}
                </Badge>
                {eventData?.points_reward && (
                  <Badge variant="gradient" size="sm">
                    <Sparkles className="h-3 w-3 mr-1 inline" />
                    +{eventData.points_reward} XP Points
                  </Badge>
                )}
                {activeSession.location_radius && (
                  <Badge variant="secondary" size="sm">
                    <MapPin className="h-3 w-3 mr-1 inline" />
                    Venue Radius: ±{activeSession.location_radius}m
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {eventData?.title || 'Campus Masterclass & Keynote'}
              </h2>
              <p className="text-xs text-slate-500">
                Venue: {eventData?.venue || 'Main University Auditorium'} &bull; Organizer: {typeof eventData?.organizer === 'object' && eventData?.organizer ? `${eventData.organizer.first_name} ${eventData.organizer.last_name}` : (String(eventData?.organizer || 'CampusSphere Council'))}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Select or launch an Event Check-In session</p>
          )}

          {/* High-Contrast Dynamic QR Container */}
          <div className="relative p-6 sm:p-8 rounded-3xl bg-white shadow-2xl border-4 border-blue-500/20 dark:border-white/10 dark:shadow-glow-md">
            {/* Viewfinder Target Brackets */}
            <div className="absolute top-2.5 left-2.5 h-5 w-5 border-t-4 border-l-4 border-blue-500 rounded-tl-md" />
            <div className="absolute top-2.5 right-2.5 h-5 w-5 border-t-4 border-r-4 border-blue-500 rounded-tr-md" />
            <div className="absolute bottom-2.5 left-2.5 h-5 w-5 border-b-4 border-l-4 border-blue-500 rounded-bl-md" />
            <div className="absolute bottom-2.5 right-2.5 h-5 w-5 border-b-4 border-r-4 border-blue-500 rounded-br-md" />

            {currentToken && isSessionActive ? (
              <QRCode
                value={currentToken}
                size={240}
              />
            ) : (
              <div className="h-[240px] w-[240px] flex flex-col items-center justify-center text-slate-400 space-y-2">
                <QrCode className="h-16 w-16" />
                <span className="text-xs font-bold text-slate-500">Session Closed / Inactive</span>
              </div>
            )}
          </div>

          {/* Dynamic Token Details & Live Rotation Countdown */}
          {activeSession && isSessionActive && (
            <div className="w-full max-w-md space-y-3 relative z-10">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-midnight-800/80 border border-slate-200/90 dark:border-white/10 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    Manual 6-Digit Code:
                  </span>
                  <span className="font-mono font-black text-base text-blue-600 dark:text-blue-400 select-all tracking-wider">
                    {currentToken}
                  </span>
                </div>
                <Badge variant="neutral" size="sm">
                  30s Anti-Proxy
                </Badge>
              </div>

              {/* Progress & Countdowns */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-midnight-800/50 border border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                  <span className="text-slate-500">Token Rotates:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {tokenTimeLeft}s
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-midnight-800/50 border border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                  <span className="text-slate-500">Projector Ends:</span>
                  <span className={`font-mono font-bold ${sessionTimeLeft <= 60 ? 'text-rose-500 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
                    {String(sessionMinutes).padStart(2, '0')}:{String(sessionSeconds).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Right 5 Cols: Live Attendee Roster & Manual Overrides */}
        <Card className="lg:col-span-5 flex flex-col h-[600px]">
          <CardHeader
            title="Live Attendee Telemetry"
            subtitle={`${attendees.length} / ${maxCap} Attendees Checked In (${checkinRate}%)`}
            action={
              <div className="flex items-center gap-2">
                <Badge variant="success" size="sm" dot>
                  {checkinRate}%
                </Badge>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsManualOverrideOpen(true)}
                >
                  Manual Add
                </Button>
              </div>
            }
          />

          {/* Attendees List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {attendees.length === 0 ? (
              <EmptyState
                title="Awaiting Attendee Scans"
                description="Live attendee check-ins with anti-proxy verification and verified activity points will appear here in real time."
              />
            ) : (
              attendees.map((rec: any) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 dark:bg-midnight-800/50 border border-slate-200/70 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {rec.student?.first_name} {rec.student?.last_name || 'Attendee'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {rec.student?.email || 'Student Attendee'}
                    </p>
                    {rec.remarks && (
                      <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono">
                        {rec.remarks}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <Badge variant="success" size="sm">
                        VERIFIED
                      </Badge>
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        {rec.created_at ? new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Now'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteRecordPrompt(rec.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Remove Attendance Record"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Start New Event Session Modal */}
      <Modal
        isOpen={isNewSessionOpen}
        onClose={() => setIsNewSessionOpen(false)}
        title="Launch Event Check-In Session"
        description="Select an event or masterclass to start a live rotating anti-proxy QR projector."
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <Select
            label="Event / Masterclass"
            required
            value={newSessionForm.event_id}
            onChange={(e) => setNewSessionForm({ ...newSessionForm, event_id: e.target.value })}
            options={events.map((ev) => ({
              value: ev.id,
              label: `${ev.title} (${ev.category || 'Event'} — ${new Date(ev.start_date).toLocaleDateString()})`,
            }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Select
              label="Check-In Window Duration"
              value={newSessionForm.duration_minutes}
              onChange={(e) => setNewSessionForm({ ...newSessionForm, duration_minutes: Number(e.target.value) })}
              options={[
                { value: 15, label: '15 Minutes (Quick Entry)' },
                { value: 30, label: '30 Minutes' },
                { value: 60, label: '60 Minutes (Standard)' },
                { value: 120, label: '2 Hours (Workshops)' },
                { value: 240, label: '4 Hours (Half Day Keynote)' },
              ]}
            />
            <Input
              label="Location Radius (Meters)"
              type="number"
              value={newSessionForm.location_radius}
              onChange={(e) => setNewSessionForm({ ...newSessionForm, location_radius: Number(e.target.value) })}
            />
          </div>

          {/* GPS Geofencing Option */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-midnight-800/60 border border-slate-200/80 dark:border-white/5 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-900 dark:text-white">
              <input
                type="checkbox"
                checked={newSessionForm.enable_geofence}
                onChange={(e) => setNewSessionForm({ ...newSessionForm, enable_geofence: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Enforce Venue GPS Geofence Perimeter</span>
            </label>

            {newSessionForm.enable_geofence && (
              <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                <Input
                  label="Auditorium Latitude"
                  type="number"
                  step="any"
                  value={newSessionForm.latitude}
                  onChange={(e) => setNewSessionForm({ ...newSessionForm, latitude: Number(e.target.value) })}
                />
                <Input
                  label="Auditorium Longitude"
                  type="number"
                  step="any"
                  value={newSessionForm.longitude}
                  onChange={(e) => setNewSessionForm({ ...newSessionForm, longitude: Number(e.target.value) })}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewSessionOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={creatingSession} leftIcon={<Play className="h-4 w-4" />}>
              Launch Projector
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manual Override Modal */}
      <Modal
        isOpen={isManualOverrideOpen}
        onClose={() => setIsManualOverrideOpen(false)}
        title="Manual Attendee Check-In"
        description="Manually verify an attendee's presence if mobile scanning was unavailable."
      >
        <form onSubmit={handleManualOverride} className="space-y-4">
          <Select
            label="Select Registered Attendee / Student"
            value={manualForm.student_id}
            onChange={(e) => setManualForm({ ...manualForm, student_id: e.target.value })}
            options={students.map((s) => ({
              value: s.id,
              label: `${s.first_name} ${s.last_name} (${s.email})`,
            }))}
          />

          <Input
            label="Mandatory Audit Reason"
            required
            placeholder="e.g. Phone battery drained, attendee physically present at seat A-12"
            value={manualForm.reason}
            onChange={(e) => setManualForm({ ...manualForm, reason: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsManualOverrideOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={overriding} leftIcon={<ShieldCheck className="h-4 w-4" />}>
              Confirm Check-In
            </Button>
          </div>
        </form>
      </Modal>

      {/* Audit Trail Modal */}
      <Modal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        title="Event Check-In Audit Trail"
        description="Immutable cryptographic log of all event check-ins, rotations, and manual organizer overrides."
      >
        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {auditLogs.length === 0 ? (
            <EmptyState title="No Audit Logs" description="Audit events will appear here as attendance is recorded." />
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-midnight-800/60 border border-slate-200/80 dark:border-white/5 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white uppercase font-mono text-[10px]">
                    {log.action.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  {log.reason}
                </p>
                {log.actor && (
                  <p className="text-[10px] text-slate-400">
                    Actor: {log.actor.first_name} {log.actor.last_name} ({log.actor.role})
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </Modal>
      {/* Delete Record Modal */}
      {recordToDelete && (
        <Modal
          isOpen={Boolean(recordToDelete)}
          onClose={() => setRecordToDelete(null)}
          title="Remove Attendee Record"
          description="Please provide an administrative reason for removing this check-in record."
          size="sm"
        >
          <div className="space-y-4">
            <Input
              label="Reason for Removal"
              required
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="e.g. Identity mismatch / Left early"
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <Button variant="outline" size="sm" onClick={() => setRecordToDelete(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={confirmDeleteRecord} isLoading={isDeleting}>
                Confirm Removal
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
