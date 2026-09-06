# CampusSphere — Canonical Database Deployment & Verification Guide

This guide describes how to deploy the authoritative, reconstructed database schema to Supabase.

---

## Method 1: Instant 1-Click Deployment (Supabase Web Dashboard) — RECOMMENDED

1. Open your **Supabase Dashboard**: [https://supabase.com/dashboard/project/hgvhdvqoejypgoyfzrjo](https://supabase.com/dashboard/project/hgvhdvqoejypgoyfzrjo)
2. Navigate to **SQL Editor** in the left sidebar.
3. Click **New Query**.
4. Copy the entire contents of `supabase/complete_canonical_schema.sql` (or the root `supabase_schema.sql`).
5. Paste into the SQL Editor and click **Run**.
6. The query will:
   - Create all extensions, enums, canonical tables, and indexes.
   - Set up the atomic `handle_new_user()` registration trigger.
   - Enforce private document security policies (RLS).
   - Seed base departments, roles, and granular permissions.
   - Run the self-healing data reconciliation script.

---

## Method 2: Supabase CLI (Automated Migration Pipeline)

If you prefer using the Supabase CLI:

1. **Login to Supabase CLI**:
   ```bash
   npx supabase login
   ```

2. **Link your project**:
   ```bash
   npx supabase link --project-ref hgvhdvqoejypgoyfzrjo
   ```

3. **Deploy all numbered migrations**:
   ```bash
   npx supabase db push
   ```

4. **Verify migration status**:
   ```bash
   npx supabase migration list
   ```

---

## Migration Suite Manifest (in `supabase/migrations/`)

| Sequence | File | Purpose |
| :--- | :--- | :--- |
| 001 | `001_extensions.sql` | Enables `uuid-ossp` and `pgcrypto` |
| 002 | `002_users_and_profiles.sql` | Canonical users table and compatibility profiles view |
| 003 | `003_roles_permissions.sql` | RBAC roles, permissions, role_permissions, user_roles |
| 004 | `004_academic_structure.sql` | Departments, subjects, class batches |
| 005 | `005_students_faculty.sql` | Students, faculty, subject enrollments |
| 006 | `006_attendance.sql` | Attendance sessions, anti-proxy records, audit logs |
| 007 | `007_timetable.sql` | Timetable slots with room, day, and conflict checks |
| 008 | `008_examinations_results.sql` | Examinations and exam results ledger |
| 009 | `009_grievances.sql` | Support tickets, dual title/subject sync, comments |
| 010 | `010_scholarships.sql` | Fellowships, scholarship applications |
| 011 | `011_events.sql` | Events and dynamic participant registrations |
| 012 | `012_announcements_notifications.sql` | Announcements and real-time user notifications |
| 013 | `013_documents_storage.sql` | Certificates vault (UUID foreign keys), skills, projects |
| 014 | `014_system_settings_audit_logs.sql` | Platform CMS configuration, institutional audit logs |
| 015 | `015_rls_policies.sql` | Production RLS security hardening across all tables |
| 016 | `016_functions_triggers.sql` | Atomic registration trigger (Auth -> Users -> Students) |
| 017 | `017_data_reconciliation.sql` | Data healing for missing student profiles and roles |

---

## Verification Checklist

- [x] Canonical tables created without column conflicts.
- [x] Students table linked by UUID to auth.users.
- [x] Certificates table references users(id) via UUID.
- [x] Private certificates protected by RLS (no global public SELECT).
- [x] Grievances supports both title and subject without PostgREST errors.
- [x] System settings has stable ID = 1 and persists real CMS edits.
- [x] Admin sidebar and permissions load synchronously for Admin roles.
- [x] Command Palette (Ctrl + K / Cmd + K) accessible everywhere.
