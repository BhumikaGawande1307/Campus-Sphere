-- 022_event_qr_and_attendance.sql
-- Migration to support Event QR codes, attendance check-in codes, banner images, and reliable registration syncing

-- 1. Ensure columns on public.events
DO $$ BEGIN
  ALTER TABLE public.events ADD COLUMN IF NOT EXISTS attendance_code TEXT;
  ALTER TABLE public.events ADD COLUMN IF NOT EXISTS qr_code TEXT;
  ALTER TABLE public.events ADD COLUMN IF NOT EXISTS banner_url TEXT;
EXCEPTION WHEN OTHERS THEN null; END $$;

-- 2. Ensure columns on public.event_registrations
DO $$ BEGIN
  ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
  ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'REGISTERED';
  ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS registration_data JSONB DEFAULT '{}'::jsonb;
  ALTER TABLE public.event_registrations DROP CONSTRAINT IF EXISTS event_registrations_status_check;
  ALTER TABLE public.event_registrations ADD CONSTRAINT event_registrations_status_check 
    CHECK (status IN ('REGISTERED', 'ATTENDED', 'CHECKED_IN', 'CANCELLED', 'REJECTED', 'APPROVED'));
EXCEPTION WHEN OTHERS THEN null; END $$;

-- 3. Ensure event_id exists on attendance_sessions and attendance_records
DO $$ BEGIN
  ALTER TABLE public.attendance_sessions ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;
  ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN null; END $$;

-- 4. Indexes for fast attendance code and session lookup
CREATE INDEX IF NOT EXISTS idx_events_attendance_code ON public.events (attendance_code);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_event_id ON public.attendance_sessions (event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_topic_covered ON public.attendance_sessions (topic_covered);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_user ON public.event_registrations (event_id, user_id);

-- 5. Row Level Security Policies for event_registrations
-- Enable RLS
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Allow reading event registrations:
-- Must be readable so registration counts (e.g. 45/100) and participant rosters work properly
DROP POLICY IF EXISTS "allow_read_event_registrations" ON public.event_registrations;
CREATE POLICY "allow_read_event_registrations" ON public.event_registrations FOR SELECT 
USING (true);

-- Allow authenticated users to register themselves or admins/staff to register participants
DROP POLICY IF EXISTS "allow_insert_event_registrations" ON public.event_registrations;
CREATE POLICY "allow_insert_event_registrations" ON public.event_registrations FOR INSERT 
WITH CHECK (user_id = auth.uid() OR public.is_faculty_or_admin());

-- Allow students to check in or coordinators to update registration status
DROP POLICY IF EXISTS "allow_update_event_registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "allow_student_checkin_event_registration" ON public.event_registrations;
CREATE POLICY "allow_update_event_registrations" ON public.event_registrations FOR UPDATE 
USING (user_id = auth.uid() OR public.is_faculty_or_admin())
WITH CHECK (user_id = auth.uid() OR public.is_faculty_or_admin());

-- Allow students to unenroll or admins to delete registrations
DROP POLICY IF EXISTS "allow_delete_event_registrations" ON public.event_registrations;
CREATE POLICY "allow_delete_event_registrations" ON public.event_registrations FOR DELETE 
USING (user_id = auth.uid() OR public.is_faculty_or_admin());

-- 6. Row Level Security Policies for event attendance
DO $$ BEGIN
  -- Allow reading attendance sessions
  DROP POLICY IF EXISTS "allow_read_attendance_sessions" ON public.attendance_sessions;
  CREATE POLICY "allow_read_attendance_sessions" ON public.attendance_sessions FOR SELECT USING (true);

  -- Allow students to insert attendance records upon QR scan
  DROP POLICY IF EXISTS "allow_student_checkin_records" ON public.attendance_records;
  CREATE POLICY "allow_student_checkin_records" ON public.attendance_records FOR INSERT 
  WITH CHECK (student_id = auth.uid() OR public.is_faculty_or_admin());
EXCEPTION WHEN OTHERS THEN null; END $$;

