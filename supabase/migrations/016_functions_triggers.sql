-- 016_functions_triggers.sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role user_role;
  v_dept_id BIGINT;
  v_student_id TEXT;
  v_faculty_id TEXT;
  v_role_record RECORD;
BEGIN
  BEGIN
    v_role := CAST(COALESCE(NEW.raw_user_meta_data->>'role', 'STUDENT') AS user_role);
  EXCEPTION WHEN OTHERS THEN
    v_role := 'STUDENT';
  END;

  INSERT INTO public.users (
    id, email, username, first_name, last_name, role, phone_number, is_active, created_at, updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    v_role,
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    TRUE,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = CASE WHEN EXCLUDED.first_name <> '' THEN EXCLUDED.first_name ELSE users.first_name END,
    last_name = CASE WHEN EXCLUDED.last_name <> '' THEN EXCLUDED.last_name ELSE users.last_name END,
    role = EXCLUDED.role,
    updated_at = NOW();

  IF v_role = 'STUDENT' THEN
    v_student_id := COALESCE(
      NEW.raw_user_meta_data->>'student_id',
      'CS2026' || lpad(floor(random() * 9000 + 1000)::text, 4, '0')
    );
    
    v_dept_id := (NEW.raw_user_meta_data->>'department_id')::bigint;
    IF v_dept_id IS NULL THEN
      SELECT id INTO v_dept_id FROM public.departments ORDER BY id ASC LIMIT 1;
    END IF;

    INSERT INTO public.students (
      user_id, student_id, department_id, course, year, semester, division, cgpa, points
    ) VALUES (
      NEW.id,
      v_student_id,
      v_dept_id,
      COALESCE(NEW.raw_user_meta_data->>'course', 'B.Tech in Computer Science'),
      COALESCE((NEW.raw_user_meta_data->>'year')::int, 1),
      COALESCE((NEW.raw_user_meta_data->>'semester')::int, 1),
      COALESCE(NEW.raw_user_meta_data->>'division', 'A'),
      COALESCE((NEW.raw_user_meta_data->>'cgpa')::numeric, 0),
      100
    ) ON CONFLICT (user_id) DO NOTHING;
  END IF;

  IF v_role IN ('FACULTY', 'HOD') THEN
    v_faculty_id := COALESCE(
      NEW.raw_user_meta_data->>'faculty_id',
      'FAC2026' || lpad(floor(random() * 900 + 100)::text, 3, '0')
    );

    v_dept_id := (NEW.raw_user_meta_data->>'department_id')::bigint;
    IF v_dept_id IS NULL THEN
      SELECT id INTO v_dept_id FROM public.departments ORDER BY id ASC LIMIT 1;
    END IF;

    INSERT INTO public.faculty (
      user_id, faculty_id, department_id, designation
    ) VALUES (
      NEW.id,
      v_faculty_id,
      v_dept_id,
      COALESCE(NEW.raw_user_meta_data->>'designation', 'Assistant Professor')
    ) ON CONFLICT (user_id) DO NOTHING;
  END IF;

  SELECT id INTO v_role_record FROM public.roles WHERE name = v_role::text LIMIT 1;
  IF v_role_record IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, v_role_record.id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
