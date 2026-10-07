-- ==============================================================================
-- CAMPUSCONNECT AI - SUPERADMIN SYSTEM SETTINGS MODULE
-- Migration: 20261007000004_superadmin_system_settings.sql
-- ==============================================================================

-- 1. CREATE SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.system_settings (
    category TEXT PRIMARY KEY CHECK (category IN ('general', 'placement', 'notifications', 'system_controls')),
    values JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'system_settings' AND policyname = 'Authenticated users can read system settings'
    ) THEN
        CREATE POLICY "Authenticated users can read system settings"
        ON public.system_settings FOR SELECT
        TO authenticated
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'system_settings' AND policyname = 'Superadmins can insert system settings'
    ) THEN
        CREATE POLICY "Superadmins can insert system settings"
        ON public.system_settings FOR INSERT
        TO authenticated
        WITH CHECK (public.is_admin());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'system_settings' AND policyname = 'Superadmins can update system settings'
    ) THEN
        CREATE POLICY "Superadmins can update system settings"
        ON public.system_settings FOR UPDATE
        TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());
    END IF;
END $$;

-- 4. SEED INITIAL DEFAULTS
INSERT INTO public.system_settings (category, values)
VALUES 
(
  'general',
  '{
    "university_name": "CampusConnect Institute of Technology",
    "university_code": "CCIT-001",
    "support_email": "support@campusconnect.edu",
    "support_phone": "+91 98765 43210",
    "placement_cell_office": "Career Guidance & Placement Center, Admin Block, Floor 2",
    "default_academic_calendar": "2025-2026",
    "platform_status": "operational",
    "maintenance_message": "CampusConnect is undergoing scheduled maintenance. Normal operations will resume shortly."
  }'::jsonb
),
(
  'placement',
  '{
    "allow_multiple_offers": false,
    "max_active_applications": 5,
    "auto_lock_on_deadline": true,
    "default_min_cgpa": 6.00,
    "default_max_backlogs": 0,
    "allow_student_withdraw": true,
    "default_tier": "Core Recruiter",
    "default_status": "applied",
    "enable_backlog_grace": false,
    "require_resume_attached": true
  }'::jsonb
),
(
  'notifications',
  '{
    "enable_placement_alerts": true,
    "enable_drive_updates": true,
    "enable_interview_calls": true,
    "enable_deadline_reminders": true,
    "enable_general_announcements": true,
    "enable_system_alerts": true,
    "default_delivery_in_app": true,
    "default_email_dispatch": false,
    "digest_frequency": "immediate"
  }'::jsonb
),
(
  'system_controls',
  '{
    "maintenance_mode": false,
    "enable_community_hub": true,
    "enable_peer_guidance": true,
    "enable_resume_builder": true,
    "enable_mock_tests": true,
    "enable_company_registration": false,
    "allow_profile_edit": true
  }'::jsonb
)
ON CONFLICT (category) DO NOTHING;
