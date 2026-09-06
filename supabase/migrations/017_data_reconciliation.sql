-- 017_data_reconciliation.sql
-- Seed Departments
INSERT INTO public.departments (name, code, description) VALUES
  ('Computer Science & Engineering', 'CSE', 'Core Computer Science, Software Engineering and AI'),
  ('Information Technology & Data Science', 'ITDS', 'Information Architecture, Cloud and Analytics'),
  ('Electronics & Communication', 'ECE', 'Embedded Systems, IoT and VLSI Design'),
  ('Mechanical Engineering', 'MECH', 'Thermodynamics, Robotics and Manufacturing'),
  ('Civil Engineering', 'CIVIL', 'Structural Engineering and Infrastructure')
ON CONFLICT (code) DO NOTHING;

-- Seed Roles
INSERT INTO public.roles (name, description) VALUES
  ('SUPER_ADMIN', 'Unrestricted administrative authority across institutional platform'),
  ('ADMIN', 'Full institutional administration and ERP management access'),
  ('FACULTY', 'Academic, attendance, grading and course coordination privileges'),
  ('HOD', 'Departmental management, course supervision, and academic approvals'),
  ('COORDINATOR', 'Event, fellowship, and student organization coordination'),
  ('STUDENT', 'Enrolled student with self-service academic and credential access')
ON CONFLICT (name) DO NOTHING;

-- Seed Permissions
INSERT INTO public.permissions (code, name, category) VALUES
  ('students.view', 'View Student Directories', 'Academics'),
  ('students.create', 'Enroll New Students', 'Academics'),
  ('students.update', 'Modify Student Profiles', 'Academics'),
  ('students.deactivate', 'Deactivate Student Accounts', 'Academics'),
  ('faculty.view', 'View Faculty Directory', 'Faculty'),
  ('faculty.manage', 'Manage Faculty Profiles & Departments', 'Faculty'),
  ('timetable.view', 'View Academic Timetable', 'Academics'),
  ('timetable.manage', 'Schedule & Edit Timetable Slots', 'Academics'),
  ('attendance.view', 'View Attendance Records', 'Attendance'),
  ('attendance.manage', 'Record & Override Attendance Sessions', 'Attendance'),
  ('results.view', 'View Semester Results', 'Examinations'),
  ('results.manage', 'Record Exam Scores & SGPA', 'Examinations'),
  ('results.publish', 'Publish Official Examination Results', 'Examinations'),
  ('grievances.view', 'View Support & Grievance Tickets', 'Services'),
  ('grievances.assign', 'Assign Grievance to Staff', 'Services'),
  ('grievances.resolve', 'Resolve & Close Grievance Tickets', 'Services'),
  ('scholarships.view', 'Browse Scholarships', 'Scholarships'),
  ('scholarships.manage', 'Create & Review Scholarship Applications', 'Scholarships'),
  ('events.view', 'Browse Campus Events', 'Events'),
  ('events.manage', 'Publish Events & Manage Attendees', 'Events'),
  ('documents.view', 'Inspect Credential Documents', 'Credentials'),
  ('documents.manage', 'Verify & Approve Certificate Vault Entries', 'Credentials'),
  ('audit_logs.view', 'Inspect Institutional Audit Logs', 'Administration'),
  ('system_settings.manage', 'Configure CMS & Platform Parameters', 'Administration'),
  ('users.manage', 'Assign Roles & Permissions', 'Administration')
ON CONFLICT (code) DO NOTHING;

-- Assign all permissions to ADMIN & SUPER_ADMIN
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name IN ('ADMIN', 'SUPER_ADMIN')
ON CONFLICT DO NOTHING;

-- Heal existing students missing student record
INSERT INTO public.students (user_id, student_id, department_id, course, year, semester, division, cgpa, points)
SELECT 
  u.id,
  'CS2026' || lpad(floor(random() * 9000 + 1000)::text, 4, '0'),
  1,
  'B.Tech in Computer Science',
  1,
  1,
  'A',
  8.0,
  100
FROM public.users u
LEFT JOIN public.students s ON s.user_id = u.id
WHERE u.role = 'STUDENT' AND s.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Assign ADMIN role permissions to existing admin users
INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM public.users u
JOIN public.roles r ON r.name = 'ADMIN'
WHERE u.role IN ('ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR')
ON CONFLICT (user_id, role_id) DO NOTHING;
