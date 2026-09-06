-- 014_system_settings_audit_logs.sql
-- Safely drop old empty system_settings table if it lacks 'id' primary key
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'system_settings'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'system_settings' AND column_name = 'id'
  ) THEN
    DROP TABLE public.system_settings CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.system_settings (
  id INT PRIMARY KEY DEFAULT 1,
  hero_title TEXT NOT NULL DEFAULT 'The Intelligent Operating Platform for Modern University Campus Life',
  hero_description TEXT NOT NULL DEFAULT 'Empowering students to verify cryptographic credentials and manage academics.',
  hero_badge TEXT NOT NULL DEFAULT 'Next-Gen University Operating System',
  primary_cta_text TEXT NOT NULL DEFAULT 'Launch Student Hub',
  secondary_cta_text TEXT NOT NULL DEFAULT 'Explore Opportunities',
  stats_students TEXT NOT NULL DEFAULT '4,200+',
  stats_attendance TEXT NOT NULL DEFAULT '99.4%',
  stats_placements TEXT NOT NULL DEFAULT '96%',
  stats_scholarships TEXT NOT NULL DEFAULT '₹1.2 Cr+',
  faqs JSONB NOT NULL DEFAULT '[]'::jsonb,
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  academic_year TEXT NOT NULL DEFAULT '2025-2026',
  current_semester INT NOT NULL DEFAULT 1,
  attendance_threshold NUMERIC(4,2) NOT NULL DEFAULT 75.0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default settings
INSERT INTO public.system_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  previous_state JSONB,
  new_state JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
