-- ==============================================================================
-- CAMPUSCONNECT AI - SUPERADMIN FACULTY MANAGEMENT & ALLOCATIONS
-- Migration: 20261005000001_superadmin_faculty_allocations.sql
-- ==============================================================================

DO $$
BEGIN
    -- 1. FACULTY MEMBERS RLS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'faculty_members' AND policyname = 'Admins can view all faculty records') THEN
        CREATE POLICY "Admins can view all faculty records"
        ON public.faculty_members FOR SELECT
        TO authenticated
        USING (public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'faculty_members' AND policyname = 'Admins can delete faculty records') THEN
        CREATE POLICY "Admins can delete faculty records"
        ON public.faculty_members FOR DELETE
        TO authenticated
        USING (public.is_admin());
    END IF;

    -- 2. FACULTY CLASS ASSIGNMENTS RLS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'faculty_class_assignments' AND policyname = 'Admins can view all class assignments') THEN
        CREATE POLICY "Admins can view all class assignments"
        ON public.faculty_class_assignments FOR SELECT
        TO authenticated
        USING (public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'faculty_class_assignments' AND policyname = 'Admins can insert class assignments') THEN
        CREATE POLICY "Admins can insert class assignments"
        ON public.faculty_class_assignments FOR INSERT
        TO authenticated
        WITH CHECK (public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'faculty_class_assignments' AND policyname = 'Admins can update class assignments') THEN
        CREATE POLICY "Admins can update class assignments"
        ON public.faculty_class_assignments FOR UPDATE
        TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'faculty_class_assignments' AND policyname = 'Admins can delete class assignments') THEN
        CREATE POLICY "Admins can delete class assignments"
        ON public.faculty_class_assignments FOR DELETE
        TO authenticated
        USING (public.is_admin());
    END IF;

    -- 3. FACULTY TRAINING ASSIGNMENTS RLS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'faculty_training_assignments' AND policyname = 'Admins can view all training assignments') THEN
        CREATE POLICY "Admins can view all training assignments"
        ON public.faculty_training_assignments FOR SELECT
        TO authenticated
        USING (public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'faculty_training_assignments' AND policyname = 'Admins can insert training assignments') THEN
        CREATE POLICY "Admins can insert training assignments"
        ON public.faculty_training_assignments FOR INSERT
        TO authenticated
        WITH CHECK (public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'faculty_training_assignments' AND policyname = 'Admins can update training assignments') THEN
        CREATE POLICY "Admins can update training assignments"
        ON public.faculty_training_assignments FOR UPDATE
        TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'faculty_training_assignments' AND policyname = 'Admins can delete training assignments') THEN
        CREATE POLICY "Admins can delete training assignments"
        ON public.faculty_training_assignments FOR DELETE
        TO authenticated
        USING (public.is_admin());
    END IF;

    -- 4. CLASS SESSIONS RLS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'class_sessions' AND policyname = 'Admins can view all class sessions') THEN
        CREATE POLICY "Admins can view all class sessions"
        ON public.class_sessions FOR SELECT
        TO authenticated
        USING (public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'class_sessions' AND policyname = 'Admins can insert class sessions') THEN
        CREATE POLICY "Admins can insert class sessions"
        ON public.class_sessions FOR INSERT
        TO authenticated
        WITH CHECK (public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'class_sessions' AND policyname = 'Admins can update class sessions') THEN
        CREATE POLICY "Admins can update class sessions"
        ON public.class_sessions FOR UPDATE
        TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'class_sessions' AND policyname = 'Admins can delete class sessions') THEN
        CREATE POLICY "Admins can delete class sessions"
        ON public.class_sessions FOR DELETE
        TO authenticated
        USING (public.is_admin());
    END IF;
END $$;
