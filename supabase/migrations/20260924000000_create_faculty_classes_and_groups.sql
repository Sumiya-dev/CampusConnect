-- ==============================================================================
-- CAMPUSCONNECT AI - FACULTY PORTAL: CLASSES & GROUPS FOUNDATION
-- PostgreSQL / Supabase Schema Definition & Row-Level Security
-- ==============================================================================

-- 1. DEPARTMENTS
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. PROGRAMS / BRANCHES
CREATE TABLE IF NOT EXISTS public.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_program_dept_code UNIQUE (department_id, code)
);

-- 3. ACADEMIC CLASSES / SECTIONS
CREATE TABLE IF NOT EXISTS public.academic_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL, -- e.g. '2025-2026'
    year INT NOT NULL CHECK (year BETWEEN 1 AND 5), -- 1st, 2nd, 3rd, 4th, 5th Year
    semester INT,
    section_name TEXT NOT NULL, -- e.g. 'Section A', 'Section B'
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_section_program_year UNIQUE (program_id, academic_year, year, section_name)
);

-- 4. TRAINING GROUPS
CREATE TABLE IF NOT EXISTS public.training_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- e.g. 'Java Training', 'Python Training', 'Aptitude Training', 'Coding Training'
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. STUDENT ACADEMIC ENROLLMENT (A student belongs to ONE academic section)
CREATE TABLE IF NOT EXISTS public.student_academic_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.academic_sections(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. STUDENT TRAINING ENROLLMENT (A student can belong to MULTIPLE training groups)
CREATE TABLE IF NOT EXISTS public.student_training_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    training_group_id UUID NOT NULL REFERENCES public.training_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_student_training UNIQUE (student_id, training_group_id)
);

-- 7. FACULTY CLASS ASSIGNMENTS (Faculty assigned to academic sections)
CREATE TABLE IF NOT EXISTS public.faculty_class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES public.faculty_members(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.academic_sections(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_faculty_section UNIQUE (faculty_id, section_id)
);

-- 8. FACULTY TRAINING ASSIGNMENTS (Faculty assigned to training groups)
CREATE TABLE IF NOT EXISTS public.faculty_training_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES public.faculty_members(id) ON DELETE CASCADE,
    training_group_id UUID NOT NULL REFERENCES public.training_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_faculty_training UNIQUE (faculty_id, training_group_id)
);

-- ------------------------------------------------------------------------------
-- INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_programs_department ON public.programs(department_id);
CREATE INDEX IF NOT EXISTS idx_sections_program ON public.academic_sections(program_id);
CREATE INDEX IF NOT EXISTS idx_sections_year ON public.academic_sections(year);
CREATE INDEX IF NOT EXISTS idx_student_academics_section ON public.student_academic_enrollments(section_id);
CREATE INDEX IF NOT EXISTS idx_student_trainings_group ON public.student_training_enrollments(training_group_id);
CREATE INDEX IF NOT EXISTS idx_faculty_classes_faculty ON public.faculty_class_assignments(faculty_id);
CREATE INDEX IF NOT EXISTS idx_faculty_trainings_faculty ON public.faculty_training_assignments(faculty_id);

-- ------------------------------------------------------------------------------
-- HELPER FUNCTIONS FOR FACULTY SCOPED ACCESS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_faculty_id()
RETURNS UUID AS $$
    SELECT id FROM public.faculty_members WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- ROW-LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_academic_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_training_assignments ENABLE ROW LEVEL SECURITY;

-- 9.1 DEPARTMENTS & PROGRAMS
-- Readable by all authenticated users
CREATE POLICY "Authenticated users can view departments"
    ON public.departments FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view programs"
    ON public.programs FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- 9.2 ACADEMIC SECTIONS
-- Placement officers & admins can view all sections
-- Faculty can only view sections assigned to them
CREATE POLICY "Admins and officers can view all sections"
    ON public.academic_sections FOR SELECT
    USING (public.is_placement_officer());

