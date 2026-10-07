-- Migration: 20260926000000_create_alumni_module.sql
-- Description: Sets up the Alumni module including profiles, experiences, community posts/comments/likes, and guidance requests with RLS.

-- 1. Ensure 'alumni' role exists in user_role enum
DO $$
BEGIN
    ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'alumni';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Helper Functions for RBAC & RLS
CREATE OR REPLACE FUNCTION public.is_alumni()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'alumni'
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_alumni_community()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('student', 'alumni')
    );
$$;

-- 3. ALUMNI PROFILES
CREATE TABLE IF NOT EXISTS public.alumni_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    graduation_year INTEGER,
    department TEXT,
    degree TEXT DEFAULT 'B.Tech',
    current_company TEXT,
    job_role TEXT,
    location TEXT,
    bio TEXT,
    skills TEXT[] DEFAULT '{}',
    profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'students_only', 'private')),
    linkedin_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_alumni_profiles_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_alumni_profiles_user_id ON public.alumni_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_dept ON public.alumni_profiles(department);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_grad_year ON public.alumni_profiles(graduation_year);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_company ON public.alumni_profiles(current_company);

-- 4. ALUMNI EXPERIENCES
CREATE TABLE IF NOT EXISTS public.alumni_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alumni_id UUID NOT NULL REFERENCES public.alumni_profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'Placement Experience',
        'Interview Experience',
        'Company Experience',
        'Career Journey',
        'Preparation Advice'
    )),
    title TEXT NOT NULL,
    company TEXT,
    job_role TEXT,
    content TEXT NOT NULL,
    selection_process TEXT,
    preparation_tips TEXT,
    advice_for_juniors TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_alumni_exp_alumni_id ON public.alumni_experiences(alumni_id);
CREATE INDEX IF NOT EXISTS idx_alumni_exp_type ON public.alumni_experiences(type);
CREATE INDEX IF NOT EXISTS idx_alumni_exp_company ON public.alumni_experiences(company);

-- 5. ALUMNI COMMUNITY POSTS
CREATE TABLE IF NOT EXISTS public.alumni_community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN (
        'Placements',
        'Careers',
        'Interviews',
        'Technical',
        'General'
    )),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_alumni_posts_author ON public.alumni_community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_alumni_posts_category ON public.alumni_community_posts(category);
CREATE INDEX IF NOT EXISTS idx_alumni_posts_created ON public.alumni_community_posts(created_at DESC);

-- 6. ALUMNI COMMUNITY COMMENTS
CREATE TABLE IF NOT EXISTS public.alumni_community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.alumni_community_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES public.alumni_community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_alumni_comments_post ON public.alumni_community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_alumni_comments_author ON public.alumni_community_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_alumni_comments_parent ON public.alumni_community_comments(parent_comment_id);

-- 7. ALUMNI COMMUNITY LIKES
CREATE TABLE IF NOT EXISTS public.alumni_community_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.alumni_community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_alumni_likes_post_user UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_alumni_likes_post ON public.alumni_community_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_alumni_likes_user ON public.alumni_community_likes(user_id);

-- 8. GUIDANCE REQUESTS
CREATE TABLE IF NOT EXISTS public.guidance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    alumni_id UUID NOT NULL REFERENCES public.alumni_profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED')),
    response_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_guidance_student ON public.guidance_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_guidance_alumni ON public.guidance_requests(alumni_id);
CREATE INDEX IF NOT EXISTS idx_guidance_status ON public.guidance_requests(status);

-- 9. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guidance_requests ENABLE ROW LEVEL SECURITY;

-- 10. RLS POLICIES

-- alumni_profiles: viewable by authenticated users (or anyone who can access alumni directory, i.e. student & alumni & faculty)
CREATE POLICY "alumni_profiles_select" ON public.alumni_profiles
    FOR SELECT TO authenticated
    USING (profile_visibility != 'private' OR user_id = auth.uid());

