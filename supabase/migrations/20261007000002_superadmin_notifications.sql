-- ==============================================================================
-- CAMPUSCONNECT AI - SUPERADMIN NOTIFICATIONS MANAGEMENT MODULE
-- Migration: 20261007000002_superadmin_notifications.sql
-- ==============================================================================

-- 1. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Placement', 'Drive', 'Deadline', 'Interview', 'Announcement', 'System', 'General')),
    target_roles TEXT[] NOT NULL DEFAULT '{}',
    target_department TEXT,
    target_year INT CHECK (target_year IS NULL OR (target_year >= 1 AND target_year <= 5)),
    target_section_id UUID REFERENCES public.academic_sections(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. RECIPIENT DELIVERY & READ TRACKING
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_notification_user UNIQUE (notification_id, user_id)
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON public.notifications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_notif_id ON public.user_notifications(notification_id);

-- 4. ROW LEVEL SECURITY
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Notifications RLS
CREATE POLICY "Users can view assigned notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.user_notifications un
        WHERE un.notification_id = public.notifications.id
        AND un.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (public.is_admin());

-- User Notifications RLS
CREATE POLICY "Users can view their notifications"
ON public.user_notifications FOR SELECT
TO authenticated
USING (public.is_admin() OR user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
ON public.user_notifications FOR UPDATE
TO authenticated
USING (public.is_admin() OR user_id = auth.uid())
WITH CHECK (public.is_admin() OR user_id = auth.uid());

CREATE POLICY "Admins can insert user notifications"
ON public.user_notifications FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete user notifications"
ON public.user_notifications FOR DELETE
TO authenticated
USING (public.is_admin());
