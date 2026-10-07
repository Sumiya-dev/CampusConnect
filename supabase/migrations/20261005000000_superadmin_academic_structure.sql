-- ==============================================================================
-- CAMPUSCONNECT AI - SUPERADMIN ACADEMIC STRUCTURE MANAGEMENT
-- Migration: 20261005000000_superadmin_academic_structure.sql
-- ==============================================================================

-- 1. Ensure programs table has status column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'programs' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.programs ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive'));
    END IF;
END $$;

-- 2. ACADEMIC YEARS TABLE
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_number INT NOT NULL UNIQUE CHECK (year_number >= 1 AND year_number <= 5),
    display_name TEXT NOT NULL,
    current_academic_calendar TEXT NOT NULL DEFAULT '2025-2026',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

INSERT INTO public.academic_years (year_number, display_name, current_academic_calendar, status)
VALUES
    (1, '1st Year (Freshman)', '2025-2026', 'active'),
    (2, '2nd Year (Sophomore)', '2025-2026', 'active'),
    (3, '3rd Year (Pre-Final)', '2025-2026', 'active'),
    (4, '4th Year (Graduating)', '2025-2026', 'active')
ON CONFLICT (year_number) DO NOTHING;

-- 3. RLS POLICIES FOR SUPERADMIN OPERATIONS

-- Departments RLS
DROP POLICY IF EXISTS "Admins can insert departments" ON public.departments;
CREATE POLICY "Admins can insert departments"
ON public.departments FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update departments" ON public.departments;
CREATE POLICY "Admins can update departments"
ON public.departments FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete departments" ON public.departments;
CREATE POLICY "Admins can delete departments"
ON public.departments FOR DELETE
TO authenticated
USING (public.is_admin());

-- Programs RLS
DROP POLICY IF EXISTS "Admins can insert programs" ON public.programs;
CREATE POLICY "Admins can insert programs"
ON public.programs FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update programs" ON public.programs;
CREATE POLICY "Admins can update programs"
ON public.programs FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete programs" ON public.programs;
CREATE POLICY "Admins can delete programs"
ON public.programs FOR DELETE
TO authenticated
USING (public.is_admin());

-- Academic Sections RLS
DROP POLICY IF EXISTS "Admins can insert academic sections" ON public.academic_sections;
CREATE POLICY "Admins can insert academic sections"
ON public.academic_sections FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update academic sections" ON public.academic_sections;
CREATE POLICY "Admins can update academic sections"
ON public.academic_sections FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete academic sections" ON public.academic_sections;
CREATE POLICY "Admins can delete academic sections"
ON public.academic_sections FOR DELETE
TO authenticated
USING (public.is_admin());

-- Training Groups RLS
DROP POLICY IF EXISTS "Admins can insert training groups" ON public.training_groups;
CREATE POLICY "Admins can insert training groups"
ON public.training_groups FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update training groups" ON public.training_groups;
CREATE POLICY "Admins can update training groups"
ON public.training_groups FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete training groups" ON public.training_groups;
CREATE POLICY "Admins can delete training groups"
ON public.training_groups FOR DELETE
TO authenticated
USING (public.is_admin());

-- Academic Years RLS
DROP POLICY IF EXISTS "Authenticated users can view academic years" ON public.academic_years;
CREATE POLICY "Authenticated users can view academic years"
ON public.academic_years FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can insert academic years" ON public.academic_years;
CREATE POLICY "Admins can insert academic years"
ON public.academic_years FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update academic years" ON public.academic_years;
CREATE POLICY "Admins can update academic years"
ON public.academic_years FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete academic years" ON public.academic_years;
CREATE POLICY "Admins can delete academic years"
ON public.academic_years FOR DELETE
TO authenticated
USING (public.is_admin());
