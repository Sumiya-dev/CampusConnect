'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '../auth/user';
import { createClient } from '../supabase/server';
import { ApplicationStatus } from '../types/database.types';
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
} from '../types/settings.types';

export interface SettingsActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

const VALID_APPLICATION_STATUSES: ApplicationStatus[] = [
  'applied',
  'shortlisted',
  'interview',
  'rejected',
  'selected',
  'placed',
  'withdrawn',
];

/**
 * Superadmin authorization check
 */
async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    throw new Error('Unauthorized: Privileged Superadmin access required.');
  }
  if (user.accountStatus !== 'active') {
    throw new Error('Unauthorized: Account is suspended or inactive.');
  }
  return user;
}

/**
 * Record action in audit log
 */
async function logAudit(
  supabase: any,
  admin: { id: string; email: string },
  action: string,
  details: Record<string, unknown>
) {
  try {
    await supabase.from('admin_audit_logs').insert({
      actor_id: admin.id,
      actor_email: admin.email,
      action,
      target_user_id: null,
      target_user_email: null,
      details,
      status: 'success',
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Audit logging failed:', err);
  }
}

/**
 * Update General System Settings
 */
export async function updateGeneralSettingsAction(
  data: Partial<GeneralSettings>
): Promise<SettingsActionResult> {
  try {
    const admin = await requireSuperAdmin();
    const supabase: any = await createClient();

    // 1. Validate fields
    if (data.university_name !== undefined) {
      if (typeof data.university_name !== 'string' || data.university_name.trim().length === 0) {
        return { success: false, error: 'University name cannot be empty.' };
      }
    }

    if (data.support_email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.support_email.trim())) {
        return { success: false, error: 'Please provide a valid support email address.' };
      }
    }

    if (data.platform_status !== undefined) {
      if (!['operational', 'maintenance', 'read_only'].includes(data.platform_status)) {
        return { success: false, error: 'Invalid platform status specified.' };
      }
    }

    // 2. Fetch existing values
    const { data: existingRow } = await supabase
      .from('system_settings')
      .select('values')
      .eq('category', 'general')
      .maybeSingle();

    const currentValues: GeneralSettings = {
      ...DEFAULT_GENERAL_SETTINGS,
      ...(existingRow?.values || {}),
    };

    const newValues: GeneralSettings = {
      university_name: data.university_name?.trim() ?? currentValues.university_name,
      university_code: data.university_code?.trim() ?? currentValues.university_code,
      support_email: data.support_email?.trim() ?? currentValues.support_email,
      support_phone: data.support_phone?.trim() ?? currentValues.support_phone,
      placement_cell_office: data.placement_cell_office?.trim() ?? currentValues.placement_cell_office,
      default_academic_calendar: data.default_academic_calendar?.trim() ?? currentValues.default_academic_calendar,
      platform_status: data.platform_status ?? currentValues.platform_status,
      maintenance_message: data.maintenance_message?.trim() ?? currentValues.maintenance_message,
    };

    // 3. Upsert
    const { error: upsertError } = await supabase
      .from('system_settings')
      .upsert({
        category: 'general',
        values: newValues,
        updated_by: admin.id,
        updated_at: new Date().toISOString(),
      });

    if (upsertError) {
      console.error('Error updating general settings:', upsertError);
      return { success: false, error: upsertError.message || 'Failed to update general settings.' };
    }

    // 4. Audit
    await logAudit(supabase, admin, 'UPDATE_SYSTEM_SETTINGS_GENERAL', {
      previous: currentValues,
      updated: newValues,
    });

    revalidatePath('/admin/settings');
    revalidatePath('/admin');
    return { success: true, message: 'General system settings updated successfully.' };
  } catch (err: any) {
    console.error('updateGeneralSettingsAction error:', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

/**
 * Update Placement Settings
 */
export async function updatePlacementSettingsAction(
  data: Partial<PlacementSettings>
): Promise<SettingsActionResult> {
  try {
    const admin = await requireSuperAdmin();
    const supabase: any = await createClient();

    // 1. Validations
    if (data.max_active_applications !== undefined) {
      const val = Number(data.max_active_applications);
      if (isNaN(val) || val < 1 || val > 50) {
        return { success: false, error: 'Max active applications must be between 1 and 50.' };
      }
    }

    if (data.default_min_cgpa !== undefined) {
      const val = Number(data.default_min_cgpa);
      if (isNaN(val) || val < 0 || val > 10) {
        return { success: false, error: 'Default minimum CGPA must be between 0.00 and 10.00.' };
      }
    }

    if (data.default_max_backlogs !== undefined) {
      const val = Number(data.default_max_backlogs);
      if (isNaN(val) || val < 0 || val > 20) {
        return { success: false, error: 'Default max backlogs must be between 0 and 20.' };
      }
    }

    if (data.default_status !== undefined) {
      if (!VALID_APPLICATION_STATUSES.includes(data.default_status)) {
        return { success: false, error: 'Invalid default application status.' };
      }
    }

    // 2. Fetch existing
    const { data: existingRow } = await supabase
      .from('system_settings')
      .select('values')
      .eq('category', 'placement')
      .maybeSingle();

    const currentValues: PlacementSettings = {
      ...DEFAULT_PLACEMENT_SETTINGS,
      ...(existingRow?.values || {}),
    };

    const newValues: PlacementSettings = {
      allow_multiple_offers: data.allow_multiple_offers !== undefined ? Boolean(data.allow_multiple_offers) : currentValues.allow_multiple_offers,
      max_active_applications: data.max_active_applications !== undefined ? Number(data.max_active_applications) : currentValues.max_active_applications,
      auto_lock_on_deadline: data.auto_lock_on_deadline !== undefined ? Boolean(data.auto_lock_on_deadline) : currentValues.auto_lock_on_deadline,
      default_min_cgpa: data.default_min_cgpa !== undefined ? Number(data.default_min_cgpa) : currentValues.default_min_cgpa,
      default_max_backlogs: data.default_max_backlogs !== undefined ? Number(data.default_max_backlogs) : currentValues.default_max_backlogs,
      allow_student_withdraw: data.allow_student_withdraw !== undefined ? Boolean(data.allow_student_withdraw) : currentValues.allow_student_withdraw,
      default_tier: data.default_tier?.trim() || currentValues.default_tier,
      default_status: data.default_status || currentValues.default_status,
      enable_backlog_grace: data.enable_backlog_grace !== undefined ? Boolean(data.enable_backlog_grace) : currentValues.enable_backlog_grace,
      require_resume_attached: data.require_resume_attached !== undefined ? Boolean(data.require_resume_attached) : currentValues.require_resume_attached,
    };

    // 3. Upsert
    const { error: upsertError } = await supabase
      .from('system_settings')
      .upsert({
        category: 'placement',
        values: newValues,
        updated_by: admin.id,
        updated_at: new Date().toISOString(),
      });

    if (upsertError) {
      console.error('Error updating placement settings:', upsertError);
      return { success: false, error: upsertError.message || 'Failed to update placement settings.' };
    }

    // 4. Audit
    await logAudit(supabase, admin, 'UPDATE_SYSTEM_SETTINGS_PLACEMENT', {
      previous: currentValues,
      updated: newValues,
    });

    revalidatePath('/admin/settings');
    revalidatePath('/admin/placements');
    return { success: true, message: 'Placement configuration updated successfully.' };
  } catch (err: any) {
    console.error('updatePlacementSettingsAction error:', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

/**
 * Update Notification Settings
 */
export async function updateNotificationSettingsAction(
  data: Partial<NotificationSettings>
): Promise<SettingsActionResult> {
  try {
    const admin = await requireSuperAdmin();
    const supabase: any = await createClient();

    if (data.digest_frequency !== undefined) {
      if (!['immediate', 'daily', 'weekly'].includes(data.digest_frequency)) {
        return { success: false, error: 'Invalid digest frequency option.' };
      }
    }

    const { data: existingRow } = await supabase
      .from('system_settings')
      .select('values')
      .eq('category', 'notifications')
      .maybeSingle();

    const currentValues: NotificationSettings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...(existingRow?.values || {}),
    };

    const newValues: NotificationSettings = {
      enable_placement_alerts: data.enable_placement_alerts !== undefined ? Boolean(data.enable_placement_alerts) : currentValues.enable_placement_alerts,
      enable_drive_updates: data.enable_drive_updates !== undefined ? Boolean(data.enable_drive_updates) : currentValues.enable_drive_updates,
      enable_interview_calls: data.enable_interview_calls !== undefined ? Boolean(data.enable_interview_calls) : currentValues.enable_interview_calls,
      enable_deadline_reminders: data.enable_deadline_reminders !== undefined ? Boolean(data.enable_deadline_reminders) : currentValues.enable_deadline_reminders,
      enable_general_announcements: data.enable_general_announcements !== undefined ? Boolean(data.enable_general_announcements) : currentValues.enable_general_announcements,
      enable_system_alerts: data.enable_system_alerts !== undefined ? Boolean(data.enable_system_alerts) : currentValues.enable_system_alerts,
      default_delivery_in_app: data.default_delivery_in_app !== undefined ? Boolean(data.default_delivery_in_app) : currentValues.default_delivery_in_app,
      default_email_dispatch: data.default_email_dispatch !== undefined ? Boolean(data.default_email_dispatch) : currentValues.default_email_dispatch,
      digest_frequency: data.digest_frequency || currentValues.digest_frequency,
    };

    const { error: upsertError } = await supabase
      .from('system_settings')
      .upsert({
        category: 'notifications',
        values: newValues,
        updated_by: admin.id,
        updated_at: new Date().toISOString(),
      });

    if (upsertError) {
      console.error('Error updating notification settings:', upsertError);
      return { success: false, error: upsertError.message || 'Failed to update notification settings.' };
    }

    await logAudit(supabase, admin, 'UPDATE_SYSTEM_SETTINGS_NOTIFICATIONS', {
      previous: currentValues,
      updated: newValues,
    });

    revalidatePath('/admin/settings');
    revalidatePath('/admin/notifications');
    return { success: true, message: 'Notification preferences updated successfully.' };
  } catch (err: any) {
    console.error('updateNotificationSettingsAction error:', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

/**
 * Update System Controls & Feature Toggles
 */
export async function updateSystemControlsAction(
  data: Partial<SystemControlSettings>
): Promise<SettingsActionResult> {
  try {
    const admin = await requireSuperAdmin();
    const supabase: any = await createClient();

    const { data: existingRow } = await supabase
      .from('system_settings')
      .select('values')
      .eq('category', 'system_controls')
      .maybeSingle();

    const currentValues: SystemControlSettings = {
      ...DEFAULT_SYSTEM_CONTROL_SETTINGS,
      ...(existingRow?.values || {}),
    };

    const newValues: SystemControlSettings = {
      maintenance_mode: data.maintenance_mode !== undefined ? Boolean(data.maintenance_mode) : currentValues.maintenance_mode,
      enable_community_hub: data.enable_community_hub !== undefined ? Boolean(data.enable_community_hub) : currentValues.enable_community_hub,
      enable_peer_guidance: data.enable_peer_guidance !== undefined ? Boolean(data.enable_peer_guidance) : currentValues.enable_peer_guidance,
      enable_resume_builder: data.enable_resume_builder !== undefined ? Boolean(data.enable_resume_builder) : currentValues.enable_resume_builder,
      enable_mock_tests: data.enable_mock_tests !== undefined ? Boolean(data.enable_mock_tests) : currentValues.enable_mock_tests,
      enable_company_registration: data.enable_company_registration !== undefined ? Boolean(data.enable_company_registration) : currentValues.enable_company_registration,
      allow_profile_edit: data.allow_profile_edit !== undefined ? Boolean(data.allow_profile_edit) : currentValues.allow_profile_edit,
    };

    const { error: upsertError } = await supabase
      .from('system_settings')
      .upsert({
        category: 'system_controls',
        values: newValues,
        updated_by: admin.id,
        updated_at: new Date().toISOString(),
      });

    if (upsertError) {
      console.error('Error updating system controls:', upsertError);
      return { success: false, error: upsertError.message || 'Failed to update system controls.' };
    }

    await logAudit(supabase, admin, 'UPDATE_SYSTEM_SETTINGS_CONTROLS', {
      previous: currentValues,
      updated: newValues,
    });

    revalidatePath('/admin/settings');
    revalidatePath('/admin');
    return { success: true, message: 'System controls updated successfully.' };
  } catch (err: any) {
    console.error('updateSystemControlsAction error:', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

/**
 * Restore Safe Defaults for a specific category or all categories
 */
export async function restoreDefaultSettingsAction(
  category: SettingCategory | 'all'
): Promise<SettingsActionResult> {
  try {
    const admin = await requireSuperAdmin();
    const supabase: any = await createClient();

    const timestamp = new Date().toISOString();

    if (category === 'all' || category === 'general') {
      await supabase.from('system_settings').upsert({
        category: 'general',
        values: DEFAULT_GENERAL_SETTINGS,
        updated_by: admin.id,
        updated_at: timestamp,
      });
    }

    if (category === 'all' || category === 'placement') {
      await supabase.from('system_settings').upsert({
        category: 'placement',
        values: DEFAULT_PLACEMENT_SETTINGS,
        updated_by: admin.id,
        updated_at: timestamp,
      });
    }

    if (category === 'all' || category === 'notifications') {
      await supabase.from('system_settings').upsert({
        category: 'notifications',
        values: DEFAULT_NOTIFICATION_SETTINGS,
        updated_by: admin.id,
        updated_at: timestamp,
      });
    }

    if (category === 'all' || category === 'system_controls') {
      await supabase.from('system_settings').upsert({
        category: 'system_controls',
        values: DEFAULT_SYSTEM_CONTROL_SETTINGS,
        updated_by: admin.id,
        updated_at: timestamp,
      });
    }

    await logAudit(supabase, admin, 'RESTORE_DEFAULT_SETTINGS', {
      targetCategory: category,
    });

    revalidatePath('/admin/settings');
    revalidatePath('/admin');
    return {
      success: true,
      message: `Default configuration successfully restored for ${category === 'all' ? 'all categories' : category}.`,
    };
  } catch (err: any) {
    console.error('restoreDefaultSettingsAction error:', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}
