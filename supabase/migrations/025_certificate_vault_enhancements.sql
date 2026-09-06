-- ========================================================
-- Migration: 025_certificate_vault_enhancements.sql
-- Description: Add missing columns and support metadata for Document Vault
-- ========================================================

-- 1. Safely add missing columns to public.certificates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.certificates ADD COLUMN description TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE public.certificates ADD COLUMN file_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'file_type'
  ) THEN
    ALTER TABLE public.certificates ADD COLUMN file_type TEXT DEFAULT 'application/pdf';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'document_metadata'
  ) THEN
    ALTER TABLE public.certificates ADD COLUMN document_metadata JSONB DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE public.certificates ADD COLUMN verified_at TIMESTAMPTZ;
  END IF;
END $$;

-- 2. Helpful indexes for fast document queries
CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON public.certificates (student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates (status);
CREATE INDEX IF NOT EXISTS idx_certificates_category ON public.certificates (category);
CREATE INDEX IF NOT EXISTS idx_certificates_uid ON public.certificates (certificate_uid);

-- 3. Storage Bucket Configuration for 'certificates'
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. Storage Objects RLS Policies for 'certificates' bucket
DROP POLICY IF EXISTS "Public certificates read access" ON storage.objects;
CREATE POLICY "Public certificates read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificates');

DROP POLICY IF EXISTS "Authenticated users certificates insert" ON storage.objects;
CREATE POLICY "Authenticated users certificates insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'certificates');

DROP POLICY IF EXISTS "Users can delete own certificates in storage" ON storage.objects;
CREATE POLICY "Users can delete own certificates in storage"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'certificates' AND (auth.uid()::text = (storage.foldername(name))[1] OR name LIKE (auth.uid()::text || '%')));
