-- 020_grievance_schema_cleanup.sql

-- Drop the sync trigger and function
DROP TRIGGER IF EXISTS trg_sync_grievance_title_subject ON public.grievances;
DROP FUNCTION IF EXISTS public.sync_grievance_title_subject();

-- Drop the redundant subject column (we use title as the single source of truth)
ALTER TABLE public.grievances DROP COLUMN IF EXISTS subject;