CREATE POLICY "Faculty can view assigned sections"
    ON public.academic_sections FOR SELECT
    USING (
        public.get_current_user_role() = 'faculty'
        AND id IN (
            SELECT section_id FROM public.faculty_class_assignments
            WHERE faculty_id = public.get_current_faculty_id()
        )
    );

-- 9.3 TRAINING GROUPS
-- Admins/Officers view all
-- Faculty view assigned training groups
CREATE POLICY "Admins and officers can view all training groups"
    ON public.training_groups FOR SELECT
    USING (public.is_placement_officer());

CREATE POLICY "Faculty can view assigned training groups"
    ON public.training_groups FOR SELECT
    USING (
        public.get_current_user_role() = 'faculty'
        AND id IN (
            SELECT training_group_id FROM public.faculty_training_assignments
            WHERE faculty_id = public.get_current_faculty_id()
        )
    );

-- Students can view their enrolled training groups
CREATE POLICY "Students can view enrolled training groups"
    ON public.training_groups FOR SELECT
    USING (
        public.get_current_user_role() = 'student'
        AND id IN (
            SELECT ste.training_group_id FROM public.student_training_enrollments ste
            JOIN public.students s ON s.id = ste.student_id
            WHERE s.user_id = auth.uid()
        )
    );

-- 9.4 STUDENT ACADEMIC ENROLLMENTS
CREATE POLICY "Admins and officers can view academic enrollments"
    ON public.student_academic_enrollments FOR SELECT
    USING (public.is_placement_officer());

CREATE POLICY "Faculty can view enrollments for assigned sections"
    ON public.student_academic_enrollments FOR SELECT
    USING (
        public.get_current_user_role() = 'faculty'
        AND section_id IN (
            SELECT section_id FROM public.faculty_class_assignments
            WHERE faculty_id = public.get_current_faculty_id()
        )
    );

CREATE POLICY "Students can view own academic enrollment"
    ON public.student_academic_enrollments FOR SELECT
    USING (
        student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    );

-- 9.5 STUDENT TRAINING ENROLLMENTS
CREATE POLICY "Admins and officers can view training enrollments"
    ON public.student_training_enrollments FOR SELECT
    USING (public.is_placement_officer());

CREATE POLICY "Faculty can view training enrollments for assigned groups or sections"
    ON public.student_training_enrollments FOR SELECT
    USING (
        public.get_current_user_role() = 'faculty'
        AND (
            training_group_id IN (
                SELECT training_group_id FROM public.faculty_training_assignments
                WHERE faculty_id = public.get_current_faculty_id()
            )
            OR
            student_id IN (
                SELECT sae.student_id FROM public.student_academic_enrollments sae
                JOIN public.faculty_class_assignments fca ON fca.section_id = sae.section_id
                WHERE fca.faculty_id = public.get_current_faculty_id()
            )
        )
    );

CREATE POLICY "Students can view own training enrollments"
    ON public.student_training_enrollments FOR SELECT
    USING (
        student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    );

-- 9.6 FACULTY ASSIGNMENTS
CREATE POLICY "Faculty can view own class assignments"
    ON public.faculty_class_assignments FOR SELECT
    USING (faculty_id = public.get_current_faculty_id() OR public.is_placement_officer());

CREATE POLICY "Faculty can view own training assignments"
    ON public.faculty_training_assignments FOR SELECT
    USING (faculty_id = public.get_current_faculty_id() OR public.is_placement_officer());

-- ------------------------------------------------------------------------------
-- SEED FOUNDATION DATA
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    dept_cse_id UUID;
    dept_it_id UUID;
    prog_cse_id UUID;
    prog_it_id UUID;
    sec_cse_3a_id UUID;
    sec_cse_3b_id UUID;
    sec_it_3a_id UUID;
    grp_java_id UUID;
    grp_python_id UUID;
    grp_aptitude_id UUID;
    grp_coding_id UUID;
    faculty_rec RECORD;
    student_rec RECORD;
    sec_rec RECORD;
    s_idx INT := 0;
    target_count INT := 0;
