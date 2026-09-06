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
