-- 018_admin_fixes.sql
-- ==============================================================================
-- CAMPUSSPHERE — COMPLETE ADMIN & ROSTER INTEGRITY FIX
-- ==============================================================================

-- 1. Helper Security Functions (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR', 'HOD', 'COORDINATOR')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_faculty_or_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR', 'HOD', 'COORDINATOR', 'FACULTY')
  );
$$;

-- 2. EVENTS TABLE: Ensure columns & RLS policies
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS max_participants INT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS points_reward INT;

-- Sync capacity and max_participants
UPDATE public.events SET max_participants = capacity WHERE max_participants IS NULL AND capacity IS NOT NULL;
UPDATE public.events SET points_reward = points WHERE points_reward IS NULL AND points IS NOT NULL;

-- Trigger to keep capacity and max_participants in sync
CREATE OR REPLACE FUNCTION public.sync_event_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.capacity IS NULL AND NEW.max_participants IS NOT NULL THEN
    NEW.capacity := NEW.max_participants;
  ELSIF NEW.max_participants IS NULL AND NEW.capacity IS NOT NULL THEN
    NEW.max_participants := NEW.capacity;
  END IF;
  
  IF NEW.points IS NULL AND NEW.points_reward IS NOT NULL THEN
    NEW.points := NEW.points_reward;
  ELSIF NEW.points_reward IS NULL AND NEW.points IS NOT NULL THEN
    NEW.points_reward := NEW.points;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_event_columns ON public.events;
CREATE TRIGGER trg_sync_event_columns
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.sync_event_columns();

-- Events RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_read_events" ON public.events;
CREATE POLICY "allow_read_events" ON public.events FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_manage_events" ON public.events;
CREATE POLICY "allow_manage_events" ON public.events FOR ALL 
USING (public.is_faculty_or_admin())
WITH CHECK (public.is_faculty_or_admin());

-- 3. TIMETABLE TABLE: Ensure missing columns & RLS policies
ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS batch TEXT DEFAULT 'All';
ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'A';
ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2025-2026';
ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS building TEXT DEFAULT 'Main Block';
ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS class_name TEXT DEFAULT 'Class A';
ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS division TEXT DEFAULT 'A';
ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS color_theme TEXT DEFAULT 'blue';
ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'LECTURE';

-- Timetable RLS
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_read_timetable" ON public.timetable;
CREATE POLICY "allow_read_timetable" ON public.timetable FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_manage_timetable" ON public.timetable;
CREATE POLICY "allow_manage_timetable" ON public.timetable FOR ALL 
USING (public.is_faculty_or_admin())
WITH CHECK (public.is_faculty_or_admin());

-- 4. DEPARTMENTS & SUBJECTS: Full Admin Management
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_read_departments" ON public.departments;
CREATE POLICY "allow_read_departments" ON public.departments FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_manage_departments" ON public.departments;
CREATE POLICY "allow_manage_departments" ON public.departments FOR ALL 
USING (public.is_admin_or_staff())
WITH CHECK (public.is_admin_or_staff());

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_read_subjects" ON public.subjects;
CREATE POLICY "allow_read_subjects" ON public.subjects FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_manage_subjects" ON public.subjects;
CREATE POLICY "allow_manage_subjects" ON public.subjects FOR ALL 
USING (public.is_admin_or_staff())
WITH CHECK (public.is_admin_or_staff());

-- 5. FACULTY TABLE: Schema & Policies
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS faculty_id TEXT;
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS office_room TEXT;
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT 'Assistant Professor';
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS specialization TEXT DEFAULT 'General';
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS joining_date DATE DEFAULT CURRENT_DATE;

ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_read_faculty" ON public.faculty;
CREATE POLICY "allow_read_faculty" ON public.faculty FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_manage_faculty" ON public.faculty;
CREATE POLICY "allow_manage_faculty" ON public.faculty FOR ALL 
USING (public.is_admin_or_staff())
WITH CHECK (public.is_admin_or_staff());

-- 6. ANNOUNCEMENTS: Admin, Faculty & Staff Publishing
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_read_announcements" ON public.announcements;
CREATE POLICY "allow_read_announcements" ON public.announcements FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_manage_announcements" ON public.announcements;
CREATE POLICY "allow_manage_announcements" ON public.announcements FOR ALL 
USING (public.is_faculty_or_admin())
WITH CHECK (public.is_faculty_or_admin());

