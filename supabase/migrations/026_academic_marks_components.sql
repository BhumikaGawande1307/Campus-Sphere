-- 026_academic_marks_components.sql
-- Safely add academic mark component columns to public.exam_results
-- Preserves all historical records; existing marks_obtained remains the authoritative total.
-- Newly added component columns are NULL for historical records where breakdown was never recorded.

DO $$ BEGIN
  ALTER TABLE public.exam_results 
    ADD COLUMN IF NOT EXISTS internal_marks NUMERIC(5,2) DEFAULT NULL;
  
  ALTER TABLE public.exam_results 
    ADD COLUMN IF NOT EXISTS practical_marks NUMERIC(5,2) DEFAULT NULL;
  
  ALTER TABLE public.exam_results 
    ADD COLUMN IF NOT EXISTS end_term_marks NUMERIC(5,2) DEFAULT NULL;

  ALTER TABLE public.exam_results 
    ADD COLUMN IF NOT EXISTS remarks TEXT DEFAULT NULL;
EXCEPTION WHEN OTHERS THEN null; END $$;

-- Check constraints for valid component ranges where recorded
DO $$ BEGIN
  ALTER TABLE public.exam_results 
    ADD CONSTRAINT check_internal_marks_range 
    CHECK (internal_marks IS NULL OR (internal_marks >= 0 AND internal_marks <= 40));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.exam_results 
    ADD CONSTRAINT check_practical_marks_range 
    CHECK (practical_marks IS NULL OR (practical_marks >= 0 AND practical_marks <= 40));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.exam_results 
    ADD CONSTRAINT check_end_term_marks_range 
    CHECK (end_term_marks IS NULL OR (end_term_marks >= 0 AND end_term_marks <= 100));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.exam_results 
    ADD CONSTRAINT check_marks_obtained_range 
    CHECK (marks_obtained >= 0 AND marks_obtained <= max_marks);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Performance index for student semester results lookups
CREATE INDEX IF NOT EXISTS idx_exam_results_student_exam 
  ON public.exam_results(student_id, examination_id);

CREATE INDEX IF NOT EXISTS idx_exam_results_subject 
  ON public.exam_results(subject_id);