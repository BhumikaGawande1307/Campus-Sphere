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
