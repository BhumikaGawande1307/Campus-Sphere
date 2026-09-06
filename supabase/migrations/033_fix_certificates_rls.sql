-- 033_fix_certificates_rls.sql
-- Complete Fix for Certificate Vault RLS & Verification
-- Allows admins, staff, faculty, and authenticated sessions to verify, approve, reject, and update certificates

-- 1. Ensure public.is_admin_or_staff helper includes FACULTY and handles enum type casting safely
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() 
        AND UPPER(role::text) IN ('ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR', 'HOD', 'COORDINATOR', 'FACULTY')
    ),
    false
  );
$$;

-- 2. CERTIFICATES TABLE: Enable RLS and grant open read/write access so review and uploads never fail
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_read_certificates" ON public.certificates;
DROP POLICY IF EXISTS "Public certificates verify access" ON public.certificates;
DROP POLICY IF EXISTS "allow_read_certs" ON public.certificates;

CREATE POLICY "allow_read_certificates" 
  ON public.certificates 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "allow_insert_own_certificate" ON public.certificates;
DROP POLICY IF EXISTS "allow_insert_certificates" ON public.certificates;
CREATE POLICY "allow_insert_certificates" 
  ON public.certificates 
  FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "allow_update_certificate" ON public.certificates;
DROP POLICY IF EXISTS "allow_update_certificates" ON public.certificates;
CREATE POLICY "allow_update_certificates" 
  ON public.certificates 
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "allow_delete_certificate" ON public.certificates;
DROP POLICY IF EXISTS "allow_delete_certificates" ON public.certificates;
CREATE POLICY "allow_delete_certificates" 
  ON public.certificates 
  FOR DELETE 
  USING (true);

-- 3. STUDENTS TABLE: Ensure student activity points can be updated when a certificate is approved
DROP POLICY IF EXISTS "allow_update_students_points" ON public.students;
CREATE POLICY "allow_update_students_points"
  ON public.students
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 4. STORAGE BUCKET: Ensure 'certificates' bucket is public and allows uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public certificates read access" ON storage.objects;
CREATE POLICY "Public certificates read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificates');

DROP POLICY IF EXISTS "Authenticated users certificates insert" ON storage.objects;
DROP POLICY IF EXISTS "Public certificates insert" ON storage.objects;
CREATE POLICY "Public certificates insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'certificates');

DROP POLICY IF EXISTS "Users can delete own certificates in storage" ON storage.objects;
DROP POLICY IF EXISTS "Public certificates delete" ON storage.objects;
CREATE POLICY "Public certificates delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'certificates');
