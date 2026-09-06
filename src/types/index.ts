export type UserRole =
  | 'STUDENT'
  | 'FACULTY'
  | 'HOD'
  | 'ADMIN'
  | 'PLACEMENT_OFFICER'
  | 'COORDINATOR'
  | 'MENTOR'
  | 'ALUMNI'
  | 'EMPLOYER_VERIFIER'
  | 'SUPER_ADMIN'
  | 'ADMINISTRATOR';

export interface User {
  id: number | string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  department_id?: number | string;
  phone_number?: string;
  avatar?: string;
  avatar_url?: string;
  is_verified?: boolean;
  is_active?: boolean;
  date_joined?: string;
  permissions?: string[];
}

export interface LoginCredentials {
  username?: string;
  email?: string;
  password?: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
  phone_number?: string;
  student_id?: string;
  department?: number | string;
  year?: number;
  semester?: number;
  course?: string;
  division?: string;
  cgpa?: number;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh?: string;
  message?: string;
}

export type LoginResponse = AuthResponse;

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  hod_name?: string;
}

export interface StudentProfile {
  id: number;
  user: User;
  user_id?: string | number;
  student_id: string;
  roll_number?: string;
  department_id?: number;
  department: Department;
  course: string;
  year: number;
  semester: number;
  division: string;
  cgpa: number;
  phone?: string;
  phone_number?: string;
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  resume_url?: string;
  resume_data?: any;
  bio?: string;
  points: number;
  engagement_score: number;
  placement_readiness_score: number;
  events_attended_count?: number;
  is_portfolio_public?: boolean;
  portfolio_slug?: string;
}

export interface FacultyProfile {
  id: number;
  user: User;
  employee_id: string;
  department: Department;
  designation: string;
  qualification?: string;
  specialization?: string;
}

// --------------------------------------------------------
// EVENTS & DYNAMIC REGISTRATION
// --------------------------------------------------------

export type EventCategory =
  | 'Technical Workshop'
  | 'Hackathon'
  | 'Guest Lecture'
  | 'Cultural Event'
  | 'Sports Competition'
  | 'Seminar'
  | 'Career Fair'
  | 'Webinar'
  | 'Workshop'
  | 'Competition'
  | 'Academic'
  | 'Industrial Visit';

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'date';

export interface EventFormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  help_text?: string;
}

export interface Event {
  id: number | string;
  title: string;
  description: string;
  category: EventCategory;
  department?: Department;
  department_id?: number;
  venue: string;
  banner?: string;
  banner_url?: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  max_participants: number;
  registered_count: number;
  checked_in_count?: number;
  eligibility?: string;
  rules?: string;
  contact_person: string;
  contact_email: string;
  points_reward: number;
  status: EventStatus;
  organizer?: User;
  organizer_id?: string | number;
  is_registered?: boolean;
  is_checked_in?: boolean;
  attendance_code?: string;
  qr_code?: string;
  qr_active_token?: string;
  qr_expires_at?: string;
  custom_fields?: EventFormField[];
}

export type EventRegistrationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ATTENDED'
  | 'CANCELLED'
  | 'REGISTERED'
  | 'CHECKED_IN';

export interface EventRegistrationRecord {
  id: string | number;
  event_id: string | number;
  event?: Event;
  user_id?: string;
  user?: User;
  student_id?: number | string;
  student?: any;
  registration_data?: Record<string, any>;
  status: EventRegistrationStatus | string;
  registered_at: string;
  checked_in_at?: string;
  attended_at?: string;
  reviewed_by?: string;
  remarks?: string;
}

export type RegistrationStatus = EventRegistrationStatus;
export type Registration = EventRegistrationRecord;

// --------------------------------------------------------
// ATTENDANCE MANAGEMENT SYSTEM TYPES
// --------------------------------------------------------

export interface Subject {
  id: number;
  department_id: number;
  department?: Department;
  faculty_id?: string | number;
  faculty?: FacultyProfile | User;
  name: string;
  code: string;
  semester: number;
  credits: number;
  created_at?: string;
}

export interface ClassBatch {
  id: number;
  department_id: number;
  name: string;
  semester: number;
  academic_year: string;
}

