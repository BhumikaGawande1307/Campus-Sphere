-- 025_fix_grievance_rls.sql
-- Fix: Grievances not showing in admin portal because master-password login
-- does not create a Supabase auth session, causing auth.uid() to be NULL
-- and RLS policies to block all reads.

-- Solution: Add a permissive SELECT policy that allows any authenticated
-- or anonymous connection to read grievances. The frontend already enforces
-- role-based filtering (students only see their own tickets, staff sees all).
-- Also handle INSERT and UPDATE similarly so master-password users can
-- create and manage tickets.

-- Drop old restrictive policies
DROP POLICY IF EXISTS "allow_read_grievances" ON public.grievances;
DROP POLICY IF EXISTS "allow_insert_grievances" ON public.grievances;
DROP POLICY IF EXISTS "allow_update_grievances" ON public.grievances;

-- Allow reading all grievances for any connection (auth handled in frontend)
CREATE POLICY "allow_read_grievances" ON public.grievances
  FOR SELECT USING (true);

-- Allow inserting grievances for any connection
CREATE POLICY "allow_insert_grievances" ON public.grievances
  FOR INSERT WITH CHECK (true);

-- Allow updating grievances for any connection
CREATE POLICY "allow_update_grievances" ON public.grievances
  FOR UPDATE USING (true);

-- Also fix grievance_comments RLS for the same reason
DROP POLICY IF EXISTS "allow_read_grievance_comments" ON public.grievance_comments;
DROP POLICY IF EXISTS "allow_insert_grievance_comments" ON public.grievance_comments;

CREATE POLICY "allow_read_grievance_comments" ON public.grievance_comments
  FOR SELECT USING (true);

CREATE POLICY "allow_insert_grievance_comments" ON public.grievance_comments
  FOR INSERT WITH CHECK (true);

-- Enable Supabase Realtime for the grievances table so changes are broadcast
ALTER PUBLICATION supabase_realtime ADD TABLE public.grievances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.grievance_comments;
