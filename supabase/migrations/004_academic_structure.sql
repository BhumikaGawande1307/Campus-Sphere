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