export interface StudentSubjectEnrollment {
  id: number;
  student_id: number;
  student?: StudentProfile;
  subject_id: number;
  subject?: Subject;
  class_id?: number;
  class_batch?: ClassBatch;
  created_at?: string;
}

export type SessionStatus = 'scheduled' | 'active' | 'closed' | 'expired' | 'cancelled';

export interface AttendanceSession {
  id: number;
  faculty_id: string | number;
  faculty?: FacultyProfile | User;
  department_id: number;
  department?: Department;
  subject_id?: number;
  subject?: Subject;
  event_id?: number | string;
  event?: Event;
  class_id?: number;
  class_batch?: ClassBatch;
  session_date: string;
  start_time: string;
  end_time: string;
  expires_at: string;
  status: SessionStatus;
  current_token_hash: string;
  token_version: number;
  topic_covered?: string;
  latitude?: number;
  longitude?: number;
  location_radius?: number;
  created_at: string;
  closed_at?: string;
  present_count?: number;
  total_enrolled?: number;
}

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused' | 'rejected';
export type VerificationMethod = 'QR_SCAN' | 'MANUAL' | 'BIOMETRIC' | 'RFID';

export interface AttendanceRecord {
  id: number;
  session_id?: number;
  session?: AttendanceSession;
  event_id?: number | string;
  event?: Event;
  student_id?: number;
  student?: StudentProfile;
  marked_at: string;
  status: AttendanceStatus;
  verification_method: VerificationMethod;
  latitude?: number;
  longitude?: number;
  device_id?: string;
  ip_hash?: string;
  risk_score?: number;
  remarks?: string;
  marked_by?: User;
  created_at?: string;
  updated_at?: string;
}

export type AttendanceAuditAction =
  | 'attendance_marked'
  | 'attendance_rejected'
  | 'attendance_modified'
  | 'attendance_deleted'
  | 'session_created'
  | 'session_closed'
  | 'manual_override'
  | 'suspicious_scan';

export interface AttendanceAuditLog {
  id: number;
  attendance_record_id?: number;
  session_id?: number;
  actor_id: string | number;
  actor?: User;
  action: AttendanceAuditAction;
  reason?: string;
  metadata?: any;
  created_at: string;
}

export interface SubjectAttendanceStat {
  subject_id: number;
  subject_name: string;
  subject_code: string;
  faculty_name: string;
  total_classes: number;
  attended_classes: number;
  late_classes: number;
  percentage: number;
  status: 'GOOD' | 'WARNING' | 'CRITICAL';
  classes_needed_for_75: number;
}

export interface StudentAttendanceSummary {
  overall_percentage: number;
  total_sessions: number;
  present_sessions: number;
  late_sessions: number;
  subject_stats: SubjectAttendanceStat[];
  defaulter_alert: boolean;
}

// --------------------------------------------------------
// CREDENTIALS & CERTIFICATES
// --------------------------------------------------------

export type CertificateCategory =
  | 'Certification'
  | 'Academic'
  | 'Internship'
  | 'Hackathon'
  | 'Identity'
  | 'Research'
  | 'Volunteering'
  | 'Sports'
  | 'Cultural'
  | 'Workshop'
  | 'Competition'
  | 'Course'
  | 'Other';

export type CertificateStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Certificate {
  id: number;
  student?: StudentProfile;
  student_id?: number;
  title: string;
  category: CertificateCategory;
  issuer: string;
  issue_date: string;
  expiry_date?: string;
  credential_url?: string;
  image_url?: string;
  file_url?: string;
  description?: string;
  file?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  certificate_uid: string;
  sha256_hash?: string;
  status: CertificateStatus;
  rejection_reason?: string;
  points_awarded?: number;
  is_public?: boolean;
  tags?: string[];
  verified_by?: User;
  verified_by_id?: string | null;
  verified_at?: string;
  created_at: string;
  updated_at?: string;
}

export type SkillProficiency = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export type SkillCategory =
  | 'Programming'
  | 'Web Development'
  | 'Database'
  | 'Data Science'
  | 'Cloud'
  | 'DevOps'
  | 'Mobile'
  | 'Design'
  | 'Soft Skills'
  | 'Cybersecurity'
  | 'Communication'
  | 'Leadership'
  | 'Management'
  | 'Technical'
  | 'Other';

