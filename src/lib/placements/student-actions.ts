'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '../supabase/server';
import { getCurrentUser } from '../auth/user';
import { ApplicationStatus, PlacementStatus } from '../types/database.types';
import { StudentPlacementActionState } from '../types/student-placement.types';

/**
 * Superadmin authorization validator
 */
async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    throw new Error('Unauthorized: Superadmin privileges required.');
  }
  return user;
}

/**
 * Log privileged administrative action in admin_audit_logs
 */
async function logAudit(
  supabase: any,
  user: { id: string; email: string },
  action: string,
  details: Record<string, unknown>
) {
  try {
    await supabase.from('admin_audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
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
 * Superadmin: Update overall student placement status (unplaced, placed, opted_out, in_process)
 */
export async function updateStudentPlacementStatusAction(
  studentId: string,
  newStatus: PlacementStatus,
  notes?: string
): Promise<StudentPlacementActionState> {
  try {
    const user = await requireSuperAdmin();
    const supabase: any = await createClient();

    const validStatuses: PlacementStatus[] = ['unplaced', 'placed', 'opted_out', 'in_process'];
    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: `Invalid placement status: ${newStatus}` };
    }

    const { data: student, error: fetchErr } = await supabase
      .from('students')
      .select('id, user_id, placement_status, student_id')
      .eq('id', studentId)
      .single();

    if (fetchErr || !student) {
      return { success: false, error: 'Student record not found.' };
    }

    const previousStatus = student.placement_status;

    const { error: updateErr } = await supabase
      .from('students')
      .update({
        placement_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', studentId);

    if (updateErr) {
      return { success: false, error: `Failed to update placement status: ${updateErr.message}` };
    }

    await logAudit(supabase, user, 'UPDATE_STUDENT_PLACEMENT_STATUS', {
      student_id: studentId,
      student_roll_number: student.student_id,
      previous_status: previousStatus,
      new_status: newStatus,
      notes: notes || null,
    });

    revalidatePath('/admin/placements/students');
    revalidatePath(`/admin/placements/students/${studentId}`);
    revalidatePath('/admin/placements');

    return {
      success: true,
      message: `Placement status updated to "${newStatus.replace('_', ' ').toUpperCase()}" successfully.`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

/**
 * Superadmin: Update a student's drive application status with stage progression and historical preservation
 */
export async function updateStudentApplicationStatusAction(
  applicationId: string,
  newStatus: ApplicationStatus,
  notes?: string,
  interviewDate?: string,
  interviewVenue?: string
): Promise<StudentPlacementActionState> {
  try {
    const user = await requireSuperAdmin();
    const supabase: any = await createClient();

    const validStatuses: ApplicationStatus[] = [
      'applied',
      'shortlisted',
      'interview',
      'rejected',
      'selected',
      'placed',
      'withdrawn',
    ];

    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: `Invalid application status: ${newStatus}` };
    }

    const { data: app, error: fetchErr } = await supabase
      .from('applications')
      .select('id, student_id, drive_id, status, notes, interview_date, interview_venue, shortlisted_at')
      .eq('id', applicationId)
      .single();

    if (fetchErr || !app) {
      return { success: false, error: 'Application record not found.' };
    }

    const previousStatus = app.status;

    const updatePayload: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (notes !== undefined && notes.trim() !== '') {
      updatePayload.notes = notes.trim();
    }

    if (newStatus === 'shortlisted' && !app.shortlisted_at) {
      updatePayload.shortlisted_at = new Date().toISOString();
    }

    if (newStatus === 'interview') {
      if (interviewDate) updatePayload.interview_date = interviewDate;
      if (interviewVenue) updatePayload.interview_venue = interviewVenue;
    }

    const { error: updateErr } = await supabase
      .from('applications')
      .update(updatePayload)
      .eq('id', applicationId);

    if (updateErr) {
      return { success: false, error: `Failed to update application status: ${updateErr.message}` };
    }

    // Explicitly record history if trigger wasn't triggered
    // Trigger `trigger_application_history_sync` handles it automatically in PostgreSQL

    await logAudit(supabase, user, 'UPDATE_STUDENT_APPLICATION_STATUS', {
      application_id: applicationId,
      student_id: app.student_id,
      drive_id: app.drive_id,
      previous_status: previousStatus,
      new_status: newStatus,
      notes: notes || null,
      interview_date: interviewDate || null,
      interview_venue: interviewVenue || null,
    });

    revalidatePath('/admin/placements/students');
    revalidatePath(`/admin/placements/students/${app.student_id}`);
    revalidatePath(`/admin/placements/${app.drive_id}`);
    revalidatePath('/admin/placements');

    return {
      success: true,
      message: `Candidate application status advanced to "${newStatus.toUpperCase()}" successfully.`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

/**
 * Superadmin: Register a student for a placement drive (duplicate applications prevented)
 */
export async function adminRegisterStudentForDriveAction(
  studentId: string,
  driveId: string,
  notes?: string
): Promise<StudentPlacementActionState> {
  try {
    const user = await requireSuperAdmin();
    const supabase: any = await createClient();

    // 1. Check existing application to prevent duplicates
    const { data: existingApp } = await supabase
      .from('applications')
      .select('id, status')
      .eq('student_id', studentId)
      .eq('drive_id', driveId)
      .maybeSingle();

    if (existingApp) {
      return {
        success: false,
        error: `Candidate is already registered for this drive (Current status: ${existingApp.status.toUpperCase()}). Duplicate applications are prohibited.`,
      };
    }

    // 2. Validate drive exists and is not cancelled
    const { data: drive, error: driveErr } = await supabase
      .from('placement_drives')
      .select('id, job_role, status, company:companies(company_name)')
      .eq('id', driveId)
      .single();

    if (driveErr || !drive) {
      return { success: false, error: 'Target placement drive not found.' };
    }

    if (drive.status === 'cancelled') {
      return { success: false, error: 'Cannot register student for a cancelled placement drive.' };
    }

    // 3. Create application
    const { data: newApp, error: insertErr } = await supabase
      .from('applications')
      .insert({
        student_id: studentId,
        drive_id: driveId,
        status: 'applied',
        notes: notes || 'Nominated/Registered by Administrator',
        applied_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertErr) {
      return { success: false, error: `Failed to register student: ${insertErr.message}` };
    }

    await logAudit(supabase, user, 'ADMIN_REGISTER_STUDENT_DRIVE', {
      student_id: studentId,
      drive_id: driveId,
      application_id: newApp?.id,
      notes: notes || null,
    });

    revalidatePath('/admin/placements/students');
    revalidatePath(`/admin/placements/students/${studentId}`);
    revalidatePath(`/admin/placements/${driveId}`);
    revalidatePath('/admin/placements');

    return {
      success: true,
      message: `Candidate registered for ${drive.job_role} successfully.`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}
