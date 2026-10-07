-- ==============================================================================
-- CAMPUSCONNECT AI - SUPERADMIN STUDENT PLACEMENT MANAGEMENT & HISTORY
-- Migration: 20261007000000_superadmin_student_placements.sql
-- ==============================================================================

-- 1. Create application_status_history table to preserve historical activity records
CREATE TABLE IF NOT EXISTS public.application_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    drive_id UUID NOT NULL REFERENCES public.placement_drives(id) ON DELETE CASCADE,
    from_status public.application_status,
    to_status public.application_status NOT NULL,
    notes TEXT,
    interview_date TIMESTAMPTZ,
    interview_venue TEXT,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    changed_by_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Indexes for efficient lookup
CREATE INDEX IF NOT EXISTS idx_app_history_student ON public.application_status_history(student_id);
CREATE INDEX IF NOT EXISTS idx_app_history_drive ON public.application_status_history(drive_id);
CREATE INDEX IF NOT EXISTS idx_app_history_app ON public.application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_app_history_created_at ON public.application_status_history(created_at DESC);

-- 3. Row Level Security for application_status_history
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'application_status_history' AND policyname = 'Admins and Officers can view history'
    ) THEN
        CREATE POLICY "Admins and Officers can view history"
            ON public.application_status_history FOR SELECT
            USING (public.is_placement_officer());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'application_status_history' AND policyname = 'Students can view own history'
    ) THEN
        CREATE POLICY "Students can view own history"
            ON public.application_status_history FOR SELECT
            USING (
                student_id IN (
                    SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'application_status_history' AND policyname = 'Admins and Officers can insert history'
    ) THEN
        CREATE POLICY "Admins and Officers can insert history"
            ON public.application_status_history FOR INSERT
            WITH CHECK (public.is_placement_officer());
    END IF;
END $$;

-- 4. Allow Superadmins and Placement Officers to insert applications for students
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'applications' AND policyname = 'Officers and Admins can insert applications'
    ) THEN
        CREATE POLICY "Officers and Admins can insert applications"
            ON public.applications FOR INSERT
            WITH CHECK (public.is_placement_officer());
    END IF;
END $$;

-- 5. Trigger function to automatically maintain application history and sync student placement_status
CREATE OR REPLACE FUNCTION public.handle_application_history_and_placement_sync()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_user_email TEXT := NULL;
BEGIN
    IF v_user_id IS NOT NULL THEN
        SELECT email INTO v_user_email FROM public.profiles WHERE id = v_user_id;
    END IF;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.application_status_history (
            application_id,
            student_id,
            drive_id,
            from_status,
            to_status,
            notes,
            interview_date,
            interview_venue,
            changed_by,
            changed_by_email,
            created_at
        ) VALUES (
            NEW.id,
            NEW.student_id,
            NEW.drive_id,
            NULL,
            NEW.status,
            NEW.notes,
            NEW.interview_date,
            NEW.interview_venue,
            v_user_id,
            v_user_email,
            timezone('utc'::text, now())
        );

        IF NEW.status = 'placed' THEN
            UPDATE public.students SET placement_status = 'placed' WHERE id = NEW.student_id;
        ELSIF NEW.status IN ('shortlisted', 'interview', 'selected') THEN
            UPDATE public.students 
            SET placement_status = 'in_process' 
            WHERE id = NEW.student_id AND placement_status = 'unplaced';
        END IF;

    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.status IS DISTINCT FROM NEW.status OR 
            OLD.interview_date IS DISTINCT FROM NEW.interview_date OR
            OLD.interview_venue IS DISTINCT FROM NEW.interview_venue OR
            OLD.notes IS DISTINCT FROM NEW.notes) THEN
            
            INSERT INTO public.application_status_history (
                application_id,
                student_id,
                drive_id,
                from_status,
                to_status,
                notes,
                interview_date,
                interview_venue,
                changed_by,
                changed_by_email,
                created_at
            ) VALUES (
                NEW.id,
                NEW.student_id,
                NEW.drive_id,
                OLD.status,
                NEW.status,
                NEW.notes,
                NEW.interview_date,
                NEW.interview_venue,
                v_user_id,
                v_user_email,
                timezone('utc'::text, now())
            );
        END IF;

        IF NEW.status = 'placed' THEN
            UPDATE public.students SET placement_status = 'placed' WHERE id = NEW.student_id;
        ELSIF NEW.status IN ('shortlisted', 'interview', 'selected') THEN
            UPDATE public.students 
            SET placement_status = 'in_process' 
            WHERE id = NEW.student_id AND placement_status = 'unplaced';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_application_history_sync'
    ) THEN
        CREATE TRIGGER trigger_application_history_sync
            AFTER INSERT OR UPDATE ON public.applications
            FOR EACH ROW EXECUTE FUNCTION public.handle_application_history_and_placement_sync();
    END IF;
END $$;
