import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { BrandingProvider } from './context/BrandingContext';
import { RootLayout } from './layouts/RootLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminSettings } from './pages/AdminSettings';
import { Sparkles } from 'lucide-react';

// Lazy-Loaded Public Pages
const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import('./pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
);
const VerifyEmailPage = lazy(() =>
  import('./pages/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage }))
);
const PublicCertificateVerificationPage = lazy(() =>
  import('./pages/PublicCertificateVerificationPage').then((m) => ({
    default: m.PublicCertificateVerificationPage,
  }))
);

// Lazy-Loaded Legal & Policy Pages
const PrivacyPolicyPage = lazy(() =>
  import('./pages/legal/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage }))
);
const TermsPage = lazy(() =>
  import('./pages/legal/TermsPage').then((m) => ({ default: m.TermsPage }))
);
const UserAgreementPage = lazy(() =>
  import('./pages/legal/UserAgreementPage').then((m) => ({ default: m.UserAgreementPage }))
);
const DataProtectionPage = lazy(() =>
  import('./pages/legal/DataProtectionPage').then((m) => ({ default: m.DataProtectionPage }))
);
const CookiePolicyPage = lazy(() =>
  import('./pages/legal/CookiePolicyPage').then((m) => ({ default: m.CookiePolicyPage }))
);
const GrievancePolicyPage = lazy(() =>
  import('./pages/legal/GrievancePolicyPage').then((m) => ({ default: m.GrievancePolicyPage }))
);
const CertificatePolicyPage = lazy(() =>
  import('./pages/legal/CertificatePolicyPage').then((m) => ({ default: m.CertificatePolicyPage }))
);

// Lazy-Loaded Protected Pages
const StudentDashboard = lazy(() =>
  import('./pages/StudentDashboard').then((m) => ({
    default: m.StudentDashboard,
  }))
);
const FacultyDashboard = lazy(() =>
  import('./pages/FacultyDashboard').then((m) => ({
    default: m.FacultyDashboard,
  }))
);
const HODDashboard = lazy(() =>
  import('./pages/HODDashboard').then((m) => ({ default: m.HODDashboard }))
);
const PlacementDashboard = lazy(() =>
  import('./pages/PlacementDashboard').then((m) => ({
    default: m.PlacementDashboard,
  }))
);
const AdminDashboard = lazy(() =>
  import('./pages/AdminDashboard').then((m) => ({
    default: m.AdminDashboard,
  }))
);
const AdminAuditLogs = lazy(() =>
  import('./pages/AdminAuditLogs').then((m) => ({ default: m.AdminAuditLogs }))
);
const ComingSoonPage = lazy(() =>
  import('./pages/ComingSoonPage').then((m) => ({ default: m.ComingSoonPage }))
);
const DepartmentManagement = lazy(() =>
  import('./pages/admin/DepartmentManagement').then((m) => ({ default: m.DepartmentManagement }))
);
const UserManagement = lazy(() =>
  import('./pages/admin/UserManagement').then((m) => ({ default: m.UserManagement }))
);
const EventsPage = lazy(() =>
  import('./pages/EventsPage').then((m) => ({ default: m.EventsPage }))
);
const AttendancePage = lazy(() =>
  import('./pages/AttendancePage').then((m) => ({ default: m.AttendancePage }))
);
const FacultyAttendanceQRPage = lazy(() =>
  import('./pages/FacultyAttendanceQRPage').then((m) => ({
    default: m.FacultyAttendanceQRPage,
  }))
);
const CertificateVaultPage = lazy(() =>
  import('./pages/CertificateVaultPage').then((m) => ({
    default: m.CertificateVaultPage,
  }))
);
const ScholarshipsPage = lazy(() =>
  import('./pages/ScholarshipsPage').then((m) => ({
    default: m.ScholarshipsPage,
  }))
);
const SkillsProjectsPage = lazy(() =>
  import('./pages/SkillsProjectsPage').then((m) => ({
    default: m.SkillsProjectsPage,
  }))
);
const CareerHubPage = lazy(() =>
  import('./pages/CareerHubPage').then((m) => ({ default: m.CareerHubPage }))
);
const AnnouncementsPage = lazy(() =>
  import('./pages/AnnouncementsPage').then((m) => ({
    default: m.AnnouncementsPage,
  }))
);
const ResumeBuilderPage = lazy(() =>
  import('./pages/ResumeBuilderPage').then((m) => ({
    default: m.ResumeBuilderPage,
  }))
);
const AIAssistantPage = lazy(() =>
  import('./pages/AIAssistantPage').then((m) => ({
    default: m.AIAssistantPage,
  }))
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const GrievanceCenterPage = lazy(() =>
  import('./pages/GrievanceCenterPage').then((m) => ({ default: m.GrievanceCenterPage }))
);
const ExamResultsPage = lazy(() =>
  import('./pages/ExamResultsPage').then((m) => ({ default: m.ExamResultsPage }))
);
const SecuritySettingsPage = lazy(() =>
  import('./pages/SecuritySettingsPage').then((m) => ({ default: m.SecuritySettingsPage }))
);

const PageFallbackLoader: React.FC = () => (
  <div className="flex h-64 w-full items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white animate-pulse">
        <Sparkles className="h-5 w-5" />
      </div>
      <p className="text-xs font-semibold text-slate-400">Loading view...</p>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrandingProvider>
        <ToastProvider>
          <BrowserRouter>
          <Suspense fallback={<PageFallbackLoader />}>
            <Routes>
              {/* Public Landing, Auth & Public Ledger Verification */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route
                path="/verify/:uid"
                element={<PublicCertificateVerificationPage />}
              />

              {/* Public Legal & Policy Pages */}
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/user-agreement" element={<UserAgreementPage />} />
              <Route path="/data-protection" element={<DataProtectionPage />} />
              <Route path="/cookie-policy" element={<CookiePolicyPage />} />
              <Route path="/grievance-policy" element={<GrievancePolicyPage />} />
              <Route path="/certificate-policy" element={<CertificatePolicyPage />} />

              {/* Protected Application Layer */}
              <Route element={<RootLayout />}>
                {/* 1. Student-Only Routes */}
                <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
                  <Route
                    path="/dashboard/student"
                    element={<StudentDashboard />}
                  />
                  <Route path="/attendance" element={<AttendancePage />} />
                  <Route
                    path="/skills-projects"
                    element={<SkillsProjectsPage />}
                  />
                  <Route
                    path="/resume-builder"
                    element={<ResumeBuilderPage />}
                  />
                  <Route
                    path="/ai-assistant"
                    element={<AIAssistantPage />}
                  />
                </Route>

                {/* 2. Faculty / Instructor Routes */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={['FACULTY', 'HOD', 'ADMIN', 'COORDINATOR']}
                    />
                  }
                >
                  <Route
                    path="/dashboard/faculty"
                    element={<FacultyDashboard />}
                  />
                  <Route
                    path="/attendance/qr"
                    element={<FacultyAttendanceQRPage />}
                  />
                  <Route
                    path="/faculty/attendance-qr"
                    element={<FacultyAttendanceQRPage />}
                  />
                  <Route
                    path="/faculty/certificates"
                    element={<CertificateVaultPage />}
                  />
                </Route>

                {/* 3. HOD Routes */}
                <Route element={<ProtectedRoute allowedRoles={['HOD', 'ADMIN']} />}>
                  <Route path="/dashboard/hod" element={<HODDashboard />} />
                </Route>

                {/* 4. Placement Officer Routes */}
                <Route
                  element={
                    <ProtectedRoute allowedRoles={['PLACEMENT_OFFICER', 'ADMIN']} />
                  }
                >
                  <Route
                    path="/dashboard/placement"
                    element={<PlacementDashboard />}
                  />
                  <Route path="/placement/jobs" element={<CareerHubPage />} />
                  <Route
                    path="/placement/applications"
                    element={<CareerHubPage />}
                  />
                </Route>

                {/* 5. Institutional Admin & CMS Routes (Moved to AdminLayout below) */}

                {/* 6. Shared Authenticated Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/scholarships" element={<ScholarshipsPage />} />
                  <Route path="/career" element={<CareerHubPage />} />
                  <Route
                    path="/announcements"
                    element={<AnnouncementsPage />}
                  />
                  <Route
                    path="/certificates"
                    element={<CertificateVaultPage />}
                  />
                  <Route path="/timetable" element={<Navigate to="/events" replace />} />
                  <Route path="/exam-results" element={<ExamResultsPage />} />
                  <Route path="/grievances" element={<GrievanceCenterPage />} />
                  <Route path="/security" element={<SecuritySettingsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Route>
              </Route>

              {/* Admin Operating System Layer */}
              <Route element={<AdminLayout />}>
                <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR', 'COORDINATOR']} />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/dashboard/admin" element={<Navigate to="/admin/dashboard" replace />} />
                  
                  {/* Administrative Portals */}
                  <Route path="/admin/scholarships" element={<ScholarshipsPage />} />
                  <Route path="/admin/career" element={<CareerHubPage />} />
                  <Route path="/admin/announcements" element={<AnnouncementsPage />} />
                  <Route path="/admin/approvals" element={<CertificateVaultPage />} />
                  <Route path="/admin/timetable" element={<Navigate to="/admin/events" replace />} />
                  <Route path="/admin/results" element={<ExamResultsPage />} />
                  <Route path="/admin/grievances" element={<GrievanceCenterPage />} />
                  <Route path="/admin/events" element={<EventsPage />} />
                  <Route path="/admin/audit" element={<AdminAuditLogs />} />
                  <Route path="/admin/students" element={<UserManagement />} />
                  <Route path="/admin/faculty" element={<UserManagement />} />
                  <Route path="/admin/departments" element={<DepartmentManagement />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                </Route>
              </Route>

              {/* 404 Catch-All Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </BrandingProvider>
  </AuthProvider>
  );
};

export default App;
