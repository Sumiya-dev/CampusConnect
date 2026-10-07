-- ==============================================================================
-- CAMPUSCONNECT AI - FACULTY PLACEMENTS MODULE RLS
-- PostgreSQL / Supabase Schema Row-Level Security Policies
-- ==============================================================================

-- 1. Allow faculty to view companies
DROP POLICY IF EXISTS "Faculty can view companies" ON public.companies;
CREATE POLICY "Faculty can view companies"
    ON public.companies FOR SELECT
    TO authenticated
    USING (public.get_current_user_role() = 'faculty');

-- 2. Allow faculty to view all placement drives
DROP POLICY IF EXISTS "Authenticated users can view placement drives" ON public.placement_drives;
CREATE POLICY "Authenticated users can view placement drives"
    ON public.placement_drives FOR SELECT
    TO authenticated
    USING (
        (status != 'cancelled'::drive_status) 
        OR public.is_placement_officer() 
        OR (public.get_current_user_role() = 'faculty'::user_role)
    );

-- 3. Allow faculty to view applications of authorized students
DROP POLICY IF EXISTS "Faculty can view authorized student applications" ON public.applications;
CREATE POLICY "Faculty can view authorized student applications"
    ON public.applications FOR SELECT
    TO authenticated
    USING (
        public.get_current_user_role() = 'faculty'
        AND (
            student_id IN (
                SELECT sae.student_id 
                FROM public.student_academic_enrollments sae
                JOIN public.faculty_class_assignments fca ON fca.section_id = sae.section_id
                WHERE fca.faculty_id = public.get_current_faculty_id()
            )
            OR
            student_id IN (
                SELECT ste.student_id 
                FROM public.student_training_enrollments ste
                JOIN public.faculty_training_assignments fta ON fta.training_group_id = ste.training_group_id
                WHERE fta.faculty_id = public.get_current_faculty_id()
            )
            OR
            student_id IN (
                SELECT s.id 
                FROM public.students s
                WHERE s.department = public.get_current_user_department()
            )
        )
    );

-- 4. Allow faculty to view authorized students
DROP POLICY IF EXISTS "Faculty can view authorized students" ON public.students;
CREATE POLICY "Faculty can view authorized students"
    ON public.students FOR SELECT
    TO authenticated
    USING (
        public.get_current_user_role() = 'faculty'
        AND (
            department = public.get_current_user_department()
            OR id IN (
                SELECT sae.student_id 
                FROM public.student_academic_enrollments sae
                JOIN public.faculty_class_assignments fca ON fca.section_id = sae.section_id
                WHERE fca.faculty_id = public.get_current_faculty_id()
            )
            OR id IN (
                SELECT ste.student_id 
                FROM public.student_training_enrollments ste
                JOIN public.faculty_training_assignments fta ON fta.training_group_id = ste.training_group_id
                WHERE fta.faculty_id = public.get_current_faculty_id()
            )
        )
    );
