# CampusConnect AI — Software Requirements Specification (SRS)

**Document Title**: System Requirements & Functional Specification  
**Project**: CampusConnect AI (Unified Campus Placement & Academic Management System)  
**Version**: 1.0.0  
**Status**: Approved & Implemented  
**Date**: September 2026  

---

## 1. Executive Summary & Purpose

### 1.1 Purpose
This document provides the formal Software Requirements Specification (SRS) for **CampusConnect AI**. It defines the functional requirements, non-functional constraints, user roles, database architecture, security policies, and system prerequisites required to operate and maintain the application.

### 1.2 System Scope
CampusConnect AI is an enterprise-grade campus placement and academic training platform designed for higher education institutions. It bridges the operational gaps between students, academic faculty, placement officers, and university administrators through:
- Real-time automated placement eligibility verification and drive application workflows.
- Strictly isolated faculty schedule and training session allocation with attendance roster access.
- Comprehensive company management and drive scheduling for placement officers.
- Structured technical, aptitude, and HR interview preparation hubs with student progress tracking.
- Centralized administration, user access control, and moderation tools.

---

## 2. Technology Stack & Environment Requirements

### 2.1 Hardware Requirements
- **Development/Host Server**:
  - Processor: 64-bit multi-core CPU (Intel Core i5 / AMD Ryzen 5 or higher recommended)
  - Memory (RAM): Minimum 8 GB (16 GB recommended for concurrent Next.js dev server and builds)
  - Disk Space: Minimum 5 GB free disk space for node dependencies, build artifacts, and local database cache
- **Client Devices**:
  - Modern desktop, laptop, or tablet with internet connectivity
  - Minimum display resolution: 1280 x 720 (optimized for responsive desktop layouts)

### 2.2 Software & Runtime Requirements
- **Runtime Environment**: Node.js `v18.18.0` or `v20.x` LTS
- **Package Manager**: `npm` `v9.x` or higher (compatible with `pnpm` / `yarn`)
- **Web Framework**: Next.js `16.3.4` (App Router, Turbopack, React Server Components)
- **UI Engine**: React `19.2.8`, ReactDOM `19.2.8`
- **Language**: TypeScript `5.x`
- **Styling**: Tailwind CSS `v4`, PostCSS, Lucide React
- **Database & Auth**: Supabase (PostgreSQL 15+, Supabase Auth, Storage, Row-Level Security)
- **Supported Browsers**: Google Chrome (v100+), Mozilla Firefox (v100+), Apple Safari (v15+), Microsoft Edge (v100+)

### 2.3 Environment Configuration (`.env.local`)
The application requires the following environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-publishable-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 3. User Personas & Role-Based Access Control (RBAC)

The system enforces strict Role-Based Access Control mapped to 4 system roles:

| Role | Role Identifier | Scope of Access | Default Route |
| :--- | :--- | :--- | :--- |
| **Student** | `student` | Profile, Placement Drives, Applications, Preparation Hub, Resume Manager | `/student` |
| **Faculty** | `faculty` | Assigned Teaching Schedule, Session Rosters, Faculty Profile | `/faculty` |
| **Placement Officer**| `placement_officer` | Company Directory, Drive Management, Applications, Shortlists, Analytics | `/placement` |
| **Administrator** | `administrator` | Full System Management, User Directory, Moderation, System Settings | `/admin` |

---

## 4. Functional Requirements (FR)

### FR-1: Authentication & Session Management
- **FR-1.1**: The system must provide secure email/password authentication using Supabase Auth.
- **FR-1.2**: Upon successful login, users must be automatically routed to their role-specific dashboard based on their verified profile role (`/student`, `/faculty`, `/placement`, or `/admin`).
- **FR-1.3**: The system must provide proxy-level route protection (`src/proxy.ts`). Unauthenticated requests to protected endpoints (`/student/*`, `/faculty/*`, `/placement/*`, `/admin/*`) must redirect to `/login?redirect=<target>`.
- **FR-1.4**: Users attempting to access unauthorized role routes must be redirected to their authorized dashboard with an `unauthorized=true` parameter.
- **FR-1.5**: The system must support local testing through cookie-based demo sessions (`campusconnect_demo_role` and `campusconnect_demo_user`).

### FR-2: Student Placement & Eligibility Verification
- **FR-2.1**: The system must present active placement drives (`/student/placements`) with company details, CTC package, registration deadlines, and eligibility criteria.
- **FR-2.2**: The system must perform **automated real-time eligibility evaluation** comparing the student's profile against drive criteria:
  - Minimum CGPA cutoff
  - Maximum active backlogs allowed
  - Eligible departments (e.g., CSE, AIDS, AIML, CS)
  - Eligible graduation batch/year (e.g., 4th Year)
- **FR-2.3**: Eligible students must be able to submit a one-click application referencing their primary uploaded resume.
- **FR-2.4**: Ineligible students must be prevented from submitting applications, and the system must clearly display the exact failed criteria (e.g., *"CGPA 7.2 below required 8.0"*).
- **FR-2.5**: Students must be able to track their application status in real-time (`/student/placements/applications`): `Applied`, `Shortlisted`, `Interview Scheduled`, `Selected`, `Rejected`.

