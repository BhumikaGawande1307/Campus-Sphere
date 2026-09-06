-- 029_student_resume_and_documents.sql
-- Add resume synchronization columns to students table
-- Ensure indexes and metadata support on certificates for fast QR verification

DO $$ BEGIN
  ALTER TABLE public.students 
    ADD COLUMN IF NOT EXISTS resume_data JSONB DEFAULT NULL;

  ALTER TABLE public.students 
    ADD COLUMN IF NOT EXISTS resume_url TEXT DEFAULT NULL;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.certificates 
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
EXCEPTION WHEN OTHERS THEN null; END $$;

-- Fast index for public verification lookups by certificate_uid
CREATE INDEX IF NOT EXISTS idx_certificates_uid_lookup 
  ON public.certificates(certificate_uid);