-- 031_performance_indexes_and_integrity.sql
-- Indexes and constraints to support high concurrency, fast dashboard analytics, and clean relation queries

CREATE INDEX IF NOT EXISTS idx_attendance_records_student_session 
  ON public.attendance_records(student_id, session_id);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_dept_date 
  ON public.attendance_sessions(department_id, session_date);

CREATE INDEX IF NOT EXISTS idx_grievances_ticket_number 
  ON public.grievances(ticket_number);

CREATE INDEX IF NOT EXISTS idx_grievances_submitted_by 
  ON public.grievances(submitted_by, status);

CREATE INDEX IF NOT EXISTS idx_event_registrations_user_event 
  ON public.event_registrations(user_id, event_id);

CREATE INDEX IF NOT EXISTS idx_scholarship_applications_user_scholarship 
  ON public.scholarship_applications(user_id, scholarship_id);

CREATE INDEX IF NOT EXISTS idx_applications_student_job 
  ON public.applications(student_id, job_id);