### FR-3: Faculty Allocation & Schedule Management
- **FR-3.1**: The Faculty Classes view (`/faculty/classes`) must be strictly organized by **Faculty Allocation $\rightarrow$ Schedule $\rightarrow$ Registered Students**.
- **FR-3.2**: Faculty must **never** see university-wide student directories, arbitrary academic years, or departments they do not teach.
- **FR-3.3**: The main schedule view must categorize allocated sessions chronologically into three distinct blocks:
  - **`TODAY`**: Immediate sessions scheduled for the current day.
  - **`TOMORROW`**: Sessions scheduled for the next calendar day.
  - **`UPCOMING`**: Future sessions sorted chronologically.
- **FR-3.4**: Each schedule item must display: time slot, training/subject title, academic year · section, venue/room, and registered student count.
- **FR-3.5**: On selecting a session (`/faculty/classes/[classId]`), the system must display:
  - Full session metadata (subject, year · section, time, venue)
  - Registered student roster displaying only `Student Name` and `Student ID`
  - A dynamic dropdown filter (`Training: [ All ▼ ]`) operating *strictly* on students registered for that class session.
- **FR-3.6**: Direct URL manipulation to access unauthorized or unallocated session IDs must be blocked and return `404 Not Found`.

### FR-4: Company & Corporate Recruitment Management
- **FR-4.1**: Placement Officers and Administrators must have full CRUD capabilities over participating companies (`/placement/companies`, `/admin/companies`).
- **FR-4.2**: Company entities must record: legal name, slug, industry category, recruitment tier (`Tier 1`, `Tier 2`, `Tier 3`, `Dream`), corporate website, primary point of contact, and active/inactive status.
- **FR-4.3**: Students and Faculty must be strictly prohibited from modifying or managing company records.

### FR-5: Interview Preparation Hub
- **FR-5.1**: The system must provide a structured preparation resource center (`/student/preparation`) divided into:
  - **Technical Tracks**: Java, Python, C++, Web Development, Cloud & DevOps, Core CS (OS, DBMS, CN).
  - **Aptitude Tracks**: Quantitative Aptitude, Logical Reasoning, Verbal Ability.
  - **HR & Soft Skills**: Common HR Questions, Behavioral Assessments, STAR Framework.
  - **Company-Specific Kits**: Curated interview preparation kits for frequent recruiters (e.g., Google, Amazon, TCS, Infosys).
- **FR-5.2**: Each study material must include estimated reading time, difficulty tags, and full conceptual explanations.
- **FR-5.3**: Students must be able to toggle topic completion status with real-time progress calculations saved to the database.

### FR-6: Resume Manager
- **FR-6.1**: Students must be able to upload PDF resumes to secure Supabase storage (`/student/resume`).
- **FR-6.2**: Students must be able to mark a specific resume version as their "Primary" active resume used for campus placement applications.
- **FR-6.3**: The system must provide inline resume preview and ATS readiness scoring indicators.

### FR-7: Profile Management
- **FR-7.1**: The system must provide role-tailored profile pages (`/profile`):
  - **Student**: Academic year, department, section, roll number, CGPA, backlogs, technical skills with searchable tag selector, and resume link.
  - **Faculty**: Department, designation, employee ID, office/cabin location, specializations.
  - **Placement Officer / Admin**: Official designation, department, contact information.

### FR-8: System Administration & User Management
- **FR-8.1**: Administrators must be able to view and manage all registered users, roles, and status (`/admin/users`).
- **FR-8.2**: Administrators must have access to moderation queues (`/admin/moderation`) and global placement metrics (`/admin/placements`).

---

## 5. Non-Functional Requirements (NFR)

### NFR-1: Security & Data Privacy
- **Row-Level Security (RLS)**: PostgreSQL RLS must be enabled on every table in the public schema.
- **Policy Enforcement**:
  - Students may only read/write their own profile, resumes, progress, and applications.
  - Faculty may only read sessions allocated to them and registrations for those sessions.
  - Placement Officers and Admins have elevated access to placement entities.
- **Authentication**: JWT tokens managed via HTTP-only secure cookies via `@supabase/ssr`.

### NFR-2: Performance & Responsiveness
- **Server-Side Rendering (SSR)**: Critical authenticated pages must be rendered server-side using React Server Components (RSC) to minimize client bundle sizes.
- **Response Time**: Page response times must remain under 300ms for cached routes and under 800ms for dynamic database queries.
- **Database Optimization**: Foreign keys must have corresponding B-Tree indexes to prevent table scans during join operations.

### NFR-3: User Interface & Visual Aesthetics
- **Theme**: Strict **Pure Black** theme (`#000000` background, `#0A0A0A` surface containers, `#222222` subtle borders).
- **Typography & Colors**:
  - Primary text: Light Gray (`#EDEDED`)
  - Secondary/Supporting text: Muted Gray (`#9AA1AA`)
  - Single Accent Color: Safety Orange (`#FF6B00`) reserved for active items, indicators, and focus states.
