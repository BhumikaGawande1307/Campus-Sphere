# CampusSphere — Centralized Digital Student Activity Platform

[![Supabase](https://img.shields.io/badge/Backend-Supabase%20PostgreSQL-3ECF8E.svg)](https://supabase.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2F%20TypeScript-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/UI-Tailwind%20CSS-38bdf8.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Bundler-Vite%206-646CFF.svg)](https://vitejs.dev/)

**CampusSphere** is a centralized full-stack digital student activity and credential verification platform built as a **unified, single-repository application** powered by **React 18, TypeScript, Tailwind CSS, and Supabase (PostgreSQL, Auth, Storage, and Realtime)**.

---

## 1. Architecture Overview

CampusSphere uses a unified modern full-stack architecture located in a single project root:

```text
React 18 + TypeScript + Vite + Tailwind CSS
        ↓
Supabase JavaScript Client SDK (@supabase/supabase-js)
        ↓
Supabase Cloud / Local Engine (PostgreSQL, Auth, Storage, Realtime)
```

---

## 2. Directory Structure

```text
campus-sphere/
├── src/
│   ├── components/          # Navbar, Sidebar, StatCard, Badge, Modal, Icons, EmptyState, Skeleton
│   ├── context/             # AuthContext with session persistence
│   ├── layouts/             # RootLayout & ProtectedRoute guards
│   ├── pages/               # Dashboards, Events, QR Attendance, Vault, Skills, Jobs, Clubs, AI, etc.
│   ├── services/            # Supabase database & auth client services
│   │   ├── supabaseClient.ts # Supabase client initialization & hybrid engine
│   │   ├── authService.ts   # Authentication & profile management
│   │   ├── studentService.ts # Relational dashboard aggregations & portfolio
│   │   ├── eventService.ts  # Dynamic QR tokens & event registration
│   │   ├── attendanceService.ts # Real-time QR attendance validation
│   │   ├── certificateService.ts # Certificate vault & public verification
│   │   ├── skillService.ts  # Skill proficiency CRUD
│   │   ├── projectService.ts # Student project showcase
│   │   ├── careerService.ts # Job postings & 1-click applications
│   │   ├── clubService.ts   # Student clubs & society memberships
│   │   ├── announcementService.ts # Circulars & notifications
│   │   ├── analyticsService.ts # Institutional charts & statistics
│   │   └── aiService.ts     # AI Skill-Gap Analyzer & advisor
│   ├── types/               # TypeScript domain models
│   ├── App.tsx              # Main React Router v7
│   ├── main.tsx
│   └── index.css            # Tailwind directives & glassmorphism
│
├── supabase/
│   └── schema.sql           # Complete PostgreSQL DDL, RLS policies & demo seed data
│
├── .env                     # Supabase URL & Anon key configuration
├── .env.example
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 3. Quick Start & Setup

### Step 1: Install Dependencies
Open a terminal in the project root:
```bash
npm install
```

---

### Step 2: Configure Supabase (Optional)
The project includes a hybrid engine pre-loaded with realistic demo data so you can run and test all features immediately without any setup.

To connect your own **live Supabase cloud project**:
1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard and run the entire script in [`supabase/schema.sql`](supabase/schema.sql).
3. Copy your **Project URL** and **Anon Key** from *Project Settings $\rightarrow$ API* into your `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

---

### Step 3: Run Development Server
```bash
npm run dev
```

The application will be live at: **[http://localhost:5173/](http://localhost:5173/)**

---

## 4. Demo Accounts & Credentials

All demo accounts use password: `password123`

| Role | Email / Username | Name | Primary Portal |
| :--- | :--- | :--- | :--- |
| **Student** | `student@campus.edu` (`alex_student`) | Alex Mercer | `/dashboard/student` |
| **Faculty** | `faculty@campus.edu` (`prof_sharma`) | Dr. Rajesh Sharma | `/dashboard/faculty` |
| **HOD** | `hod@campus.edu` (`hod_cse`) | Dr. Ananya Iyer | `/dashboard/hod` |
| **Administrator** | `admin@campus.edu` (`admin`) | System Administrator | `/dashboard/admin` |
| **Placement Officer** | `placement@campus.edu` (`placement_officer`) | Priya Mehta | `/dashboard/placement` |
| **Club Coordinator** | `club@campus.edu` (`club_lead`) | Rohan Verma | `/dashboard/club` |
| **Employer / Verifier** | `verifier@campus.edu` (`verifier_org`) | Acme Corp Verifier | `/verify/CERT-2026-CS88910-VERIFIED` |

*(Tip: You can also use the 1-click Quick-Fill buttons on the Login page to sign in instantly as any role.)*

---

## 5. Core Features

1. **Role-Based Portals**:
   - **Student**: Dynamic activity KPIs, verified certificate vault, project portfolio, recruitment tracker, AI advisor.
   - **Faculty**: Live dynamic QR code generator with 15-minute expiration countdown, attendee counter, certificate approvals.
   - **HOD**: Departmental participation rates, event approvals, branch competency distribution.
   - **Placement Officer**: Recruitment drives, CGPA candidate filters, applicant pipeline management.
   - **Club Coordinator**: Society registrations, club fests, attendance QR codes.
   - **Admin**: Institutional analytics with Recharts graphs and audit metrics.

2. **Real-Time Dynamic QR Attendance**:
   - Time-expiring dynamic session QR codes.
   - Anti-proxy / anti-duplicate scan safeguards.
   - Instant points awards and record persistence.

3. **Digital Certificate Vault & Public Verification**:
   - Drag & drop document uploads (PDF/Images).
   - Faculty approval queue with feedback notes.
   - Unauthenticated public QR verification at `/verify/:uid`.

4. **Digital Portfolio & ATS Resume Builder**:
   - Public/Private visibility toggle.
   - Shareable custom URLs (`/p/:slug`) and printable ATS single-page PDF resumes.

5. **AI Academic & Career Advisor**:
   - Live Skill-Gap Analysis comparing profiles against benchmarks for *Full-Stack Developer*, *Data Scientist*, *DevOps Engineer*, and *Cybersecurity Analyst*.

6. **Support & Grievance Redressal System**:
   - Student grievance ticket submissions with categories, priority, and real-time status tracking.
   - Dedicated Administrative resolution center with real-time sync.

7. **Scholarships & Financial Aid Directory**:
   - Scholarship search, bookmarking, and direct application workflows with administrative applicant review.

8. **Institutional Administration**:
   - System audit logs, user management, department management, and security settings.

---

## 6. Production Deployment

### Option A: Deploy to Vercel (Recommended)
1. Push your repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your `campus-Sphere` repository.
4. Set the Framework Preset to **Vite**.
5. Add the Environment Variables:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Public Key
6. Click **Deploy**. SPA routing is pre-configured via `vercel.json`.

### Option B: Deploy to Netlify
1. Go to [netlify.com](https://netlify.com) and select **"Import from Git"**.
2. Set Build Command to: `npm run build`
3. Set Publish Directory to: `dist`
4. Add the Environment Variables in Site settings > Environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy Site**. Single-page redirects are pre-configured via `public/_redirects`.

### Build & Verify Locally
```bash
# Type check and build production bundle
npm run build

# Preview production build locally
npm run preview
```
