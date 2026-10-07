import { createClient } from '../supabase/server';
import {
  DEFAULT_GENERAL_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_PLACEMENT_SETTINGS,
  DEFAULT_SYSTEM_CONTROL_SETTINGS,
  GeneralSettings,
  NotificationSettings,
  PlacementSettings,
  SettingCategory,
  SystemControlSettings,
  SystemSettingsBundle,
} from '../types/settings.types';

export interface SystemSettingsQueryResult {
  bundle: SystemSettingsBundle;
  academicYears: Array<{
    id: string;
    year_number: number;
    display_name: string;
    current_academic_calendar: string;
    status: string;
  }>;
}

/**
 * Fetch all system settings bundles merged with secure fallback defaults.
 */
export async function getSystemSettings(): Promise<SystemSettingsQueryResult> {
  const supabase: any = await createClient();

  // 1. Fetch all settings rows
  const { data: rows, error: settingsError } = await supabase
    .from('system_settings')
    .select('category, values, updated_by, updated_at');

  if (settingsError) {
    console.error('Error fetching system settings:', settingsError);
  }

  // 2. Fetch academic years for select options
  const { data: academicYearsData, error: yearsError } = await supabase
    .from('academic_years')
    .select('id, year_number, display_name, current_academic_calendar, status')
    .order('year_number', { ascending: true });

  if (yearsError) {
    console.error('Error fetching academic years for settings:', yearsError);
  }

  // Build mapped dictionary
  const rawMap = new Map<SettingCategory, { values: any; updated_at: string; updated_by: string | null }>();
  if (rows && Array.isArray(rows)) {
    for (const row of rows) {
      rawMap.set(row.category as SettingCategory, {
        values: row.values,
        updated_at: row.updated_at,
        updated_by: row.updated_by,
      });
    }
  }

  const generalRow = rawMap.get('general');
  const placementRow = rawMap.get('placement');
  const notificationsRow = rawMap.get('notifications');
  const controlsRow = rawMap.get('system_controls');

  const general: GeneralSettings = {
    ...DEFAULT_GENERAL_SETTINGS,
    ...(generalRow?.values || {}),
  };

  const placement: PlacementSettings = {
    ...DEFAULT_PLACEMENT_SETTINGS,
    ...(placementRow?.values || {}),
  };

  const notifications: NotificationSettings = {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...(notificationsRow?.values || {}),
  };

  const system_controls: SystemControlSettings = {
    ...DEFAULT_SYSTEM_CONTROL_SETTINGS,
    ...(controlsRow?.values || {}),
  };

  const metadata: SystemSettingsBundle['metadata'] = {};
  if (generalRow) {
    metadata.general = {
      updated_at: generalRow.updated_at,
      updated_by: generalRow.updated_by,
    };
  }
  if (placementRow) {
    metadata.placement = {
      updated_at: placementRow.updated_at,
      updated_by: placementRow.updated_by,
    };
  }
  if (notificationsRow) {
    metadata.notifications = {
      updated_at: notificationsRow.updated_at,
      updated_by: notificationsRow.updated_by,
    };
  }
  if (controlsRow) {
    metadata.system_controls = {
      updated_at: controlsRow.updated_at,
      updated_by: controlsRow.updated_by,
    };
  }

  return {
    bundle: {
      general,
      placement,
      notifications,
      system_controls,
      metadata,
    },
    academicYears: academicYearsData || [],
  };
}

/**
 * Lightweight public settings fetcher for banners, platform status, or support info.
 */
export async function getPublicPlatformStatus(): Promise<{
  platform_status: 'operational' | 'maintenance' | 'read_only';
  maintenance_message: string;
  maintenance_mode: boolean;
  university_name: string;
  support_email: string;
}> {
  try {
    const supabase: any = await createClient();
    const { data: rows } = await supabase
      .from('system_settings')
      .select('category, values')
      .in('category', ['general', 'system_controls']);

    let generalValues = DEFAULT_GENERAL_SETTINGS;
    let controlsValues = DEFAULT_SYSTEM_CONTROL_SETTINGS;

    if (rows && Array.isArray(rows)) {
      for (const row of rows) {
        if (row.category === 'general' && row.values) {
          generalValues = { ...DEFAULT_GENERAL_SETTINGS, ...row.values };
        }
        if (row.category === 'system_controls' && row.values) {
          controlsValues = { ...DEFAULT_SYSTEM_CONTROL_SETTINGS, ...row.values };
        }
      }
    }

    return {
      platform_status: generalValues.platform_status,
      maintenance_message: generalValues.maintenance_message,
      maintenance_mode: controlsValues.maintenance_mode,
      university_name: generalValues.university_name,
      support_email: generalValues.support_email,
    };
  } catch (error) {
    console.error('Failed to get public platform status:', error);
    return {
      platform_status: 'operational',
      maintenance_message: '',
      maintenance_mode: false,
      university_name: DEFAULT_GENERAL_SETTINGS.university_name,
      support_email: DEFAULT_GENERAL_SETTINGS.support_email,
    };
  }
}
