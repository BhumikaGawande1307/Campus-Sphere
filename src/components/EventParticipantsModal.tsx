import React, { useEffect, useState } from 'react';
import { Event, EventRegistrationRecord } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { EmptyState } from './EmptyState';
import { LoadingSkeleton } from './LoadingSkeleton';
import { useToast } from '../context/ToastContext';
import { eventService } from '../services/eventService';
import {
  Users,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Phone,
  Mail,
  Sparkles,
  CheckCheck,
} from 'lucide-react';

interface EventParticipantsModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EventParticipantsModal: React.FC<EventParticipantsModalProps> = ({
  event,
  isOpen,
  onClose,
}) => {
  const [registrations, setRegistrations] = useState<EventRegistrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const toast = useToast();

  const fetchParticipants = async () => {
    if (!event) return;
    try {
      const res = await eventService.getEventRegistrations(event.id);
      setRegistrations(res);
    } catch {
      toast.error('Failed to load participant roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && event) {
      setLoading(true);
      fetchParticipants();
    }
  }, [isOpen, event?.id]);

  // Real-time synchronization for participant registrations & attendance updates
  useEffect(() => {
    if (!isOpen || !event) return;

    let channel: any;
    if (isSupabaseConfigured) {
      try {
        channel = supabase
          .channel(`roster_${event.id}_realtime`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'event_registrations',
              filter: `event_id=eq.${event.id}`,
            },
            () => {
              fetchParticipants();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Roster realtime subscription note:', err);
      }
    }

    const handleSync = (e: any) => {
      if (e?.detail?.eventId && String(e.detail.eventId) !== String(event.id)) return;
      fetchParticipants();
    };

    window.addEventListener('campus:event_registered', handleSync);
    window.addEventListener('campus:event_unregistered', handleSync);
    window.addEventListener('campus:attendance_updated', handleSync);

    return () => {
      if (channel) supabase.removeChannel(channel);
      window.removeEventListener('campus:event_registered', handleSync);
      window.removeEventListener('campus:event_unregistered', handleSync);
      window.removeEventListener('campus:attendance_updated', handleSync);
    };
  }, [isOpen, event?.id]);

  if (!event || !isOpen) return null;

  const handleStatusChange = async (
    regId: string | number,
    newStatus: EventRegistrationRecord['status']
  ) => {
    // Optimistic UI state update
    const now = new Date().toISOString();
    setRegistrations((prev) =>
      prev.map((r) =>
        String(r.id) === String(regId)
          ? {
              ...r,
              status: newStatus,
              checked_in_at: newStatus === 'CHECKED_IN' ? now : r.checked_in_at,
            }
          : r
      )
    );

    try {
      await eventService.updateRegistrationStatus(regId, newStatus);
      toast.success(
        newStatus === 'CHECKED_IN' ? 'Marked as Present! ✓' : `Status updated to ${newStatus}`
      );
      fetchParticipants();
    } catch {
      toast.error('Failed to update participant status');
      fetchParticipants();
    }
  };

  const handleMarkAllPresent = async () => {
    const pending = registrations.filter(
      (r) => r.status !== 'CHECKED_IN' && r.status !== 'ATTENDED'
    );
    if (pending.length === 0) return;

    setIsBulkUpdating(true);
    try {
      for (const p of pending) {
        await eventService.updateRegistrationStatus(p.id, 'CHECKED_IN');
      }
      toast.success(`Marked all ${pending.length} students as present! ✓`);
      fetchParticipants();
    } catch {
      toast.error('Could not complete bulk check-in');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const totalCount = registrations.length;
  const checkedInCount = registrations.filter(
    (r) => r.status === 'CHECKED_IN' || r.status === 'ATTENDED'
  ).length;
  const pendingCount = totalCount - checkedInCount;

  const handleExportCSV = () => {
    if (registrations.length === 0) return;

    const headers = ['Student ID', 'Full Name', 'Email', 'Status', 'Registered At', 'Checked In At'];
    const rows = registrations.map((r) => {
      const u = r.user || r.student?.user || r.student;
      const name = `${u?.first_name || ''} ${u?.last_name || ''}`.trim() || u?.username || u?.email || 'Student';
      return [
        r.student?.student_id || u?.id?.substring(0, 8) || '',
        name,
        u?.email || '',
        r.status,
        new Date(r.registered_at).toLocaleString(),
        r.checked_in_at ? new Date(r.checked_in_at).toLocaleString() : 'Not Checked In',
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `participants_${event.id}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredList = registrations.filter((r) => {
    const u = r.user || r.student?.user || r.student;
    const name = `${u?.first_name || ''} ${u?.last_name || ''}`.toLowerCase();
    const email = (u?.email || '').toLowerCase();
    const id = (r.student?.student_id || u?.id || '').toLowerCase();
    const matchesSearch =
      name.includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase()) ||
      id.includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'CHECKED_IN'
        ? r.status === 'CHECKED_IN' || r.status === 'ATTENDED'
        : r.status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Participant Roster & Attendance"
      description={`Manage enrollments and attendance for "${event.title}" (${registrations.length} registered)`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Attendance Summary Chips & Bulk Action */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-midnight-900/60 border border-slate-200/80 dark:border-white/5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
              Total Enrolled: {totalCount}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              Checked In: {checkedInCount}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
              Pending: {pendingCount}
            </span>
          </div>

          {pendingCount > 0 && (
            <Button
              size="sm"
              variant="secondary"
              isLoading={isBulkUpdating}
              onClick={handleMarkAllPresent}
              leftIcon={<CheckCheck className="h-3.5 w-3.5 text-emerald-500" />}
            >
              Mark All ({pendingCount}) Present
            </Button>
          )}
        </div>

        {/* Controls Bar: Search, Status Filter & CSV Export */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, email, or ID..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-midnight-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-midnight-900 text-slate-900 dark:text-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="CHECKED_IN">Checked In (Attended)</option>
              <option value="REGISTERED">Registered</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            disabled={registrations.length === 0}
            leftIcon={<Download className="h-3.5 w-3.5" />}
          >
            Export CSV
          </Button>
        </div>

        {/* Participant List Table / Cards */}
        {loading ? (
          <LoadingSkeleton rows={4} />
        ) : filteredList.length === 0 ? (
          <EmptyState
            title="No Participants Found"
            description="No student submissions matched your active search query or filter."
          />
        ) : (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {filteredList.map((r) => {
              const u = r.user || r.student?.user || r.student;
              const name =
                `${u?.first_name || ''} ${u?.last_name || ''}`.trim() ||
                u?.username ||
                u?.email ||
                'Registered Student';
              const email = u?.email || 'No email registered';
              const phone = r.student?.phone_number || (u as any)?.phone_number || r.registration_data?.verified_phone || '';
              const isCheckedIn = r.status === 'CHECKED_IN' || r.status === 'ATTENDED';
              const isExpanded = expandedId === (r.id as any);
              const hasCustomResponses = r.registration_data && Object.keys(r.registration_data).length > 0;

              return (
                <div
                  key={r.id}
                  className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-midnight-900/60 space-y-2.5 transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {name}
                        </h4>
                        <Badge
                          variant={
                            isCheckedIn
                              ? 'success'
                              : r.status === 'REGISTERED' || r.status === 'APPROVED'
                              ? 'primary'
                              : 'danger'
                          }
                          size="sm"
                          dot
                        >
                          {isCheckedIn ? 'Checked In' : r.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono truncate">
                        {email}
                        {phone && ` • 📞 ${phone}`}
                        {` • Registered ${new Date(r.registered_at).toLocaleDateString()}`}
                        {r.checked_in_at && ` • Attended at ${new Date(r.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isCheckedIn ? (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(r.id as any, 'CHECKED_IN')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-[11px] font-bold transition-colors"
                          title="Mark student as present"
                        >
                          Mark Present
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(r.id as any, 'REGISTERED')}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-[11px] font-bold transition-colors"
                          title="Reset to registered"
                        >
                          Undo Check-In
                        </button>
                      )}

                      {r.status !== 'REJECTED' && !isCheckedIn && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(r.id as any, 'REJECTED')}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-[11px] font-bold transition-colors"
                        >
                          Reject
                        </button>
                      )}

                      {hasCustomResponses && (
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : (r.id as any))}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                          title="View Responses"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Custom Registration Form Responses */}
                  {isExpanded && hasCustomResponses && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 space-y-1.5 text-xs">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Custom Form Responses:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white dark:bg-midnight-950 p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                        {Object.entries(r.registration_data).map(([key, val]) => {
                          const matchingField = event.custom_fields?.find((f) => f.id === key);
                          return (
                            <div key={key}>
                              <span className="text-[10px] font-semibold text-slate-400 block">
                                {matchingField?.label || key}
                              </span>
                              <span className="text-xs text-slate-800 dark:text-slate-200 break-words">
                                {String(val)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
