-- 009_grievances.sql
DO $$ BEGIN
  CREATE TYPE grievance_status AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_STUDENT', 'RESOLVED', 'CLOSED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE grievance_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.grievances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subject TEXT DEFAULT '',
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Academic',
  subcategory TEXT,
  priority grievance_priority NOT NULL DEFAULT 'MEDIUM',
  status grievance_status NOT NULL DEFAULT 'OPEN',
  submitted_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  department_id BIGINT REFERENCES public.departments(id) ON DELETE SET NULL,
  attachments JSONB,
  preferred_contact TEXT DEFAULT 'EMAIL',
  reference_number TEXT,
  resolution_summary TEXT,
  rating INT,
  rating_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

DO $$ BEGIN
  ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT '';
  ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS subcategory TEXT;
  ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS preferred_contact TEXT DEFAULT 'EMAIL';
  ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS reference_number TEXT;
  ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS resolution_summary TEXT;
  ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS rating INT;
  ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS rating_feedback TEXT;
EXCEPTION WHEN OTHERS THEN null; END $$;

CREATE OR REPLACE FUNCTION public.sync_grievance_title_subject()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.title IS NOT NULL AND (NEW.subject IS NULL OR NEW.subject = '') THEN
    NEW.subject := NEW.title;
  ELSIF NEW.subject IS NOT NULL AND (NEW.title IS NULL OR NEW.title = '') THEN
    NEW.title := NEW.subject;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_grievance_title_subject ON public.grievances;
CREATE TRIGGER trg_sync_grievance_title_subject BEFORE INSERT OR UPDATE ON public.grievances
FOR EACH ROW EXECUTE FUNCTION public.sync_grievance_title_subject();

CREATE TABLE IF NOT EXISTS public.grievance_comments (
  id BIGSERIAL PRIMARY KEY,
  grievance_id UUID NOT NULL REFERENCES public.grievances(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  attachments JSONB,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
