-- ==============================================================================
-- CAMPUSCONNECT AI - PHASE 4: PLACEMENT DRIVES & STUDENT APPLICATIONS
-- PostgreSQL / Supabase Schema & Row-Level Security
-- ==============================================================================

-- 1. Create enums if not exists
DO $$ BEGIN
    CREATE TYPE drive_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM (
        'applied',
        'shortlisted',
        'interview',
        'rejected',
        'selected',
        'placed',
        'withdrawn'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create placement_drives table
CREATE TABLE IF NOT EXISTS public.placement_drives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    job_role TEXT NOT NULL,
    package_details TEXT NOT NULL,
    tier TEXT NOT NULL DEFAULT 'Core Recruiter',
    location TEXT,
    description TEXT,
    min_cgpa NUMERIC(4,2) NOT NULL DEFAULT 6.00,
    eligible_departments TEXT[] NOT NULL DEFAULT '{}',
    eligible_years INT[] NOT NULL DEFAULT '{}',
    max_backlogs INT NOT NULL DEFAULT 0,
    required_skills TEXT[] DEFAULT '{}',
    recruitment_stages TEXT[] DEFAULT '{}',
    registration_deadline TIMESTAMPTZ NOT NULL,
    drive_date TIMESTAMPTZ,
    drive_time TEXT,
    venue TEXT,
    instructions TEXT[] DEFAULT '{}',
    required_documents TEXT[] DEFAULT '{}',
    vacancies TEXT,
    bond_period TEXT,
    status drive_status NOT NULL DEFAULT 'open',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    drive_id UUID NOT NULL REFERENCES public.placement_drives(id) ON DELETE CASCADE,
    status application_status NOT NULL DEFAULT 'applied',
    shortlisted_at TIMESTAMPTZ,
    interview_date TIMESTAMPTZ,
    interview_venue TEXT,
    notes TEXT,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_student_drive UNIQUE (student_id, drive_id)
);

-- 4. Indexes for fast joins, search, and student queries
CREATE INDEX IF NOT EXISTS idx_drives_company_id ON public.placement_drives(company_id);
CREATE INDEX IF NOT EXISTS idx_drives_status ON public.placement_drives(status);
CREATE INDEX IF NOT EXISTS idx_drives_deadline ON public.placement_drives(registration_deadline);
CREATE INDEX IF NOT EXISTS idx_applications_student ON public.applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_drive ON public.applications(drive_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);

-- 5. Updated_at automated triggers
DROP TRIGGER IF EXISTS trigger_placement_drives_updated_at ON public.placement_drives;
CREATE TRIGGER trigger_placement_drives_updated_at
    BEFORE UPDATE ON public.placement_drives
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_applications_updated_at ON public.applications;
CREATE TRIGGER trigger_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Row-Level Security (RLS)

-- 6.1 Enable RLS
ALTER TABLE public.placement_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- 6.2 Companies access for Students (students need to read active companies associated with drives)
DROP POLICY IF EXISTS "Students can view active companies" ON public.companies;
CREATE POLICY "Students can view active companies"
    ON public.companies FOR SELECT
    USING (status = 'active');

-- 6.3 Placement Drives Policies
-- Everyone authenticated can view non-cancelled drives
DROP POLICY IF EXISTS "Authenticated users can view placement drives" ON public.placement_drives;
CREATE POLICY "Authenticated users can view placement drives"
    ON public.placement_drives FOR SELECT
    USING (status != 'cancelled' OR public.is_placement_officer());

-- Only Placement Officers & Admins can manage drives
DROP POLICY IF EXISTS "Placement officers can manage drives" ON public.placement_drives;
CREATE POLICY "Placement officers can manage drives"
    ON public.placement_drives FOR ALL
    USING (public.is_placement_officer())
    WITH CHECK (public.is_placement_officer());

-- 6.4 Applications Policies
-- Students can view their OWN applications
DROP POLICY IF EXISTS "Students can view own applications" ON public.applications;
CREATE POLICY "Students can view own applications"
    ON public.applications FOR SELECT
    USING (
        student_id IN (
            SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()
        )
        OR public.is_placement_officer()
    );

-- Students can insert their OWN applications
DROP POLICY IF EXISTS "Students can insert own applications" ON public.applications;
CREATE POLICY "Students can insert own applications"
    ON public.applications FOR INSERT
    WITH CHECK (
        student_id IN (
            SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()
        )
    );

-- Only Placement Officers and Admins can update application status
DROP POLICY IF EXISTS "Officers and Admins can update applications" ON public.applications;
CREATE POLICY "Officers and Admins can update applications"
    ON public.applications FOR UPDATE
    USING (public.is_placement_officer())
    WITH CHECK (public.is_placement_officer());
