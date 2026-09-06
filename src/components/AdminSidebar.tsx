import React, { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { adminService } from '../services/adminService';
import {
  ShieldCheck,
  Users,
  GraduationCap,
  Calendar,
  AlertCircle,
  Settings,
  Activity,
  FileText,
  Clock,
  ChevronRight,
  Database,
  Building2,
  Award,
  Briefcase,
  Bell,
  QrCode,
  Sparkles,
  ArrowUpRight,
  LogOut,
} from 'lucide-react';
import { Badge } from './Badge';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { branding, renderBrandName } = useBranding();
  const location = useLocation();
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname]);

  useEffect(() => {
    adminService.loadMyPermissions().then(setPermissions).catch(() => {});
  }, []);

  const isSuperOrAdmin = user && ['ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR', 'COORDINATOR'].includes(user.role);
  const hasPerm = (code: string) => isSuperOrAdmin || permissions.includes(code);

  const adminNav = [
    {
      title: 'Overview & Actions',
      items: [
        { name: 'Overview', path: '/admin/dashboard', icon: Activity, reqPerm: 'students.view' },
        { name: 'Approval Center', path: '/admin/approvals', icon: ShieldCheck, badge: 'Review', badgeVariant: 'warning', reqPerm: 'scholarships.manage' },
        { name: 'Live QR Scanner', path: '/attendance/qr', icon: QrCode, badge: 'Live', badgeVariant: 'live', reqPerm: 'attendance.manage' },
      ],
    },
    {
      title: 'Academic & People',
      items: [
        { name: 'Students List', path: '/admin/students', icon: Users, reqPerm: 'students.view' },
        { name: 'Faculty & Staff', path: '/admin/faculty', icon: GraduationCap, reqPerm: 'faculty.view' },
        { name: 'Departments & HODs', path: '/admin/departments', icon: Building2, reqPerm: 'faculty.manage' },
      ],
    },
    {
      title: 'Opportunities & Growth',
      items: [
        { name: 'Scholarships & Grants', path: '/admin/scholarships', icon: Award, badge: 'Grants', badgeVariant: 'gradient', reqPerm: 'scholarships.create' },
        { name: 'Career & Placements', path: '/admin/career', icon: Briefcase, badge: 'Drives', badgeVariant: 'primary', reqPerm: 'jobs.create' },
      ],
    },
    {
      title: 'Operations & Records',
      items: [
        { name: 'Campus Announcements', path: '/admin/announcements', icon: Bell, reqPerm: 'announcements.create' },
        { name: 'Campus Events & Workshops', path: '/admin/events', icon: Calendar, reqPerm: 'events.manage' },
        { name: 'Exam Results', path: '/admin/results', icon: FileText, reqPerm: 'results.manage' },
        { name: 'Grievance Desk', path: '/admin/grievances', icon: AlertCircle, reqPerm: 'grievances.view' },
      ],
    },
    {
      title: 'System & Security',
      items: [
        { name: 'Settings & Branding', path: '/admin/settings', icon: Settings, badge: '1-Click', badgeVariant: 'success', reqPerm: 'system_settings.manage' },
        { name: 'Activity Logs', path: '/admin/audit', icon: Database, reqPerm: 'audit_logs.view' },
      ],
    },
  ];

  const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username : 'Administrator';
  const initial = (fullName[0] || 'A').toUpperCase();

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#0a0c16]/70 backdrop-blur-sm transition-opacity lg:hidden"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-gray-200/80 dark:border-violet-500/15 backdrop-blur-2xl bg-white/90 dark:bg-[#0a0c16]/90 transition-transform duration-300 lg:translate-x-0 overflow-y-auto flex flex-col justify-between shadow-2xl lg:shadow-none pb-safe ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header Banner */}
        <div className="p-3 border-b border-gray-200/70 dark:border-white/5 bg-gray-50/50 dark:bg-[#111425]/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-xs">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="leading-tight truncate">
                <p className="text-xs font-black text-gray-900 dark:text-white truncate">
                  {branding.shortName || branding.appName} OS
                </p>
                <p className="text-[10px] text-gray-400 font-medium">Admin Suite</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
        </div>

        {/* Navigation Link Groups */}
        <div className="p-3 space-y-4 flex-1">
          {adminNav.map((group) => {
            const visibleItems = group.items.filter((item) => hasPerm(item.reqPerm));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                <h4 className="px-2.5 mb-1 text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {group.title}
                </h4>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                            isActive
                              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25 font-bold scale-[1.01]'
                              : 'text-gray-600 dark:text-gray-400 hover:text-violet-700 dark:hover:text-white hover:bg-violet-50/70 dark:hover:bg-white/5'
                          }`
                        }
                      >
                        {({ isActive }: { isActive: boolean }) => (
                          <>
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon
                                className={`h-4 w-4 shrink-0 transition-colors duration-150 ${
                                  isActive
                                    ? 'text-white'
                                    : 'text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-300'
                                }`}
                              />
                              <span className="truncate">{item.name}</span>
                            </div>
                            {item.badge && (
                              <Badge
                                variant={isActive ? 'neutral' : ((item.badgeVariant as any) || 'neutral')}
                                size="sm"
                                className={isActive ? 'bg-white/20 text-white border-transparent text-[10px]' : 'text-[10px]'}
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* User Profile Card & Return to Student Portal */}
        <div className="p-3 border-t border-gray-200/80 dark:border-violet-500/15 space-y-2 bg-gray-50/40 dark:bg-[#111425]/30">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#111425] border border-gray-200/80 dark:border-violet-500/20 shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{fullName}</p>
                <p className="text-[10px] text-gray-400 truncate">{user?.role || 'Admin'}</p>
              </div>
            </div>
            <Link
              to="/profile"
              onClick={onClose}
              title="Profile Settings"
              className="p-1.5 text-gray-400 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
            </Link>
          </div>

          <Link
            to="/dashboard/student"
            className="group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-violet-700 dark:hover:text-white hover:bg-violet-50/80 dark:hover:bg-white/5 transition-all border border-transparent hover:border-violet-500/20"
          >
            <div className="flex items-center gap-2">
              <ChevronRight className="h-3.5 w-3.5 rotate-180 text-gray-400 group-hover:text-violet-600 transition-colors" />
              <span>Exit Admin Mode</span>
            </div>
            <span className="text-[10px] text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-400">Student Hub</span>
          </Link>
        </div>
      </aside>
    </>
  );
};
