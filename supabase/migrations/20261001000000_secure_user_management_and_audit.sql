-- ==============================================================================
-- CAMPUSCONNECT AI - SUPERADMIN USER MANAGEMENT & PRIVILEGED GOVERNANCE
-- Migration: 20261001000000_secure_user_management_and_audit.sql
-- ==============================================================================

-- 1. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_email TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN (
        'user_created',
        'user_updated',
        'role_changed',
        'user_status_changed',
        'user_deactivated',
        'user_activated',
        'user_deleted',
        'security_event'
    )),
    target_user_id UUID,
    target_user_email TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor ON public.admin_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON public.admin_audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created ON public.admin_audit_logs(created_at DESC);

-- Enable RLS on audit logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_logs FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_logs FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Notice: NO UPDATE or DELETE policies are granted. Audit logs are strictly append-only.

-- 2. PRIVILEGE ESCALATION DEFENSE TRIGGER
-- Ensures normal users cannot escalate their own privilege level via profile updates
CREATE OR REPLACE FUNCTION public.prevent_self_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- If role is being changed
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Only an administrator can change roles
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Security violation: Only administrators can modify user roles.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_self_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_self_privilege_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_self_privilege_escalation();

-- 3. HELPER: ATOMIC AUDIT LOGGER
CREATE OR REPLACE FUNCTION public.admin_log_action(
    p_action TEXT,
    p_target_user_id UUID,
    p_target_user_email TEXT,
    p_details JSONB DEFAULT '{}'::jsonb,
    p_status TEXT DEFAULT 'success'
)
RETURNS UUID AS $$
DECLARE
    v_actor_id UUID := auth.uid();
    v_actor_email TEXT;
    v_log_id UUID;
