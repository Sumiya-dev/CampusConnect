'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '../auth/user';
import { createClient } from '../supabase/server';
import { SuperadminProfileActionResult } from '../types/superadmin-profile.types';

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
 * Internal audit logger for profile modifications
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
      target_user_id: admin.id,
      target_user_email: admin.email,
      details,
      status: 'success',
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Audit logging failed for superadmin profile:', err);
  }
}

/**
 * Update safe profile fields: Name, Phone, Avatar
 * Explicitly guards against role tampering, email modification, or privilege escalation.
 */
export async function updateSuperadminSafeProfileAction(
  formData: FormData
): Promise<SuperadminProfileActionResult> {
  try {
    const admin = await requireSuperAdmin();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');
    const cookieStore = await cookies();

    const name = (formData.get('name') as string)?.trim();
    const contactNumber = (formData.get('contactNumber') as string)?.trim() || null;
    const avatarUrl = (formData.get('avatarUrl') as string)?.trim() || null;

    // Strict validations
    if (!name || name.length < 2) {
      return { success: false, error: 'Full name must contain at least 2 characters.' };
    }
    if (name.length > 100) {
      return { success: false, error: 'Full name must not exceed 100 characters.' };
    }

    if (contactNumber && contactNumber.length > 25) {
      return { success: false, error: 'Contact number must not exceed 25 characters.' };
    }

    if (avatarUrl && avatarUrl.length > 3 * 1024 * 1024) {
      return { success: false, error: 'Avatar image payload is too large. Please use an image under 2MB.' };
    }

    if (isLiveSupabase) {
      const supabase: any = await createClient();

      // Only update safe fields on profiles table for the authenticated user's own ID
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name,
          contact_number: contactNumber,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', admin.id);

      if (profileError) {
        console.error('Superadmin profile update error:', profileError);
        return { success: false, error: profileError.message || 'Failed to update profile.' };
      }

      // Record audit event
      await logAudit(supabase, admin, 'UPDATE_SUPERADMIN_PROFILE', {
        updatedFields: {
          name,
          contactNumber: contactNumber ? 'updated' : 'cleared',
          avatarUrl: avatarUrl ? 'updated' : 'cleared',
        },
      });
    } else {
      // Local demo mode persistence
      cookieStore.set('campusconnect_demo_name', name, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
      cookieStore.set('campusconnect_demo_contact', contactNumber || '', { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
      cookieStore.set('campusconnect_demo_avatar', avatarUrl || '', { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    }

    revalidatePath('/superadmin/profile');
    revalidatePath('/profile');
    revalidatePath('/admin');

    return {
      success: true,
      message: 'Superadmin profile updated successfully.',
    };
  } catch (err: any) {
    console.error('updateSuperadminSafeProfileAction error:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred while saving profile changes.',
    };
  }
}

/**
 * Secure password change using Supabase Auth updateUser API
 */
export async function updateSuperadminPasswordAction(
  formData: FormData
): Promise<SuperadminProfileActionResult> {
  try {
    const admin = await requireSuperAdmin();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

    const newPassword = (formData.get('newPassword') as string) || '';
    const confirmPassword = (formData.get('confirmPassword') as string) || '';

    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long.' };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: 'Password confirmation does not match new password.' };
    }

    if (isLiveSupabase) {
      const supabase: any = await createClient();

      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (authError) {
        console.error('Password update error:', authError);
        return { success: false, error: authError.message || 'Failed to update password.' };
      }

      await logAudit(supabase, admin, 'UPDATE_SUPERADMIN_PASSWORD', {
        method: 'supabase_auth_update_user',
      });
    }

    revalidatePath('/superadmin/profile');
    return {
      success: true,
      message: 'Password successfully updated. Please use your new password on subsequent logins.',
    };
  } catch (err: any) {
    console.error('updateSuperadminPasswordAction error:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred while updating password.',
    };
  }
}
