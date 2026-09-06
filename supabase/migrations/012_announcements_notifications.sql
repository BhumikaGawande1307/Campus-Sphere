-- 012_announcements_notifications.sql
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'SYSTEM',
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  department_id BIGINT REFERENCES public.departments(id) ON DELETE SET NULL,
  target_audience user_role[],
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'NORMAL',
  is_pinned BOOLEAN DEFAULT FALSE,
  attachments JSONB,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS department_id BIGINT;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'NORMAL';
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS attachments JSONB;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;
EXCEPTION WHEN OTHERS THEN null; END $$;
