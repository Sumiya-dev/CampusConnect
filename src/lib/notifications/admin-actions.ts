'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '../auth/user';
import { createClient } from '../supabase/server';
import {
  CreateNotificationInput,
  NotificationType,
  UpdateNotificationInput,
} from '../types/notification.types';

export interface ActionResponse {
  success: boolean;
  message?: string;
  error?: string;
  notificationId?: string;
  recipientCount?: number;
}

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
 * Log audit events to admin_audit_logs
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
    console.error('Notification audit logging error:', err);
  }
}

/**
 * Resolve recipient user IDs based on notification target configuration
 */
async function resolveRecipientUserIds(
  supabase: any,
  targets: {
    target_roles: string[];
    target_department?: string | null;
    target_year?: number | null;
    target_section_id?: string | null;
  }
): Promise<string[]> {
  const isAllRoles =
    targets.target_roles.length === 0 || targets.target_roles.includes('all');
  const targetRoles = isAllRoles
    ? ['student', 'faculty', 'placement_officer', 'administrator']
    : targets.target_roles;

  const recipientUserIds = new Set<string>();

  // 1. Resolve students if targeted
  if (targetRoles.includes('student')) {
    let studentQuery = supabase
      .from('students')
      .select('id, user_id, department, year, user:profiles!students_user_id_fkey(account_status)');

    if (targets.target_department && targets.target_department !== 'all') {
      studentQuery = studentQuery.eq('department', targets.target_department);
    }
    if (targets.target_year) {
      studentQuery = studentQuery.eq('year', targets.target_year);
    }

    const { data: studentRows, error: sErr } = await studentQuery;
    if (!sErr && studentRows) {
      let filteredStudents = studentRows.filter(
        (s: any) => s.user?.account_status !== 'suspended'
      );

      // Section check
      if (targets.target_section_id && targets.target_section_id !== 'all') {
        const studentIds = filteredStudents.map((s: any) => s.id);
        if (studentIds.length > 0) {
          const { data: enrollments } = await supabase
            .from('student_academic_enrollments')
            .select('student_id')
            .eq('section_id', targets.target_section_id)
            .in('student_id', studentIds);

          const enrolledIds = new Set(
            (enrollments || []).map((e: any) => e.student_id)
          );
          filteredStudents = filteredStudents.filter((s: any) =>
            enrolledIds.has(s.id)
          );
        } else {
          filteredStudents = [];
        }
      }

      filteredStudents.forEach((s: any) => recipientUserIds.add(s.user_id));
    }
  }

  // 2. Resolve non-student roles
  const nonStudentRoles = targetRoles.filter((r) => r !== 'student');
  // Year and section filters only apply to students; skip non-students if specific year/section was selected
  if (nonStudentRoles.length > 0 && !targets.target_year && (!targets.target_section_id || targets.target_section_id === 'all')) {
    let profileQuery = supabase
      .from('profiles')
      .select('id, department')
      .in('role', nonStudentRoles)
      .neq('account_status', 'suspended');

    if (targets.target_department && targets.target_department !== 'all') {
      profileQuery = profileQuery.eq('department', targets.target_department);
    }

    const { data: profileRows, error: pErr } = await profileQuery;
    if (!pErr && profileRows) {
      profileRows.forEach((p: any) => recipientUserIds.add(p.id));
    }
  }

  return Array.from(recipientUserIds);
}

/**
 * Fan out notification delivery records to target recipients
 */
async function dispatchToRecipients(
  supabase: any,
  notificationId: string,
  recipientUserIds: string[]
): Promise<number> {
  if (recipientUserIds.length === 0) return 0;

  const records = recipientUserIds.map((userId) => ({
    notification_id: notificationId,
    user_id: userId,
    is_read: false,
  }));

  // Batch insert in chunks of 200
  const chunkSize = 200;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('user_notifications')
      .upsert(chunk, { onConflict: 'notification_id,user_id', ignoreDuplicates: true });
    if (error) {
      console.error('Error dispatching user_notifications batch:', error);
    }
  }

  return recipientUserIds.length;
}

/**
 * Superadmin: Create a new notification (Draft, Scheduled, or Immediate Send)
 */
