-- ==============================================================================
-- 1. CREATE RESUMES TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure a student only has one active resume at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_resumes_active_student 
ON public.resumes(student_id) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_resumes_student_id ON public.resumes(student_id);

-- Attach updated_at trigger
DROP TRIGGER IF EXISTS trigger_resumes_updated_at ON public.resumes;
CREATE TRIGGER trigger_resumes_updated_at
    BEFORE UPDATE ON public.resumes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 2. ROW LEVEL SECURITY (RLS) FOR RESUMES TABLE
-- ==============================================================================

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Students can view their own resumes
CREATE POLICY "Students can view their own resumes"
ON public.resumes
FOR SELECT
TO authenticated
USING (
    student_id IN (
        SELECT id FROM public.students WHERE user_id = auth.uid()
    )
);

-- Students can insert their own resumes
CREATE POLICY "Students can insert their own resumes"
ON public.resumes
FOR INSERT
TO authenticated
WITH CHECK (
    student_id IN (
        SELECT id FROM public.students WHERE user_id = auth.uid()
    )
);

-- Students can update their own resumes
CREATE POLICY "Students can update their own resumes"
ON public.resumes
FOR UPDATE
TO authenticated
USING (
    student_id IN (
        SELECT id FROM public.students WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    student_id IN (
        SELECT id FROM public.students WHERE user_id = auth.uid()
    )
);

-- Students can delete their own resumes
CREATE POLICY "Students can delete their own resumes"
ON public.resumes
FOR DELETE
TO authenticated
USING (
    student_id IN (
        SELECT id FROM public.students WHERE user_id = auth.uid()
    )
);

-- Placement Officers and Admins can view all resumes
CREATE POLICY "Placement Officers and Admins can view all resumes"
ON public.resumes
FOR SELECT
TO authenticated
USING (
    public.is_placement_officer() OR public.is_admin()
);

-- ==============================================================================
-- 3. STORAGE POLICIES FOR 'resumes' BUCKET
-- ==============================================================================

-- Allow authenticated students to upload their own resumes
-- The file path convention will be: {student_user_id}/{filename}
CREATE POLICY "Students can upload their own resume files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated students to update their own resumes
CREATE POLICY "Students can update their own resume files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated students to delete their own resumes
CREATE POLICY "Students can delete their own resume files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated students to view their own resumes
CREATE POLICY "Students can view their own resume files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow Placement Officers and Admins to view all resumes
CREATE POLICY "Placement Officers and Admins can view all resume files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'resumes' AND
    (public.is_placement_officer() OR public.is_admin())
);
