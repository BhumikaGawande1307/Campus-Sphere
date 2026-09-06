-- 024_scholarship_applications_fix.sql
-- ==============================================================================
-- CAMPUSSPHERE — SCHOLARSHIP APPLICATIONS RLS & SCHEMA ALIGNMENT
-- ==============================================================================

-- 1. Ensure columns exist on public.scholarship_applications
DO $$ BEGIN
  ALTER TABLE public.scholarship_applications ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE public.scholarship_applications ADD COLUMN IF NOT EXISTS student_id BIGINT;
  ALTER TABLE public.scholarship_applications ADD COLUMN IF NOT EXISTS submitted_documents JSONB DEFAULT '{}'::jsonb;
EXCEPTION WHEN OTHERS THEN null; END $$;

-- 2. Enable RLS on public.scholarship_applications
ALTER TABLE public.scholarship_applications ENABLE ROW LEVEL SECURITY;

-- 3. Safely drop all existing policies on scholarship_applications to clear any invalid enum casts
DO $$ 
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'scholarship_applications' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.scholarship_applications', pol.policyname);
  END LOOP;
END $$;

-- 4. Recreate clean, robust RLS policies
CREATE POLICY "allow_read_scholarship_applications" ON public.scholarship_applications FOR SELECT 
USING (
  user_id = auth.uid() OR public.is_admin_or_staff()
);

CREATE POLICY "allow_insert_scholarship_applications" ON public.scholarship_applications FOR INSERT 
WITH CHECK (
  user_id = auth.uid() OR public.is_admin_or_staff()
);

CREATE POLICY "allow_update_scholarship_applications" ON public.scholarship_applications FOR UPDATE 
USING (
  user_id = auth.uid() OR public.is_admin_or_staff()
)
WITH CHECK (
  user_id = auth.uid() OR public.is_admin_or_staff()
);

CREATE POLICY "allow_delete_scholarship_applications" ON public.scholarship_applications FOR DELETE 
USING (
  user_id = auth.uid() OR public.is_admin_or_staff()
);

-- 5. Indexes for high-performance candidate pipelines & fast user queries
CREATE INDEX IF NOT EXISTS idx_scholarship_applications_user_id ON public.scholarship_applications (user_id);
CREATE INDEX IF NOT EXISTS idx_scholarship_applications_scholarship_id ON public.scholarship_applications (scholarship_id);
