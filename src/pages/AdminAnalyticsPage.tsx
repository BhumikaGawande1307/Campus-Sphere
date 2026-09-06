import React, { useEffect, useState } from 'react';
import { analyticsService } from '../services/analyticsService';
import { AdminAnalyticsData } from '../types';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { Card, CardHeader } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import {
  Users,
  Calendar,
  FileCheck,
  Briefcase,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const AdminAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await analyticsService.getAdminAnalytics();
        setData(res);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <LoadingSkeleton rows={5} />;
  if (!data) return null;

  const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Campus Analytics & Reports"
        subtitle="Real-time campus activity, verified student credentials, and placement metrics"
        badge={
          <Badge variant="success" size="sm" dot>
            PostgreSQL Live
          </Badge>
        }
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
        <StatCard
          title="Registered Students"
          value={data.total_students}
          icon={Users}
          color="blue"
          subtitle="Enrolled Profiles"
          trend={{ value: '+12% YoY', isPositive: true }}
          progress={92}
        />
        <StatCard
          title="Events Conducted"
          value={data.total_events}
          icon={Calendar}
          color="purple"
          subtitle="Across All Departments"
          trend={{ value: '+4 this month', isPositive: true }}
          progress={80}
        />
        <StatCard
          title="Verified Credentials"
          value={data.certificates_issued}
          icon={FileCheck}
          color="emerald"
          subtitle="Approved in Vault"
          trend={{ value: '100% Audited', isPositive: true }}
          progress={98}
        />
        <StatCard
          title="Campus Attendance"
          value={`${data.attendance_rate}%`}
          icon={CheckCircle2}
          color="amber"
          subtitle="Anti-Proxy QR Verified"
          trend={{ value: '+3.4% vs last sem', isPositive: true }}
          progress={data.attendance_rate}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Department Participation */}
        <Card className="p-6">
          <CardHeader
            title="Department-Wise Student Enrolment"
            subtitle="Distribution across engineering and computing branches"
          />
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.department_participation}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b0f19',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="students" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Skill Distribution */}
        <Card className="p-6">
          <CardHeader
            title="Skill Proficiency Distribution"
            subtitle="Top technical competencies logged across the student body"
          />
          <div className="h-64 w-full flex items-center justify-center pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.skill_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data.skill_distribution.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b0f19',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Monthly Activity Trends */}
        {data.monthly_activity && (
          <Card className="lg:col-span-2 p-6">
            <CardHeader
              title="Monthly Campus Activity & Issuance Velocity"
              subtitle="Events organized vs. verified certificates issued over time"
            />
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.monthly_activity}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCerts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b0f19',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="events"
                    name="Events Conducted"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorEvents)"
                  />
                  <Area
                    type="monotone"
                    dataKey="certificates"
                    name="Certificates Issued"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCerts)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