BEGIN
    IF v_actor_id IS NOT NULL THEN
        SELECT email INTO v_actor_email FROM public.profiles WHERE id = v_actor_id;
    END IF;

    IF v_actor_email IS NULL THEN
        v_actor_email := 'system@campusconnect.edu';
    END IF;

    INSERT INTO public.admin_audit_logs (
        actor_id,
        actor_email,
        action,
        target_user_id,
        target_user_email,
        details,
        status,
        created_at
    ) VALUES (
        COALESCE(v_actor_id, '00000000-0000-0000-0000-000000000000'::uuid),
        v_actor_email,
        p_action,
        p_target_user_id,
        p_target_user_email,
        p_details,
        p_status,
        NOW()
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- 4. SECURE USER PROVISIONING BY ADMIN
CREATE OR REPLACE FUNCTION public.admin_provision_user(
    p_email TEXT,
    p_password TEXT,
    p_name TEXT,
    p_role public.user_role,
    p_department TEXT,
    p_contact_number TEXT DEFAULT NULL,
    p_extra_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID := gen_random_uuid();
    v_clean_email TEXT;
    v_identifier TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Superadmin role required.';
    END IF;

    v_clean_email := LOWER(TRIM(p_email));

    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_clean_email) THEN
        RAISE EXCEPTION 'A user with email % already exists.', v_clean_email;
    END IF;

    v_identifier := NULLIF(TRIM(p_extra_data->>'identifier'), '');

    -- Insert into auth.users (this triggers handle_new_user automatically)
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000'::uuid,
        'authenticated',
        'authenticated',
        v_clean_email,
        crypt(p_password, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        json_build_object(
            'name', p_name,
            'role', p_role::text,
            'department', p_department,
            'contact_number', p_contact_number,
            'identifier', v_identifier,
            'cgpa', COALESCE((p_extra_data->>'cgpa')::numeric, 8.00),
            'year', COALESCE((p_extra_data->>'year')::int, 4),
            'designation', COALESCE(p_extra_data->>'designation', 'Assistant Professor'),
            'cabin_location', p_extra_data->>'cabin_location',
            'office_location', p_extra_data->>'office_location',
            'admin_code', COALESCE(p_extra_data->>'admin_code', 'ADM-' || UPPER(SUBSTR(REPLACE(new_user_id::text, '-', ''), 1, 6))),
            'access_level', COALESCE(p_extra_data->>'access_level', 'superadmin')
        )::jsonb,
        NOW(),
        NOW()
    );

    -- Record Audit Log
    PERFORM public.admin_log_action(
        'user_created',
        new_user_id,
        v_clean_email,
        json_build_object(
            'name', p_name,
            'role', p_role::text,
            'department', p_department
        )::jsonb
    );

    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions, pg_temp;

-- 5. SECURE ROLE CHANGE WITH LAST-SUPERADMIN PROTECTION
CREATE OR REPLACE FUNCTION public.admin_change_user_role(
    p_target_user_id UUID,
    p_new_role public.user_role
)
RETURNS BOOLEAN AS $$
DECLARE
    v_old_role public.user_role;
    v_target_email TEXT;
    v_target_status public.account_status;
    v_active_admin_count INT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Superadmin role required.';
    END IF;

    SELECT role, email, account_status INTO v_old_role, v_target_email, v_target_status
    FROM public.profiles WHERE id = p_target_user_id;

    IF v_old_role IS NULL THEN
        RAISE EXCEPTION 'User not found.';
    END IF;

    IF v_old_role = p_new_role THEN
        RETURN TRUE; -- No change needed
    END IF;

    -- Safety check: Prevent removing the last active Superadmin
    IF v_old_role = 'administrator' THEN
        SELECT COUNT(*) INTO v_active_admin_count
        FROM public.profiles
        WHERE role = 'administrator' AND account_status = 'active';

        IF v_active_admin_count <= 1 THEN
            RAISE EXCEPTION 'Operation aborted: Cannot modify role of the last active Superadmin.';
        END IF;
    END IF;

    -- Update profile
    UPDATE public.profiles
    SET role = p_new_role, updated_at = NOW()
    WHERE id = p_target_user_id;

    -- Update auth user metadata
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{role}',
        to_jsonb(p_new_role::text)
    ), updated_at = NOW()
    WHERE id = p_target_user_id;

    -- Ensure supplemental role tables reflect new role
    IF p_new_role = 'student' THEN
        INSERT INTO public.students (user_id, student_id, department, year, cgpa, skills)
        VALUES (
            p_target_user_id,
            'STU-' || UPPER(SUBSTR(REPLACE(p_target_user_id::text, '-', ''), 1, 6)),
            COALESCE((SELECT department FROM public.profiles WHERE id = p_target_user_id), 'Computer Science & Engineering'),
            4,
            8.00,
            ARRAY['General']
        ) ON CONFLICT (user_id) DO NOTHING;
    ELSIF p_new_role = 'faculty' THEN
        INSERT INTO public.faculty_members (user_id, employee_id, department, designation)
        VALUES (
            p_target_user_id,
            'FAC-' || UPPER(SUBSTR(REPLACE(p_target_user_id::text, '-', ''), 1, 6)),
            COALESCE((SELECT department FROM public.profiles WHERE id = p_target_user_id), 'Computer Science & Engineering'),
            'Assistant Professor'
        ) ON CONFLICT (user_id) DO NOTHING;
    ELSIF p_new_role = 'placement_officer' THEN
        INSERT INTO public.placement_officers (user_id, employee_id, designation)
        VALUES (
            p_target_user_id,
            'TPO-' || UPPER(SUBSTR(REPLACE(p_target_user_id::text, '-', ''), 1, 6)),
            'Placement Officer'
        ) ON CONFLICT (user_id) DO NOTHING;
    ELSIF p_new_role = 'administrator' THEN
        INSERT INTO public.administrators (user_id, admin_code, access_level)
        VALUES (
            p_target_user_id,
            'ADM-' || UPPER(SUBSTR(REPLACE(p_target_user_id::text, '-', ''), 1, 6)),
            'superadmin'
        ) ON CONFLICT (user_id) DO NOTHING;
    END IF;

    -- Record Audit Log
    PERFORM public.admin_log_action(
        'role_changed',
        p_target_user_id,
        v_target_email,
        json_build_object(
            'old_role', v_old_role::text,
            'new_role', p_new_role::text
        )::jsonb
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- 6. SECURE STATUS CHANGE WITH LAST-SUPERADMIN PROTECTION
CREATE OR REPLACE FUNCTION public.admin_change_user_status(
    p_target_user_id UUID,
    p_new_status public.account_status
)
RETURNS BOOLEAN AS $$
DECLARE
    v_role public.user_role;
    v_target_email TEXT;
    v_old_status public.account_status;
    v_active_admin_count INT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Superadmin role required.';
    END IF;

    SELECT role, email, account_status INTO v_role, v_target_email, v_old_status
    FROM public.profiles WHERE id = p_target_user_id;

    IF v_role IS NULL THEN
        RAISE EXCEPTION 'User not found.';
    END IF;

    IF v_old_status = p_new_status THEN
        RETURN TRUE;
    END IF;

    -- Safety check: Prevent deactivating the last active Superadmin
    IF v_role = 'administrator' AND p_new_status != 'active' THEN
        SELECT COUNT(*) INTO v_active_admin_count
        FROM public.profiles
        WHERE role = 'administrator' AND account_status = 'active';

        IF v_active_admin_count <= 1 THEN
            RAISE EXCEPTION 'Security constraint: Cannot deactivate the last active Superadmin.';
        END IF;
    END IF;

    -- Update profile status
    UPDATE public.profiles
    SET account_status = p_new_status, updated_at = NOW()
    WHERE id = p_target_user_id;

    -- Record Audit Log
    PERFORM public.admin_log_action(
        CASE WHEN p_new_status = 'active' THEN 'user_activated' ELSE 'user_deactivated' END,
        p_target_user_id,
        v_target_email,
        json_build_object(
            'old_status', v_old_status::text,
            'new_status', p_new_status::text
        )::jsonb
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- 7. SECURE SAFE USER DELETION WITH DEPENDENCY VERIFICATION
CREATE OR REPLACE FUNCTION public.admin_safe_delete_user(
    p_target_user_id UUID,
    p_force_hard_delete BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
    v_role public.user_role;
    v_email TEXT;
    v_active_admin_count INT;
    v_has_applications INT := 0;
    v_has_drives INT := 0;
    v_has_resources INT := 0;
    v_has_announcements INT := 0;
    v_has_posts INT := 0;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Superadmin role required.';
    END IF;

    SELECT role, email INTO v_role, v_email
    FROM public.profiles WHERE id = p_target_user_id;

    IF v_role IS NULL THEN
        RAISE EXCEPTION 'User not found.';
    END IF;

    -- Safety check: Never allow deleting the last active Superadmin
    IF v_role = 'administrator' THEN
        SELECT COUNT(*) INTO v_active_admin_count
        FROM public.profiles
        WHERE role = 'administrator' AND account_status = 'active';

        IF v_active_admin_count <= 1 THEN
            RAISE EXCEPTION 'Critical safety constraint: Cannot delete the last active Superadmin account.';
        END IF;
    END IF;

    -- Check dependencies across institutional tables
    SELECT COUNT(*) INTO v_has_applications
    FROM public.applications a
    JOIN public.students s ON s.id = a.student_id
    WHERE s.user_id = p_target_user_id;

    SELECT COUNT(*) INTO v_has_drives
    FROM public.placement_drives
    WHERE created_by = p_target_user_id;

    SELECT COUNT(*) INTO v_has_resources
    FROM public.faculty_resources fr
    JOIN public.faculty_members f ON f.id = fr.faculty_id
    WHERE f.user_id = p_target_user_id;

    SELECT COUNT(*) INTO v_has_announcements
    FROM public.faculty_announcements fa
    JOIN public.faculty_members f ON f.id = fa.faculty_id
    WHERE f.user_id = p_target_user_id;

    SELECT COUNT(*) INTO v_has_posts
    FROM public.community_posts
    WHERE author_id = p_target_user_id;

    -- If dependencies exist and force hard delete is false, perform safe deactivation (soft delete)
    IF (v_has_applications > 0 OR v_has_drives > 0 OR v_has_resources > 0 OR v_has_announcements > 0 OR v_has_posts > 0)
       AND NOT p_force_hard_delete THEN
        UPDATE public.profiles
        SET account_status = 'inactive', updated_at = NOW()
        WHERE id = p_target_user_id;

        PERFORM public.admin_log_action(
            'user_deactivated',
            p_target_user_id,
            v_email,
            json_build_object(
                'reason', 'Safe soft-delete applied due to existing historic placement/academic dependencies',
                'applications_count', v_has_applications,
                'drives_count', v_has_drives,
                'resources_count', v_has_resources,
                'announcements_count', v_has_announcements
            )::jsonb
        );

        RETURN json_build_object(
            'action', 'soft_deleted',
            'message', 'User account deactivated safely to preserve historic application and placement records.'
        )::jsonb;
    END IF;

    -- Otherwise execute hard deletion
    -- Delete child tables first
    DELETE FROM public.student_academic_enrollments WHERE student_id IN (SELECT id FROM public.students WHERE user_id = p_target_user_id);
    DELETE FROM public.student_training_enrollments WHERE student_id IN (SELECT id FROM public.students WHERE user_id = p_target_user_id);
    DELETE FROM public.students WHERE user_id = p_target_user_id;

    DELETE FROM public.faculty_class_assignments WHERE faculty_id IN (SELECT id FROM public.faculty_members WHERE user_id = p_target_user_id);
    DELETE FROM public.faculty_training_assignments WHERE faculty_id IN (SELECT id FROM public.faculty_members WHERE user_id = p_target_user_id);
    DELETE FROM public.faculty_members WHERE user_id = p_target_user_id;

    DELETE FROM public.placement_officers WHERE user_id = p_target_user_id;
    DELETE FROM public.administrators WHERE user_id = p_target_user_id;

    -- Delete profile
    DELETE FROM public.profiles WHERE id = p_target_user_id;

    -- Delete auth user
    DELETE FROM auth.users WHERE id = p_target_user_id;

    -- Record Audit Log
    PERFORM public.admin_log_action(
        'user_deleted',
        p_target_user_id,
        v_email,
        json_build_object(
            'action', 'hard_deleted'
        )::jsonb
    );

    RETURN json_build_object(
        'action', 'hard_deleted',
        'message', 'User account permanently removed from system.'
    )::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- 8. PROVISION INITIAL SUPERADMIN ACCOUNT (if not already existing)
DO $$
DECLARE
    admin_auth_id UUID := 'a0000000-0000-0000-0000-000000000001'::uuid;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@campusconnect.edu') THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            admin_auth_id,
            '00000000-0000-0000-0000-000000000000'::uuid,
            'authenticated',
            'authenticated',
            'admin@campusconnect.edu',
            crypt('Password@123', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"name":"Dr. Vikram Singhania","role":"administrator","department":"Central Administration","identifier":"ADM-SYS-001","access_level":"superadmin"}'::jsonb,
            NOW(),
            NOW()
        );
    ELSE
        SELECT id INTO admin_auth_id FROM auth.users WHERE email = 'admin@campusconnect.edu';
        UPDATE auth.users
        SET encrypted_password = crypt('Password@123', gen_salt('bf')),
            email_confirmed_at = NOW(),
            raw_user_meta_data = '{"name":"Dr. Vikram Singhania","role":"administrator","department":"Central Administration","identifier":"ADM-SYS-001","access_level":"superadmin"}'::jsonb
        WHERE id = admin_auth_id;
    END IF;

    -- Ensure profile
    INSERT INTO public.profiles (id, name, email, role, department, account_status)
    VALUES (admin_auth_id, 'Dr. Vikram Singhania', 'admin@campusconnect.edu', 'administrator', 'Central Administration', 'active')
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        role = 'administrator',
        department = EXCLUDED.department,
        account_status = 'active';

    -- Ensure administrator table entry
    INSERT INTO public.administrators (user_id, admin_code, access_level)
    VALUES (admin_auth_id, 'ADM-SYS-001', 'superadmin')
    ON CONFLICT (user_id) DO UPDATE SET
        access_level = 'superadmin';

    -- Initial Audit Record
    INSERT INTO public.admin_audit_logs (actor_id, actor_email, action, target_user_id, target_user_email, details, status)
    VALUES (
        admin_auth_id,
        'admin@campusconnect.edu',
        'security_event',
        admin_auth_id,
        'admin@campusconnect.edu',
        '{"event":"Superadmin Governance & Audit Engine Initialized"}'::jsonb,
        'success'
    );
END $$;
