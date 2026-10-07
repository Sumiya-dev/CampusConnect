-- ==============================================================================
-- CAMPUSCONNECT AI - FACULTY ANNOUNCEMENTS MODULE
-- PostgreSQL / Supabase Schema Definition, RLS Policies, and Real Demo Seed
-- ==============================================================================

-- Helper functions for student context with row_security = off to prevent circular policy recursion
CREATE OR REPLACE FUNCTION public.get_current_student_id()
RETURNS UUID AS $$
    SELECT id FROM public.students WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public SET row_security = off;

CREATE OR REPLACE FUNCTION public.get_current_student_department()
RETURNS TEXT AS $$
    SELECT department FROM public.students WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public SET row_security = off;

CREATE OR REPLACE FUNCTION public.get_current_student_year()
RETURNS INT AS $$
    SELECT year FROM public.students WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public SET row_security = off;

-- Clean up student enrollment policies to avoid circular recursion
DROP POLICY IF EXISTS "Students can view own academic enrollment" ON public.student_academic_enrollments;
DROP POLICY IF EXISTS "Students can view own academic enrollments" ON public.student_academic_enrollments;
CREATE POLICY "Students can view own academic enrollment"
ON public.student_academic_enrollments FOR SELECT
TO authenticated
USING (student_id = public.get_current_student_id());

DROP POLICY IF EXISTS "Students can view own training enrollment" ON public.student_training_enrollments;
DROP POLICY IF EXISTS "Students can view own training enrollments" ON public.student_training_enrollments;
CREATE POLICY "Students can view own training enrollment"
ON public.student_training_enrollments FOR SELECT
TO authenticated
USING (student_id = public.get_current_student_id());

CREATE TABLE IF NOT EXISTS public.faculty_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES public.faculty_members(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_type TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'department', 'year', 'section', 'training_group')),
    target_department TEXT,
    target_year INT CHECK (target_year IS NULL OR (target_year >= 1 AND target_year <= 5)),
    section_id UUID REFERENCES public.academic_sections(id) ON DELETE CASCADE,
    training_group_id UUID REFERENCES public.training_groups(id) ON DELETE CASCADE,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_faculty_announcements_faculty ON public.faculty_announcements(faculty_id);
