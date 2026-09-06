import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  Search,
  User as UserIcon,
  LogOut,
  Moon,
  Sun,
  Sparkles,
  Award,
  Menu,
  ShieldCheck,
} from 'lucide-react';
import { GlobalSearchModal } from './GlobalSearchModal';
import { useBranding } from '../context/BrandingContext';
import { formatDate } from '../utils/dateUtils';

export const Navbar: React.FC<{ onToggleMobileSidebar?: () => void }> = ({
  onToggleMobileSidebar,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  React.useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        const { supabase } = await import('../services/supabaseClient');
        const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
        if (data) setNotifications(data);
      };
      fetchNotifications();
    }
  }, [user]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const markAllAsRead = async () => {
    if (!user) return;
    const { supabase } = await import('../services/supabaseClient');
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  };

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabelMap: Record<string, { label: string; badgeClass: string }> = {
    STUDENT: { label: 'Student', badgeClass: 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/40' },
    FACULTY: { label: 'Faculty', badgeClass: 'bg-fuchsia-100 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800/40' },
    HOD: { label: 'HOD', badgeClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40' },
    ADMIN: { label: 'Admin', badgeClass: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40' },
    SUPER_ADMIN: { label: 'Super Admin', badgeClass: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40' },
    ADMINISTRATOR: { label: 'Administrator', badgeClass: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40' },
    PLACEMENT_OFFICER: { label: 'Placement Officer', badgeClass: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40' },
    CLUB_COORDINATOR: { label: 'Club Coordinator', badgeClass: 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/40' },
  };

  const { renderBrandName } = useBranding();
  const roleInfo = user?.role ? roleLabelMap[user.role] || { label: user.role, badgeClass: 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/40' } : null;

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-gray-200/80 bg-white/90 px-4 backdrop-blur-2xl dark:border-violet-500/15 dark:bg-[#0a0c16]/90 sm:px-6 shadow-xs transition-colors duration-200">
      {/* Brand & Mobile Toggle */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            aria-label="Toggle navigation menu"
            className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl text-gray-500 hover:bg-violet-50 hover:text-violet-700 lg:hidden dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-violet-300 transition-colors touch-manipulation shrink-0"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <Link to="/" className="flex items-center gap-2.5 group min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25 group-hover:scale-105 group-hover:shadow-violet-500/40 transition-all">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          {renderBrandName(
            "text-lg sm:text-xl font-black tracking-tight text-gray-900 dark:text-white truncate",
            "text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600"
          )}
        </Link>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        
        {/* Global Command Palette & Directory Search */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex h-10 items-center gap-2 rounded-xl border border-gray-200/80 dark:border-violet-500/20 px-2.5 sm:px-3 py-1.5 text-xs text-gray-500 hover:border-violet-300 dark:hover:border-violet-500/40 hover:text-violet-600 dark:hover:text-violet-300 bg-gray-50/70 dark:bg-[#111425]/70 backdrop-blur-md transition-all duration-200 shadow-xs hover:shadow-sm touch-manipulation"
          title="Search directory & commands (Ctrl + K)"
        >
          <Search className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          <span className="hidden md:inline font-medium">Search anything...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-gray-300 dark:border-violet-500/20 bg-white dark:bg-[#171b32] px-1.5 py-0.5 text-[10px] font-mono text-gray-500 shadow-xs">
            ⌘K
          </kbd>
        </button>
        <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl text-gray-500 hover:bg-violet-50 hover:text-violet-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-violet-300 transition-colors relative touch-manipulation"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia-600"></span>
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-sm sm:w-96 rounded-2xl border border-gray-200/80 bg-white/95 shadow-2xl backdrop-blur-2xl dark:border-violet-500/20 dark:bg-[#111425]/95 overflow-hidden z-50 animate-fade-up">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 px-4 py-3.5 bg-gray-50/50 dark:bg-gray-800/30">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">Notifications</h3>
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                      {notifications.filter(n => !n.is_read).length} new
                    </span>
                  )}
                </div>
                <button onClick={markAllAsRead} className="text-[11px] font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 hover:underline">
                  Mark all as read
                </button>
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-30 text-gray-400" />
                    No notifications right now
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {notifications.map(notification => (
                      <div
                        key={notification.id}
                        onClick={async () => {
                          try {
                            if (!notification.is_read) {
                              const { supabase } = await import('../services/supabaseClient');
                              await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
                              setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
                            }
                          } catch (err) {
                            console.error('Failed to mark notification read:', err);
                          }
                          setShowNotifications(false);
                          if (notification.action_url) {
                            navigate(notification.action_url);
                          } else {
                            navigate('/announcements');
                          }
                        }}
                        className={`p-3.5 transition-colors hover:bg-violet-50/50 dark:hover:bg-white/5 cursor-pointer ${!notification.is_read ? 'bg-violet-50/30 dark:bg-violet-950/20' : ''}`}
                      >
                        <div className="flex gap-3">
                          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${!notification.is_read ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-xs' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                            <Bell className="h-4 w-4" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className={`text-xs ${!notification.is_read ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                              {notification.title}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                              {notification.message}
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dark Mode Switcher */}
        <button
          onClick={toggleDarkMode}
          aria-label="Toggle color theme"
          className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl text-gray-500 hover:bg-violet-50 hover:text-violet-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-amber-400 transition-colors touch-manipulation"
          title="Toggle color theme"
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-gray-600" />}
        </button>

        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              aria-label="User account menu"
              className="flex items-center gap-2 rounded-full border border-gray-200/80 bg-gray-50/80 py-1 pl-1 pr-2 sm:pr-3 transition hover:border-violet-300 dark:border-violet-500/15 dark:bg-[#111425]/80 backdrop-blur-md hover:shadow-md hover:shadow-violet-500/10 touch-manipulation min-h-[40px]"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-xs font-black text-white uppercase shadow-sm shrink-0">
                {user.first_name?.[0] || user.username?.[0] || 'U'}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-tight">
                  {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
                </p>
                {roleInfo && (
                  <span className={`inline-block px-1.5 py-0.2 text-[9px] font-bold rounded-md border ${roleInfo.badgeClass}`}>
                    {roleInfo.label}
                  </span>
                )}
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-24px)] rounded-2xl border border-gray-200/80 bg-white/95 p-2 shadow-2xl backdrop-blur-2xl dark:border-violet-500/20 dark:bg-[#111425]/95 z-50 animate-fade-up"
                onClick={() => setShowProfileMenu(false)}
              >
                <div className="border-b border-gray-100 px-3 py-2.5 dark:border-white/10">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">
                    {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                </div>

                <div className="py-1 space-y-0.5">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-violet-50 hover:text-violet-700 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-violet-300 transition-colors"
                  >
                    <UserIcon className="h-4 w-4 text-violet-500" />
                    My Account Profile
                  </Link>
                  {user.role === 'STUDENT' && (
                    <Link
                      to="/portfolio"
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-violet-50 hover:text-violet-700 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-violet-300 transition-colors"
                    >
                      <Award className="h-4 w-4 text-fuchsia-500" />
                      Digital Portfolio
                    </Link>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-1 dark:border-white/10">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-xl px-3.5 py-1.5 text-xs font-bold text-gray-700 hover:text-violet-600 dark:text-gray-300 dark:hover:text-violet-400 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold px-4 py-2 text-xs shadow-md shadow-violet-500/25 hover:shadow-violet-500/40 active:scale-[0.98] transition-all"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
