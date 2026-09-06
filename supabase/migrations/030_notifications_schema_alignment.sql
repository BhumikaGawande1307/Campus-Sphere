-- 030_notifications_schema_alignment.sql
-- Ensure canonical column names on notifications table (type, action_url)
-- Provide backward compatibility for any legacy payloads

DO $$ BEGIN
  ALTER TABLE public.notifications 
    ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'SYSTEM';

  ALTER TABLE public.notifications 
    ADD COLUMN IF NOT EXISTS action_url TEXT DEFAULT '/announcements';
EXCEPTION WHEN OTHERS THEN null; END $$;

-- Backfill from legacy columns if they exist
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'notification_type'
  ) THEN
    UPDATE public.notifications 
    SET type = notification_type 
    WHERE type = 'SYSTEM' AND notification_type IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'link'
  ) THEN
    UPDATE public.notifications 
    SET action_url = link 
    WHERE action_url IS NULL AND link IS NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN null; END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON public.notifications(user_id, is_read);