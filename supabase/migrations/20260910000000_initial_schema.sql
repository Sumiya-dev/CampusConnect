-- ==============================================================================
-- CAMPUSCONNECT AI - PHASE 1 INITIAL DATABASE SCHEMA & RBAC
-- PostgreSQL / Supabase Schema Definition
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. ENUMS & DOMAINS
-- ------------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'faculty', 'placement_officer', 'administrator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_status AS ENUM ('active', 'inactive', 'pending', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE placement_status AS ENUM ('unplaced', 'placed', 'opted_out', 'in_process');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 2. BASE PROFILES TABLE (Linked directly to Supabase Auth)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'student',
    department TEXT NOT NULL DEFAULT 'Computer Science & Engineering',
    contact_number TEXT,
    account_status account_status NOT NULL DEFAULT 'active',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast lookup by email and role
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);

-- ------------------------------------------------------------------------------
-- 3. ROLE-SPECIFIC EXTENSION TABLES
-- ------------------------------------------------------------------------------

-- 3.1 STUDENTS
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL UNIQUE, -- University Roll/Registration Number
    department TEXT NOT NULL,
    year INT NOT NULL CHECK (year BETWEEN 1 AND 5),
    cgpa NUMERIC(4,2) NOT NULL DEFAULT 0.00 CHECK (cgpa >= 0.00 AND cgpa <= 10.00),
    skills TEXT[] DEFAULT '{}',
    placement_status placement_status NOT NULL DEFAULT 'unplaced',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_students_placement_status ON public.students(placement_status);
CREATE INDEX IF NOT EXISTS idx_students_cgpa ON public.students(cgpa);
CREATE INDEX IF NOT EXISTS idx_students_year ON public.students(year);

-- 3.2 FACULTY MEMBERS
CREATE TABLE IF NOT EXISTS public.faculty_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL,
    designation TEXT NOT NULL DEFAULT 'Assistant Professor',
    cabin_location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_faculty_department ON public.faculty_members(department);

-- 3.3 PLACEMENT OFFICERS
CREATE TABLE IF NOT EXISTS public.placement_officers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL UNIQUE,
    designation TEXT NOT NULL DEFAULT 'Placement Officer',
    office_location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.4 ADMINISTRATORS
CREATE TABLE IF NOT EXISTS public.administrators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_code TEXT NOT NULL UNIQUE,
    access_level TEXT NOT NULL DEFAULT 'super_admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 4. AUTOMATED TRIGGERS & TIMESTAMP UPDATERS
-- ------------------------------------------------------------------------------

-- Generic updated_at timestamp updater function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach updated_at triggers
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_students_updated_at ON public.students;
CREATE TRIGGER trigger_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_faculty_updated_at ON public.faculty_members;
CREATE TRIGGER trigger_faculty_updated_at
    BEFORE UPDATE ON public.faculty_members
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_placement_updated_at ON public.placement_officers;
CREATE TRIGGER trigger_placement_updated_at
    BEFORE UPDATE ON public.placement_officers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_admin_updated_at ON public.administrators;
CREATE TRIGGER trigger_admin_updated_at
    BEFORE UPDATE ON public.administrators
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 5. NEW USER PROVISIONING TRIGGER (Auth -> Profiles & Roles)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role user_role;
    assigned_department TEXT;
    assigned_name TEXT;
    assigned_contact TEXT;
    roll_or_emp_id TEXT;
    assigned_year INT;
    assigned_designation TEXT;
