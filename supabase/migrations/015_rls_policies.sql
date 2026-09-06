-- 015_rls_policies.sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievance_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR', 'HOD', 'COORDINATOR')
  );
$$;

DROP POLICY IF EXISTS "allow_read_departments" ON public.departments;
CREATE POLICY "allow_read_departments" ON public.departments FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_read_subjects" ON public.subjects;
CREATE POLICY "allow_read_subjects" ON public.subjects FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_read_timetable" ON public.timetable;
CREATE POLICY "allow_read_timetable" ON public.timetable FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_manage_timetable" ON public.timetable;
CREATE POLICY "allow_manage_timetable" ON public.timetable FOR ALL USING (public.is_admin_or_staff());

DROP POLICY IF EXISTS "allow_read_events" ON public.events;
CREATE POLICY "allow_read_events" ON public.events FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_manage_events" ON public.events;
CREATE POLICY "allow_manage_events" ON public.events FOR ALL USING (public.is_admin_or_staff());

DROP POLICY IF EXISTS "allow_read_scholarships" ON public.scholarships;
CREATE POLICY "allow_read_scholarships" ON public.scholarships FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_manage_scholarships" ON public.scholarships;
CREATE POLICY "allow_manage_scholarships" ON public.scholarships FOR ALL USING (public.is_admin_or_staff());

DROP POLICY IF EXISTS "allow_read_announcements" ON public.announcements;
CREATE POLICY "allow_read_announcements" ON public.announcements FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_read_system_settings" ON public.system_settings;
CREATE POLICY "allow_read_system_settings" ON public.system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_update_system_settings" ON public.system_settings;
CREATE POLICY "allow_update_system_settings" ON public.system_settings FOR UPDATE USING (public.is_admin_or_staff());

DROP POLICY IF EXISTS "allow_read_users" ON public.users;
CREATE POLICY "allow_read_users" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_update_own_user" ON public.users;
CREATE POLICY "allow_update_own_user" ON public.users FOR UPDATE USING (auth.uid() = id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "allow_read_students" ON public.students;
CREATE POLICY "allow_read_students" ON public.students FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_insert_students" ON public.students;
CREATE POLICY "allow_insert_students" ON public.students FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "allow_update_students" ON public.students;
CREATE POLICY "allow_update_students" ON public.students FOR UPDATE USING (auth.uid() = user_id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "allow_read_certificates" ON public.certificates;
CREATE POLICY "allow_read_certificates" ON public.certificates FOR SELECT USING (
  student_id = auth.uid() OR is_public = true OR public.is_admin_or_staff()
);

DROP POLICY IF EXISTS "allow_insert_own_certificate" ON public.certificates;
CREATE POLICY "allow_insert_own_certificate" ON public.certificates FOR INSERT WITH CHECK (
  student_id = auth.uid() OR public.is_admin_or_staff()
);

DROP POLICY IF EXISTS "allow_update_certificate" ON public.certificates;
CREATE POLICY "allow_update_certificate" ON public.certificates FOR UPDATE USING (
  student_id = auth.uid() OR public.is_admin_or_staff()
);

DROP POLICY IF EXISTS "allow_delete_certificate" ON public.certificates;
CREATE POLICY "allow_delete_certificate" ON public.certificates FOR DELETE USING (
  student_id = auth.uid() OR public.is_admin_or_staff()
);

DROP POLICY IF EXISTS "allow_read_grievances" ON public.grievances;
CREATE POLICY "allow_read_grievances" ON public.grievances FOR SELECT USING (
  submitted_by = auth.uid() OR assigned_to = auth.uid() OR public.is_admin_or_staff()
);

DROP POLICY IF EXISTS "allow_insert_grievances" ON public.grievances;
CREATE POLICY "allow_insert_grievances" ON public.grievances FOR INSERT WITH CHECK (
  submitted_by = auth.uid() OR public.is_admin_or_staff()
);

DROP POLICY IF EXISTS "allow_update_grievances" ON public.grievances;
CREATE POLICY "allow_update_grievances" ON public.grievances FOR UPDATE USING (
  submitted_by = auth.uid() OR assigned_to = auth.uid() OR public.is_admin_or_staff()
);

DROP POLICY IF EXISTS "allow_read_roles" ON public.roles;
CREATE POLICY "allow_read_roles" ON public.roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_read_permissions" ON public.permissions;
CREATE POLICY "allow_read_permissions" ON public.permissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_read_role_permissions" ON public.role_permissions;
CREATE POLICY "allow_read_role_permissions" ON public.role_permissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_read_user_roles" ON public.user_roles;
CREATE POLICY "allow_read_user_roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "allow_read_skills" ON public.skills;
CREATE POLICY "allow_read_skills" ON public.skills FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_manage_skills" ON public.skills;
CREATE POLICY "allow_manage_skills" ON public.skills FOR ALL TO authenticated 
USING (
  auth.uid() = user_id OR 
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()) OR 
  public.is_admin_or_staff()
)
WITH CHECK (
  auth.uid() = user_id OR 
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()) OR 
  public.is_admin_or_staff()
);

DROP POLICY IF EXISTS "allow_read_projects" ON public.projects;
CREATE POLICY "allow_read_projects" ON public.projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_manage_projects" ON public.projects;
CREATE POLICY "allow_manage_projects" ON public.projects FOR ALL TO authenticated 
USING (
  auth.uid() = user_id OR 
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()) OR 
  public.is_admin_or_staff()
)
WITH CHECK (
  auth.uid() = user_id OR 
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()) OR 
  public.is_admin_or_staff()
);