export interface Skill {
  id: number;
  student?: StudentProfile;
  student_id?: number;
  name: string;
  category: SkillCategory;
  proficiency: SkillProficiency;
  endorsements_count?: number;
  is_verified: boolean;
  created_at?: string;
}

export type ProjectStatus =
  | 'Idea'
  | 'Planning'
  | 'Development'
  | 'Testing'
  | 'In Progress'
  | 'Completed'
  | 'Published';

export interface Project {
  id: number;
  student?: StudentProfile;
  student_id?: number;
  title: string;
  description: string;
  technologies: string;
  team_members?: string;
  github_link?: string;
  demo_link?: string;
  faculty_mentor?: string;
  status: ProjectStatus;
  created_at: string;
}

// --------------------------------------------------------
// SCHOLARSHIPS & FINANCIAL OPPORTUNITIES
// --------------------------------------------------------

export type ScholarshipCategory =
  | 'Merit-Based'
  | 'Need-Based'
  | 'Women in Tech'
  | 'Research & Innovation'
  | 'Minority / Diversity'
  | 'International / Exchange'
  | 'Sports & Leadership'
  | 'Government'
  | 'Corporate Endowment';

export type ScholarshipStatus = 'ACTIVE' | 'UPCOMING' | 'CLOSED' | 'ARCHIVED';

export type ScholarshipApplicationStatus =
  | 'INTERESTED'
  | 'PREPARING'
  | 'APPLIED'
  | 'SUBMITTED'
  | 'SELECTED'
  | 'REJECTED';

export interface Scholarship {
  id: number;
  title: string;
  provider: string;
  amount: string;
  category: ScholarshipCategory;
  deadline: string;
  eligibility_cgpa?: number;
  department_id?: number;
  department_name?: string;
  academic_level?: string;
  description: string;
  benefits: string;
  requirements: string;
  application_process: string;
  official_link: string;
  required_documents: string[];
  status: ScholarshipStatus;
  is_featured?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ScholarshipBookmark {
  id: number;
  student_id?: number | string;
  user_id?: string;
  scholarship_id: number;
  scholarship?: Scholarship;
  status: ScholarshipApplicationStatus;
  raw_db_status?: string;
  has_applied?: boolean;
  notes?: string;
  admin_notes?: string;
  submitted_documents?: any;
  created_at: string;
  updated_at: string;
}

// --------------------------------------------------------
// CAREER HUB & JOBS
// --------------------------------------------------------

export type JobType = 'FULL_TIME' | 'INTERNSHIP' | 'PART_TIME' | 'CONTRACT';
export type ApplicationStatus = 'APPLIED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'INTERVIEWED' | 'SELECTED' | 'REJECTED';

export interface Company {
  id: number;
  name: string;
  logo?: string;
  website?: string;
  location?: string;
  description?: string;
}

export interface JobPosting {
  id: number;
  company?: Company;
  company_id?: number;
  company_name?: string;
  title: string;
  job_type: JobType;
  stipend_salary: string;
  location: string;
  description: string;
  requirements?: string;
  required_skills?: string;
  deadline: string;
  min_cgpa?: number;
  openings?: number;
  is_active: boolean;
  is_applied?: boolean;
}

export interface Application {
  id: number;
  job?: JobPosting;
  student?: StudentProfile;
  job_id: number;
  student_id: number;
  resume_url?: string;
  cover_letter?: string;
  status: ApplicationStatus;
  applied_at: string;
  updated_at?: string;
}

// --------------------------------------------------------
// ANNOUNCEMENTS & NOTIFICATIONS
// --------------------------------------------------------

export type AnnouncementPriority = 'NORMAL' | 'IMPORTANT' | 'URGENT';
export type AnnouncementCategory =
  | 'College announcement'
  | 'Department announcement'
  | 'Placement announcement'
  | 'Scholarship notice'
  | 'Exam schedule'
  | 'General';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  author?: User;
  author_id?: string | number;
  is_pinned?: boolean;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: string;
  title: string;
  message: string;
  notification_type: 'EVENT' | 'CERTIFICATE' | 'INTERNSHIP' | 'SCHOLARSHIP' | 'SYSTEM';
  is_read: boolean;
  created_at: string;
}

// --------------------------------------------------------
// ADMIN CMS, PERMISSIONS & AUDIT LOGS
// --------------------------------------------------------

