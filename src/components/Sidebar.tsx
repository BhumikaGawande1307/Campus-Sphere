import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  FileCheck,
  Code2,
  Briefcase,
  Bell,
  Bot,
  CheckCircle2,
  FileText,
  QrCode,
  IndianRupee,
  ShieldCheck,
  ChevronRight,
  Clock,
  Award,
  HelpCircle,
  Lock,
} from 'lucide-react';
import { Badge } from './Badge';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'gradient' | 'live' | 'neutral';
  badgePulse?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role || 'STUDENT';
  const location = useLocation();

  React.useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname]);

  const getDashboardPath = () => {
    switch (role) {
      case 'FACULTY':           return '/dashboard/faculty';
      case 'HOD':               return '/dashboard/hod';
      case 'PLACEMENT_OFFICER': return '/dashboard/placement';
      case 'ADMIN':
      case 'COORDINATOR':       return '/admin/dashboard';
      default:                  return '/dashboard/student';
    }
  };

  const navGroups: NavGroup[] = [
    {
      title: 'Overview',
      items: [
        { name: 'Dashboard', path: getDashboardPath(), icon: LayoutDashboard },
      ],
    },
    {
      title: 'Academic Records',
      items: [
        {
          name: 'Exam Results & Marksheets',
          path: '/exam-results',
          icon: Award,
          badge: 'SGPA/CGPA',
          badgeVariant: 'success',
        },
        ...(role === 'STUDENT'
          ? [{ name: 'Event Attendance & Passes', path: '/attendance', icon: CheckCircle2, badge: 'XP', badgeVariant: 'success' as const }]
          : []),
        ...(['FACULTY', 'HOD', 'ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR', 'COORDINATOR'].includes(role)
          ? [{ name: 'Live Attendance QR', path: '/attendance/qr', icon: QrCode, badge: 'Live', badgeVariant: 'primary' as const, badgePulse: true }]
          : []),
        {
          name: ['FACULTY', 'HOD', 'ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR', 'COORDINATOR'].includes(role) ? 'Verify Certificates' : 'Certificates & Documents',
          path: '/certificates',
          icon: FileCheck,
          badge: 'Verified',
          badgeVariant: 'gradient',
        },
      ],
    },
    {
      title: 'Campus Life & Support',
      items: [
        { name: 'Campus Events & Workshops', path: '/events', icon: Calendar },
        {
          name: 'Help & Support Desk',
          path: '/grievances',
          icon: HelpCircle,
          badge: '72h Reply',
          badgeVariant: 'warning',
        },
        ...(role === 'STUDENT'
          ? [{ name: 'Skills & Projects', path: '/skills-projects', icon: Code2 }]
          : []),
      ],
    },
    {
      title: 'Career & Placements',
      items: [
        { name: 'Career Opportunities', path: '/career', icon: Briefcase },
        ...(role === 'STUDENT'
          ? [
              { name: 'Resume Builder', path: '/resume-builder', icon: FileText },
              { name: 'AI Career Assistant', path: '/ai-assistant', icon: Bot, badge: 'AI', badgeVariant: 'primary' as const, badgePulse: true },
            ]
          : []),
      ],
    },
    {
      title: 'Aid & Governance',
      items: [
        { name: 'Scholarships & Aid', path: '/scholarships', icon: IndianRupee, badge: '₹1.2 Cr+', badgeVariant: 'success' },
        { name: 'Official Notices', path: '/announcements', icon: Bell },
        { name: 'Security & 2FA', path: '/security', icon: Lock, badge: '2FA', badgeVariant: 'success' },
      ],
    },
  ];

  if (['ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR', 'HOD', 'PLACEMENT_OFFICER', 'COORDINATOR'].includes(role)) {
    navGroups.push({
      title: 'Governance & CMS',
      items: [
        { name: 'Admin Management', path: '/admin/dashboard', icon: ShieldCheck, badge: 'Admin', badgeVariant: 'gradient' },
      ],
    });
  }

  const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username : 'User';
  const initial = (fullName[0] || 'U').toUpperCase();
  const isProfileActive = location.pathname === '/profile';
  const roleLabel = role.toLowerCase().replace(/_/g, ' ');

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#0a0c16]/70 backdrop-blur-sm transition-opacity lg:hidden"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-gray-200/80 dark:border-violet-500/15 backdrop-blur-2xl bg-white/90 dark:bg-[#0a0c16]/90 transition-transform duration-300 lg:translate-x-0 overflow-y-auto flex flex-col justify-between shadow-2xl lg:shadow-none pb-safe ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation Groups */}
        <div className="p-3 space-y-4 flex-1">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-0.5">
              <h4 className="px-3 mb-1.5 text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {group.title}
              </h4>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                          isActive
                            ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold shadow-md shadow-violet-500/25 scale-[1.01]'
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
                                  : 'text-gray-400 dark:text-gray-500 group-hover:text-violet-600 dark:group-hover:text-violet-300'
                              }`}
                            />
                            <span className="truncate">{item.name}</span>
                          </div>
                          {item.badge && (
                            <Badge
                              variant={isActive ? 'neutral' : (item.badgeVariant || 'neutral')}
                              size="sm"
                              pulse={item.badgePulse && !isActive}
                              className={isActive ? 'bg-white/20 text-white border-transparent' : ''}
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
          ))}
        </div>

        {/* Bottom: User Profile */}
        <div className="p-3 border-t border-gray-200/80 dark:border-white/10">
          <Link
            to="/profile"
            onClick={onClose}
            className={`group flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 ${
              isProfileActive
                ? 'bg-violet-500/10 border-violet-500/30 shadow-md shadow-violet-500/10'
                : 'border-gray-200/80 dark:border-violet-500/15 bg-white/80 dark:bg-[#111425]/60 hover:border-violet-300 dark:hover:border-violet-500/30 hover:bg-violet-50/50 dark:hover:bg-[#111425]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Avatar */}
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white text-sm font-black shadow-sm shrink-0">
                {initial}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white dark:ring-gray-950" />
                </span>
              </div>
              {/* Details */}
              <div className="min-w-0 text-left">
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {fullName}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {roleLabel}
                  </span>
                  <span className="text-[10px] text-gray-400">· Profile</span>
                </div>
              </div>
            </div>
            <ChevronRight
              className={`h-4 w-4 shrink-0 transition-all duration-150 ${
                isProfileActive
                  ? 'text-violet-600 dark:text-violet-400'
                  : 'text-gray-400 group-hover:translate-x-0.5 group-hover:text-violet-600 dark:group-hover:text-violet-300'
              }`}
            />
          </Link>
        </div>
      </aside>
    </>
  );
};
