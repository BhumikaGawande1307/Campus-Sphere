-- 008_examinations_results.sql
CREATE TABLE IF NOT EXISTS public.examinations (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'END_TERM',
  department_id BIGINT REFERENCES public.departments(id) ON DELETE CASCADE,
  semester INT NOT NULL DEFAULT 1,
  academic_year TEXT NOT NULL DEFAULT '2025-2026',
  start_date DATE,
  end_date DATE,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id BIGINT REFERENCES public.examinations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject_id BIGINT REFERENCES public.subjects(id) ON DELETE CASCADE,
  marks_obtained NUMERIC(5,2) NOT NULL DEFAULT 0,
  max_marks NUMERIC(5,2) NOT NULL DEFAULT 100,
  grade TEXT DEFAULT 'A',
  grade_points NUMERIC(3,1) DEFAULT 8.0,
  status TEXT NOT NULL DEFAULT 'PASS',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_exam_student_subject UNIQUE (examination_id, student_id, subject_id)
);