BEGIN
    -- Extract metadata with fallbacks
    assigned_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    assigned_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'::user_role);
    assigned_department := COALESCE(NEW.raw_user_meta_data->>'department', 'Computer Science & Engineering');
    assigned_contact := NEW.raw_user_meta_data->>'contact_number';
    roll_or_emp_id := COALESCE(NEW.raw_user_meta_data->>'identifier', 'ID-' || substr(NEW.id::text, 1, 8));

    -- Insert into base profiles
    INSERT INTO public.profiles (id, name, email, role, department, contact_number)
    VALUES (
        NEW.id,
        assigned_name,
        NEW.email,
        assigned_role,
        assigned_department,
        assigned_contact
    )
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        department = EXCLUDED.department,
        contact_number = EXCLUDED.contact_number;

    -- Insert into role specific table based on assigned_role
    IF assigned_role = 'student' THEN
        assigned_year := COALESCE((NEW.raw_user_meta_data->>'year')::INT, 3);
        INSERT INTO public.students (user_id, student_id, department, year, cgpa, skills)
        VALUES (
            NEW.id,
            roll_or_emp_id,
            assigned_department,
            assigned_year,
            COALESCE((NEW.raw_user_meta_data->>'cgpa')::numeric, 8.00),
            COALESCE(ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'skills')), ARRAY['JavaScript', 'TypeScript'])
        )
        ON CONFLICT (user_id) DO NOTHING;

    ELSIF assigned_role = 'faculty' THEN
        assigned_designation := COALESCE(NEW.raw_user_meta_data->>'designation', 'Assistant Professor');
        INSERT INTO public.faculty_members (user_id, employee_id, department, designation, cabin_location)
        VALUES (
            NEW.id,
            roll_or_emp_id,
            assigned_department,
            assigned_designation,
            NEW.raw_user_meta_data->>'cabin_location'
        )
        ON CONFLICT (user_id) DO NOTHING;

    ELSIF assigned_role = 'placement_officer' THEN
        INSERT INTO public.placement_officers (user_id, employee_id, designation, office_location)
        VALUES (
            NEW.id,
            roll_or_emp_id,
            COALESCE(NEW.raw_user_meta_data->>'designation', 'Senior Placement Officer'),
            NEW.raw_user_meta_data->>'office_location'
        )
        ON CONFLICT (user_id) DO NOTHING;

    ELSIF assigned_role = 'administrator' THEN
        INSERT INTO public.administrators (user_id, admin_code, access_level)
        VALUES (
            NEW.id,
            roll_or_emp_id,
            COALESCE(NEW.raw_user_meta_data->>'access_level', 'super_admin')
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing immediately upon sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 6. ROW-LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Helper security functions to check user roles without recursive RLS loop
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT (public.get_current_user_role() = 'administrator');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_placement_officer()
RETURNS BOOLEAN AS $$
    SELECT (public.get_current_user_role() IN ('placement_officer', 'administrator'));
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administrators ENABLE ROW LEVEL SECURITY;

-- 6.1 PROFILES POLICIES
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Placement officers & administrators can view all profiles
CREATE POLICY "Admins and Placement Officers can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_placement_officer());

-- Faculty can view profiles of students in their department
CREATE POLICY "Faculty can view student profiles in their department"
    ON public.profiles FOR SELECT
    USING (
        public.get_current_user_role() = 'faculty'
        AND department = (SELECT department FROM public.profiles WHERE id = auth.uid())
    );

-- Users can update specific profile info (contact number, name)
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Administrators can update any profile (e.g. status, role)
CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR UPDATE
    USING (public.is_admin());

-- 6.2 STUDENTS POLICIES
-- Students can read their own student record
CREATE POLICY "Students can view own record"
    ON public.students FOR SELECT
    USING (user_id = auth.uid());

-- Placement officers and admins can view all student records
CREATE POLICY "Placement and Admins can view all student records"
    ON public.students FOR SELECT
    USING (public.is_placement_officer());

-- Faculty can view student records in their department
CREATE POLICY "Faculty can view departmental students"
    ON public.students FOR SELECT
    USING (
        public.get_current_user_role() = 'faculty'
        AND department = (SELECT department FROM public.profiles WHERE id = auth.uid())
    );

-- Students can update their own skills
CREATE POLICY "Students can update own skills"
    ON public.students FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Placement officers and Admins can update CGPA and placement status
CREATE POLICY "Placement and Admins can update student records"
    ON public.students FOR UPDATE
    USING (public.is_placement_officer());

-- 6.3 FACULTY POLICIES
CREATE POLICY "Faculty can view own record"
    ON public.faculty_members FOR SELECT
    USING (user_id = auth.uid() OR public.is_placement_officer());

CREATE POLICY "Faculty can update own record"
    ON public.faculty_members FOR UPDATE
    USING (user_id = auth.uid());

-- 6.4 PLACEMENT OFFICERS POLICIES
CREATE POLICY "Placement officers can view own record"
    ON public.placement_officers FOR SELECT
    USING (user_id = auth.uid() OR public.is_admin());

-- 6.5 ADMINISTRATORS POLICIES
CREATE POLICY "Admins can view and manage administrators"
    ON public.administrators FOR ALL
    USING (public.is_admin() OR user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 7. SUPABASE STORAGE (Configuration Setup)
-- ------------------------------------------------------------------------------

-- Insert storage buckets if storage schema is available in Supabase
DO $$ BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('resumes', 'resumes', false)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true)
    ON CONFLICT (id) DO NOTHING;
EXCEPTION
    WHEN undefined_table THEN null;
END $$;
