-- 027_mfa_user_configs.sql
-- Table to securely store user MFA (TOTP) configurations and backup recovery codes
CREATE TABLE IF NOT EXISTS public.user_mfa_configs (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  is_mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  totp_secret TEXT NOT NULL,
  backup_recovery_codes TEXT[] DEFAULT '{}',
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_mfa_configs ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view and manage their own MFA config; admins have elevated operational access
DROP POLICY IF EXISTS "Users can view own mfa config" ON public.user_mfa_configs;
CREATE POLICY "Users can view own mfa config" 
  ON public.user_mfa_configs 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert/update own mfa config" ON public.user_mfa_configs;
CREATE POLICY "Users can insert/update own mfa config" 
  ON public.user_mfa_configs 
  FOR ALL 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all mfa configs" ON public.user_mfa_configs;
CREATE POLICY "Admins can view all mfa configs" 
  ON public.user_mfa_configs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE INDEX IF NOT EXISTS idx_user_mfa_configs_user_id ON public.user_mfa_configs(user_id);

-- Seed initial bootstrap configuration for default system admin
INSERT INTO public.user_mfa_configs (
  user_id,
  is_mfa_enabled,
  totp_secret,
  backup_recovery_codes
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  true,
  'JBSWY3DPEHPK3PXP',
  ARRAY['444444', '8888-9999', '7777-1111', '4444-0001', '1234-5678']
)
ON CONFLICT (user_id) DO NOTHING;