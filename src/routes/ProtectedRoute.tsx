import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { adminService } from '../services/adminService';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  requirePermission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, requirePermission }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [hasPerm, setHasPerm] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    if (requirePermission && isAuthenticated && user) {
      adminService.hasPermission(requirePermission).then((res) => {
        if (mounted) setHasPerm(res);
      });
    } else {
      setHasPerm(true);
    }
    return () => { mounted = false; };
  }, [requirePermission, isAuthenticated, user]);

  if (isLoading || hasPerm === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-midnight-950">
        <div className="text-center text-xs font-semibold text-slate-500">
          Checking access permissions...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (user.role || '').toUpperCase() as UserRole;
  const isAllowed = !allowedRoles || allowedRoles.some((r) => r.toUpperCase() === userRole);

  if (!isAllowed) {
    // Dynamic redirection based on user's authorized role
    const getRoleDashboard = (role: UserRole) => {
      const normalized = (role || '').toUpperCase();
      switch (normalized) {
        case 'STUDENT':
          return '/dashboard/student';
        case 'FACULTY':
          return '/dashboard/faculty';
        case 'HOD':
          return '/dashboard/hod';
        case 'PLACEMENT_OFFICER':
          return '/dashboard/placement';
        case 'COORDINATOR':
        case 'ADMIN':
        case 'SUPER_ADMIN':
        case 'ADMINISTRATOR':
          return '/admin/dashboard';
        default:
          return '/dashboard/student';
      }
    };

    return <Navigate to={getRoleDashboard(user.role)} replace />;
  }

  if (hasPerm === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-midnight-950 p-6 text-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Access Denied</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            You do not have the required administrative permissions to view this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
