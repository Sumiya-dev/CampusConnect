-- ==============================================================================
-- CAMPUSCONNECT AI - MODULE: STUDENT PREPARATION & PROGRESS TRACKING
-- PostgreSQL / Supabase Schema & Row-Level Security
-- ==============================================================================

-- 1. Create preparation_materials table
CREATE TABLE IF NOT EXISTS public.preparation_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('Technical', 'Aptitude', 'HR')),
    sub_category TEXT,
    difficulty TEXT NOT NULL DEFAULT 'Intermediate' CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    job_role TEXT,
    estimated_time TEXT DEFAULT '45 mins',
    content TEXT NOT NULL,
    key_takeaways TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create interview_questions table
CREATE TABLE IF NOT EXISTS public.interview_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID REFERENCES public.preparation_materials(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('Technical', 'Aptitude', 'HR')),
    question TEXT NOT NULL,
    answer_guide TEXT NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    job_role TEXT,
    interview_type TEXT DEFAULT 'Technical Interview',
    difficulty TEXT NOT NULL DEFAULT 'Intermediate' CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    sample_code TEXT,
    tips TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create student_preparation_progress table
CREATE TABLE IF NOT EXISTS public.student_preparation_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES public.preparation_materials(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'in_progress',
    notes TEXT,
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_student_material UNIQUE (student_id, material_id)
);

-- 4. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_prep_materials_category ON public.preparation_materials(category);
CREATE INDEX IF NOT EXISTS idx_prep_materials_company ON public.preparation_materials(company_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_category ON public.interview_questions(category);
CREATE INDEX IF NOT EXISTS idx_interview_questions_company ON public.interview_questions(company_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_material ON public.interview_questions(material_id);
CREATE INDEX IF NOT EXISTS idx_student_prep_student ON public.student_preparation_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_prep_material ON public.student_preparation_progress(material_id);
CREATE INDEX IF NOT EXISTS idx_student_prep_status ON public.student_preparation_progress(status);

-- 5. Updated_at automated triggers
DROP TRIGGER IF EXISTS trigger_prep_materials_updated_at ON public.preparation_materials;
CREATE TRIGGER trigger_prep_materials_updated_at
    BEFORE UPDATE ON public.preparation_materials
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_student_prep_progress_updated_at ON public.student_preparation_progress;
CREATE TRIGGER trigger_student_prep_progress_updated_at
    BEFORE UPDATE ON public.student_preparation_progress
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Row-Level Security (RLS)

-- 6.1 Enable RLS
ALTER TABLE public.preparation_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_preparation_progress ENABLE ROW LEVEL SECURITY;

-- 6.2 Preparation Materials Policies
-- Authenticated users can view all preparation materials
DROP POLICY IF EXISTS "Authenticated users can view preparation materials" ON public.preparation_materials;
CREATE POLICY "Authenticated users can view preparation materials"
    ON public.preparation_materials FOR SELECT
    TO authenticated
    USING (true);

-- Placement Officers & Administrators can manage preparation materials
DROP POLICY IF EXISTS "Officers and Admins can manage preparation materials" ON public.preparation_materials;
CREATE POLICY "Officers and Admins can manage preparation materials"
    ON public.preparation_materials FOR ALL
    USING (public.is_placement_officer())
    WITH CHECK (public.is_placement_officer());

-- 6.3 Interview Questions Policies
-- Authenticated users can view interview questions
DROP POLICY IF EXISTS "Authenticated users can view interview questions" ON public.interview_questions;
CREATE POLICY "Authenticated users can view interview questions"
    ON public.interview_questions FOR SELECT
    TO authenticated
    USING (true);

-- Placement Officers & Administrators can manage interview questions
DROP POLICY IF EXISTS "Officers and Admins can manage interview questions" ON public.interview_questions;
CREATE POLICY "Officers and Admins can manage interview questions"
    ON public.interview_questions FOR ALL
    USING (public.is_placement_officer())
    WITH CHECK (public.is_placement_officer());

-- 6.4 Student Preparation Progress Policies
-- Students can only view their own preparation progress (Placement Officers can also view for monitoring)
DROP POLICY IF EXISTS "Students can view own preparation progress" ON public.student_preparation_progress;
CREATE POLICY "Students can view own preparation progress"
    ON public.student_preparation_progress FOR SELECT
    USING (
        student_id IN (
            SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()
        )
        OR public.is_placement_officer()
    );

-- Students can insert only their own preparation progress
DROP POLICY IF EXISTS "Students can insert own preparation progress" ON public.student_preparation_progress;
CREATE POLICY "Students can insert own preparation progress"
    ON public.student_preparation_progress FOR INSERT
    WITH CHECK (
        student_id IN (
            SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()
        )
    );

-- Students can update only their own preparation progress
DROP POLICY IF EXISTS "Students can update own preparation progress" ON public.student_preparation_progress;
CREATE POLICY "Students can update own preparation progress"
    ON public.student_preparation_progress FOR UPDATE
    USING (
        student_id IN (
            SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()
        )
    )
    WITH CHECK (
        student_id IN (
            SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()
        )
    );

-- Students can delete only their own preparation progress
DROP POLICY IF EXISTS "Students can delete own preparation progress" ON public.student_preparation_progress;
CREATE POLICY "Students can delete own preparation progress"
    ON public.student_preparation_progress FOR DELETE
    USING (
        student_id IN (
            SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()
        )
    );
