import { createClient } from '../supabase/server';
import {
  AdminNotification,
  NotificationDashboardStats,
  NotificationFilterOptions,
  NotificationRecipientRecord,
  TargetStructureOptions,
} from '../types/notification.types';

/**
 * Fetch all administrative notifications with optional filters and stats
 */
export async function getAdminNotifications(
  filters: NotificationFilterOptions = {}
): Promise<AdminNotification[]> {
  const supabase: any = await createClient();

  let query = supabase
    .from('notifications')
    .select(
      `
      id,
      title,
      message,
      type,
      target_roles,
      target_department,
      target_year,
      target_section_id,
      scheduled_at,
      sent_at,
      status,
      created_by,
      created_at,
      updated_at,
      target_section:academic_sections(
        id,
        section_name,
        year,
        academic_year,
        program:programs(
          code,
          name
        )
      ),
      created_by_profile:profiles!notifications_created_by_fkey(
        id,
        name,
        email
      )
    `
    )
    .order('created_at', { ascending: false });

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.type && filters.type !== 'all') {
    query = query.eq('type', filters.type);
  }

  if (filters.target_role && filters.target_role !== 'all') {
    query = query.contains('target_roles', [filters.target_role]);
  }

  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }

  if (filters.date_to) {
    query = query.lte('created_at', `${filters.date_to}T23:59:59.999Z`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching admin notifications:', error);
    return [];
  }

  // Get recipient counts & read counts for notifications in this batch
  const notificationIds = (data || []).map((n: any) => n.id);
  let countsMap: Record<string, { recipients: number; reads: number }> = {};

  if (notificationIds.length > 0) {
    const { data: recData, error: recError } = await supabase
      .from('user_notifications')
      .select('notification_id, is_read')
      .in('notification_id', notificationIds);

    if (!recError && recData) {
      recData.forEach((r: any) => {
        if (!countsMap[r.notification_id]) {
          countsMap[r.notification_id] = { recipients: 0, reads: 0 };
        }
        countsMap[r.notification_id].recipients++;
        if (r.is_read) {
          countsMap[r.notification_id].reads++;
        }
      });
    }
  }

  let results: AdminNotification[] = (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    target_roles: row.target_roles || [],
    target_department: row.target_department,
    target_year: row.target_year,
    target_section_id: row.target_section_id,
    target_section: row.target_section,
    scheduled_at: row.scheduled_at,
    sent_at: row.sent_at,
    status: row.status,
    created_by: row.created_by,
    created_by_profile: row.created_by_profile,
    created_at: row.created_at,
    updated_at: row.updated_at,
    recipient_count: countsMap[row.id]?.recipients || 0,
    read_count: countsMap[row.id]?.reads || 0,
  }));

  if (filters.search && filters.search.trim() !== '') {
    const term = filters.search.toLowerCase().trim();
    results = results.filter(
      (n) =>
        n.title.toLowerCase().includes(term) ||
        n.message.toLowerCase().includes(term) ||
        (n.target_department && n.target_department.toLowerCase().includes(term))
    );
  }

  return results;
}

/**
 * Get single notification detail
 */
export async function getNotificationDetail(
  id: string
): Promise<AdminNotification | null> {
  const supabase: any = await createClient();

  const { data, error } = await supabase
    .from('notifications')
    .select(
      `
      id,
      title,
      message,
      type,
      target_roles,
      target_department,
      target_year,
      target_section_id,
      scheduled_at,
      sent_at,
      status,
      created_by,
      created_at,
      updated_at,
      target_section:academic_sections(
        id,
        section_name,
        year,
        academic_year,
        program:programs(
          code,
          name
        )
      ),
      created_by_profile:profiles!notifications_created_by_fkey(
        id,
        name,
        email
      )
    `
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching notification detail:', error);
    return null;
  }

  // Count recipients & reads
  const { data: recData } = await supabase
    .from('user_notifications')
    .select('id, is_read')
    .eq('notification_id', id);

  const recipientCount = recData?.length || 0;
  const readCount = recData?.filter((r: any) => r.is_read).length || 0;

  return {
    id: data.id,
    title: data.title,
    message: data.message,
    type: data.type,
    target_roles: data.target_roles || [],
    target_department: data.target_department,
    target_year: data.target_year,
    target_section_id: data.target_section_id,
    target_section: (data as any).target_section,
    scheduled_at: data.scheduled_at,
    sent_at: data.sent_at,
    status: data.status,
    created_by: data.created_by,
    created_by_profile: (data as any).created_by_profile,
    created_at: data.created_at,
    updated_at: data.updated_at,
    recipient_count: recipientCount,
    read_count: readCount,
  };
}

/**
 * Get delivery recipient logs for a notification
 */
export async function getNotificationRecipients(
  notificationId: string
): Promise<NotificationRecipientRecord[]> {
  const supabase: any = await createClient();

  const { data, error } = await supabase
    .from('user_notifications')
    .select(
      `
      id,
      notification_id,
      user_id,
      is_read,
      read_at,
      created_at,
      user:profiles!user_notifications_user_id_fkey(
        id,
        name,
        email,
        role,
        department
      )
    `
    )
    .eq('notification_id', notificationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching notification recipients:', error);
    return [];
  }

  return (data || []).map((r: any) => ({
    id: r.id,
    notification_id: r.notification_id,
    user_id: r.user_id,
    is_read: r.is_read,
    read_at: r.read_at,
    created_at: r.created_at,
    user: r.user,
  }));
}

/**
 * Get high-level notification dashboard stats
 */
export async function getNotificationDashboardStats(): Promise<NotificationDashboardStats> {
  const supabase: any = await createClient();

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('id, status');

  if (error || !notifications) {
    return {
      total: 0,
      sent: 0,
      scheduled: 0,
      draft: 0,
      cancelled: 0,
      totalDelivered: 0,
      totalRead: 0,
    };
  }

  let sent = 0;
  let scheduled = 0;
  let draft = 0;
  let cancelled = 0;

  notifications.forEach((n: any) => {
    if (n.status === 'sent') sent++;
    else if (n.status === 'scheduled') scheduled++;
    else if (n.status === 'draft') draft++;
    else if (n.status === 'cancelled') cancelled++;
  });

  const { count: totalDelivered } = await supabase
    .from('user_notifications')
    .select('id', { count: 'exact', head: true });

  const { count: totalRead } = await supabase
    .from('user_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', true);

  return {
    total: notifications.length,
    sent,
    scheduled,
    draft,
    cancelled,
    totalDelivered: totalDelivered || 0,
    totalRead: totalRead || 0,
  };
}

/**
 * Get target structure options (departments, academic years, sections)
 */
export async function getTargetStructureOptions(): Promise<TargetStructureOptions> {
  const supabase: any = await createClient();

  const [deptsRes, yearsRes, sectionsRes] = await Promise.all([
    supabase
      .from('departments')
      .select('id, name, code')
      .eq('status', 'active')
      .order('name'),
    supabase
      .from('academic_years')
      .select('id, year_number, display_name')
      .eq('status', 'active')
      .order('year_number'),
    supabase
      .from('academic_sections')
      .select(
        `
        id,
        section_name,
        year,
        academic_year,
        program:programs(
          name,
          code,
          department_id
        )
      `
      )
      .eq('status', 'active')
      .order('year')
      .order('section_name'),
  ]);

  return {
    departments: deptsRes.data || [],
    academicYears: yearsRes.data || [],
    sections: (sectionsRes.data as any) || [],
  };
}