BEGIN
    -- 1. Departments
    INSERT INTO public.departments (name, code)
    VALUES 
        ('Computer Science & Engineering', 'CSE'),
        ('Artificial Intelligence & Data Science', 'AIDS'),
        ('Artificial Intelligence & Machine Learning', 'AIML'),
        ('Computer Science', 'CS'),
        ('Information Technology', 'IT')
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

    -- 2. Programs
    INSERT INTO public.programs (department_id, name, code)
    SELECT d.id, 'B.Tech ' || d.name, d.code
    FROM public.departments d
    ON CONFLICT (department_id, code) DO UPDATE SET name = EXCLUDED.name;

    -- 3. Academic Sections (4th Year & 3rd Year)
    -- 4th Year
    INSERT INTO public.academic_sections (program_id, academic_year, year, semester, section_name)
    SELECT p.id, '2025-2026', 4, 8, s.sec
    FROM public.programs p
    CROSS JOIN (VALUES ('Section A'), ('Section B')) AS s(sec)
    WHERE p.code IN ('CSE', 'AIDS')
    ON CONFLICT (program_id, academic_year, year, section_name) DO NOTHING;

    INSERT INTO public.academic_sections (program_id, academic_year, year, semester, section_name)
    SELECT p.id, '2025-2026', 4, 8, 'Section A'
    FROM public.programs p
    WHERE p.code IN ('AIML', 'CS')
    ON CONFLICT (program_id, academic_year, year, section_name) DO NOTHING;

    -- 3rd Year
    INSERT INTO public.academic_sections (program_id, academic_year, year, semester, section_name)
    SELECT p.id, '2025-2026', 3, 6, s.sec
    FROM public.programs p
    CROSS JOIN (VALUES ('Section A'), ('Section B')) AS s(sec)
    WHERE p.code = 'CSE'
    ON CONFLICT (program_id, academic_year, year, section_name) DO NOTHING;

    INSERT INTO public.academic_sections (program_id, academic_year, year, semester, section_name)
    SELECT p.id, '2025-2026', 3, 6, 'Section A'
    FROM public.programs p
    WHERE p.code IN ('AIDS', 'AIML')
    ON CONFLICT (program_id, academic_year, year, section_name) DO NOTHING;

    -- 4. Training Groups
    INSERT INTO public.training_groups (name, description)
    VALUES 
        ('Java Training', 'Advanced Object-Oriented Design, Java 17/21, Spring Boot, & Enterprise Architecture'),
        ('Python Training', 'Data Processing, Automation, Pythonic Algorithms, and AI Frameworks'),
        ('Aptitude Training', 'Quantitative Analysis, Logical Reasoning, and Data Interpretation for Campus Drives'),
        ('Coding Training', 'Competitive Programming, Data Structures, Dynamic Programming, and Graph Theory')
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

    SELECT id INTO grp_java_id FROM public.training_groups WHERE name = 'Java Training';
    SELECT id INTO grp_python_id FROM public.training_groups WHERE name = 'Python Training';
    SELECT id INTO grp_aptitude_id FROM public.training_groups WHERE name = 'Aptitude Training';
    SELECT id INTO grp_coding_id FROM public.training_groups WHERE name = 'Coding Training';

    -- 5. Assign Faculty members to all sections and training groups
    FOR faculty_rec IN SELECT id FROM public.faculty_members LOOP
        FOR sec_rec IN SELECT id FROM public.academic_sections LOOP
            INSERT INTO public.faculty_class_assignments (faculty_id, section_id)
            VALUES (faculty_rec.id, sec_rec.id)
            ON CONFLICT DO NOTHING;
        END LOOP;

        INSERT INTO public.faculty_training_assignments (faculty_id, training_group_id)
        VALUES 
            (faculty_rec.id, grp_java_id),
            (faculty_rec.id, grp_python_id),
            (faculty_rec.id, grp_aptitude_id),
            (faculty_rec.id, grp_coding_id)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;
