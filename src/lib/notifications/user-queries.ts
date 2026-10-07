import { createClient } from '../supabase/server';
import { getCurrentUser } from '../auth/user';

export interface UserInboxNotification {
  userNotificationId: string;
  isRead: boolean;
  readAt: string | null;
  deliveredAt: string;
  notificationId: string;
  title: string;
  message: string;
  type: string;
  sentAt: string | null;
}

/**
 * Fetch notifications delivered to the currently authenticated user
 */
export async function getUserDeliveredNotifications(): Promise<UserInboxNotification[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase: any = await createClient();

  const { data, error } = await supabase
    .from('user_notifications')
    .select(
      `
      id,
      is_read,
      read_at,
      created_at,
      notification:notifications!user_notifications_notification_id_fkey(
        id,
        title,
        message,
        type,
        status,
        sent_at
      )
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data
    .filter((row: any) => row.notification !== null)
    .map((row: any) => ({
      userNotificationId: row.id,
      isRead: row.is_read,
      readAt: row.read_at,
      deliveredAt: row.created_at,
      notificationId: row.notification.id,
      title: row.notification.title,
      message: row.notification.message,
      type: row.notification.type,
      sentAt: row.notification.sent_at,
    }));
}
