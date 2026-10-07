'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '../auth/user';
import { createClient } from '../supabase/server';

/**
 * Mark a user notification as read
 */
export async function markNotificationAsReadAction(userNotificationId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const supabase: any = await createClient();

    const { error } = await supabase
      .from('user_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', userNotificationId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/student/notifications');
    revalidatePath('/faculty/notifications');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error' };
  }
}
