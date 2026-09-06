-- 021_grievance_enhancements.sql
-- Migration to support grievance attachments, resolution tracking, ratings, and comments RLS policies.

-- 1. Ensure columns exist on public.grievances
DO $$ BEGIN
  ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS attachments JSONB;
  ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS resolution_summary TEXT;
  ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS rating INT;
  ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS rating_feedback TEXT;
  ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS preferred_contact TEXT DEFAULT 'EMAIL';
  ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS reference_number TEXT;
  ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ;
EXCEPTION WHEN OTHERS THEN null; END $$;

-- 2. Ensure public.grievance_comments has required columns and indexes
DO $$ BEGIN
  ALTER TABLE public.grievance_comments ADD COLUMN IF NOT EXISTS attachments JSONB;
  ALTER TABLE public.grievance_comments ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN OTHERS THEN null; END $$;

CREATE INDEX IF NOT EXISTS idx_grievance_comments_grievance_id 
ON public.grievance_comments (grievance_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_grievances_submitted_by 
ON public.grievances (submitted_by, created_at DESC);

-- 3. Row Level Security Policies for grievance_comments
ALTER TABLE public.grievance_comments ENABLE ROW LEVEL SECURITY;

-- Allow reading comments:
-- Submitter and assigned staff can read (students see non-internal comments only)
-- Admin & staff can read all comments including internal notes
DROP POLICY IF EXISTS "allow_read_grievance_comments" ON public.grievance_comments;
CREATE POLICY "allow_read_grievance_comments" ON public.grievance_comments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.grievances g
    WHERE g.id = grievance_comments.grievance_id
      AND (
        (g.submitted_by = auth.uid() AND (grievance_comments.is_internal IS NOT TRUE))
        OR g.assigned_to = auth.uid()
        OR public.is_admin_or_staff()
      )
  )
);

-- Allow inserting comments:
-- User must be logged in and be the submitter, assigned staff, or an admin/staff
DROP POLICY IF EXISTS "allow_insert_grievance_comments" ON public.grievance_comments;
CREATE POLICY "allow_insert_grievance_comments" ON public.grievance_comments FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.grievances g
    WHERE g.id = grievance_comments.grievance_id
      AND (
        g.submitted_by = auth.uid()
        OR g.assigned_to = auth.uid()
        OR public.is_admin_or_staff()
      )
  )
);

-- 4. Storage Bucket Setup (if running in environment with storage privileges)
DO $$ BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('grievances', 'grievances', true)
  ON CONFLICT (id) DO NOTHING;

  -- Storage policy to allow authenticated users to upload to grievances
  DROP POLICY IF EXISTS "allow_grievance_upload" ON storage.objects;
  CREATE POLICY "allow_grievance_upload" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'grievances' AND auth.role() = 'authenticated'
  );

  -- Storage policy to allow anyone or authenticated users to view grievances attachments
  DROP POLICY IF EXISTS "allow_grievance_read" ON storage.objects;
  CREATE POLICY "allow_grievance_read" ON storage.objects FOR SELECT USING (
    bucket_id = 'grievances'
  );
EXCEPTION WHEN OTHERS THEN null; END $$;
