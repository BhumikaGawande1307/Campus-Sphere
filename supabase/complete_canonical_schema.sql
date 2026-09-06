-- 001_extensions.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- 002_users_and_profiles.sql
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('STUDENT', 'FACULTY', 'HOD', 'ADMIN', 'PLACEMENT_OFFICER', 'COORDINATOR', 'MENTOR', 'ALUMNI', 'EMPLOYER_VERIFIER', 'SUPER_ADMIN', 'ADMINISTRATOR');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  role user_role NOT NULL DEFAULT 'STUDENT',
  phone_number TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number TEXT DEFAULT '';
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
EXCEPTION WHEN OTHERS THEN null; END $$;

CREATE OR REPLACE VIEW public.profiles AS
  SELECT id, email, username, first_name, last_name, role::text, phone_number, avatar_url, bio, is_active, created_at, updated_at
  FROM public.users;


-- 003_roles_permissions.sql
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  category TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '';
  ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '';
EXCEPTION WHEN OTHERS THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);


-- 004_academic_structure.sql
CREATE TABLE IF NOT EXISTS public.departments (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  hod_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subjects (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  department_id BIGINT REFERENCES public.departments(id) ON DELETE CASCADE,
  semester INT NOT NULL DEFAULT 1 CHECK (semester BETWEEN 1 AND 8),
  credits NUMERIC(3,1) NOT NULL DEFAULT 3.0,
  type TEXT NOT NULL DEFAULT 'THEORY',
  is_elective BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.class_batches (
  id BIGSERIAL PRIMARY KEY,
  department_id BIGINT REFERENCES public.departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  semester INT NOT NULL DEFAULT 1,
  academic_year TEXT NOT NULL DEFAULT '2025-2026'
);


-- 005_students_faculty.sql
CREATE TABLE IF NOT EXISTS public.students (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL UNIQUE,
  department_id BIGINT REFERENCES public.departments(id) ON DELETE SET NULL,
  course TEXT DEFAULT 'B.Tech in Computer Science',
  year INT DEFAULT 1 CHECK (year BETWEEN 1 AND 4),
  semester INT DEFAULT 1 CHECK (semester BETWEEN 1 AND 8),
  division TEXT DEFAULT 'A',
  cgpa NUMERIC(4,2) DEFAULT 0,
  points INT DEFAULT 0,
  engagement_score INT DEFAULT 50,
  placement_readiness_score INT DEFAULT 50,
  events_attended_count INT DEFAULT 0,
  github_url TEXT DEFAULT '',
  linkedin_url TEXT DEFAULT '',
  portfolio_url TEXT DEFAULT '',
  portfolio_slug TEXT UNIQUE,
  is_portfolio_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.faculty (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  faculty_id TEXT NOT NULL UNIQUE,
  department_id BIGINT REFERENCES public.departments(id) ON DELETE SET NULL,
  designation TEXT NOT NULL DEFAULT 'Assistant Professor',
  office_room TEXT,
  specialization TEXT,
  joining_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_subject_enrollments (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id BIGINT REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id BIGINT REFERENCES public.class_batches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_student_subject_class UNIQUE (student_id, subject_id, class_id)
);


-- 006_attendance.sql
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id BIGINT REFERENCES public.subjects(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  department_id BIGINT REFERENCES public.departments(id) ON DELETE SET NULL,
  class_id BIGINT REFERENCES public.class_batches(id) ON DELETE SET NULL,
  semester INT DEFAULT 1,
  division TEXT DEFAULT 'A',
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 minutes'),
  status TEXT DEFAULT 'active',
  current_token_hash TEXT DEFAULT '',
  token_version INT DEFAULT 1,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  location_radius INT DEFAULT 50,
  topic_covered TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'present',
  verification_method TEXT DEFAULT 'QR_SCAN',
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  device_id TEXT,
  risk_score INT DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_session_student UNIQUE (session_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.attendance_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  attendance_record_id UUID REFERENCES public.attendance_records(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 007_timetable.sql
CREATE TABLE IF NOT EXISTS public.timetable (
  id BIGSERIAL PRIMARY KEY,
  department_id BIGINT REFERENCES public.departments(id) ON DELETE CASCADE,
  semester INT NOT NULL DEFAULT 1,
  division TEXT NOT NULL DEFAULT 'A',
  class_name TEXT DEFAULT '',
  day_of_week TEXT NOT NULL DEFAULT 'Monday',
  day_number INT DEFAULT 1,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id BIGINT REFERENCES public.subjects(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  room TEXT NOT NULL DEFAULT 'C-101',
  room_number TEXT DEFAULT 'C-101',
  building TEXT DEFAULT 'Main Block',
  color_theme TEXT DEFAULT 'blue',
  type TEXT DEFAULT 'LECTURE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS room_number TEXT DEFAULT 'C-101';
  ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS building TEXT DEFAULT 'Main Block';
  ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS class_name TEXT DEFAULT '';
  ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS color_theme TEXT DEFAULT 'blue';
EXCEPTION WHEN OTHERS THEN null; END $$;

CREATE OR REPLACE FUNCTION public.sync_timetable_room()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.room IS NOT NULL AND (NEW.room_number IS NULL OR NEW.room_number = '') THEN
    NEW.room_number := NEW.room;
  ELSIF NEW.room_number IS NOT NULL AND (NEW.room IS NULL OR NEW.room = '') THEN
    NEW.room := NEW.room_number;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_timetable_room ON public.timetable;
CREATE TRIGGER trg_timetable_room BEFORE INSERT OR UPDATE ON public.timetable
FOR EACH ROW EXECUTE FUNCTION public.sync_timetable_room();


-- 008_examinations_results.sql
CREATE TABLE IF NOT EXISTS public.examinations (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'END_TERM',
  department_id BIGINT REFERENCES public.departments(id) ON DELETE CASCADE,
  semester INT NOT NULL DEFAULT 1,
  academic_year TEXT NOT NULL DEFAULT '2025-2026',
  start_date DATE,
  end_date DATE,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id BIGINT REFERENCES public.examinations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject_id BIGINT REFERENCES public.subjects(id) ON DELETE CASCADE,
  marks_obtained NUMERIC(5,2) NOT NULL DEFAULT 0,
  max_marks NUMERIC(5,2) NOT NULL DEFAULT 100,
  grade TEXT DEFAULT 'A',
  grade_points NUMERIC(3,1) DEFAULT 8.0,
  status TEXT NOT NULL DEFAULT 'PASS',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_exam_student_subject UNIQUE (examination_id, student_id, subject_id)
);


-- 009_grievances.sql
DO $$ BEGIN
  CREATE TYPE grievance_status AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_STUDENT', 'RESOLVED', 'CLOSED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE grievance_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.grievances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subject TEXT DEFAULT '',
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Academic',
  subcategory TEXT,
  priority grievance_priority NOT NULL DEFAULT 'MEDIUM',
  status grievance_status NOT NULL DEFAULT 'OPEN',
  submitted_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  department_id BIGINT REFERENCES public.departments(id) ON DELETE SET NULL,
  attachments JSONB,
  preferred_contact TEXT DEFAULT 'EMAIL',
  reference_number TEXT,
  resolution_summary TEXT,
  rating INT,
  rating_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

DO $$ BEGIN
  ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT '';
  ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS subcategory TEXT;
  ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS preferred_contact TEXT DEFAULT 'EMAIL';
  ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS reference_number TEXT;
  ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS resolution_summary TEXT;
  ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS rating INT;
  ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS rating_feedback TEXT;
EXCEPTION WHEN OTHERS THEN null; END $$;

CREATE OR REPLACE FUNCTION public.sync_grievance_title_subject()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.title IS NOT NULL AND (NEW.subject IS NULL OR NEW.subject = '') THEN
    NEW.subject := NEW.title;
  ELSIF NEW.subject IS NOT NULL AND (NEW.title IS NULL OR NEW.title = '') THEN
    NEW.title := NEW.subject;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_grievance_title_subject ON public.grievances;
CREATE TRIGGER trg_sync_grievance_title_subject BEFORE INSERT OR UPDATE ON public.grievances
FOR EACH ROW EXECUTE FUNCTION public.sync_grievance_title_subject();

CREATE TABLE IF NOT EXISTS public.grievance_comments (
  id BIGSERIAL PRIMARY KEY,
  grievance_id UUID NOT NULL REFERENCES public.grievances(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  attachments JSONB,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 010_scholarships.sql
DO $$ BEGIN
  CREATE TYPE scholarship_status AS ENUM ('ACTIVE', 'CLOSED', 'AWARDED', 'UPCOMING', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.scholarships (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  provider TEXT NOT NULL,
  description TEXT NOT NULL,
  amount TEXT NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  eligibility_criteria TEXT,
  required_documents TEXT,
  category TEXT NOT NULL DEFAULT 'Merit-Based',
  status scholarship_status NOT NULL DEFAULT 'ACTIVE',
  external_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scholarship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id BIGINT NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES public.students(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  submitted_documents JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_scholarship_user UNIQUE (scholarship_id, user_id)
);


-- 011_events.sql
DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED', 'DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  department_id BIGINT REFERENCES public.departments(id) ON DELETE SET NULL,
  venue TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  registration_deadline TIMESTAMPTZ,
  capacity INT DEFAULT 100,
  points INT DEFAULT 0,
  banner_url TEXT,
  organizer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status event_status NOT NULL DEFAULT 'UPCOMING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'REGISTERED',
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attended_at TIMESTAMPTZ,
  CONSTRAINT unique_event_user UNIQUE (event_id, user_id)
);


-- 012_announcements_notifications.sql
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'SYSTEM',
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  department_id BIGINT REFERENCES public.departments(id) ON DELETE SET NULL,
  target_audience user_role[],
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'NORMAL',
  is_pinned BOOLEAN DEFAULT FALSE,
  attachments JSONB,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS department_id BIGINT;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'NORMAL';
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS attachments JSONB;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;
EXCEPTION WHEN OTHERS THEN null; END $$;


-- 013_documents_storage.sql
CREATE TABLE IF NOT EXISTS public.certificates (
  id BIGSERIAL PRIMARY KEY,
  certificate_uid TEXT UNIQUE NOT NULL DEFAULT ('CERT-' || upper(substr(md5(random()::text), 1, 12))),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_profile_id BIGINT REFERENCES public.students(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Certification',
  issuer TEXT NOT NULL DEFAULT 'CampusSphere',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  credential_url TEXT,
  image_url TEXT,
  file_url TEXT,
  file_size INT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  rejection_reason TEXT,
  points_awarded INT DEFAULT 0,
  is_public BOOLEAN DEFAULT FALSE,
  verified_by_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS certificate_uid TEXT DEFAULT ('CERT-' || upper(substr(md5(random()::text), 1, 12)));
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Certification';
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS student_profile_id BIGINT;
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS issuer TEXT DEFAULT 'CampusSphere';
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS issue_date DATE DEFAULT CURRENT_DATE;
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS expiry_date DATE;
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS credential_url TEXT;
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS image_url TEXT;
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS file_url TEXT;
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS file_size INT;
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS points_awarded INT DEFAULT 0;
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS verified_by_id UUID;
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
EXCEPTION WHEN OTHERS THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.skills (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES public.students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  proficiency TEXT DEFAULT 'INTERMEDIATE',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
  ALTER TABLE public.skills ALTER COLUMN student_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.projects (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  technologies TEXT NOT NULL,
  team_members TEXT,
  github_link TEXT,
  demo_link TEXT,
  faculty_mentor TEXT,
  status TEXT DEFAULT 'Development',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
  ALTER TABLE public.projects ALTER COLUMN student_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN null; END $$;


-- 014_system_settings_audit_logs.sql
-- Safely drop old empty system_settings table if it lacks 'id' primary key
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'system_settings'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'system_settings' AND column_name = 'id'
  ) THEN
    DROP TABLE public.system_settings CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.system_settings (
  id INT PRIMARY KEY DEFAULT 1,
  hero_title TEXT NOT NULL DEFAULT 'The Intelligent Operating Platform for Modern University Campus Life',
  hero_description TEXT NOT NULL DEFAULT 'Empowering students to verify cryptographic credentials and manage academics.',
  hero_badge TEXT NOT NULL DEFAULT 'Next-Gen University Operating System',
  primary_cta_text TEXT NOT NULL DEFAULT 'Launch Student Hub',
  secondary_cta_text TEXT NOT NULL DEFAULT 'Explore Opportunities',
  stats_students TEXT NOT NULL DEFAULT '4,200+',
  stats_attendance TEXT NOT NULL DEFAULT '99.4%',
  stats_placements TEXT NOT NULL DEFAULT '96%',
  stats_scholarships TEXT NOT NULL DEFAULT '₹1.2 Cr+',
  faqs JSONB NOT NULL DEFAULT '[]'::jsonb,
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  academic_year TEXT NOT NULL DEFAULT '2025-2026',
  current_semester INT NOT NULL DEFAULT 1,
  attendance_threshold NUMERIC(4,2) NOT NULL DEFAULT 75.0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default settings
INSERT INTO public.system_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  previous_state JSONB,
  new_state JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 015_rls_policies.sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievance_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR', 'HOD', 'COORDINATOR')
  );
$$;

DROP POLICY IF EXISTS "allow_read_departments" ON public.departments;
CREATE POLICY "allow_read_departments" ON public.departments FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_read_subjects" ON public.subjects;
CREATE POLICY "allow_read_subjects" ON public.subjects FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_read_timetable" ON public.timetable;
CREATE POLICY "allow_read_timetable" ON public.timetable FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_manage_timetable" ON public.timetable;
CREATE POLICY "allow_manage_timetable" ON public.timetable FOR ALL USING (public.is_admin_or_staff());

DROP POLICY IF EXISTS "allow_read_events" ON public.events;
CREATE POLICY "allow_read_events" ON public.events FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_manage_events" ON public.events;
CREATE POLICY "allow_manage_events" ON public.events FOR ALL USING (public.is_admin_or_staff());

DROP POLICY IF EXISTS "allow_read_scholarships" ON public.scholarships;
CREATE POLICY "allow_read_scholarships" ON public.scholarships FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_manage_scholarships" ON public.scholarships;
CREATE POLICY "allow_manage_scholarships" ON public.scholarships FOR ALL USING (public.is_admin_or_staff());

DROP POLICY IF EXISTS "allow_read_announcements" ON public.announcements;
CREATE POLICY "allow_read_announcements" ON public.announcements FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_read_system_settings" ON public.system_settings;
CREATE POLICY "allow_read_system_settings" ON public.system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_update_system_settings" ON public.system_settings;
CREATE POLICY "allow_update_system_settings" ON public.system_settings FOR UPDATE USING (public.is_admin_or_staff());

DROP POLICY IF EXISTS "allow_read_users" ON public.users;
CREATE POLICY "allow_read_users" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_update_own_user" ON public.users;
CREATE POLICY "allow_update_own_user" ON public.users FOR UPDATE USING (auth.uid() = id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "allow_read_students" ON public.students;
CREATE POLICY "allow_read_students" ON public.students FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_insert_students" ON public.students;
CREATE POLICY "allow_insert_students" ON public.students FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "allow_update_students" ON public.students;
CREATE POLICY "allow_update_students" ON public.students FOR UPDATE USING (auth.uid() = user_id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "allow_read_certificates" ON public.certificates;
CREATE POLICY "allow_read_certificates" ON public.certificates FOR SELECT USING (
  student_id = auth.uid() OR is_public = true OR public.is_admin_or_staff()
);

DROP POLICY IF EXISTS "allow_insert_own_certificate" ON public.certificates;
CREATE POLICY "allow_insert_own_certificate" ON public.certificates FOR INSERT WITH CHECK (
  student_id = auth.uid() OR public.is_admin_or_staff()
);

DROP POLICY IF EXISTS "allow_update_certificate" ON public.certificates;
CREATE POLICY "allow_update_certificate" ON public.certificates FOR UPDATE USING (
  student_id = auth.uid() OR public.is_admin_or_staff()
);

DROP POLICY IF EXISTS "allow_delete_certificate" ON public.certificates;
CREATE POLICY "allow_delete_certificate" ON public.certificates FOR DELETE USING (
  student_id = auth.uid() OR public.is_admin_or_staff()
);

DROP POLICY IF EXISTS "allow_read_grievances" ON public.grievances;
CREATE POLICY "allow_read_grievances" ON public.grievances FOR SELECT USING (
  submitted_by = auth.uid() OR assigned_to = auth.uid() OR public.is_admin_or_staff()
);

DROP POLICY IF EXISTS "allow_insert_grievances" ON public.grievances;
CREATE POLICY "allow_insert_grievances" ON public.grievances FOR INSERT WITH CHECK (
  submitted_by = auth.uid() OR public.is_admin_or_staff()
);

DROP POLICY IF EXISTS "allow_update_grievances" ON public.grievances;
CREATE POLICY "allow_update_grievances" ON public.grievances FOR UPDATE USING (
  submitted_by = auth.uid() OR assigned_to = auth.uid() OR public.is_admin_or_staff()
);

DROP POLICY IF EXISTS "allow_read_roles" ON public.roles;
CREATE POLICY "allow_read_roles" ON public.roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_read_permissions" ON public.permissions;
CREATE POLICY "allow_read_permissions" ON public.permissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_read_role_permissions" ON public.role_permissions;
CREATE POLICY "allow_read_role_permissions" ON public.role_permissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_read_user_roles" ON public.user_roles;
CREATE POLICY "allow_read_user_roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "allow_read_skills" ON public.skills;
CREATE POLICY "allow_read_skills" ON public.skills FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_manage_skills" ON public.skills;
CREATE POLICY "allow_manage_skills" ON public.skills FOR ALL TO authenticated 
USING (
  auth.uid() = user_id OR 
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()) OR 
  public.is_admin_or_staff()
)
WITH CHECK (
  auth.uid() = user_id OR 
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()) OR 
  public.is_admin_or_staff()
);

DROP POLICY IF EXISTS "allow_read_projects" ON public.projects;
CREATE POLICY "allow_read_projects" ON public.projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_manage_projects" ON public.projects;
CREATE POLICY "allow_manage_projects" ON public.projects FOR ALL TO authenticated 
USING (
  auth.uid() = user_id OR 
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()) OR 
  public.is_admin_or_staff()
)
WITH CHECK (
  auth.uid() = user_id OR 
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()) OR 
  public.is_admin_or_staff()
);


-- 016_functions_triggers.sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role user_role;
  v_dept_id BIGINT;
  v_student_id TEXT;
  v_faculty_id TEXT;
  v_role_record RECORD;
BEGIN
  BEGIN
    v_role := CAST(COALESCE(NEW.raw_user_meta_data->>'role', 'STUDENT') AS user_role);
  EXCEPTION WHEN OTHERS THEN
    v_role := 'STUDENT';
  END;

  INSERT INTO public.users (
    id, email, username, first_name, last_name, role, phone_number, is_active, created_at, updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    v_role,
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    TRUE,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = CASE WHEN EXCLUDED.first_name <> '' THEN EXCLUDED.first_name ELSE users.first_name END,
    last_name = CASE WHEN EXCLUDED.last_name <> '' THEN EXCLUDED.last_name ELSE users.last_name END,
    role = EXCLUDED.role,
    updated_at = NOW();

  IF v_role = 'STUDENT' THEN
    v_student_id := COALESCE(
      NEW.raw_user_meta_data->>'student_id',
      'CS2026' || lpad(floor(random() * 9000 + 1000)::text, 4, '0')
    );
    
    v_dept_id := (NEW.raw_user_meta_data->>'department_id')::bigint;
    IF v_dept_id IS NULL THEN
      SELECT id INTO v_dept_id FROM public.departments ORDER BY id ASC LIMIT 1;
    END IF;

    INSERT INTO public.students (
      user_id, student_id, department_id, course, year, semester, division, cgpa, points
    ) VALUES (
      NEW.id,
      v_student_id,
      v_dept_id,
      COALESCE(NEW.raw_user_meta_data->>'course', 'B.Tech in Computer Science'),
      COALESCE((NEW.raw_user_meta_data->>'year')::int, 1),
      COALESCE((NEW.raw_user_meta_data->>'semester')::int, 1),
      COALESCE(NEW.raw_user_meta_data->>'division', 'A'),
      COALESCE((NEW.raw_user_meta_data->>'cgpa')::numeric, 0),
      100
    ) ON CONFLICT (user_id) DO NOTHING;
  END IF;

  IF v_role IN ('FACULTY', 'HOD') THEN
    v_faculty_id := COALESCE(
      NEW.raw_user_meta_data->>'faculty_id',
      'FAC2026' || lpad(floor(random() * 900 + 100)::text, 3, '0')
    );

    v_dept_id := (NEW.raw_user_meta_data->>'department_id')::bigint;
    IF v_dept_id IS NULL THEN
      SELECT id INTO v_dept_id FROM public.departments ORDER BY id ASC LIMIT 1;
    END IF;

    INSERT INTO public.faculty (
      user_id, faculty_id, department_id, designation
    ) VALUES (
      NEW.id,
      v_faculty_id,
      v_dept_id,
      COALESCE(NEW.raw_user_meta_data->>'designation', 'Assistant Professor')
    ) ON CONFLICT (user_id) DO NOTHING;
  END IF;

  SELECT id INTO v_role_record FROM public.roles WHERE name = v_role::text LIMIT 1;
  IF v_role_record IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, v_role_record.id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 017_data_reconciliation.sql
-- Seed Departments
INSERT INTO public.departments (name, code, description) VALUES
  ('Computer Science & Engineering', 'CSE', 'Core Computer Science, Software Engineering and AI'),
  ('Information Technology & Data Science', 'ITDS', 'Information Architecture, Cloud and Analytics'),
  ('Electronics & Communication', 'ECE', 'Embedded Systems, IoT and VLSI Design'),
  ('Mechanical Engineering', 'MECH', 'Thermodynamics, Robotics and Manufacturing'),
  ('Civil Engineering', 'CIVIL', 'Structural Engineering and Infrastructure')
ON CONFLICT (code) DO NOTHING;

-- Seed Roles
INSERT INTO public.roles (name, description) VALUES
  ('SUPER_ADMIN', 'Unrestricted administrative authority across institutional platform'),
  ('ADMIN', 'Full institutional administration and ERP management access'),
  ('FACULTY', 'Academic, attendance, grading and course coordination privileges'),
  ('HOD', 'Departmental management, course supervision, and academic approvals'),
  ('COORDINATOR', 'Event, fellowship, and student organization coordination'),
  ('STUDENT', 'Enrolled student with self-service academic and credential access')
ON CONFLICT (name) DO NOTHING;

-- Seed Permissions
INSERT INTO public.permissions (code, name, category) VALUES
  ('students.view', 'View Student Directories', 'Academics'),
  ('students.create', 'Enroll New Students', 'Academics'),
  ('students.update', 'Modify Student Profiles', 'Academics'),
  ('students.deactivate', 'Deactivate Student Accounts', 'Academics'),
  ('faculty.view', 'View Faculty Directory', 'Faculty'),
  ('faculty.manage', 'Manage Faculty Profiles & Departments', 'Faculty'),
  ('timetable.view', 'View Academic Timetable', 'Academics'),
  ('timetable.manage', 'Schedule & Edit Timetable Slots', 'Academics'),
  ('attendance.view', 'View Attendance Records', 'Attendance'),
  ('attendance.manage', 'Record & Override Attendance Sessions', 'Attendance'),
  ('results.view', 'View Semester Results', 'Examinations'),
  ('results.manage', 'Record Exam Scores & SGPA', 'Examinations'),
  ('results.publish', 'Publish Official Examination Results', 'Examinations'),
  ('grievances.view', 'View Support & Grievance Tickets', 'Services'),
  ('grievances.assign', 'Assign Grievance to Staff', 'Services'),
  ('grievances.resolve', 'Resolve & Close Grievance Tickets', 'Services'),
  ('scholarships.view', 'Browse Scholarships', 'Scholarships'),
  ('scholarships.manage', 'Create & Review Scholarship Applications', 'Scholarships'),
  ('events.view', 'Browse Campus Events', 'Events'),
  ('events.manage', 'Publish Events & Manage Attendees', 'Events'),
  ('documents.view', 'Inspect Credential Documents', 'Credentials'),
  ('documents.manage', 'Verify & Approve Certificate Vault Entries', 'Credentials'),
  ('audit_logs.view', 'Inspect Institutional Audit Logs', 'Administration'),
  ('system_settings.manage', 'Configure CMS & Platform Parameters', 'Administration'),
  ('users.manage', 'Assign Roles & Permissions', 'Administration')
ON CONFLICT (code) DO NOTHING;

-- Assign all permissions to ADMIN & SUPER_ADMIN
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name IN ('ADMIN', 'SUPER_ADMIN')
ON CONFLICT DO NOTHING;

-- Heal existing students missing student record
INSERT INTO public.students (user_id, student_id, department_id, course, year, semester, division, cgpa, points)
SELECT 
  u.id,
  'CS2026' || lpad(floor(random() * 9000 + 1000)::text, 4, '0'),
  1,
  'B.Tech in Computer Science',
  1,
  1,
  'A',
  8.0,
  100
FROM public.users u
LEFT JOIN public.students s ON s.user_id = u.id
WHERE u.role = 'STUDENT' AND s.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Assign ADMIN role permissions to existing admin users
INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM public.users u
JOIN public.roles r ON r.name = 'ADMIN'
WHERE u.role IN ('ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR')
ON CONFLICT (user_id, role_id) DO NOTHING;


