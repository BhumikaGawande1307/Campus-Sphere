-- 007_timetable.sql
CREATE TABLE IF NOT EXISTS public.timetable (
  id BIGSERIAL PRIMARY KEY,
  department_id BIGINT REFERENCES public.departments(id) ON DELETE CASCADE,
  semester INT NOT NULL DEFAULT 1,
  division TEXT NOT NULL DEFAULT 'A',
  class_name TEXT DEFAULT '',
  day_of_week TEXT NOT NULL DEFAULT 'Monday',
  day_number INT DEFAULT 1,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id BIGINT REFERENCES public.subjects(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  room TEXT NOT NULL DEFAULT 'C-101',
  room_number TEXT DEFAULT 'C-101',
  building TEXT DEFAULT 'Main Block',
  color_theme TEXT DEFAULT 'blue',
  type TEXT DEFAULT 'LECTURE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS room_number TEXT DEFAULT 'C-101';
  ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS building TEXT DEFAULT 'Main Block';
  ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS class_name TEXT DEFAULT '';
  ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS color_theme TEXT DEFAULT 'blue';
EXCEPTION WHEN OTHERS THEN null; END $$;

CREATE OR REPLACE FUNCTION public.sync_timetable_room()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.room IS NOT NULL AND (NEW.room_number IS NULL OR NEW.room_number = '') THEN
    NEW.room_number := NEW.room;
  ELSIF NEW.room_number IS NOT NULL AND (NEW.room IS NULL OR NEW.room = '') THEN
    NEW.room := NEW.room_number;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_timetable_room ON public.timetable;
CREATE TRIGGER trg_timetable_room BEFORE INSERT OR UPDATE ON public.timetable
FOR EACH ROW EXECUTE FUNCTION public.sync_timetable_room();
