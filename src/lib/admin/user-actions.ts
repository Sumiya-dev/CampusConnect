'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '../auth/user';
import { AccountStatus, UserRole } from '../types/database.types';
import { ManagedUserSummary } from '../types/profile.types';
import {
  AdminAuditLogEntry,
  CreateUserFormData,
  EditUserFormData,
  UserManagementOverviewData,
} from '../types/admin-users.types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES: UserRole[] = ['student', 'faculty', 'placement_officer', 'administrator'];
const ALLOWED_STATUSES: AccountStatus[] = ['active', 'inactive', 'suspended', 'pending'];

/**
 * Strict server-side verification that the requester is an active Superadmin.
 */
async function verifySuperadminSession() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error('Authentication required: Active session not found.');
  }

  if (currentUser.role !== 'administrator') {
    throw new Error('Access denied: Privileged Superadmin authorization required.');
  }

  if (currentUser.accountStatus !== 'active') {
    throw new Error('Access denied: Account is suspended or inactive.');
  }

  return currentUser;
}

/**
 * Fetches users, audit trail, and department metadata for Superadmin User Management.
 */
export async function getSuperadminUsersOverviewAction(): Promise<{
  data?: UserManagementOverviewData;
  error?: string;
}> {
  try {
    const adminUser = await verifySuperadminSession();
    const supabase: any = await createClient();

    // 1. Fetch profiles
    const { data: profiles, error: profilesErr } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        email,
        role,
        department,
        contact_number,
        account_status,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (profilesErr) {
      return { error: 'Failed to retrieve user directory: ' + profilesErr.message };
    }

    // 2. Fetch supplemental role tables
    const [
      { data: students },
      { data: faculty },
      { data: placement },
      { data: admins },
      { data: auditLogs },
      { data: depts },
    ] = await Promise.all([
      supabase.from('students').select('*'),
      supabase.from('faculty_members').select('*'),
      supabase.from('placement_officers').select('*'),
      supabase.from('administrators').select('*'),
      supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('departments').select('name').order('name'),
    ]);

    const studentMap = new Map<string, any>((students || []).map((s: any) => [s.user_id, s]));
    const facultyMap = new Map<string, any>((faculty || []).map((f: any) => [f.user_id, f]));
    const placementMap = new Map<string, any>((placement || []).map((p: any) => [p.user_id, p]));
    const adminMap = new Map<string, any>((admins || []).map((a: any) => [a.user_id, a]));

    let activeAdminCount = 0;

    const managedUsers: ManagedUserSummary[] = (profiles || []).map((p: any) => {
      if (p.role === 'administrator' && p.account_status === 'active') {
        activeAdminCount += 1;
      }

      let identifier = 'ID-2026';
      let year: number | undefined;
      let cgpa: number | undefined;
      let skills: string[] | undefined;
      let placementStatus = undefined;
      let designation: string | undefined;
      let location: string | null | undefined;

      if (p.role === 'student') {
        const st = studentMap.get(p.id);
        identifier = st?.student_id || 'STU-' + p.id.slice(0, 6);
        year = st?.year;
        cgpa = st?.cgpa ? Number(st.cgpa) : undefined;
        skills = st?.skills;
        placementStatus = st?.placement_status;
      } else if (p.role === 'faculty') {
        const f = facultyMap.get(p.id);
        identifier = f?.employee_id || 'FAC-' + p.id.slice(0, 6);
        designation = f?.designation;
        location = f?.cabin_location;
      } else if (p.role === 'placement_officer') {
        const po = placementMap.get(p.id);
        identifier = po?.employee_id || 'TPO-' + p.id.slice(0, 6);
        designation = po?.designation;
        location = po?.office_location;
      } else if (p.role === 'administrator') {
        const ad = adminMap.get(p.id);
        identifier = ad?.admin_code || 'ADM-' + p.id.slice(0, 6);
      }

      return {
        id: p.id,
        name: p.name,
        email: p.email,
        role: p.role,
        department: p.department,
        contactNumber: p.contact_number,
        accountStatus: p.account_status,
        identifier,
        year,
        cgpa,
        skills,
        placementStatus,
        designation,
        location,
        createdAt: p.created_at,
      };
    });

    const departmentList = (depts || []).map((d: any) => d.name);
    if (!departmentList.includes('Central Administration')) {
      departmentList.unshift('Central Administration');
    }

    return {
      data: {
        users: managedUsers,
        auditLogs: (auditLogs || []) as AdminAuditLogEntry[],
        departments: departmentList,
        currentUserAdminId: adminUser.id,
        totalActiveAdmins: activeAdminCount,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { error: msg };
  }
}

/**
 * Creates a new user with verified role and database-level provisioning.
 */
export async function createUserByAdminAction(formData: CreateUserFormData): Promise<{
  success: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    const adminUser = await verifySuperadminSession();

    // Input Validation
    const name = (formData.name || '').trim();
    if (!name || name.length < 2) {
      return { success: false, error: 'Full name must be at least 2 characters.' };
    }

    const email = (formData.email || '').toLowerCase().trim();
    if (!email || !EMAIL_REGEX.test(email)) {
      return { success: false, error: 'Please enter a valid institutional email address.' };
    }

    const password = formData.password || '';
    if (!password || password.length < 8) {
      return { success: false, error: 'Temporary password must be at least 8 characters.' };
    }

    if (!ALLOWED_ROLES.includes(formData.role)) {
      return { success: false, error: 'Invalid user role selected.' };
    }

    const department = (formData.department || '').trim();
    if (!department) {
      return { success: false, error: 'Department is required.' };
    }

    const supabase: any = await createClient();

    // Call stored procedure
    const { data: newUserId, error: rpcErr } = await supabase.rpc('admin_provision_user', {
      p_email: email,
      p_password: password,
      p_name: name,
      p_role: formData.role,
      p_department: department,
      p_contact_number: formData.contactNumber?.trim() || null,
      p_extra_data: {
        identifier: formData.identifier?.trim(),
        cgpa: formData.cgpa,
        year: formData.year,
        designation: formData.designation?.trim(),
        cabin_location: formData.cabinLocation?.trim(),
        office_location: formData.officeLocation?.trim(),
        admin_code: formData.adminCode?.trim(),
        access_level: formData.accessLevel?.trim() || 'superadmin',
      },
    });

    if (rpcErr) {
      return { success: false, error: rpcErr.message || 'Failed to provision user.' };
    }

    revalidatePath('/admin/users');
    return { success: true, userId: newUserId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server authorization failure.';
    return { success: false, error: msg };
  }
}

/**
 * Updates basic user information and role-specific metadata.
 */
export async function editUserByAdminAction(formData: EditUserFormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const adminUser = await verifySuperadminSession();

    const name = (formData.name || '').trim();
    if (!name || name.length < 2) {
      return { success: false, error: 'Full name must be at least 2 characters.' };
    }

    const department = (formData.department || '').trim();
    if (!department) {
      return { success: false, error: 'Department is required.' };
    }

    const supabase: any = await createClient();

    // 1. Fetch current profile
    const { data: profile, error: fetchErr } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', formData.id)
      .single();

    if (fetchErr || !profile) {
      return { success: false, error: 'User record not found.' };
    }

    // 2. Update profile
    const { error: updateProfErr } = await supabase
      .from('profiles')
      .update({
        name,
        department,
        contact_number: formData.contactNumber?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', formData.id);

    if (updateProfErr) {
      return { success: false, error: updateProfErr.message };
    }

    // 3. Update role-specific table
    if (profile.role === 'student') {
      await supabase
        .from('students')
        .update({
          department,
          student_id: formData.identifier?.trim(),
          cgpa: formData.cgpa,
          year: formData.year,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', formData.id);
    } else if (profile.role === 'faculty') {
      await supabase
        .from('faculty_members')
        .update({
          department,
          employee_id: formData.identifier?.trim(),
          designation: formData.designation?.trim(),
          cabin_location: formData.cabinLocation?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', formData.id);
    } else if (profile.role === 'placement_officer') {
      await supabase
        .from('placement_officers')
        .update({
          employee_id: formData.identifier?.trim(),
          designation: formData.designation?.trim(),
          office_location: formData.officeLocation?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', formData.id);
    }

    // 4. Log Audit Trail
    await supabase.from('admin_audit_logs').insert({
      actor_id: adminUser.id,
      actor_email: adminUser.email,
      action: 'user_updated',
      target_user_id: formData.id,
      target_user_email: profile.email,
      details: {
        updated_fields: ['name', 'department', 'contact_number', 'identifier'],
      },
      status: 'success',
      created_at: new Date().toISOString(),
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server authorization failure.';
    return { success: false, error: msg };
  }
}

/**
 * Changes a user's role with atomic Last-Superadmin safeguards.
 */
export async function changeUserRoleAction(
  targetUserId: string,
  newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminUser = await verifySuperadminSession();

    if (!ALLOWED_ROLES.includes(newRole)) {
      return { success: false, error: 'Invalid target role.' };
    }

    const supabase: any = await createClient();

    // Call stored procedure which contains atomic last active admin check
    const { data: success, error: rpcErr } = await supabase.rpc('admin_change_user_role', {
      p_target_user_id: targetUserId,
      p_new_role: newRole,
    });

    if (rpcErr) {
      return { success: false, error: rpcErr.message || 'Failed to modify user role.' };
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server authorization failure.';
    return { success: false, error: msg };
  }
}

/**
 * Changes a user's account status (active, inactive, suspended) with Last-Superadmin safeguards.
 */
export async function changeUserStatusAction(
  targetUserId: string,
  newStatus: AccountStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminUser = await verifySuperadminSession();

    if (!ALLOWED_STATUSES.includes(newStatus)) {
      return { success: false, error: 'Invalid account status.' };
    }

    const supabase: any = await createClient();

    // Call stored procedure which contains atomic last active admin check
    const { data: success, error: rpcErr } = await supabase.rpc('admin_change_user_status', {
      p_target_user_id: targetUserId,
      p_new_status: newStatus,
    });

    if (rpcErr) {
      return { success: false, error: rpcErr.message || 'Failed to update account status.' };
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server authorization failure.';
    return { success: false, error: msg };
  }
}

/**
 * Safely deletes or deactivates a user depending on historic institutional dependencies.
 */
export async function safeDeleteUserAction(
  targetUserId: string,
  forceHardDelete: boolean = false
): Promise<{
  success: boolean;
  action?: 'soft_deleted' | 'hard_deleted';
  message?: string;
  error?: string;
}> {
  try {
    const adminUser = await verifySuperadminSession();

    const supabase: any = await createClient();

    const { data: result, error: rpcErr } = await supabase.rpc('admin_safe_delete_user', {
      p_target_user_id: targetUserId,
      p_force_hard_delete: forceHardDelete,
    });

    if (rpcErr) {
      return { success: false, error: rpcErr.message || 'Failed to delete user.' };
    }

    revalidatePath('/admin/users');
    return {
      success: true,
      action: result?.action,
      message: result?.message,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server authorization failure.';
    return { success: false, error: msg };
  }
}
