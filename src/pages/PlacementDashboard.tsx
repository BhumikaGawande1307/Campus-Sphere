import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { careerService } from '../services/careerService';
import { JobPosting, Application } from '../types';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { Card, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import {
  Briefcase,
  Users,
  Building2,
  CheckCircle2,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
} from 'lucide-react';

export const PlacementDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [jobsRes, appsRes] = await Promise.all([
          careerService.getJobs(),
          careerService.getAllApplications(),
        ]);
        setJobs(jobsRes);
        setApplications(appsRes);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSkeleton rows={4} />;

  const shortlistedCount = applications.filter(
    (a) => a.status === 'SHORTLISTED' || a.status === 'INTERVIEWED'
  ).length;
  const selectedCount = applications.filter((a) => a.status === 'SELECTED').length;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Campus Placement & Career Office"
        subtitle="Manage recruitment drives, track student application pipelines, and evaluate offers"
        action={
          <Link to="/career">
            <Button leftIcon={<Plus className="h-4 w-4" />}>
              Manage Drives & Postings
            </Button>
          </Link>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Active Drives"
          value={jobs.length}
          icon={Briefcase}
          color="blue"
          subtitle="Partner companies"
        />
        <StatCard
          title="Applications"
          value={applications.length}
          icon={Users}
          color="purple"
          subtitle="Total candidate submissions"
        />
        <StatCard
          title="Shortlisted"
          value={shortlistedCount}
          icon={Clock}
          color="amber"
          subtitle="In interview stages"
        />
        <StatCard
          title="Offers Made"
          value={selectedCount}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Final selections confirmed"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Active Drives */}
        <Card>
          <CardHeader
            title="Active Recruitment Drives"
            subtitle="Current open positions and eligibility requirements"
            action={
              <Link to="/career" className="text-xs font-semibold text-primary-600 hover:underline">
                View All
              </Link>
            }
          />
          <div className="space-y-3">
            {jobs.length === 0 ? (
              <EmptyState title="No Active Drives" description="Create a job posting to accept applications." />
            ) : (
              jobs.slice(0, 4).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="primary" size="sm">
                        {job.job_type}
                      </Badge>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Min CGPA: {job.min_cgpa}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {job.title} &bull; {job.company?.name || 'Partner Company'}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      Package: {job.stipend_salary} &bull; Openings: {job.openings}
                    </p>
                  </div>

                  <Link to="/career">
                    <Button size="sm" variant="secondary">
                      Manage
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Application Pipeline */}
        <Card>
          <CardHeader
            title="Recent Candidate Applications"
            subtitle="Student applications across recruitment stages"
            action={
              <Link to="/career" className="text-xs font-semibold text-primary-600 hover:underline">
                Pipeline Roster
              </Link>
            }
          />
          <div className="space-y-3">
            {applications.length === 0 ? (
              <EmptyState title="No Applications Yet" description="Student applications will appear here." />
            ) : (
              applications.slice(0, 4).map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          app.status === 'SELECTED'
                            ? 'success'
                            : app.status === 'REJECTED'
                            ? 'danger'
                            : app.status === 'SHORTLISTED'
                            ? 'primary'
                            : 'neutral'
                        }
                        size="sm"
                        dot
                      >
                        {app.status}
                      </Badge>
                      <span className="text-[11px] text-slate-500 truncate">
                        {app.job?.title}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {app.student?.user?.first_name} {app.student?.user?.last_name || 'Aarav Sharma'}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Applied: {new Date(app.applied_at).toLocaleDateString()}
                    </p>
                  </div>

                  <Link to="/career">
                    <Button size="sm" variant="outline">
                      View
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
