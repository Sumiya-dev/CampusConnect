# CampusConnect AI

> **Unified Campus Placement, Academic Training & Institutional Collaboration Platform**

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%2015+-emerald?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-orange)](#license)

---

## Overview

**CampusConnect AI** is an enterprise-grade academic training and campus placement automation system designed for higher education institutions. It streamlines and bridges the operational gaps between students, academic faculty, corporate placement officers, and university administrators.

The platform provides automated placement eligibility checking, strictly isolated faculty schedule allocations, comprehensive corporate recruiter relationship management, structured interview preparation tracks, ATS resume analysis, and a role-isolated community forum with private student discussion spaces.

---

##  Key Modules & Capabilities

### 1. Student Placement & Career Hub
- **Placement Drive Discovery**: Browse active, upcoming, and past recruitment drives categorized into recruitment tiers (`Tier 1`, `Tier 2`, `Tier 3`, `Dream`).
- **Real-Time Eligibility Engine**: Automated validation evaluating student CGPA, active backlogs, eligible departments, and graduation year before application submission with detailed mismatch explanations.
- **One-Click Application Workflow**: Apply to eligible drives referencing primary active resumes with real-time status tracking (`Applied`, `Shortlisted`, `Interview Scheduled`, `Selected`, `Rejected`).
- **Interview Preparation Center**:
  - **Technical Tracks**: Deep-dive preparation in Java, Python, C++, Web Development, Cloud & DevOps, and Core CS (DBMS, OS, Computer Networks).
  - **Aptitude Tracks**: Quantitative Aptitude, Logical Reasoning, and Verbal Ability.
  - **HR & Soft Skills**: Standard HR questions, behavioral scenarios, and the STAR framework.
  - **Company-Specific Kits**: Tailored recruitment kits for top recruiters (Google, Amazon, TCS, Infosys, etc.) with interview difficulty metrics.
- **Resume Manager & ATS Preview**: Upload PDF resumes to secure storage with inline preview (`/api/resume/preview`), ATS score indicators, and primary resume selection.

### 2. Faculty Classes & Schedule Allocation
- **Isolated Allocation Workflow**: Organized strictly around **Faculty Allocation $\rightarrow$ Schedule $\rightarrow$ Registered Students**.
- **Chronological Schedule**: Classes categorized into **`TODAY`**, **`TOMORROW`**, and **`UPCOMING`** sessions.
- **Session Attendance Rosters**: Class-specific student rosters displaying enrolled students with dynamic training group filters (`Java`, `Python`, `Web Dev`, etc.).
- **Privacy Enforcement**: Faculty members cannot view unrelated academic years, extraneous departments, or non-allocated students.

### 3. Placement Officer Operations
- **Corporate Directory**: Manage participating companies, company tiers, primary HR contacts, recruitment histories, and compliance statuses.
- **Drive Lifecycle Management**: Schedule recruitment drives, define eligibility parameters, configure selection stages, and publish instructions.
- **Application & Shortlisting Pipelines**: Filter and shortlist candidate pools across departments, export rosters, and issue interview invites.
- **Institutional Analytics**: Real-time tracking of placement percentages, average/highest CTC packages, and department-wise recruitment rates.

### 4. Community Discussion Boards
- **Public Community**: University-wide forum visible to all authenticated institutional members (Students, Faculty, Placement Officers, Administrators) across categories:
  - `Placement`, `Preparation`, `Technical`, `Career`, `General`.
- **Students Only Community **: A completely private, peer-to-peer discussion space accessible **exclusively** to users with the `student` role.
  - **Database-Level Row Level Security (RLS)**: Enforced via PostgreSQL RLS policies and `is_student()` helper functions. Non-students receive **0 rows** for student-only posts, comments, or likes, even via direct API calls.
  - **Role-Aware UI**: Non-students never see the Students Only tab or its discussions.
  - **Interactive Discussions**: Threaded comments, optimistic likes, and author-controlled deletion.

### 5.  Administrative Governance & User Management
- **Account Directory**: Audit and manage user accounts, change account statuses (`active`, `inactive`, `pending`, `suspended`), and assign institutional roles.
- **Moderation Queue**: Review flagged content, oversee communication conduct, and manage community policies.
- **Platform Analytics**: Global insights into institutional hiring metrics, student engagement, and faculty allocations.

---

##  Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.3.4 (App Router) | React Server Components (RSC), Server Actions, Turbopack |
| **Frontend** | React 19.2.8, TypeScript 5.x | Fully typed, responsive component architecture |
| **Styling** | Tailwind CSS v4, Lucide React | Minimal pure-black dark aesthetic (`#000000`, `#0A0A0A`, `#FF6B00`) |
| **Database** | PostgreSQL 15+ (Supabase) | Relational tables, views, stored procedures, B-tree indexes |
| **Security** | Supabase Row Level Security (RLS) | Database-enforced isolation, zero client-side bypass risk |
| **Auth** | Supabase Auth + `@supabase/ssr` | Cookie-based JWT sessions with local demo session fallback |
| **Storage** | Supabase Storage / Local Uploads | Secure PDF document storage and inline streaming |

---

##  Security & Access Control Matrix

| Resource | Student | Faculty | Placement Officer | Administrator |
| :--- | :---: | :---: | :---: | :---: |
| **Own Profile & Resumes** | Read / Write | Read / Write | Read / Write | Read / Write |
| **Placement Drives & Apply** | Read / Apply | Read Only | Full CRUD | Full CRUD |
| **Company Directory** | Read Only | Read Only | Full CRUD | Full CRUD |
| **Allocated Classes & Rosters**| Enrolled Only| Allocated Only| Read Only | Full Management |
| **Public Community** | Read / Write | Read / Write | Read / Write | Read / Write |
| **Students Only Community ** | **Full Access**| **No Access (RLS)**| **No Access (RLS)**| **No Access (RLS)**|
| **User Directory & Governance**| No Access | No Access | No Access | **Full Access** |

---

##  Project Structure

```
miniproject/
├── .agents/                      # Supabase skills & PostgreSQL guidelines
├── public/                       # Static public assets & uploaded resumes
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Authentication routes (login, signup, callback)
│   │   ├── (dashboard)/          # Role-based protected routes
│   │   │   ├── admin/            # Administrator console & governance
│   │   │   ├── faculty/          # Faculty schedule, sessions & classes
│   │   │   ├── placement/        # Placement officer drives & companies
│   │   │   ├── student/          # Student placements, preparation, community & resume
│   │   │   └── profile/          # User profile configuration
│   │   ├── api/                  # API endpoints (resume preview streaming, signout)
│   │   ├── globals.css           # Pure black theme tokens & styling
│   │   ├── layout.tsx            # Root application layout
│   │   └── page.tsx              # Landing & marketing page
│   ├── components/               # Reusable UI components
│   │   ├── admin/                # Admin user tables & moderation cards
│   │   ├── community/            # Community feeds, post composers, detail views
│   │   ├── faculty/              # Schedule cards, session rosters, class lists
│   │   ├── layout/               # Header, Sidebar, Breadcrumbs, PageContainer
│   │   ├── placements/           # Drive cards, application forms, company items
│   │   ├── preparation/          # Study topic accordions & progress toggles
│   │   ├── resume/               # Resume upload dropzone & ATS preview
│   │   └── ui/                   # Button, Card, Badge, Alert, Input, Select
│   ├── lib/                      # Core business logic & integrations
│   │   ├── auth/                 # Auth actions, session parsing & user context
│   │   ├── community/            # Community queries, actions & RLS handlers
│   │   ├── companies/            # Company CRUD actions & queries
│   │   ├── faculty/              # Faculty schedule queries & actions
│   │   ├── placements/           # Drive eligibility engine & application actions
│   │   ├── preparation/          # Prep progress tracking & material queries
│   │   ├── profile/              # Profile update actions & account governance
│   │   ├── resume/               # PDF upload actions & resume queries
│   │   ├── supabase/             # Server/client Supabase instantiation & middleware
│   │   └── types/                # TypeScript database interfaces & domain types
│   └── proxy.ts                  # Route protection & role-based redirection proxy
├── supabase/
│   └── migrations/               # Sequential SQL migrations & RLS definitions
├── REQUIREMENTS.md               # Detailed Software Requirements Specification (SRS)
├── package.json                  # Dependencies & execution scripts
└── tsconfig.json                 # TypeScript compiler configuration
```

---

## Getting Started

### Prerequisites
- **Node.js**: `v18.18.0` or `v20.x` LTS
- **Package Manager**: `npm` (or `pnpm` / `yarn`)
- **Database**: A Supabase project (Free or Pro tier)

### 1. Clone the Repository
```bash
git clone https://github.com/Sumiya-dev/CampusConnect.git
cd CampusConnect
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the project root:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup & Migrations
Apply the database migrations in order to initialize the schema, RLS policies, triggers, and seed data:
```bash
# Using Supabase CLI (recommended)
supabase db push

# Or execute the SQL files in /supabase/migrations/ via Supabase SQL Editor:
# 1. 20260910000000_initial_schema.sql
# 2. 20260918000000_create_companies.sql
# 3. 20260918000001_create_drives_and_applications.sql
# 4. 20260918000002_seed_companies_and_drives.sql
# 5. 20260918000003_create_preparation_and_progress.sql
# 6. 20260918000004_seed_preparation_content.sql
# 7. 20260919000000_create_resumes.sql
# 8. 20260924000000_create_faculty_classes_and_groups.sql
# 9. 20260924000001_create_faculty_schedule_sessions.sql
# 10. 20260925000000_fix_profiles_rls_recursion.sql
# 11. 20260925000001_fix_and_scale_user_provisioning.sql
# 12. 20260925000002_create_community_module.sql
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Production Build
```bash
npm run build
npm start
```

---

##  Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the local Turbopack Next.js development server |
| `npm run build` | Compiles an optimized production build with full type checking |
| `npm start` | Launches the production-built application server |
| `npm run lint` | Runs Next.js ESLint verification across source files |

---

##  License

This project is licensed under the [MIT License](LICENSE).
