-- 002_users_and_profiles.sql
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('STUDENT', 'FACULTY', 'HOD', 'ADMIN', 'PLACEMENT_OFFICER', 'COORDINATOR', 'MENTOR', 'ALUMNI', 'EMPLOYER_VERIFIER', 'SUPER_ADMIN', 'ADMINISTRATOR');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  role user_role NOT NULL DEFAULT 'STUDENT',
  phone_number TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number TEXT DEFAULT '';
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
EXCEPTION WHEN OTHERS THEN null; END $$;

CREATE OR REPLACE VIEW public.profiles AS
  SELECT id, email, username, first_name, last_name, role::text, phone_number, avatar_url, bio, is_active, created_at, updated_at
  FROM public.users;