CREATE POLICY "alumni_profiles_insert" ON public.alumni_profiles
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() AND public.is_alumni());

CREATE POLICY "alumni_profiles_update" ON public.alumni_profiles
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- alumni_experiences: viewable by authenticated users, insert/update/delete only by owning alumni
CREATE POLICY "alumni_experiences_select" ON public.alumni_experiences
    FOR SELECT TO authenticated
    USING (is_deleted = false OR EXISTS (
        SELECT 1 FROM public.alumni_profiles ap
        WHERE ap.id = alumni_experiences.alumni_id AND ap.user_id = auth.uid()
    ));

CREATE POLICY "alumni_experiences_insert" ON public.alumni_experiences
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.alumni_profiles ap
        WHERE ap.id = alumni_experiences.alumni_id AND ap.user_id = auth.uid() AND public.is_alumni()
    ));

CREATE POLICY "alumni_experiences_update" ON public.alumni_experiences
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.alumni_profiles ap
        WHERE ap.id = alumni_experiences.alumni_id AND ap.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.alumni_profiles ap
        WHERE ap.id = alumni_experiences.alumni_id AND ap.user_id = auth.uid()
    ));

-- alumni_community_posts: ONLY accessible to Students and Alumni
CREATE POLICY "alumni_posts_select" ON public.alumni_community_posts
    FOR SELECT TO authenticated
    USING (public.can_access_alumni_community() AND (is_deleted = false OR author_id = auth.uid()));

CREATE POLICY "alumni_posts_insert" ON public.alumni_community_posts
    FOR INSERT TO authenticated
    WITH CHECK (public.can_access_alumni_community() AND author_id = auth.uid());

CREATE POLICY "alumni_posts_update" ON public.alumni_community_posts
    FOR UPDATE TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

-- alumni_community_comments: ONLY accessible to Students and Alumni
CREATE POLICY "alumni_comments_select" ON public.alumni_community_comments
    FOR SELECT TO authenticated
    USING (public.can_access_alumni_community() AND (is_deleted = false OR author_id = auth.uid()));

CREATE POLICY "alumni_comments_insert" ON public.alumni_community_comments
    FOR INSERT TO authenticated
    WITH CHECK (public.can_access_alumni_community() AND author_id = auth.uid());

CREATE POLICY "alumni_comments_update" ON public.alumni_community_comments
    FOR UPDATE TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

-- alumni_community_likes: ONLY accessible to Students and Alumni
CREATE POLICY "alumni_likes_select" ON public.alumni_community_likes
    FOR SELECT TO authenticated
    USING (public.can_access_alumni_community());

CREATE POLICY "alumni_likes_insert" ON public.alumni_community_likes
    FOR INSERT TO authenticated
    WITH CHECK (public.can_access_alumni_community() AND user_id = auth.uid());

CREATE POLICY "alumni_likes_delete" ON public.alumni_community_likes
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- guidance_requests: visible to student who created it or alumni to whom it was sent
CREATE POLICY "guidance_requests_select" ON public.guidance_requests
    FOR SELECT TO authenticated
    USING (
        student_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.alumni_profiles ap
            WHERE ap.id = guidance_requests.alumni_id AND ap.user_id = auth.uid()
        )
    );

CREATE POLICY "guidance_requests_insert" ON public.guidance_requests
    FOR INSERT TO authenticated
    WITH CHECK (
        student_id = auth.uid() AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'student')
    );

CREATE POLICY "guidance_requests_update" ON public.guidance_requests
    FOR UPDATE TO authenticated
    USING (
        student_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.alumni_profiles ap
            WHERE ap.id = guidance_requests.alumni_id AND ap.user_id = auth.uid()
        )
    )
    WITH CHECK (
        student_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.alumni_profiles ap
            WHERE ap.id = guidance_requests.alumni_id AND ap.user_id = auth.uid()
        )
    );
