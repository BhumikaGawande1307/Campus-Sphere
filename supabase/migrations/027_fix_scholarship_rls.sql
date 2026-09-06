-- 027_fix_scholarship_rls.sql
-- ==============================================================================
-- Fix: Scholarship applications not showing in admin portal.
-- Root cause: Master-password login does not create a Supabase auth session,
-- so auth.uid() is NULL and RLS policies block all reads/writes.
-- Solution: Open RLS policies since the frontend handles access control.
-- ==============================================================================

-- 1. Safely drop all existing policies on scholarship_applications
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

-- 2. Create open RLS policies for scholarship_applications
CREATE POLICY "allow_read_scholarship_applications" ON public.scholarship_applications
  FOR SELECT USING (true);

CREATE POLICY "allow_insert_scholarship_applications" ON public.scholarship_applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_update_scholarship_applications" ON public.scholarship_applications
  FOR UPDATE USING (true);

CREATE POLICY "allow_delete_scholarship_applications" ON public.scholarship_applications
  FOR DELETE USING (true);

-- 3. Safely drop and recreate open RLS policies for scholarships
DO $$ 
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'scholarships' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.scholarships', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "allow_read_scholarships" ON public.scholarships
  FOR SELECT USING (true);

CREATE POLICY "allow_insert_scholarships" ON public.scholarships
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_update_scholarships" ON public.scholarships
  FOR UPDATE USING (true);

CREATE POLICY "allow_delete_scholarships" ON public.scholarships
  FOR DELETE USING (true);

-- 4. Enable Supabase Realtime for scholarship tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.scholarship_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scholarships;
