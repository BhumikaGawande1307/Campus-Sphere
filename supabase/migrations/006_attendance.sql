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
