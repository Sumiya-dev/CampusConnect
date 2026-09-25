-- ==============================================================================
-- CAMPUSCONNECT AI - FACULTY PORTAL: SCHEDULE, ALLOCATIONS & REGISTRATIONS
-- PostgreSQL / Supabase Schema Definition & Row-Level Security
-- ==============================================================================

-- 1. CLASS / TRAINING SESSIONS
CREATE TABLE IF NOT EXISTS public.class_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,                          -- e.g. 'Java Training', 'Python Lab', 'Aptitude Practice'
    training_name TEXT NOT NULL,                  -- e.g. 'Java', 'Python', 'Aptitude', 'Coding'
    training_group_id UUID REFERENCES public.training_groups(id) ON DELETE SET NULL,
    section_id UUID NOT NULL REFERENCES public.academic_sections(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES public.faculty_members(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,                   -- e.g. CURRENT_DATE
    start_time TIME NOT NULL,                     -- e.g. '10:00:00'
    end_time TIME NOT NULL,                       -- e.g. '11:00:00'
    venue TEXT NOT NULL DEFAULT 'Room 204',       -- e.g. 'Room 204', 'Lab 3', 'Room 105'
    status TEXT NOT NULL DEFAULT 'scheduled',     -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. SESSION REGISTRATIONS (Only registered students attend a particular session)
CREATE TABLE IF NOT EXISTS public.session_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'registered',    -- 'registered', 'attended', 'absent'
    registered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_session_student UNIQUE (session_id, student_id)
);

-- ------------------------------------------------------------------------------
-- INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_class_sessions_faculty ON public.class_sessions(faculty_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_date ON public.class_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_class_sessions_section ON public.class_sessions(section_id);
CREATE INDEX IF NOT EXISTS idx_session_registrations_session ON public.session_registrations(session_id);
CREATE INDEX IF NOT EXISTS idx_session_registrations_student ON public.session_registrations(student_id);

-- ------------------------------------------------------------------------------
-- ROW-LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_registrations ENABLE ROW LEVEL SECURITY;

-- Faculty can only view sessions allocated to them
CREATE POLICY "Faculty can view own allocated sessions"
    ON public.class_sessions FOR SELECT
    USING (
        (public.get_current_user_role() = 'faculty' AND faculty_id = public.get_current_faculty_id())
        OR public.is_placement_officer()
    );

-- Faculty can only view registrations for their own sessions
CREATE POLICY "Faculty can view registrations for own sessions"
    ON public.session_registrations FOR SELECT
    USING (
        (
            public.get_current_user_role() = 'faculty'
            AND session_id IN (
                SELECT id FROM public.class_sessions
                WHERE faculty_id = public.get_current_faculty_id()
            )
        )
        OR (
            public.get_current_user_role() = 'student'
            AND student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        )
        OR public.is_placement_officer()
    );

-- ------------------------------------------------------------------------------
-- SEED ALLOCATIONS & REGISTERED STUDENTS
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    fac_id UUID;
    sec_cse_4a_id UUID;
    sec_aids_4a_id UUID;
    sec_aiml_4a_id UUID;
    sec_cse_4b_id UUID;
    grp_java_id UUID;
    grp_python_id UUID;
    grp_aptitude_id UUID;
    grp_coding_id UUID;
    sess_today_1 UUID;
    sess_today_2 UUID;
    sess_tmrw_1 UUID;
    sess_tmrw_2 UUID;
    sess_upc_1 UUID;
    student_rec RECORD;
    cnt INT := 0;
BEGIN
    -- Select first faculty
    SELECT id INTO fac_id FROM public.faculty_members LIMIT 1;

    -- Select training groups
    SELECT id INTO grp_java_id FROM public.training_groups WHERE name ILIKE '%Java%' LIMIT 1;
    SELECT id INTO grp_python_id FROM public.training_groups WHERE name ILIKE '%Python%' LIMIT 1;
    SELECT id INTO grp_aptitude_id FROM public.training_groups WHERE name ILIKE '%Aptitude%' LIMIT 1;
    SELECT id INTO grp_coding_id FROM public.training_groups WHERE name ILIKE '%Coding%' LIMIT 1;

    -- Select sections
    SELECT id INTO sec_cse_4a_id FROM public.academic_sections 
    WHERE year = 4 AND section_name = 'Section A' 
      AND program_id IN (SELECT id FROM public.programs WHERE code = 'CSE') LIMIT 1;

    SELECT id INTO sec_aids_4a_id FROM public.academic_sections 
    WHERE year = 4 AND section_name = 'Section A' 
      AND program_id IN (SELECT id FROM public.programs WHERE code = 'AIDS') LIMIT 1;

    SELECT id INTO sec_aiml_4a_id FROM public.academic_sections 
    WHERE year = 4 AND section_name = 'Section A' 
      AND program_id IN (SELECT id FROM public.programs WHERE code = 'AIML') LIMIT 1;

    SELECT id INTO sec_cse_4b_id FROM public.academic_sections 
    WHERE year = 4 AND section_name = 'Section B' 
      AND program_id IN (SELECT id FROM public.programs WHERE code = 'CSE') LIMIT 1;

    -- If section was not found, pick any available section
    IF sec_cse_4a_id IS NULL THEN
        SELECT id INTO sec_cse_4a_id FROM public.academic_sections LIMIT 1;
    END IF;
    IF sec_aids_4a_id IS NULL THEN sec_aids_4a_id := sec_cse_4a_id; END IF;
    IF sec_aiml_4a_id IS NULL THEN sec_aiml_4a_id := sec_cse_4a_id; END IF;
    IF sec_cse_4b_id IS NULL THEN sec_cse_4b_id := sec_cse_4a_id; END IF;

    IF fac_id IS NOT NULL AND sec_cse_4a_id IS NOT NULL THEN
        -- 1. TODAY SESSION 1: Java (10:00 AM – 11:00 AM, Room 204)
        INSERT INTO public.class_sessions (
            title, training_name, training_group_id, section_id, faculty_id,
            session_date, start_time, end_time, venue, status
        )
        VALUES (
            'Java Training', 'Java', grp_java_id, sec_cse_4a_id, fac_id,
            CURRENT_DATE, '10:00:00', '11:00:00', 'Room 204', 'scheduled'
        )
        RETURNING id INTO sess_today_1;

        -- 2. TODAY SESSION 2: Python (2:00 PM – 3:00 PM, Lab 3)
        INSERT INTO public.class_sessions (
            title, training_name, training_group_id, section_id, faculty_id,
            session_date, start_time, end_time, venue, status
        )
        VALUES (
            'Python Training', 'Python', grp_python_id, sec_aids_4a_id, fac_id,
            CURRENT_DATE, '14:00:00', '15:00:00', 'Lab 3', 'scheduled'
        )
        RETURNING id INTO sess_today_2;

        -- 3. TOMORROW SESSION 1: Aptitude (11:00 AM – 12:00 PM, Room 105)
        INSERT INTO public.class_sessions (
            title, training_name, training_group_id, section_id, faculty_id,
            session_date, start_time, end_time, venue, status
        )
        VALUES (
            'Aptitude Training', 'Aptitude', grp_aptitude_id, sec_aiml_4a_id, fac_id,
            CURRENT_DATE + 1, '11:00:00', '12:00:00', 'Room 105', 'scheduled'
        )
        RETURNING id INTO sess_tmrw_1;

        -- 4. TOMORROW SESSION 2: Coding (3:00 PM – 4:00 PM, Lab 1)
        INSERT INTO public.class_sessions (
            title, training_name, training_group_id, section_id, faculty_id,
            session_date, start_time, end_time, venue, status
        )
        VALUES (
            'Coding Training', 'Coding', grp_coding_id, sec_cse_4b_id, fac_id,
            CURRENT_DATE + 1, '15:00:00', '16:00:00', 'Lab 1', 'scheduled'
        )
        RETURNING id INTO sess_tmrw_2;

        -- 5. UPCOMING SESSION: Advanced Java Practice (CURRENT_DATE + 3, 10:00 AM - 11:30 AM)
        INSERT INTO public.class_sessions (
            title, training_name, training_group_id, section_id, faculty_id,
            session_date, start_time, end_time, venue, status
        )
        VALUES (
            'Java Advanced Systems', 'Java', grp_java_id, sec_cse_4a_id, fac_id,
            CURRENT_DATE + 3, '10:00:00', '11:30:00', 'Room 204', 'scheduled'
        )
        RETURNING id INTO sess_upc_1;

        -- 6. Register specific students into each session
        -- (Ensuring separate registrations: Java has its own attendees, Python has its own attendees)
        FOR student_rec IN SELECT id FROM public.students LOOP
            cnt := cnt + 1;
            
            -- Students registered for Session 1 (Java - Today 10:00 AM) - approx 32 students
            IF cnt <= 32 AND sess_today_1 IS NOT NULL THEN
                INSERT INTO public.session_registrations (session_id, student_id, status)
                VALUES (sess_today_1, student_rec.id, 'registered')
                ON CONFLICT DO NOTHING;
            END IF;

            -- Students registered for Session 2 (Python - Today 2:00 PM) - approx 28 students
            IF (cnt >= 15 AND cnt <= 42) AND sess_today_2 IS NOT NULL THEN
                INSERT INTO public.session_registrations (session_id, student_id, status)
                VALUES (sess_today_2, student_rec.id, 'registered')
                ON CONFLICT DO NOTHING;
            END IF;

            -- Students registered for Tomorrow Aptitude (approx 30 students)
            IF (cnt >= 5 AND cnt <= 34) AND sess_tmrw_1 IS NOT NULL THEN
                INSERT INTO public.session_registrations (session_id, student_id, status)
                VALUES (sess_tmrw_1, student_rec.id, 'registered')
                ON CONFLICT DO NOTHING;
            END IF;

            -- Students registered for Tomorrow Coding (approx 26 students)
            IF (cnt >= 20 AND cnt <= 45) AND sess_tmrw_2 IS NOT NULL THEN
                INSERT INTO public.session_registrations (session_id, student_id, status)
                VALUES (sess_tmrw_2, student_rec.id, 'registered')
                ON CONFLICT DO NOTHING;
            END IF;

            -- Students registered for Upcoming Session
            IF cnt <= 32 AND sess_upc_1 IS NOT NULL THEN
                INSERT INTO public.session_registrations (session_id, student_id, status)
                VALUES (sess_upc_1, student_rec.id, 'registered')
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;
    END IF;
END $$;
