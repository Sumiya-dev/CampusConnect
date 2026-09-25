-- ==============================================================================
-- CAMPUSCONNECT AI - PHASE 3: COMPANY MANAGEMENT
-- PostgreSQL / Supabase Schema & Row-Level Security
-- ==============================================================================

-- 1. Create company_status enum if not exists
DO $$ BEGIN
    CREATE TYPE company_status AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    industry TEXT,
    description TEXT,
    website TEXT,
    location TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    status company_status NOT NULL DEFAULT 'active',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Performance indexes
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON public.companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON public.companies(created_by);
CREATE INDEX IF NOT EXISTS idx_companies_company_name ON public.companies(lower(company_name));

-- 4. Attach handle_updated_at trigger
DROP TRIGGER IF EXISTS trigger_companies_updated_at ON public.companies;
CREATE TRIGGER trigger_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Row Level Security (RLS)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 5.1 Placement Officers & Administrators can view all companies
DROP POLICY IF EXISTS "Placement Officers and Admins can view companies" ON public.companies;
CREATE POLICY "Placement Officers and Admins can view companies"
    ON public.companies FOR SELECT
    USING (public.is_placement_officer());

-- 5.2 Placement Officers & Administrators can insert companies
DROP POLICY IF EXISTS "Placement Officers and Admins can insert companies" ON public.companies;
CREATE POLICY "Placement Officers and Admins can insert companies"
    ON public.companies FOR INSERT
    WITH CHECK (public.is_placement_officer());

-- 5.3 Placement Officers & Administrators can update companies
DROP POLICY IF EXISTS "Placement Officers and Admins can update companies" ON public.companies;
CREATE POLICY "Placement Officers and Admins can update companies"
    ON public.companies FOR UPDATE
    USING (public.is_placement_officer())
    WITH CHECK (public.is_placement_officer());

-- Students and Faculty have NO permissions on the companies table at this phase.
