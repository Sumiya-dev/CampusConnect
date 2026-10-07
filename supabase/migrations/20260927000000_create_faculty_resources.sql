-- ==============================================================================
-- CAMPUSCONNECT AI - FACULTY RESOURCES MODULE
-- PostgreSQL / Supabase Schema Definition, Storage Bucket, and RLS
-- ==============================================================================

-- 1. STORAGE BUCKET FOR FACULTY RESOURCES
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'faculty-resources',
  'faculty-resources',
  false,
  20971520, -- 20MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO UPDATE
SET allowed_mime_types = EXCLUDED.allowed_mime_types,
    public = false;

-- Storage policies
DROP POLICY IF EXISTS "Faculty can upload resource files" ON storage.objects;
CREATE POLICY "Faculty can upload resource files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'faculty-resources'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

DROP POLICY IF EXISTS "Authenticated users can view resource files" ON storage.objects;
CREATE POLICY "Authenticated users can view resource files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'faculty-resources'
);

DROP POLICY IF EXISTS "Faculty can update own resource files" ON storage.objects;
CREATE POLICY "Faculty can update own resource files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'faculty-resources'
  AND (storage.foldername(name))[1] = (auth.uid())::text
)
WITH CHECK (
  bucket_id = 'faculty-resources'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

DROP POLICY IF EXISTS "Faculty can delete own resource files" ON storage.objects;
CREATE POLICY "Faculty can delete own resource files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'faculty-resources'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- 2. FACULTY RESOURCES TABLE
CREATE TABLE IF NOT EXISTS public.faculty_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES public.faculty_members(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    target_type TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'section', 'training_group')),
    section_id UUID REFERENCES public.academic_sections(id) ON DELETE CASCADE,
    training_group_id UUID REFERENCES public.training_groups(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    file_type TEXT NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_faculty_resources_faculty ON public.faculty_resources(faculty_id);
CREATE INDEX IF NOT EXISTS idx_faculty_resources_section ON public.faculty_resources(section_id);
CREATE INDEX IF NOT EXISTS idx_faculty_resources_training ON public.faculty_resources(training_group_id);
CREATE INDEX IF NOT EXISTS idx_faculty_resources_target ON public.faculty_resources(target_type, is_published);
CREATE INDEX IF NOT EXISTS idx_faculty_resources_created ON public.faculty_resources(created_at DESC);

-- RLS
ALTER TABLE public.faculty_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Faculty can view own resources" ON public.faculty_resources;
CREATE POLICY "Faculty can view own resources"
ON public.faculty_resources FOR SELECT
TO authenticated
USING (
  (public.get_current_user_role() = 'faculty' AND faculty_id = public.get_current_faculty_id())
  OR public.is_admin()
  OR public.is_placement_officer()
);

DROP POLICY IF EXISTS "Students can view published targeted resources" ON public.faculty_resources;
CREATE POLICY "Students can view published targeted resources"
ON public.faculty_resources FOR SELECT
TO authenticated
USING (
  public.get_current_user_role() = 'student'
  AND is_published = true
  AND (
    target_type = 'all'
    OR (
      target_type = 'section'
      AND (
        section_id IN (
          SELECT sae.section_id FROM public.student_academic_enrollments sae
          JOIN public.students s ON s.id = sae.student_id
          WHERE s.user_id = auth.uid()
        )
        OR section_id IN (
          SELECT sec.id FROM public.academic_sections sec
          JOIN public.programs p ON sec.program_id = p.id
          JOIN public.departments d ON p.department_id = d.id
          JOIN public.students s ON s.department = d.name OR s.department = d.code
          WHERE s.user_id = auth.uid() AND sec.year = s.year
        )
      )
    )
    OR (
      target_type = 'training_group'
      AND (
        training_group_id IN (
          SELECT ste.training_group_id FROM public.student_training_enrollments ste
          JOIN public.students s ON s.id = ste.student_id
          WHERE s.user_id = auth.uid()
        )
      )
    )
  )
);

DROP POLICY IF EXISTS "Faculty can insert own resources" ON public.faculty_resources;
CREATE POLICY "Faculty can insert own resources"
ON public.faculty_resources FOR INSERT
TO authenticated
WITH CHECK (
  public.get_current_user_role() = 'faculty'
  AND faculty_id = public.get_current_faculty_id()
);

DROP POLICY IF EXISTS "Faculty can update own resources" ON public.faculty_resources;
CREATE POLICY "Faculty can update own resources"
ON public.faculty_resources FOR UPDATE
TO authenticated
USING (
  public.get_current_user_role() = 'faculty'
  AND faculty_id = public.get_current_faculty_id()
)
WITH CHECK (
  public.get_current_user_role() = 'faculty'
  AND faculty_id = public.get_current_faculty_id()
);

DROP POLICY IF EXISTS "Faculty can delete own resources" ON public.faculty_resources;
CREATE POLICY "Faculty can delete own resources"
ON public.faculty_resources FOR DELETE
TO authenticated
USING (
  public.get_current_user_role() = 'faculty'
  AND faculty_id = public.get_current_faculty_id()
);

-- Auto-assignment triggers for new faculty and students
CREATE OR REPLACE FUNCTION public.auto_assign_faculty_allocations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.faculty_class_assignments (faculty_id, section_id)
    SELECT NEW.id, s.id
    FROM public.academic_sections s
    ON CONFLICT DO NOTHING;

    INSERT INTO public.faculty_training_assignments (faculty_id, training_group_id)
    SELECT NEW.id, tg.id
    FROM public.training_groups tg
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_assign_faculty ON public.faculty_members;
CREATE TRIGGER trg_auto_assign_faculty
    AFTER INSERT ON public.faculty_members
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_faculty_allocations();

CREATE OR REPLACE FUNCTION public.auto_assign_student_allocations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sec_id UUID;
BEGIN
    SELECT id INTO v_sec_id
    FROM public.academic_sections
    WHERE year = COALESCE(NEW.year, 4)
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_sec_id IS NOT NULL THEN
        INSERT INTO public.student_academic_enrollments (student_id, section_id)
        VALUES (NEW.id, v_sec_id)
        ON CONFLICT (student_id) DO NOTHING;
    END IF;

    INSERT INTO public.student_training_enrollments (student_id, training_group_id)
    SELECT NEW.id, tg.id
    FROM public.training_groups tg
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_assign_student ON public.students;
CREATE TRIGGER trg_auto_assign_student
    AFTER INSERT ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_student_allocations();
