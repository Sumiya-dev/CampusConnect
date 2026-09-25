-- ==============================================================================
-- MIGRATION: 20260925000002_create_community_module.sql
-- PURPOSE: CampusConnect Community Module: Public Community & Students Only Community
-- ==============================================================================

-- 1. Helper function to check if the current user is a student
CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN AS $$
    SELECT (public.get_current_user_role() = 'student'::public.user_role);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public SET row_security = off;

-- 2. Create Community Tables
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('Placement', 'Preparation', 'Technical', 'Career', 'General')),
    visibility TEXT NOT NULL CHECK (visibility IN ('PUBLIC', 'STUDENTS_ONLY')),
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0 AND char_length(title) <= 250),
    content TEXT NOT NULL CHECK (char_length(trim(content)) > 0),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(trim(content)) > 0),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.community_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_community_post_user_like UNIQUE (post_id, user_id)
);

-- 3. Indexes for fast queries & scaling
CREATE INDEX IF NOT EXISTS idx_community_posts_visibility_created 
    ON public.community_posts (visibility, created_at DESC) 
    WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_community_posts_category_created 
    ON public.community_posts (category, created_at DESC) 
    WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_community_posts_author 
    ON public.community_posts (author_id);

CREATE INDEX IF NOT EXISTS idx_community_comments_post_created 
    ON public.community_comments (post_id, created_at ASC) 
    WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_community_comments_author 
    ON public.community_comments (author_id);

CREATE INDEX IF NOT EXISTS idx_community_likes_post 
    ON public.community_likes (post_id);

CREATE INDEX IF NOT EXISTS idx_community_likes_user 
    ON public.community_likes (user_id);

-- 4. Helper function: can_access_post(post_id)
CREATE OR REPLACE FUNCTION public.can_access_post(p_post_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    post_vis TEXT;
BEGIN
    SELECT visibility INTO post_vis 
    FROM public.community_posts 
    WHERE id = p_post_id AND NOT is_deleted;

    IF post_vis IS NULL THEN
        RETURN FALSE;
    ELSIF post_vis = 'PUBLIC' THEN
        RETURN auth.uid() IS NOT NULL;
    ELSIF post_vis = 'STUDENTS_ONLY' THEN
        RETURN public.is_student();
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public SET row_security = off;

-- 5. Row Level Security Policies
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-running
DROP POLICY IF EXISTS "Read community posts policy" ON public.community_posts;
DROP POLICY IF EXISTS "Insert community posts policy" ON public.community_posts;
DROP POLICY IF EXISTS "Update community posts policy" ON public.community_posts;
DROP POLICY IF EXISTS "Delete community posts policy" ON public.community_posts;

DROP POLICY IF EXISTS "Read community comments policy" ON public.community_comments;
DROP POLICY IF EXISTS "Insert community comments policy" ON public.community_comments;
DROP POLICY IF EXISTS "Update community comments policy" ON public.community_comments;
DROP POLICY IF EXISTS "Delete community comments policy" ON public.community_comments;

DROP POLICY IF EXISTS "Read community likes policy" ON public.community_likes;
DROP POLICY IF EXISTS "Insert community likes policy" ON public.community_likes;
DROP POLICY IF EXISTS "Delete community likes policy" ON public.community_likes;

-- Posts policies
CREATE POLICY "Read community posts policy"
    ON public.community_posts FOR SELECT
    USING (
        (NOT is_deleted)
        AND (
            (visibility = 'PUBLIC' AND auth.uid() IS NOT NULL)
            OR
            (visibility = 'STUDENTS_ONLY' AND public.is_student())
        )
    );

CREATE POLICY "Insert community posts policy"
    ON public.community_posts FOR INSERT
    WITH CHECK (
        auth.uid() = author_id
        AND (
            (visibility = 'PUBLIC')
            OR
            (visibility = 'STUDENTS_ONLY' AND public.is_student())
        )
    );

CREATE POLICY "Update community posts policy"
    ON public.community_posts FOR UPDATE
    USING (
        auth.uid() = author_id
        AND (
            (visibility = 'PUBLIC')
            OR
            (visibility = 'STUDENTS_ONLY' AND public.is_student())
        )
    )
    WITH CHECK (
        auth.uid() = author_id
        AND (
            (visibility = 'PUBLIC')
            OR
            (visibility = 'STUDENTS_ONLY' AND public.is_student())
        )
    );

CREATE POLICY "Delete community posts policy"
    ON public.community_posts FOR DELETE
    USING (
        auth.uid() = author_id
        AND (
            (visibility = 'PUBLIC')
            OR
            (visibility = 'STUDENTS_ONLY' AND public.is_student())
        )
    );

-- Comments policies
CREATE POLICY "Read community comments policy"
    ON public.community_comments FOR SELECT
    USING (
        (NOT is_deleted)
        AND public.can_access_post(post_id)
    );

CREATE POLICY "Insert community comments policy"
    ON public.community_comments FOR INSERT
    WITH CHECK (
        auth.uid() = author_id
        AND public.can_access_post(post_id)
    );

CREATE POLICY "Update community comments policy"
    ON public.community_comments FOR UPDATE
    USING (
        auth.uid() = author_id
        AND public.can_access_post(post_id)
    )
    WITH CHECK (
        auth.uid() = author_id
        AND public.can_access_post(post_id)
    );

CREATE POLICY "Delete community comments policy"
    ON public.community_comments FOR DELETE
    USING (
        auth.uid() = author_id
        AND public.can_access_post(post_id)
    );

-- Likes policies
CREATE POLICY "Read community likes policy"
    ON public.community_likes FOR SELECT
    USING (
        public.can_access_post(post_id)
    );

CREATE POLICY "Insert community likes policy"
    ON public.community_likes FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND public.can_access_post(post_id)
    );

CREATE POLICY "Delete community likes policy"
    ON public.community_likes FOR DELETE
    USING (
        auth.uid() = user_id
        AND public.can_access_post(post_id)
    );
