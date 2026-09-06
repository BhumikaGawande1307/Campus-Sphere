-- ============================================================================
-- CAMPUSSPHERE: PRODUCTION-GRADE ATTENDANCE MANAGEMENT SYSTEM MIGRATION
-- ============================================================================

-- 1. Create Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
  id BIGSERIAL PRIMARY KEY,
  department_id BIGINT REFERENCES departments(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  semester INT NOT NULL DEFAULT 1,
  credits INT NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Class Batches Table
CREATE TABLE IF NOT EXISTS class_batches (
  id BIGSERIAL PRIMARY KEY,
  department_id BIGINT REFERENCES departments(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  semester INT NOT NULL DEFAULT 1,
  academic_year VARCHAR(50) NOT NULL DEFAULT '2025-2026'
);

-- 3. Create Student Subject Enrollments Table
CREATE TABLE IF NOT EXISTS student_subject_enrollments (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
  subject_id BIGINT REFERENCES subjects(id) ON DELETE CASCADE,
  class_id BIGINT REFERENCES class_batches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_student_subject_class UNIQUE (student_id, subject_id, class_id)
);

-- 4. Create Attendance Sessions Table
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id BIGSERIAL PRIMARY KEY,
  faculty_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id BIGINT REFERENCES departments(id) ON DELETE CASCADE,
  subject_id BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id BIGINT REFERENCES class_batches(id) ON DELETE SET NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('scheduled', 'active', 'closed', 'expired', 'cancelled')),
  current_token_hash VARCHAR(255) NOT NULL,
  token_version INT NOT NULL DEFAULT 1,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  location_radius INT DEFAULT 50, -- in meters
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- 5. Create Attendance Records Table (with strict UNIQUE constraint)
CREATE TABLE IF NOT EXISTS attendance_records (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'late', 'absent', 'excused', 'rejected')),
  verification_method VARCHAR(20) NOT NULL DEFAULT 'QR_SCAN' CHECK (verification_method IN ('QR_SCAN', 'MANUAL', 'BIOMETRIC', 'RFID')),
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  device_id VARCHAR(255),
  ip_hash VARCHAR(255),
  risk_score INT DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_student_session_attendance UNIQUE (session_id, student_id)
);

-- 6. Create Attendance Audit Logs Table
CREATE TABLE IF NOT EXISTS attendance_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  attendance_record_id BIGINT REFERENCES attendance_records(id) ON DELETE SET NULL,
  session_id BIGINT REFERENCES attendance_sessions(id) ON DELETE SET NULL,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN (
    'attendance_marked',
    'attendance_rejected',
    'attendance_modified',
    'attendance_deleted',
    'session_created',
    'session_closed',
    'manual_override',
    'suspicious_scan'
  )),
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_faculty ON attendance_sessions(faculty_id);
CREATE INDEX IF NOT EXISTS idx_sessions_subject ON attendance_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON attendance_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON attendance_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_records_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_records_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_records_status ON attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON student_subject_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_subject ON student_subject_enrollments(subject_id);
CREATE INDEX IF NOT EXISTS idx_audit_session ON attendance_audit_logs(session_id);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_subject_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_audit_logs ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies
-- Subjects: readable by all authenticated users
CREATE POLICY "Subjects are viewable by authenticated users"
  ON subjects FOR SELECT TO authenticated USING (true);

-- Class Batches: readable by all authenticated users
CREATE POLICY "Class batches are viewable by authenticated users"
  ON class_batches FOR SELECT TO authenticated USING (true);

-- Student Enrollments: readable by student and faculty
CREATE POLICY "Students see own enrollments"
  ON student_subject_enrollments FOR SELECT TO authenticated
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('FACULTY', 'HOD', 'ADMIN'))
  );

-- Attendance Sessions:
CREATE POLICY "Faculty can view and manage their own sessions"
  ON attendance_sessions FOR ALL TO authenticated
  USING (
    faculty_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('HOD', 'ADMIN'))
  );

CREATE POLICY "Students can view active sessions for their enrolled subjects"
  ON attendance_sessions FOR SELECT TO authenticated
  USING (
    status = 'active' OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('FACULTY', 'HOD', 'ADMIN'))
  );

-- Attendance Records:
CREATE POLICY "Students can view own attendance records"
  ON attendance_records FOR SELECT TO authenticated
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM attendance_sessions s
      WHERE s.id = attendance_records.session_id AND (s.faculty_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('HOD', 'ADMIN')))
    )
  );

CREATE POLICY "Faculty can modify attendance for their sessions"
  ON attendance_records FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM attendance_sessions s
      WHERE s.id = attendance_records.session_id AND (s.faculty_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('HOD', 'ADMIN')))
    )
  );