CREATE INDEX IF NOT EXISTS idx_faculty_announcements_section ON public.faculty_announcements(section_id);
CREATE INDEX IF NOT EXISTS idx_faculty_announcements_training ON public.faculty_announcements(training_group_id);
CREATE INDEX IF NOT EXISTS idx_faculty_announcements_target ON public.faculty_announcements(target_type, is_published);
CREATE INDEX IF NOT EXISTS idx_faculty_announcements_dept ON public.faculty_announcements(target_department);
CREATE INDEX IF NOT EXISTS idx_faculty_announcements_year ON public.faculty_announcements(target_year);
CREATE INDEX IF NOT EXISTS idx_faculty_announcements_created ON public.faculty_announcements(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.faculty_announcements ENABLE ROW LEVEL SECURITY;

-- 1. Faculty SELECT: Faculty can view their OWN announcements (both published and drafts); Admins & Placement Officers can view all
DROP POLICY IF EXISTS "Faculty can view own announcements" ON public.faculty_announcements;
CREATE POLICY "Faculty can view own announcements"
ON public.faculty_announcements FOR SELECT
TO authenticated
USING (
  (public.get_current_user_role() = 'faculty' AND faculty_id = public.get_current_faculty_id())
  OR public.is_admin()
  OR public.is_placement_officer()
);

-- 2. Students SELECT: Students can ONLY view published announcements targeted to their scope
DROP POLICY IF EXISTS "Students can view published targeted announcements" ON public.faculty_announcements;
CREATE POLICY "Students can view published targeted announcements"
ON public.faculty_announcements FOR SELECT
TO authenticated
USING (
  public.get_current_user_role() = 'student'
  AND is_published = true
  AND (
    target_type = 'all'
    OR (
      target_type = 'department'
      AND (
        target_department = public.get_current_student_department()
        OR target_department IN (
          SELECT d.code FROM public.departments d
          WHERE d.name = public.get_current_student_department()
        )
      )
    )
    OR (
      target_type = 'year'
      AND target_year = public.get_current_student_year()
    )
    OR (
      target_type = 'section'
      AND section_id IN (
        SELECT sae.section_id FROM public.student_academic_enrollments sae
        WHERE sae.student_id = public.get_current_student_id()
      )
    )
    OR (
      target_type = 'training_group'
      AND training_group_id IN (
        SELECT ste.training_group_id FROM public.student_training_enrollments ste
        WHERE ste.student_id = public.get_current_student_id()
      )
    )
  )
);

-- 3. Faculty INSERT: Can insert only with their own faculty_id
DROP POLICY IF EXISTS "Faculty can insert own announcements" ON public.faculty_announcements;
CREATE POLICY "Faculty can insert own announcements"
ON public.faculty_announcements FOR INSERT
TO authenticated
WITH CHECK (
  public.get_current_user_role() = 'faculty'
  AND faculty_id = public.get_current_faculty_id()
);

-- 4. Faculty UPDATE: Can update only their own announcements
DROP POLICY IF EXISTS "Faculty can update own announcements" ON public.faculty_announcements;
CREATE POLICY "Faculty can update own announcements"
ON public.faculty_announcements FOR UPDATE
TO authenticated
USING (
  public.get_current_user_role() = 'faculty'
  AND faculty_id = public.get_current_faculty_id()
)
WITH CHECK (
  public.get_current_user_role() = 'faculty'
  AND faculty_id = public.get_current_faculty_id()
);

-- 5. Faculty DELETE: Can delete only their own announcements
DROP POLICY IF EXISTS "Faculty can delete own announcements" ON public.faculty_announcements;
CREATE POLICY "Faculty can delete own announcements"
ON public.faculty_announcements FOR DELETE
TO authenticated
USING (
  public.get_current_user_role() = 'faculty'
  AND faculty_id = public.get_current_faculty_id()
);

-- Seed initial real announcements for Dr. Ramesh Kumar (FAC-CSE-001)
DO $$
DECLARE
    fac_id UUID;
    sec_4a UUID := 'cf6aee9c-f3e8-40e8-8170-33a121c06aed'::uuid;
    train_coding UUID := 'b5e0e5d8-09ce-4400-af8b-bb9adf370a63'::uuid;
BEGIN
    SELECT id INTO fac_id FROM public.faculty_members WHERE employee_id = 'FAC-CSE-001' LIMIT 1;

    IF fac_id IS NOT NULL THEN
        -- Notice 1: Section Specific (Published)
        INSERT INTO public.faculty_announcements (
            faculty_id, title, content, target_type, section_id, is_published, created_at
        ) VALUES (
            fac_id,
            'Lab Assessment Reschedule for Microsoft Drive Candidates',
            'Distributed Systems lab session scheduled for Thursday is moved to Friday 3:00 PM in Lab 3 to accommodate candidates appearing for the Microsoft technical interview round.',
            'section',
            sec_4a,
            true,
            NOW() - INTERVAL '2 days'
        ) ON CONFLICT DO NOTHING;

        -- Notice 2: Training Group Specific (Published)
        INSERT INTO public.faculty_announcements (
            faculty_id, title, content, target_type, training_group_id, is_published, created_at
        ) VALUES (
            fac_id,
            'Competitive Programming Mock Assessment Results Released',
            'Rank lists and test-case analytics for the 3-hour weekend coding assessment have been updated. Shortlisted candidates for Tier-1 drives are requested to review edge cases for graph algorithms.',
            'training_group',
            train_coding,
            true,
            NOW() - INTERVAL '1 day'
        ) ON CONFLICT DO NOTHING;

        -- Notice 3: Academic Year Specific (Published)
        INSERT INTO public.faculty_announcements (
            faculty_id, title, content, target_type, target_year, is_published, created_at
        ) VALUES (
            fac_id,
            'Final Semester Project Synopsis Submission Deadline',
            'All 4th-year undergraduate candidates must upload their signed capstone project synopses before Friday 5:00 PM for departmental clearance.',
            'year',
            4,
            true,
            NOW() - INTERVAL '5 hours'
        ) ON CONFLICT DO NOTHING;

        -- Notice 4: Department Specific (Draft / Unpublished)
        INSERT INTO public.faculty_announcements (
            faculty_id, title, content, target_type, target_department, is_published, created_at
        ) VALUES (
            fac_id,
            '[Draft] Department Technical Symposium - Call for Project Demonstrations',
            'Proposals for the upcoming annual technical symposium will open next week. Working prototypes in Cloud Computing, AI/ML, and Cybersecurity are eligible.',
            'department',
            'Computer Science & Engineering',
            false,
            NOW() - INTERVAL '3 hours'
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;
