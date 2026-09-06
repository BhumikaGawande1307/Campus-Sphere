import React, { useState, useEffect, useCallback } from 'react';
import { attendanceService, EventAttendanceOverview, EventAttendanceRecord } from '../services/attendanceService';
import { QRCameraScanner } from '../components/QRCameraScanner';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { Input } from '../components/Input';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';
import { Link, useNavigate } from 'react-router-dom';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  MapPin,
  Award,
  Search,
  BookOpen,
  Sparkles,
  Camera,
  Layers,
  Clock,
  ShieldCheck,
  Zap,
  ExternalLink,
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<EventAttendanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [submittingToken, setSubmittingToken] = useState(false);
  const [selectedRecordForPass, setSelectedRecordForPass] = useState<EventAttendanceRecord | null>(null);
  const toast = useToast();

  const fetchAttendanceData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await attendanceService.getMyEventAttendance();
      setOverview(res);
    } catch {
      toast.error('Failed to load event attendance records');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  // Handle QR Camera Scan
  const handleScanSuccess = async (payload: { token: string; latitude?: number; longitude?: number }) => {
    try {
      const res = await attendanceService.markAttendanceSecure({
        token: payload.token,
        latitude: payload.latitude,
        longitude: payload.longitude,
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      toast.success('Event Check-In Verified! 🎉', res.message);
      setIsScannerOpen(false);
      fetchAttendanceData();
    } catch (err: any) {
      toast.error('Check-In Failed', err.message || 'Invalid or expired event QR code.');
    }
  };

  // Handle Manual Token Submission
  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) {
      toast.warning('Please enter a check-in code.');
      return;
    }
    setSubmittingToken(true);
    try {
      const res = await attendanceService.markAttendanceSecure({ token: manualToken.trim() });
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.6 },
      });
      toast.success('Check-In Confirmed! 🌟', res.message);
      setManualToken('');
      fetchAttendanceData();
    } catch (err: any) {
      toast.error('Invalid Code', err.message || 'Check-in code not recognized or expired.');
    } finally {
      setSubmittingToken(false);
    }
  };

  const records = overview?.records || [];

  const filteredRecords = records.filter((r) => {
    const titleMatch = r.event?.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const venueMatch = r.event?.venue?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const categoryMatch = r.event?.category?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const matchesSearch = titleMatch || venueMatch || categoryMatch;

    let matchesCategory = true;
    if (categoryFilter === 'MASTERCLASS') {
      matchesCategory = (r.event?.category?.toUpperCase().includes('MASTERCLASS') || r.event?.title?.toUpperCase().includes('MASTERCLASS')) || false;
    } else if (categoryFilter === 'WORKSHOP') {
      matchesCategory = (r.event?.category?.toUpperCase().includes('WORKSHOP') || r.event?.title?.toUpperCase().includes('WORKSHOP')) || false;
    } else if (categoryFilter === 'ATTENDED') {
      matchesCategory = r.status === 'ATTENDED' || r.status === 'CHECKED_IN';
    }

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Campus Event & Workshop Attendance"
        subtitle="Verified attendance records, live workshop check-ins, and activity point rewards"
        badge={
          <Badge variant="gradient" size="sm" dot>
            Verified Attendance Active
          </Badge>
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsScannerOpen(true)}
              variant="primary"
              leftIcon={<Camera className="h-4 w-4" />}
            >
              Scan Check-In QR
            </Button>
            <Link to="/events">
              <Button variant="outline" leftIcon={<Calendar className="h-4 w-4" />}>
                Browse Events
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Stats Banner */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Events Attended"
          value={overview?.total_events_attended ?? 0}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Verified check-ins"
        />
        <StatCard
          title="Masterclasses & Workshops"
          value={((overview?.masterclasses_attended ?? 0) + (overview?.workshops_attended ?? 0))}
          icon={BookOpen}
          color="purple"
          subtitle="Advanced learning sessions"
        />
        <StatCard
          title="Activity Points Earned"
          value={`+${overview?.activity_points_earned ?? 0} XP`}
          icon={Zap}
          color="amber"
          subtitle="Activity & participation points"
        />
        <StatCard
          title="Check-In Rate"
          value={`${overview?.attendance_rate ?? 100}%`}
          icon={ShieldCheck}
          color="blue"
          subtitle={`${overview?.total_events_attended ?? 0} of ${overview?.total_registered ?? 0} events`}
          progress={overview?.attendance_rate ?? 100}
        />
      </div>

      {/* Manual Check-in & Scanner Bar */}
      <Card className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/70 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border-blue-200/60 dark:border-blue-900/30">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <QrCode className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Live Venue Attendance Check-In
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Attending an in-person or live masterclass? Scan the screen QR or enter the 6-digit organizer code.
            </p>
          </div>

          <form onSubmit={handleManualCheckIn} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. EVT-481920"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white font-mono uppercase w-40"
            />
            <Button size="sm" variant="primary" type="submit" isLoading={submittingToken}>
              Check-In
            </Button>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => setIsScannerOpen(true)}
              leftIcon={<Camera className="h-3.5 w-3.5" />}
            >
              Scan
            </Button>
          </form>
        </div>
      </Card>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search attended events or venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-midnight-900 border border-slate-200 dark:border-white/10 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Sessions' },
            { id: 'MASTERCLASS', label: 'Masterclasses' },
            { id: 'WORKSHOP', label: 'Workshops' },
            { id: 'ATTENDED', label: 'Verified Attended' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                categoryFilter === tab.id
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Attendance Records Grid */}
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          title="No Event Attendance Records Found"
          description={
            searchQuery
              ? 'No matching event records found for your search query.'
              : 'You have not registered for or checked into any events or masterclasses yet.'
          }
          actionText="Explore Campus Events & Masterclasses"
          onAction={() => navigate('/events')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map((rec) => {
            const isAttended = rec.status === 'ATTENDED' || rec.status === 'CHECKED_IN';
            const isMissed = rec.status === 'MISSED';

            return (
              <Card
                key={rec.id}
                className="p-5 flex flex-col justify-between space-y-4 hover:border-blue-300 dark:hover:border-blue-900/50 transition-all border border-slate-200 dark:border-white/10"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      variant={
                        rec.event?.category?.toUpperCase().includes('MASTERCLASS')
                          ? 'primary'
                          : rec.event?.category?.toUpperCase().includes('WORKSHOP')
                          ? 'gradient'
                          : 'secondary'
                      }
                      size="sm"
                    >
                      {rec.event?.category || 'Masterclass'}
                    </Badge>
                    <Badge
                      variant={isAttended ? 'success' : isMissed ? 'danger' : 'warning'}
                      size="sm"
                      dot
                    >
                      {isAttended ? 'Verified Attended' : isMissed ? 'Missed Session' : 'Registered / Upcoming'}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                      {rec.event?.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {rec.event?.description || 'Institutional learning event with certified attendance.'}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{rec.event?.venue || 'Campus Auditorium'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>
                        {rec.event?.start_date ? new Date(rec.event.start_date).toLocaleDateString() : 'TBD'}
                        {rec.event?.start_date && ` at ${new Date(rec.event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                    </div>
                    {rec.checked_in_at && (
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>Checked In: {new Date(rec.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5" />
                    +{rec.points_reward || 10} XP
                  </span>

                  {isAttended ? (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setSelectedRecordForPass(rec)}
                      leftIcon={<ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />}
                    >
                      View Pass
                    </Button>
                  ) : (
                    <Button
                      size="xs"
                      variant="primary"
                      onClick={() => setIsScannerOpen(true)}
                      leftIcon={<Camera className="h-3 w-3" />}
                    >
                      Check-In
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* QR Camera Scanner Modal */}
      <QRCameraScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* Verified Event Attendance Pass Modal */}
      {selectedRecordForPass && (
        <Modal
          isOpen={Boolean(selectedRecordForPass)}
          onClose={() => setSelectedRecordForPass(null)}
          title="Official Event Attendance Pass"
          size="md"
        >
          <div className="p-6 text-center space-y-4 bg-gradient-to-b from-emerald-50/40 to-transparent dark:from-emerald-950/20 dark:to-transparent rounded-2xl">
            <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <Badge variant="success" size="md">Securely Verified</Badge>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {selectedRecordForPass.event?.title}
              </h3>
              <p className="text-xs text-slate-500">
                Venue: {selectedRecordForPass.event?.venue} &bull; Category: {selectedRecordForPass.event?.category}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-midnight-900 border border-slate-200 dark:border-white/10 text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Pass ID:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedRecordForPass.verification_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Attendance Status:</span>
                <span className="font-bold text-emerald-600">VERIFIED PRESENT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Activity Points:</span>
                <span className="font-bold text-amber-600">+{selectedRecordForPass.points_reward || 10} XP Earned</span>
              </div>
              {selectedRecordForPass.checked_in_at && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Timestamp:</span>
                  <span className="text-slate-700 dark:text-slate-300">{new Date(selectedRecordForPass.checked_in_at).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setSelectedRecordForPass(null)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