-- Audit Logs:
CREATE POLICY "Audit logs readable by Faculty, HOD, and Admin"
  ON attendance_audit_logs FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('FACULTY', 'HOD', 'ADMIN'))
  );

-- 10. Atomic Server-Side Procedure: mark_attendance_secure
CREATE OR REPLACE FUNCTION mark_attendance_secure(
  p_token VARCHAR,
  p_lat NUMERIC DEFAULT NULL,
  p_lng NUMERIC DEFAULT NULL,
  p_device_id VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_student_id BIGINT;
  v_session RECORD;
  v_is_enrolled BOOLEAN;
  v_existing_id BIGINT;
  v_distance NUMERIC;
  v_record_id BIGINT;
  v_risk_score INT := 0;
BEGIN
  -- 1. Identify Student
  SELECT id INTO v_student_id FROM students WHERE user_id = v_user_id;
  IF v_student_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active student profile associated with this account.');
  END IF;

  -- 2. Find and Validate Active Session by Token Hash
  SELECT * INTO v_session
  FROM attendance_sessions
  WHERE current_token_hash = crypt(p_token, current_token_hash) OR current_token_hash = p_token
  ORDER BY id DESC LIMIT 1;

  IF v_session IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or rotated attendance QR token.');
  END IF;

  IF v_session.status <> 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This attendance session is no longer active (' || v_session.status || ').');
  END IF;

  IF NOW() > v_session.expires_at THEN
    -- Mark session as expired
    UPDATE attendance_sessions SET status = 'expired' WHERE id = v_session.id;
    RETURN jsonb_build_object('success', false, 'error', 'Attendance session has expired.');
  END IF;

  -- 3. Check Enrollment
  SELECT EXISTS (
    SELECT 1 FROM student_subject_enrollments
    WHERE student_id = v_student_id AND subject_id = v_session.subject_id
  ) INTO v_is_enrolled;

  IF NOT v_is_enrolled THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are not enrolled in this course subject.');
  END IF;

  -- 4. Check Duplicate Attendance
  SELECT id INTO v_existing_id
  FROM attendance_records
  WHERE session_id = v_session.id AND student_id = v_student_id;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Attendance already marked for this session.');
  END IF;

  -- 5. Geolocation Haversine Check (if enabled)
  IF v_session.latitude IS NOT NULL AND v_session.longitude IS NOT NULL AND v_session.location_radius IS NOT NULL THEN
    IF p_lat IS NULL OR p_lng IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Location verification is required for this session. Please enable GPS.');
    END IF;

    -- Haversine formula in meters (Earth radius ~ 6,371,000 meters)
    v_distance := 6371000 * 2 * ASIN(SQRT(
      POWER(SIN(RADIANS(p_lat - v_session.latitude) / 2), 2) +
      COS(RADIANS(v_session.latitude)) * COS(RADIANS(p_lat)) *
      POWER(SIN(RADIANS(p_lng - v_session.longitude) / 2), 2)
    ));

    IF v_distance > v_session.location_radius THEN
      -- Log suspicious scan attempt
      INSERT INTO attendance_audit_logs (session_id, actor_id, action, reason, metadata)
      VALUES (
        v_session.id,
        v_user_id,
        'suspicious_scan',
        'Student outside permitted geofence radius (' || ROUND(v_distance) || 'm > ' || v_session.location_radius || 'm)',
        jsonb_build_object('student_id', v_student_id, 'distance', v_distance, 'radius', v_session.location_radius)
      );
      RETURN jsonb_build_object('success', false, 'error', 'Location verification failed. You are outside the lecture hall boundary.');
    END IF;
  END IF;

  -- 6. Insert Verified Attendance Record
  INSERT INTO attendance_records (
    session_id,
    student_id,
    marked_at,
    status,
    verification_method,
    latitude,
    longitude,
    device_id,
    risk_score
  ) VALUES (
    v_session.id,
    v_student_id,
    NOW(),
    'present',
    'QR_SCAN',
    p_lat,
    p_lng,
    p_device_id,
    v_risk_score
  ) RETURNING id INTO v_record_id;

  -- 7. Audit Log
  INSERT INTO attendance_audit_logs (attendance_record_id, session_id, actor_id, action, reason)
  VALUES (v_record_id, v_session.id, v_user_id, 'attendance_marked', 'Verified anti-proxy dynamic QR scan');

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Attendance verified and recorded successfully!',
    'record_id', v_record_id,
    'session_id', v_session.id,
    'marked_at', NOW()
  );
END;
$$;
