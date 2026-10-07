-- ==============================================================================
-- CAMPUSCONNECT AI - SUPERADMIN COMPANY MANAGEMENT
-- Migration: 20261005000002_superadmin_companies.sql
-- ==============================================================================

DO $$
BEGIN
    -- 1. Ensure Superadmin can view all companies (including inactive)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'companies' AND policyname = 'Admins can view all companies'
    ) THEN
        CREATE POLICY "Admins can view all companies"
        ON public.companies FOR SELECT
        TO authenticated
        USING (public.is_admin());
    END IF;

    -- 2. Ensure Superadmin can insert companies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'companies' AND policyname = 'Admins can insert companies'
    ) THEN
        CREATE POLICY "Admins can insert companies"
        ON public.companies FOR INSERT
        TO authenticated
        WITH CHECK (public.is_admin());
    END IF;

    -- 3. Ensure Superadmin can update companies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'companies' AND policyname = 'Admins can update companies'
    ) THEN
        CREATE POLICY "Admins can update companies"
        ON public.companies FOR UPDATE
        TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());
    END IF;

    -- 4. Ensure Superadmin can delete companies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'companies' AND policyname = 'Admins can delete companies'
    ) THEN
        CREATE POLICY "Admins can delete companies"
        ON public.companies FOR DELETE
        TO authenticated
        USING (public.is_admin());
    END IF;
END $$;
