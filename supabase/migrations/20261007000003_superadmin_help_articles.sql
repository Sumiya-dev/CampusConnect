-- ==============================================================================
-- CAMPUSCONNECT AI - SUPERADMIN HELP CENTER MANAGEMENT MODULE
-- Migration: 20261007000003_superadmin_help_articles.sql
-- ==============================================================================

-- 1. HELP ARTICLES TABLE
CREATE TABLE IF NOT EXISTS public.help_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('FAQs', 'Placement Guidelines', 'Platform Guide', 'Interview Preparation', 'Placement Policies', 'General')),
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. INDEXES
CREATE INDEX IF NOT EXISTS idx_help_articles_status ON public.help_articles(status);
CREATE INDEX IF NOT EXISTS idx_help_articles_category ON public.help_articles(category);
CREATE INDEX IF NOT EXISTS idx_help_articles_created_at ON public.help_articles(created_at DESC);

-- 3. ROW LEVEL SECURITY
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View help articles"
ON public.help_articles FOR SELECT
TO authenticated
USING (public.is_admin() OR status = 'published');

CREATE POLICY "Admins can insert help articles"
ON public.help_articles FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update help articles"
ON public.help_articles FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete help articles"
ON public.help_articles FOR DELETE
TO authenticated
USING (public.is_admin());
