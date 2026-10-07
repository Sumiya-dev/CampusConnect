-- ==============================================================================
-- CAMPUSCONNECT AI - SUPERADMIN PLACEMENT DRIVES MANAGEMENT
-- Migration: 20261006000000_superadmin_placement_drives.sql
-- ==============================================================================

-- 1. Ensure archived value in drive_status enum
DO $$
BEGIN
    ALTER TYPE drive_status ADD VALUE IF NOT EXISTS 'archived';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add published state and academic targeting fields
ALTER TABLE public.placement_drives ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.placement_drives ADD COLUMN IF NOT EXISTS eligible_programs TEXT[] DEFAULT '{}';
ALTER TABLE public.placement_drives ADD COLUMN IF NOT EXISTS graduation_year INT;

-- 3. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_drives_is_published ON public.placement_drives(is_published);
CREATE INDEX IF NOT EXISTS idx_drives_graduation_year ON public.placement_drives(graduation_year);
