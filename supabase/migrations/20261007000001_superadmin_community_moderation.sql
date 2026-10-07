-- ==============================================================================
-- CAMPUSCONNECT AI - SUPERADMIN COMMUNITY MODERATION MODULE
-- Migration: 20261007000001_superadmin_community_moderation.sql
-- ==============================================================================

-- 1. Add moderation columns to community_posts and community_comments
ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS is_moderated BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
    ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.community_comments
    ADD COLUMN IF NOT EXISTS is_moderated BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
    ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Create Enums for Community Reports
DO $$ BEGIN
    CREATE TYPE community_report_status AS ENUM ('Pending', 'Reviewed', 'Resolved', 'Dismissed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE community_report_target_type AS ENUM ('post', 'comment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create community_reports Table
CREATE TABLE IF NOT EXISTS public.community_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type community_report_target_type NOT NULL,
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (char_length(trim(reason)) > 0),
    details TEXT,
    status community_report_status NOT NULL DEFAULT 'Pending',
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Create Indexes for Reports
CREATE INDEX IF NOT EXISTS idx_community_reports_status ON public.community_reports(status);
CREATE INDEX IF NOT EXISTS idx_community_reports_target ON public.community_reports(target_type, post_id, comment_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_reporter ON public.community_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_created ON public.community_reports(created_at DESC);

-- 5. Enable Row-Level Security
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'community_reports' AND policyname = 'Admins can manage all community reports'
    ) THEN
        CREATE POLICY "Admins can manage all community reports"
            ON public.community_reports FOR ALL
            USING (public.is_admin())
            WITH CHECK (public.is_admin());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'community_reports' AND policyname = 'Users can file community reports'
    ) THEN
        CREATE POLICY "Users can file community reports"
            ON public.community_reports FOR INSERT
            WITH CHECK (auth.uid() = reporter_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'community_reports' AND policyname = 'Users can view their own community reports'
    ) THEN
        CREATE POLICY "Users can view their own community reports"
            ON public.community_reports FOR SELECT
            USING (auth.uid() = reporter_id);
    END IF;
END $$;

-- 6. Superadmin Permissions for Community Posts Moderation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'community_posts' AND policyname = 'Admins can view all posts for moderation'
    ) THEN
        CREATE POLICY "Admins can view all posts for moderation"
            ON public.community_posts FOR SELECT
            USING (public.is_admin());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'community_posts' AND policyname = 'Admins can moderate community posts'
    ) THEN
        CREATE POLICY "Admins can moderate community posts"
            ON public.community_posts FOR UPDATE
            USING (public.is_admin())
            WITH CHECK (public.is_admin());
    END IF;
END $$;

-- 7. Superadmin Permissions for Community Comments Moderation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'community_comments' AND policyname = 'Admins can view all comments for moderation'
    ) THEN
        CREATE POLICY "Admins can view all comments for moderation"
            ON public.community_comments FOR SELECT
            USING (public.is_admin());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'community_comments' AND policyname = 'Admins can moderate community comments'
    ) THEN
        CREATE POLICY "Admins can moderate community comments"
            ON public.community_comments FOR UPDATE
            USING (public.is_admin())
            WITH CHECK (public.is_admin());
    END IF;
END $$;