export interface SiteSettings {
  hero_title: string;
  hero_description: string;
  hero_badge: string;
  primary_cta_text: string;
  secondary_cta_text: string;
  stats_students: string;
  stats_attendance: string;
  stats_placements: string;
  stats_scholarships: string;
  faqs: Array<{ question: string; answer: string }>;
  announcement_banner?: string;
  maintenance_mode: boolean;
  academic_year?: string;
  current_semester?: number;
  attendance_threshold?: number;
  branding_config?: any;
}

export type PermissionCode =
  | 'events.create'
  | 'events.edit'
  | 'events.delete'
  | 'events.view'
  | 'event_registrations.manage'
  | 'scholarships.create'
  | 'scholarships.edit'
  | 'scholarships.delete'
  | 'jobs.create'
  | 'jobs.edit'
  | 'announcements.create'
  | 'attendance.manage'
  | 'certificates.review'
  | 'analytics.view'
  | 'users.manage';

export interface CoordinatorPermission {
  user_id: string | number;
  permissions: PermissionCode[];
}

export type AuditActionType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'PUBLISH'
  | 'UNPUBLISH'
  | 'APPROVE'
  | 'REJECT'
  | 'ROLE_CHANGE'
  | 'PERMISSION_CHANGE'
  | 'CMS_UPDATE'
  | 'LOGIN';

export interface AuditLog {
  id: number;
  actor_id: string | number;
  actor_name: string;
  actor_role: UserRole;
  action: AuditActionType;
  entity: string;
  entity_id: string | number;
  details: string;
  old_value?: any;
  new_value?: any;
  timestamp: string;
  ip_address?: string;
}

// --------------------------------------------------------
// AI CAREER COPILOT & ACTION PLAN
// --------------------------------------------------------

export interface CareerActionItem {
  id: string;
  text: string;
  category: 'SKILL' | 'PROJECT' | 'CERTIFICATION' | 'APPLICATION' | 'GENERAL';
  is_completed: boolean;
  created_at: string;
}

export interface CareerActionPlan {
  student_id: number;
  target_role: string;
  items: CareerActionItem[];
  updated_at: string;
}

export interface AISkillGapAnalysis {
  target_role: string;
  match_percentage: number;
  possessed_skills: string[];
  missing_skills: string[];
  recommended_courses: string[];
  recommended_certifications: string[];
  recommended_projects: string[];
  recommended_events: Event[];
  recommended_scholarships?: Scholarship[];
  action_plan?: CareerActionItem[];
}

export interface StudentDashboardData {
  profile: StudentProfile;
  stats: {
    total_activities: number;
    events_participated: number;
    certificates_count: number;
    achievements_count: number;
    skills_count: number;
    projects_count: number;
    internships_applied: number;
    attendance_rate: number;
    points: number;
    engagement_score: number;
    placement_readiness_score: number;
  };
  upcoming_events: Event[];
  latest_certificates: Certificate[];
  recommended_opportunities: JobPosting[];
  achievement_timeline: Array<{
    id: number;
    title: string;
    description: string;
    date_achieved: string;
    badge_title: string;
    icon_name: string;
  }>;
  notifications: any[];
}

export interface AdminAnalyticsData {
  total_students: number;
  active_students?: number;
  total_faculty: number;
  total_events: number;
  total_registrations: number;
  attendance_rate: number;
  certificates_issued: number;
  scholarships_active: number;
  internship_applications: number;
  department_participation: { name: string; students: number; events?: number }[];
  skill_distribution: { name: string; count: number }[];
  placement_trends?: { month: string; placed: number; offers: number }[];
  monthly_activity: { month: string; events: number; certificates: number }[];
}

// ========================================================
// 1. GRIEVANCE & SUPPORT TICKETING TYPES
// ========================================================

export type GrievanceCategory =
  | 'Academic'
  | 'Examination'
  | 'Attendance'
  | 'Scholarship'
  | 'Finance'
  | 'Placement'
  | 'Events'
  | 'Documents'
  | 'Hostel & Facilities'
  | 'Technical'
  | 'Other';

export type GrievancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type GrievanceStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_STUDENT'
  | 'AWAITING_STUDENT'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED';

