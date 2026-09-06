-- 013_documents_storage.sql
CREATE TABLE IF NOT EXISTS public.certificates (
  id BIGSERIAL PRIMARY KEY,
  certificate_uid TEXT UNIQUE NOT NULL DEFAULT ('CERT-' || upper(substr(md5(random()::text), 1, 12))),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_profile_id BIGINT REFERENCES public.students(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Certification',
  issuer TEXT NOT NULL DEFAULT 'CampusSphere',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  credential_url TEXT,
  image_url TEXT,
  file_url TEXT,
  file_size INT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  rejection_reason TEXT,
  points_awarded INT DEFAULT 0,
  is_public BOOLEAN DEFAULT FALSE,
  verified_by_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS certificate_uid TEXT DEFAULT ('CERT-' || upper(substr(md5(random()::text), 1, 12)));
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Certification';
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS student_profile_id BIGINT;
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS issuer TEXT DEFAULT 'CampusSphere';
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS issue_date DATE DEFAULT CURRENT_DATE;
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS expiry_date DATE;
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS credential_url TEXT;
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS image_url TEXT;
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS file_url TEXT;
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS file_size INT;
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS points_awarded INT DEFAULT 0;
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS verified_by_id UUID;
  ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
EXCEPTION WHEN OTHERS THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.skills (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES public.students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  proficiency TEXT DEFAULT 'INTERMEDIATE',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
  ALTER TABLE public.skills ALTER COLUMN student_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.projects (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  technologies TEXT NOT NULL,
  team_members TEXT,
  github_link TEXT,
  demo_link TEXT,
  faculty_mentor TEXT,
  status TEXT DEFAULT 'Development',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
  ALTER TABLE public.projects ALTER COLUMN student_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN null; END $$;
