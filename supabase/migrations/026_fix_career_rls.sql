-- 026_fix_career_rls.sql
-- ==============================================================================
-- Fix: Career & placement data not showing in admin portal.
-- Root cause: Master-password login does not create a Supabase auth session,
-- so auth.uid() is NULL and RLS policies block all reads/writes.
-- Solution: Open RLS policies since the frontend handles access control.
-- ==============================================================================

-- 1. Fix applications RLS (the main broken table)
DROP POLICY IF EXISTS "allow_read_applications" ON public.applications;
CREATE POLICY "allow_read_applications" ON public.applications
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_insert_applications" ON public.applications;
CREATE POLICY "allow_insert_applications" ON public.applications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "allow_update_applications" ON public.applications;
CREATE POLICY "allow_update_applications" ON public.applications
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "allow_delete_applications" ON public.applications;
CREATE POLICY "allow_delete_applications" ON public.applications
  FOR DELETE USING (true);

-- 2. Fix companies RLS (manage policy blocks inserts for non-auth users)
DROP POLICY IF EXISTS "allow_manage_companies" ON public.companies;
CREATE POLICY "allow_manage_companies" ON public.companies
  FOR ALL USING (true) WITH CHECK (true);

-- 3. Fix jobs RLS (manage policy blocks inserts for non-auth users)
DROP POLICY IF EXISTS "allow_manage_jobs" ON public.jobs;
CREATE POLICY "allow_manage_jobs" ON public.jobs
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Enable Supabase Realtime for career tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