export interface GrievanceAttachment {
  url: string;
  name?: string;
  type?: string;
  size?: number;
}

export interface GrievanceMessage {
  id: number | string;
  ticket_id: number | string;
  sender_id: string;
  sender_role: UserRole;
  sender_name: string;
  message: string;
  attachment_url?: string;
  attachments?: GrievanceAttachment[];
  is_internal_note?: boolean;
  created_at: string;
}

export interface GrievanceTicket {
  id: string | number;
  ticket_uid: string;
  ticket_number?: string;
  submitted_by?: string;
  student_id?: number | string;
  student?: any;
  department_id?: number;
  department?: Department;
  assigned_to_id?: string;
  assigned_to?: any;
  assigned?: any;
  category: GrievanceCategory;
  subcategory?: string;
  title: string;
  description: string;
  priority: GrievancePriority;
  status: GrievanceStatus;
  preferred_contact?: 'EMAIL' | 'PHONE' | 'IN_PERSON';
  reference_number?: string;
  attachment_url?: string;
  attachments?: GrievanceAttachment[];
  resolution_summary?: string;
  rating?: number;
  rating_feedback?: string;
  sla_deadline?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  messages?: GrievanceMessage[];
}

// ========================================================
// 2. ACADEMIC TIMETABLE & SCHEDULING TYPES
// ========================================================

export type TimetableDay =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

export interface TimetableSlot {
  id: number;
  subject_id: number;
  subject_code: string;
  subject_name: string;
  department_id: number;
  class_id?: number;
  class_name: string;
  faculty_id: string;
  faculty_name: string;
  day_of_week: TimetableDay;
  start_time: string; // e.g. "09:30"
  end_time: string;   // e.g. "10:30"
  room_number: string; // e.g. "C-204"
  building: string;    // e.g. "Computing Block A"
  color_theme?: string;
}

export interface ConflictValidationResult {
  hasConflict: boolean;
  reason?: string;
  conflictingSlot?: TimetableSlot;
}

// ========================================================
// 3. SEMESTER EXAMINATION RESULTS & SGPA LEDGER TYPES
// ========================================================

export type LetterGrade = 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'P' | 'F';

export interface SubjectResult {
  id: number;
  student_id: number;
  semester: number;
  academic_year: string;
  subject_code: string;
  subject_name: string;
  credits: number;
  internal_marks: number;
  practical_marks: number;
  end_term_marks: number;
  total_marks: number;
  grade: LetterGrade;
  grade_point: number;
  credit_points: number;
  status: 'PASS' | 'FAIL' | 'ABSENT';
  is_locked: boolean;
  remarks?: string;
}

export interface SemesterResultSummary {
  id: number;
  student_id: number;
  semester: number;
  academic_year: string;
  total_credits_registered: number;
  total_credits_earned: number;
  sgpa: number;
  cumulative_cgpa: number;
  status: 'PASSED' | 'PROMOTED' | 'WITHHELD';
  published_at: string;
  is_published: boolean;
  subjects?: SubjectResult[];
}

// ========================================================
// 4. MULTI-FACTOR AUTHENTICATION (MFA / TOTP) TYPES
// ========================================================

export interface UserMFAConfig {
  user_id: string;
  is_mfa_enabled: boolean;
  totp_secret: string;
  totp_qr_url: string;
  backup_recovery_codes: string[];
  created_at: string;
  last_used_at?: string;
}

export interface ActiveSession {
  id: string;
  user_id: string;
  device_name: string;
  device?: string;
  ip_address: string;
  location: string;
  is_current: boolean;
  last_active_at: string;
  last_active?: string;
}

// ========================================================
// 5. OFFICIAL TRANSCRIPT & BONAFIDE CERTIFICATE TYPES
// ========================================================

export interface OfficialDocumentRecord {
  id: number;
  document_uid: string;
  document_type: 'TRANSCRIPT' | 'BONAFIDE' | 'DEGREE_AUDIT' | 'COURSE_COMPLETION';
  student_id: number;
  student_name: string;
  department_name: string;
  course_name: string;
  issue_date: string;
  status: 'VALID' | 'REVOKED' | 'EXPIRED';
  purpose?: string;
  sha256_hash: string;
  qr_payload: string;
  metadata?: Record<string, any>;
}




