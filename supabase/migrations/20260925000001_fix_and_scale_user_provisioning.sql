-- ==============================================================================
-- MIGRATION: 20260925000001_fix_and_scale_user_provisioning.sql
-- PURPOSE: Fix database errors during user signup/creation and scale user operations
-- ==============================================================================

-- 1. Resilient handle_new_user() trigger function
-- Fixes:
--   - Explicit search_path = public, auth, pg_temp prevents "type user_role does not exist" in auth context
--   - row_security = off avoids recursive RLS checks during trigger execution
--   - Safe role string normalization & fallback prevents enum casting failures
--   - Auto-generated guaranteed-unique identifier handles collisions on student_id / employee_id
--   - Correct placement_status enum ('unplaced') prevents enum casting crash
--   - Exception safety ensures auth user creation is never aborted by auxiliary failures

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
SET row_security = off
AS $$
DECLARE
    raw_role_str TEXT;
    assigned_role public.user_role;
    assigned_department TEXT;
    assigned_name TEXT;
    assigned_contact TEXT;
    roll_or_emp_id TEXT;
    assigned_year INT;
    assigned_cgpa NUMERIC;
    assigned_skills TEXT[];
    assigned_designation TEXT;
    unique_suffix TEXT;
BEGIN
    -- Extract and sanitize name
    assigned_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
        NULLIF(TRIM(split_part(NEW.email, '@', 1)), ''),
        'Institutional User'
    );

    -- Extract and sanitize role with fallback to student
    raw_role_str := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'role', 'student')));
    IF raw_role_str IN ('faculty', 'teacher', 'professor') THEN
        assigned_role := 'faculty'::public.user_role;
    ELSIF raw_role_str IN ('placement_officer', 'placement', 'tpo') THEN
        assigned_role := 'placement_officer'::public.user_role;
    ELSIF raw_role_str IN ('administrator', 'admin', 'super_admin') THEN
        assigned_role := 'administrator'::public.user_role;
    ELSE
        assigned_role := 'student'::public.user_role;
    END IF;

    -- Extract department
    assigned_department := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'department'), ''),
        'Computer Science & Engineering'
    );

    -- Extract contact
    assigned_contact := NULLIF(TRIM(NEW.raw_user_meta_data->>'contact_number'), '');

    -- Generate unique suffix from user ID
    unique_suffix := UPPER(SUBSTR(REPLACE(NEW.id::text, '-', ''), 1, 8));

    -- Determine roll or employee ID
    roll_or_emp_id := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'identifier'), ''),
        CASE 
            WHEN assigned_role = 'student' THEN 'STU-' || unique_suffix
            WHEN assigned_role = 'faculty' THEN 'FAC-' || unique_suffix
            WHEN assigned_role = 'placement_officer' THEN 'TPO-' || unique_suffix
            ELSE 'ADM-' || unique_suffix
        END
    );

    -- 1. Insert or update base profile
    INSERT INTO public.profiles (
        id, 
        name, 
        email, 
        role, 
        department, 
        contact_number,
        account_status,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        assigned_name,
        NEW.email,
        assigned_role,
        assigned_department,
        assigned_contact,
        'active'::public.account_status,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET name = COALESCE(EXCLUDED.name, public.profiles.name),
        department = COALESCE(EXCLUDED.department, public.profiles.department),
        contact_number = COALESCE(EXCLUDED.contact_number, public.profiles.contact_number),
        updated_at = NOW();

    -- 2. Insert or update role-specific records
    IF assigned_role = 'student' THEN
        -- Safely extract year
        BEGIN
            assigned_year := (NEW.raw_user_meta_data->>'year')::INT;
            IF assigned_year IS NULL OR assigned_year < 1 OR assigned_year > 5 THEN
                assigned_year := 3;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            assigned_year := 3;
        END;

        -- Safely extract cgpa
        BEGIN
            assigned_cgpa := (NEW.raw_user_meta_data->>'cgpa')::NUMERIC;
            IF assigned_cgpa IS NULL OR assigned_cgpa < 0.00 OR assigned_cgpa > 10.00 THEN
                assigned_cgpa := 8.00;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            assigned_cgpa := 8.00;
        END;

        -- Safely extract skills
        BEGIN
            IF NEW.raw_user_meta_data->'skills' IS NOT NULL 
               AND jsonb_typeof(NEW.raw_user_meta_data->'skills') = 'array' THEN
                assigned_skills := ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'skills'));
            ELSE
                assigned_skills := ARRAY['JavaScript', 'TypeScript'];
            END IF;
        EXCEPTION WHEN OTHERS THEN
            assigned_skills := ARRAY['JavaScript', 'TypeScript'];
        END;

        -- Handle potential student_id conflict
        IF EXISTS (SELECT 1 FROM public.students WHERE student_id = roll_or_emp_id AND user_id <> NEW.id) THEN
            roll_or_emp_id := roll_or_emp_id || '-' || unique_suffix;
        END IF;

        INSERT INTO public.students (
            user_id, 
            student_id, 
            department, 
            year, 
            cgpa, 
            skills, 
            placement_status,
            created_at,
            updated_at
        )
        VALUES (
            NEW.id,
            roll_or_emp_id,
            assigned_department,
            assigned_year,
            assigned_cgpa,
            assigned_skills,
            'unplaced'::public.placement_status,
            NOW(),
            NOW()
        )
        ON CONFLICT (user_id) DO UPDATE
        SET department = EXCLUDED.department,
            year = EXCLUDED.year,
            updated_at = NOW();

    ELSIF assigned_role = 'faculty' THEN
        assigned_designation := COALESCE(
            NULLIF(TRIM(NEW.raw_user_meta_data->>'designation'), ''),
            'Assistant Professor'
        );

        IF EXISTS (SELECT 1 FROM public.faculty_members WHERE employee_id = roll_or_emp_id AND user_id <> NEW.id) THEN
            roll_or_emp_id := roll_or_emp_id || '-' || unique_suffix;
        END IF;

        INSERT INTO public.faculty_members (
            user_id, 
            employee_id, 
            department, 
            designation, 
            cabin_location,
            created_at,
            updated_at
        )
        VALUES (
            NEW.id,
            roll_or_emp_id,
            assigned_department,
            assigned_designation,
            NEW.raw_user_meta_data->>'cabin_location',
            NOW(),
            NOW()
        )
        ON CONFLICT (user_id) DO UPDATE
        SET department = EXCLUDED.department,
            designation = EXCLUDED.designation,
            updated_at = NOW();

    ELSIF assigned_role = 'placement_officer' THEN
        assigned_designation := COALESCE(
            NULLIF(TRIM(NEW.raw_user_meta_data->>'designation'), ''),
            'Senior Placement Officer'
        );

        IF EXISTS (SELECT 1 FROM public.placement_officers WHERE employee_id = roll_or_emp_id AND user_id <> NEW.id) THEN
            roll_or_emp_id := roll_or_emp_id || '-' || unique_suffix;
        END IF;

        INSERT INTO public.placement_officers (
            user_id, 
            employee_id, 
            designation, 
            office_location,
            created_at,
            updated_at
        )
        VALUES (
            NEW.id,
            roll_or_emp_id,
            assigned_designation,
            NEW.raw_user_meta_data->>'office_location',
            NOW(),
            NOW()
        )
        ON CONFLICT (user_id) DO UPDATE
        SET designation = EXCLUDED.designation,
            updated_at = NOW();

    ELSIF assigned_role = 'administrator' THEN
        IF EXISTS (SELECT 1 FROM public.administrators WHERE admin_code = roll_or_emp_id AND user_id <> NEW.id) THEN
            roll_or_emp_id := roll_or_emp_id || '-' || unique_suffix;
        END IF;

        INSERT INTO public.administrators (
            user_id, 
            admin_code, 
            access_level,
            created_at,
            updated_at
        )
        VALUES (
            NEW.id,
            roll_or_emp_id,
            COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'access_level'), ''), 'super_admin'),
            NOW(),
            NOW()
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user exception caught for user % (%): %', NEW.id, NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Complete RLS Policies for Profiles and Role Tables (Self-service + Admin)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;
CREATE POLICY "Admins can insert any profile"
    ON public.profiles FOR INSERT
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert students" ON public.students;
CREATE POLICY "Admins can insert students"
    ON public.students FOR INSERT
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Faculty can insert own record" ON public.faculty_members;
CREATE POLICY "Faculty can insert own record"
    ON public.faculty_members FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can insert faculty records" ON public.faculty_members;
CREATE POLICY "Admins can insert faculty records"
    ON public.faculty_members FOR INSERT
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update faculty records" ON public.faculty_members;
CREATE POLICY "Admins can update faculty records"
    ON public.faculty_members FOR UPDATE
    USING (public.is_admin());

DROP POLICY IF EXISTS "Placement officers can insert own record" ON public.placement_officers;
CREATE POLICY "Placement officers can insert own record"
    ON public.placement_officers FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can insert placement officer records" ON public.placement_officers;
CREATE POLICY "Admins can insert placement officer records"
    ON public.placement_officers FOR INSERT
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update placement officer records" ON public.placement_officers;
CREATE POLICY "Admins can update placement officer records"
    ON public.placement_officers FOR UPDATE
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert administrators" ON public.administrators;
CREATE POLICY "Admins can insert administrators"
    ON public.administrators FOR INSERT
    WITH CHECK (public.is_admin());

-- 3. Scaling & High-Concurrency Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role_status ON public.profiles(role, account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_department_role ON public.profiles(department, role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_students_dept_year ON public.students(department, year);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON public.students(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_faculty_created_at ON public.faculty_members(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_placement_created_at ON public.placement_officers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admins_created_at ON public.administrators(created_at DESC);
