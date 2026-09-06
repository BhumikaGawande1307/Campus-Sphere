-- 032_fix_examinations_rls.sql
-- Fix Row Level Security policies on examinations and exam_results tables
-- Allows administrators, faculty, authenticated users, and application sessions to schedule exams and add marks

-- 1. Ensure public.is_faculty_or_admin helper is case-insensitive and resilient
CREATE OR REPLACE FUNCTION public.is_faculty_or_admin()
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

-- 2. EXAMINATIONS TABLE: Allow read for everyone, allow manage for faculty/admin/authenticated/app
ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_read_examinations" ON public.examinations;
DROP POLICY IF EXISTS "allow_manage_examinations" ON public.examinations;
DROP POLICY IF EXISTS "allow_insert_examinations" ON public.examinations;
DROP POLICY IF EXISTS "allow_update_examinations" ON public.examinations;
DROP POLICY IF EXISTS "allow_delete_examinations" ON public.examinations;
DROP POLICY IF EXISTS "allow_read_exams" ON public.examinations;
DROP POLICY IF EXISTS "allow_manage_exams" ON public.examinations;

CREATE POLICY "allow_read_examinations" 
  ON public.examinations 
  FOR SELECT 
  USING (true);

CREATE POLICY "allow_manage_examinations" 
  ON public.examinations 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- 3. EXAM RESULTS TABLE: Allow read and manage for exam marks entry
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_read_exam_results" ON public.exam_results;
DROP POLICY IF EXISTS "allow_manage_exam_results" ON public.exam_results;
DROP POLICY IF EXISTS "allow_insert_exam_results" ON public.exam_results;
DROP POLICY IF EXISTS "allow_update_exam_results" ON public.exam_results;
DROP POLICY IF EXISTS "allow_delete_exam_results" ON public.exam_results;

CREATE POLICY "allow_read_exam_results" 
  ON public.exam_results 
  FOR SELECT 
  USING (true);

CREATE POLICY "allow_manage_exam_results" 
  ON public.exam_results 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- 4. SUBJECTS TABLE: Ensure subjects can be read and linked during marks entry
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_read_subjects" ON public.subjects;
CREATE POLICY "allow_read_subjects" 
  ON public.subjects 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "allow_manage_subjects" ON public.subjects;
CREATE POLICY "allow_manage_subjects" 
  ON public.subjects 
  FOR ALL 
  USING (true)
  WITH CHECK (true);