- **Layout Principle**: Vertical alignment, compact line heights, minimal unnecessary cards, and absence of visual clutter.

### NFR-4: Data Integrity & Constraints
- Database relationships must enforce referential integrity with appropriate `ON DELETE CASCADE` or `ON DELETE SET NULL` constraints.
- Unique constraints must prevent duplicate applications per student per drive (`(drive_id, student_id)`) and duplicate session registrations (`(session_id, student_id)`).

---

## 6. Database Schema Specification

### 6.1 Core Tables & Relationships

```
                     ┌────────────────┐
                     │    profiles    │
                     └───────┬────────┘
                             │ 1:1
              ┌──────────────┴──────────────┐
              │                             │
       ┌──────▼──────┐               ┌──────▼──────┐
       │   students  │               │   faculty   │
       └──────┬──────┘               └──────┬──────┘
              │                             │
     ┌────────┴────────┐             ┌──────┴────────┐
     │                 │             │               │
┌────▼────┐      ┌─────▼──────┐ ┌────▼────────┐ ┌────▼────────┐
│ resumes │      │applications│ │class_sessions││allocations  │
└─────────┘      └─────▲──────┘ └────┬────────┘ └─────────────┘
                       │             │
                ┌──────┴─────┐  ┌────▼──────────────┐
                │  drives    │  │session_regis...   │
                └──────┬─────┘  └───────────────────┘
                       │
                ┌──────▼─────┐
                │ companies  │
                └────────────┘
```

### 6.2 Table Inventory

| Table Name | Description | Key Columns |
| :--- | :--- | :--- |
| `public.profiles` | Core user identity & role | `id (UUID, PK)`, `email`, `full_name`, `role (enum)`, `avatar_url` |
| `public.departments` | Academic departments | `id (UUID, PK)`, `name`, `code` (e.g., CSE, AIDS, AIML) |
| `public.academic_sections`| Department sections | `id (UUID, PK)`, `department_id (FK)`, `year`, `section_name` |
| `public.students` | Student academic records | `id (UUID, PK)`, `user_id (FK)`, `student_id`, `cgpa`, `backlogs`, `skills` |
| `public.faculty_members` | Faculty staff directory | `id (UUID, PK)`, `user_id (FK)`, `employee_id`, `designation` |
| `public.companies` | Recruiter companies | `id (UUID, PK)`, `name`, `tier`, `industry`, `status`, `website` |
| `public.placement_drives` | Recruitment drives | `id (UUID, PK)`, `company_id (FK)`, `role`, `package_ctc_lpa`, `min_cgpa` |
| `public.drive_applications`| Student drive applications | `id (UUID, PK)`, `drive_id (FK)`, `student_id (FK)`, `status` |
| `public.class_sessions` | Faculty teaching schedule | `id (UUID, PK)`, `faculty_id (FK)`, `session_date`, `start_time`, `venue` |
| `public.session_registrations`| Student session enrollment| `id (UUID, PK)`, `session_id (FK)`, `student_id (FK)`, `status` |
| `public.training_groups` | Training categories | `id (UUID, PK)`, `name` (Java, Python, Aptitude, Coding) |
| `public.preparation_topics`| Interview prep topics | `id (UUID, PK)`, `category`, `title`, `slug` |
| `public.preparation_materials`| Articles & questions | `id (UUID, PK)`, `topic_id (FK)`, `title`, `content`, `read_time_mins` |
| `public.student_topic_progress`| Prep completion status| `id (UUID, PK)`, `student_id (FK)`, `topic_id (FK)`, `is_completed` |
| `public.student_resumes` | Uploaded resumes | `id (UUID, PK)`, `student_id (FK)`, `file_url`, `is_primary` |

---

## 7. Verification & Quality Acceptance Criteria

| Specification ID | Verification Method | Acceptance Standard |
| :--- | :--- | :--- |
| **AC-01: Build & Typing** | `npx tsc --noEmit` & `npm run build` | Zero compilation errors; all 35 Next.js routes statically or dynamically generated. |
| **AC-02: RBAC Protection** | Route inspection with role cookies | Unauthenticated access redirects to `/login`; unauthorized roles redirect to assigned dashboard. |
| **AC-03: Eligibility Check**| Submission test with varied CGPA/backlogs | Application denied when student CGPA < cutoff or active backlogs > allowed limit. |
| **AC-04: Schedule Isolation**| Faculty query test | Faculty only sees allocated classes across `TODAY`, `TOMORROW`, and `UPCOMING`. |
| **AC-05: Roster Privacy** | Session detail inspection | Only students registered for that specific session are returned; no academic-wide leaks. |
| **AC-06: Database RLS** | Direct table query simulation | Queries without authenticated faculty context or ownership fail with permission denied. |

---

## 8. Installation & Deployment Guide

```bash
# 1. Clone repository
git clone <repository-url>
cd miniproject

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Provide Supabase URL and Keys in .env.local

# 4. Run database migrations
supabase db push
# Or apply migrations from /supabase/migrations/ in sequential order

# 5. Start development server
npm run dev

# 6. Production build
npm run build
npm start
```
