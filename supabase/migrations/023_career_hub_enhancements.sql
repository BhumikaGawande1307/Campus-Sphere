-- 023_career_hub_enhancements.sql
-- ==============================================================================
-- CAMPUSSPHERE — CAREER & PLACEMENT HUB ENHANCEMENTS & RLS POLICIES
-- ==============================================================================

-- 1. Ensure required columns exist on public.jobs
DO $$ BEGIN
  ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'FULL_TIME';
  ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS salary_range TEXT;
  ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS company_name TEXT;
  ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS required_skills TEXT;
  ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS min_cgpa NUMERIC(4,2) DEFAULT 7.0;
  ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS openings INT DEFAULT 1;
  ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
EXCEPTION WHEN OTHERS THEN null; END $$;

-- 2. Ensure columns on public.companies
DO $$ BEGIN
  ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url TEXT;
  ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS website TEXT;
  ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS location TEXT;
  ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS description TEXT;
EXCEPTION WHEN OTHERS THEN null; END $$;

-- 3. Ensure columns on public.applications
DO $$ BEGIN
  ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS resume_url TEXT;
  ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS cover_letter TEXT;
  ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS notes TEXT;
EXCEPTION WHEN OTHERS THEN null; END $$;

-- 4. Enable RLS on all three tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- 5. Policies for public.companies
DROP POLICY IF EXISTS "allow_read_companies" ON public.companies;
CREATE POLICY "allow_read_companies" ON public.companies FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_manage_companies" ON public.companies;
CREATE POLICY "allow_manage_companies" ON public.companies FOR ALL 
USING (public.is_admin_or_staff())
WITH CHECK (public.is_admin_or_staff());

-- 6. Policies for public.jobs
DROP POLICY IF EXISTS "allow_read_jobs" ON public.jobs;
CREATE POLICY "allow_read_jobs" ON public.jobs FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_manage_jobs" ON public.jobs;
CREATE POLICY "allow_manage_jobs" ON public.jobs FOR ALL 
USING (public.is_admin_or_staff())
WITH CHECK (public.is_admin_or_staff());

-- 7. Policies for public.applications
DROP POLICY IF EXISTS "allow_read_applications" ON public.applications;
CREATE POLICY "allow_read_applications" ON public.applications FOR SELECT 
USING (
  student_id = auth.uid() OR public.is_admin_or_staff()
);

DROP POLICY IF EXISTS "allow_insert_applications" ON public.applications;
CREATE POLICY "allow_insert_applications" ON public.applications FOR INSERT 
WITH CHECK (
  student_id = auth.uid() OR public.is_admin_or_staff()
);

DROP POLICY IF EXISTS "allow_update_applications" ON public.applications;
CREATE POLICY "allow_update_applications" ON public.applications FOR UPDATE 
USING (
  student_id = auth.uid() OR public.is_admin_or_staff()
);

DROP POLICY IF EXISTS "allow_delete_applications" ON public.applications;
CREATE POLICY "allow_delete_applications" ON public.applications FOR DELETE 
USING (
  student_id = auth.uid() OR public.is_admin_or_staff()
);

-- 8. Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON public.jobs (company_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications (job_id);
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON public.applications (student_id);