export async function createNotificationAction(
  input: CreateNotificationInput
): Promise<ActionResponse> {
  try {
    const admin = await requireSuperAdmin();
    const supabase: any = await createClient();

    // Input Validation
    if (!input.title || input.title.trim() === '') {
      return { success: false, error: 'Notification title is required.' };
    }
    if (!input.message || input.message.trim() === '') {
      return { success: false, error: 'Notification message body is required.' };
    }

    const validTypes: NotificationType[] = [
      'Placement',
      'Drive',
      'Deadline',
      'Interview',
      'Announcement',
      'System',
      'General',
    ];
    if (!validTypes.includes(input.type)) {
      return { success: false, error: `Invalid notification type: ${input.type}` };
    }

    let status: 'draft' | 'scheduled' | 'sent' = 'draft';
    let sentAt: string | null = null;
    let scheduledAt: string | null = null;

    if (input.send_now) {
      status = 'sent';
      sentAt = new Date().toISOString();
    } else if (input.scheduled_at && input.scheduled_at.trim() !== '') {
      status = 'scheduled';
      scheduledAt = new Date(input.scheduled_at).toISOString();
    }

    const insertPayload = {
      title: input.title.trim(),
      message: input.message.trim(),
      type: input.type,
      target_roles: input.target_roles || [],
      target_department:
        input.target_department && input.target_department !== 'all'
          ? input.target_department
          : null,
      target_year: input.target_year || null,
      target_section_id:
        input.target_section_id && input.target_section_id !== 'all'
          ? input.target_section_id
          : null,
      scheduled_at: scheduledAt,
      sent_at: sentAt,
      status,
      created_by: admin.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: notification, error: insertError } = await supabase
      .from('notifications')
      .insert(insertPayload)
      .select('id')
      .single();

    if (insertError || !notification) {
      return {
        success: false,
        error: insertError?.message || 'Failed to create notification record.',
      };
    }

    let recipientCount = 0;
    if (status === 'sent') {
      const recipientIds = await resolveRecipientUserIds(supabase, {
        target_roles: insertPayload.target_roles,
        target_department: insertPayload.target_department,
        target_year: insertPayload.target_year,
        target_section_id: insertPayload.target_section_id,
      });

      recipientCount = await dispatchToRecipients(
        supabase,
        notification.id,
        recipientIds
      );
    }

    await logAudit(supabase, admin, 'NOTIFICATION_CREATED', {
      notification_id: notification.id,
      title: insertPayload.title,
      type: insertPayload.type,
      status,
      recipient_count: recipientCount,
      target_roles: insertPayload.target_roles,
      target_department: insertPayload.target_department,
    });

    revalidatePath('/admin/notifications');
    revalidatePath(`/admin/notifications/${notification.id}`);
    revalidatePath('/student/notifications');
    revalidatePath('/faculty/notifications');

    return {
      success: true,
      message:
        status === 'sent'
          ? `Notification published and dispatched to ${recipientCount} user(s).`
          : status === 'scheduled'
          ? 'Notification successfully scheduled.'
          : 'Notification saved as draft.',
      notificationId: notification.id,
      recipientCount,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred.' };
  }
}

/**
 * Superadmin: Send a draft or scheduled notification immediately
 */
export async function sendNotificationNowAction(
  id: string
): Promise<ActionResponse> {
  try {
    const admin = await requireSuperAdmin();
    const supabase: any = await createClient();

    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !notification) {
      return { success: false, error: 'Notification not found.' };
    }

    if (notification.status === 'sent') {
      return {
        success: false,
        error: 'Integrity protection: This notification has already been sent.',
      };
    }

    const recipientIds = await resolveRecipientUserIds(supabase, {
      target_roles: notification.target_roles || [],
      target_department: notification.target_department,
      target_year: notification.target_year,
      target_section_id: notification.target_section_id,
    });

    const recipientCount = await dispatchToRecipients(
      supabase,
      notification.id,
      recipientIds
    );

    const nowIso = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('notifications')
      .update({
        status: 'sent',
        sent_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', id);

    if (updateError) {
      return { success: false, error: 'Failed to update notification status.' };
    }

    await logAudit(supabase, admin, 'NOTIFICATION_SENT', {
      notification_id: id,
      title: notification.title,
      recipient_count: recipientCount,
    });

    revalidatePath('/admin/notifications');
    revalidatePath(`/admin/notifications/${id}`);
    revalidatePath('/student/notifications');
    revalidatePath('/faculty/notifications');

    return {
      success: true,
      message: `Notification successfully dispatched to ${recipientCount} recipient(s).`,
      recipientCount,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred.' };
  }
}

/**
 * Superadmin: Update a scheduled or draft notification
 * Crucial rule: Already-sent notifications CANNOT be modified.
 */
export async function updateScheduledNotificationAction(
  id: string,
  input: UpdateNotificationInput
): Promise<ActionResponse> {
  try {
    const admin = await requireSuperAdmin();
    const supabase: any = await createClient();

    const { data: existing, error: fetchErr } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return { success: false, error: 'Notification not found.' };
    }

    if (existing.status === 'sent') {
      return {
        success: false,
        error:
          'Historical record protection: Sent notifications are immutable and cannot be modified.',
      };
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) {
      if (!input.title.trim()) {
        return { success: false, error: 'Title cannot be blank.' };
      }
      updatePayload.title = input.title.trim();
    }

    if (input.message !== undefined) {
      if (!input.message.trim()) {
        return { success: false, error: 'Message content cannot be blank.' };
      }
      updatePayload.message = input.message.trim();
    }

    if (input.type !== undefined) {
      updatePayload.type = input.type;
    }

    if (input.target_roles !== undefined) {
      updatePayload.target_roles = input.target_roles;
    }

    if (input.target_department !== undefined) {
      updatePayload.target_department =
        input.target_department && input.target_department !== 'all'
          ? input.target_department
          : null;
    }

    if (input.target_year !== undefined) {
      updatePayload.target_year = input.target_year || null;
    }

    if (input.target_section_id !== undefined) {
      updatePayload.target_section_id =
        input.target_section_id && input.target_section_id !== 'all'
          ? input.target_section_id
          : null;
    }

    if (input.scheduled_at !== undefined) {
      if (input.scheduled_at && input.scheduled_at.trim() !== '') {
        updatePayload.scheduled_at = new Date(input.scheduled_at).toISOString();
        if (existing.status !== 'cancelled') {
          updatePayload.status = 'scheduled';
        }
      } else {
        updatePayload.scheduled_at = null;
        if (existing.status === 'scheduled') {
          updatePayload.status = 'draft';
        }
      }
    }

    const { error: updateErr } = await supabase
      .from('notifications')
      .update(updatePayload)
      .eq('id', id);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    await logAudit(supabase, admin, 'NOTIFICATION_SCHEDULED_UPDATED', {
      notification_id: id,
      changes: updatePayload,
    });

    revalidatePath('/admin/notifications');
    revalidatePath(`/admin/notifications/${id}`);
    revalidatePath(`/admin/notifications/${id}/edit`);

    return { success: true, message: 'Notification successfully updated.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred.' };
  }
}

/**
 * Superadmin: Cancel a scheduled notification
 */
export async function cancelScheduledNotificationAction(
  id: string
): Promise<ActionResponse> {
  try {
    const admin = await requireSuperAdmin();
    const supabase: any = await createClient();

    const { data: existing, error: fetchErr } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return { success: false, error: 'Notification not found.' };
    }

    if (existing.status === 'sent') {
      return {
        success: false,
        error: 'Cannot cancel a notification that has already been dispatched.',
      };
    }

    const { error: updateErr } = await supabase
      .from('notifications')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    await logAudit(supabase, admin, 'NOTIFICATION_CANCELLED', {
      notification_id: id,
      previous_status: existing.status,
    });

    revalidatePath('/admin/notifications');
    revalidatePath(`/admin/notifications/${id}`);

    return { success: true, message: 'Scheduled notification has been cancelled.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred.' };
  }
}

/**
 * Superadmin: Delete a draft or cancelled notification
 */
export async function deleteNotificationAction(
  id: string
): Promise<ActionResponse> {
  try {
    const admin = await requireSuperAdmin();
    const supabase: any = await createClient();

    const { data: existing, error: fetchErr } = await supabase
      .from('notifications')
      .select('id, status, title')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return { success: false, error: 'Notification not found.' };
    }

    if (existing.status === 'sent') {
      return {
        success: false,
        error:
          'Sent notifications cannot be deleted in order to preserve historical and audit integrity.',
      };
    }

    const { error: delErr } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (delErr) {
      return { success: false, error: delErr.message };
    }

    await logAudit(supabase, admin, 'NOTIFICATION_DELETED', {
      notification_id: id,
      title: existing.title,
    });

    revalidatePath('/admin/notifications');

    return { success: true, message: 'Notification removed successfully.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred.' };
  }
}