-- 7. AUDIT LOGS: Allow Insert for All Authenticated Users, Select for Admins
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_insert_audit_logs" ON public.audit_logs;
CREATE POLICY "allow_insert_audit_logs" ON public.audit_logs FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "allow_read_audit_logs" ON public.audit_logs;
CREATE POLICY "allow_read_audit_logs" ON public.audit_logs FOR SELECT 
USING (public.is_admin_or_staff());

-- 8. SYSTEM SETTINGS: Allow Read for Everyone, Upsert/Update for Admins
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_read_system_settings" ON public.system_settings;
CREATE POLICY "allow_read_system_settings" ON public.system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_manage_system_settings" ON public.system_settings;
CREATE POLICY "allow_manage_system_settings" ON public.system_settings FOR ALL 
USING (public.is_admin_or_staff())
WITH CHECK (public.is_admin_or_staff());

-- 9. EXAMINATIONS & EXAM RESULTS: Schema & RLS Policies
ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_read_examinations" ON public.examinations;
CREATE POLICY "allow_read_examinations" ON public.examinations FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_manage_examinations" ON public.examinations;
CREATE POLICY "allow_manage_examinations" ON public.examinations FOR ALL 
USING (public.is_faculty_or_admin())
WITH CHECK (public.is_faculty_or_admin());

ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_read_exam_results" ON public.exam_results;
CREATE POLICY "allow_read_exam_results" ON public.exam_results FOR SELECT 
USING (
  student_id = auth.uid() OR public.is_faculty_or_admin()
);

DROP POLICY IF EXISTS "allow_manage_exam_results" ON public.exam_results;
CREATE POLICY "allow_manage_exam_results" ON public.exam_results FOR ALL 
USING (public.is_faculty_or_admin())
WITH CHECK (public.is_faculty_or_admin());

-- 10. EVENT & MASTERCLASS ATTENDANCE SYSTEM
DO $$
BEGIN
  -- If event_id exists in attendance_sessions and is not UUID, drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendance_sessions' AND column_name = 'event_id' AND data_type != 'uuid'
  ) THEN
    ALTER TABLE public.attendance_sessions DROP COLUMN event_id CASCADE;
  END IF;

  -- If event_id exists in attendance_records and is not UUID, drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendance_records' AND column_name = 'event_id' AND data_type != 'uuid'
  ) THEN
    ALTER TABLE public.attendance_records DROP COLUMN event_id CASCADE;
  END IF;

  -- Make subject_id and class_id nullable for event attendance sessions
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendance_sessions' AND column_name = 'subject_id'
  ) THEN
    ALTER TABLE public.attendance_sessions ALTER COLUMN subject_id DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendance_sessions' AND column_name = 'class_id'
  ) THEN
    ALTER TABLE public.attendance_sessions ALTER COLUMN class_id DROP NOT NULL;
  END IF;
END $$;

ALTER TABLE public.attendance_sessions ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

-- Attendance Sessions RLS
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_read_attendance_sessions" ON public.attendance_sessions;
CREATE POLICY "allow_read_attendance_sessions" ON public.attendance_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_manage_attendance_sessions" ON public.attendance_sessions;
CREATE POLICY "allow_manage_attendance_sessions" ON public.attendance_sessions FOR ALL 
USING (public.is_faculty_or_admin())
WITH CHECK (public.is_faculty_or_admin());

-- Attendance Records RLS
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_read_attendance_records" ON public.attendance_records;
CREATE POLICY "allow_read_attendance_records" ON public.attendance_records FOR SELECT 
USING (student_id = auth.uid() OR public.is_faculty_or_admin());

DROP POLICY IF EXISTS "allow_student_checkin_records" ON public.attendance_records;
CREATE POLICY "allow_student_checkin_records" ON public.attendance_records FOR INSERT 
WITH CHECK (student_id = auth.uid() OR public.is_faculty_or_admin());

DROP POLICY IF EXISTS "allow_manage_attendance_records" ON public.attendance_records;
CREATE POLICY "allow_manage_attendance_records" ON public.attendance_records FOR ALL 
USING (public.is_faculty_or_admin())
WITH CHECK (public.is_faculty_or_admin());

-- Event Registrations Check-In Update RLS
DROP POLICY IF EXISTS "allow_student_checkin_event_registration" ON public.event_registrations;
CREATE POLICY "allow_student_checkin_event_registration" ON public.event_registrations FOR UPDATE 
USING (user_id = auth.uid() OR public.is_faculty_or_admin())
WITH CHECK (user_id = auth.uid() OR public.is_faculty_or_admin());

