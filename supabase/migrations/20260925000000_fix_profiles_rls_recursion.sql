-- ==============================================================================
-- FIX: Infinite recursion in profiles and related RLS policies
-- ==============================================================================

-- 1. Helper security functions with SET row_security = off to prevent recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public SET row_security = off;

CREATE OR REPLACE FUNCTION public.get_current_user_department()
RETURNS TEXT AS $$
    SELECT department FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public SET row_security = off;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT (public.get_current_user_role() = 'administrator');
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public SET row_security = off;

CREATE OR REPLACE FUNCTION public.is_placement_officer()
RETURNS BOOLEAN AS $$
    SELECT (public.get_current_user_role() IN ('placement_officer', 'administrator'));
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public SET row_security = off;

CREATE OR REPLACE FUNCTION public.get_current_faculty_id()
RETURNS UUID AS $$
    SELECT id FROM public.faculty_members WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public SET row_security = off;

-- 2. Clean up and recreate profiles policies without recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and Placement Officers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Faculty can view student profiles in their department" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins and Placement Officers can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_placement_officer());

CREATE POLICY "Faculty can view student profiles in their department"
    ON public.profiles FOR SELECT
    USING (
        public.get_current_user_role() = 'faculty'
        AND department = public.get_current_user_department()
    );

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 3. Clean up students policy to prevent nested subquery recursion
DROP POLICY IF EXISTS "Faculty can view departmental students" ON public.students;
CREATE POLICY "Faculty can view departmental students"
    ON public.students FOR SELECT
    USING (
        public.get_current_user_role() = 'faculty'
        AND department = public.get_current_user_department()
    );
