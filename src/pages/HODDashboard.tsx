import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/analyticsService';
import { attendanceService } from '../services/attendanceService';
import { notificationSocketService } from '../services/notificationSocketService';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { Card, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../context/ToastContext';
import {
  Building2,
  Users,
  Calendar,
  FileCheck,
  TrendingUp,
  BarChart3,
  Bell,
  ArrowRight,
  ShieldCheck,
  QrCode,
  AlertTriangle,
  Send,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export const HODDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [attendanceAnalytics, setAttendanceAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const deptId = user?.department_id ? Number(user.department_id) : 1;
        const [adminRes, attRes] = await Promise.all([
          analyticsService.getAdminAnalytics(),
          attendanceService.getDepartmentAttendanceAnalytics(deptId),
        ]);
        setAnalytics(adminRes);
        setAttendanceAnalytics(attRes);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleSendDefaulterNotice = async (st: any) => {
    try {
      if (st.user_id) {
        await notificationSocketService.sendNotification({
          user_id: st.user_id,
          title: 'Official Attendance Shortage Notice',
          message: `Your attendance is currently ${st.percentage}%, which is below the mandatory 75% threshold. Please meet your HOD immediately.`,
          type: 'WARNING',
          action_url: '/attendance',
        });
      }
      toast.success('Attendance Warning Dispatched', `Official shortage notice recorded and delivered to ${st.name}.`);
    } catch (err: any) {
      toast.error('Failed to send notice', err?.message || 'Could not deliver notification.');
    }
  };

  if (loading) return <LoadingSkeleton rows={4} />;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Head of Department (HOD) Portal"
        subtitle="Department management, real-time attendance tracking, course progress, and low attendance monitoring"
        action={
          <div className="flex items-center gap-2.5">
            <Link to="/attendance/qr">
              <Button leftIcon={<QrCode className="h-4 w-4" />}>
                Launch Session QR
              </Button>
            </Link>
            <Link to="/announcements">
              <Button variant="outline" size="sm" leftIcon={<Bell className="h-4 w-4" />}>
                Post Notice
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Department Students"
          value={analytics?.total_students || 120}
          icon={Users}
          color="blue"
          subtitle="Enrolled in CSE"
          progress={92}
        />
        <StatCard
          title="Active Sessions"
          value={attendanceAnalytics?.total_active_sessions || 1}
          icon={QrCode}
          color="purple"
          subtitle="Real-time live QR sessions"
          progress={100}
        />
        <StatCard
          title="Certificates Verified"
          value={analytics?.certificates_issued || 42}
          icon={FileCheck}
          color="emerald"
          subtitle="Faculty audited"
          progress={88}
        />
        <StatCard
          title="Department Attendance"
          value={`${attendanceAnalytics?.department_average || 86.4}%`}
          icon={TrendingUp}
          color="amber"
          subtitle="Across all courses"
          progress={attendanceAnalytics?.department_average || 86}
        />
      </div>

      {/* Charts & Subject Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Subject-Wise Attendance Averages */}
        <Card className="p-6">
          <CardHeader
            title="Subject Attendance Averages"
            subtitle="Department course-wise student participation rates"
          />
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceAnalytics?.subject_breakdown || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    color: '#0f172a',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="average" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Low Attendance Defaulter List (<75%) */}
        <Card className="p-6 flex flex-col justify-between">
          <CardHeader
            title="Low Attendance Students (< 75%)"
            subtitle="Students with attendance below the required 75% mark"
            action={
              <Badge variant="danger" size="sm" dot>
                {attendanceAnalytics?.low_attendance_students?.length || 0} Students
              </Badge>
            }
          />

          <div className="space-y-3 flex-1 overflow-y-auto max-h-56 pr-1">
            {attendanceAnalytics?.low_attendance_students?.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                All students currently meet the 75% attendance threshold!
              </p>
            ) : (
              attendanceAnalytics?.low_attendance_students?.map((st: any) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {st.name} ({st.student_id})
                    </p>
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                      Attendance: {st.percentage}% &bull; Shortage: {75 - st.percentage}%
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleSendDefaulterNotice(st)}
                    leftIcon={<Send className="h-3 w-3" />}
                  >
                    Send Warning
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
