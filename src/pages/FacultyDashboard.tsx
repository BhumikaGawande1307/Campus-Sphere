import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { certificateService } from '../services/certificateService';
import { Event, Certificate } from '../types';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { Card, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import {
  Calendar,
  FileCheck,
  QrCode,
  Users,
  Plus,
  ArrowRight,
  ExternalLink,
  Clock,
} from 'lucide-react';

export const FacultyDashboard: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [pendingCertificates, setPendingCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [evList, certList] = await Promise.all([
          eventService.getEvents(),
          certificateService.getCertificates({ status: 'PENDING' }),
        ]);
        setEvents(evList);
        setPendingCertificates(certList);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSkeleton rows={4} />;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Faculty & Academic Coordinator Portal"
        subtitle="Manage department events, launch live QR attendance sessions, and verify student credentials"
        action={
          <div className="flex items-center gap-2.5">
            <Link to="/faculty/attendance-qr">
              <Button leftIcon={<QrCode className="h-4 w-4" />}>
                Live QR Session
              </Button>
            </Link>
            <Link to="/events">
              <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />}>
                New Event
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          title="Active Events"
          value={events.length}
          icon={Calendar}
          color="blue"
          subtitle="Managed sessions"
        />
        <StatCard
          title="Pending Approvals"
          value={pendingCertificates.length}
          icon={FileCheck}
          color="amber"
          subtitle="Awaiting faculty verification"
        />
        <StatCard
          title="Registrations"
          value={events.reduce((acc, e) => acc + (e.registered_count || 0), 0)}
          icon={Users}
          color="purple"
          subtitle="Total student signups"
        />
      </div>

      {/* Main Grid: Pending Approvals & Upcoming Sessions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending Certificate Verification Queue */}
        <Card>
          <CardHeader
            title="Pending Certificate Queue"
            subtitle="Student submissions requiring faculty review"
            action={
              <Link to="/faculty/certificates" className="text-xs font-semibold text-primary-600 hover:underline">
                Review All ({pendingCertificates.length})
              </Link>
            }
          />
          <div className="space-y-3">
            {pendingCertificates.length === 0 ? (
              <EmptyState
                title="No Pending Submissions"
                description="All submitted student credentials have been processed."
              />
            ) : (
              pendingCertificates.slice(0, 4).map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="warning" size="sm" dot>
                        Pending Review
                      </Badge>
                      <span className="text-[11px] text-slate-400">{cert.category}</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {cert.title}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Issuer: {cert.issuer} &bull; {cert.certificate_uid}
                    </p>
                  </div>

                  <Link to="/faculty/certificates">
                    <Button size="sm" variant="secondary">
                      Review
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Managed Events */}
        <Card>
          <CardHeader
            title="Managed Campus Events"
            subtitle="Recent technical sessions, workshops, and competitions"
            action={
              <Link to="/events" className="text-xs font-semibold text-primary-600 hover:underline">
                Manage All
              </Link>
            }
          />
          <div className="space-y-3">
            {events.length === 0 ? (
              <EmptyState
                title="No Events Created"
                description="Create a technical session or workshop to start taking dynamic QR attendance."
              />
            ) : (
              events.slice(0, 4).map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="primary" size="sm">
                        {ev.category}
                      </Badge>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {ev.registered_count} / {ev.max_participants} Registered
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {ev.title}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Venue: {ev.venue} &bull; {new Date(ev.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>

                  <Link to="/faculty/attendance-qr">
                    <Button size="sm" variant="outline" leftIcon={<QrCode className="h-3.5 w-3.5" />}>
                      QR Session
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
