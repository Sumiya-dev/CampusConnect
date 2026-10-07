'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '../supabase/server';
import { getCurrentUser, getFullUserProfile } from '../auth/user';
import { ApplyActionState } from '../types/drive.types';
import { StudentProfileData } from '../types/profile.types';
import { getPlacementDriveById } from './queries';
import { evaluateEligibility } from './eligibility';

export async function applyForDriveAction(driveId: string): Promise<ApplyActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Authentication required. Please log in to submit your application.' };
  }

  if (user.role !== 'student') {
    return { success: false, error: 'Unauthorized: Only registered students can apply for placement drives.' };
  }

  // 1. Fetch Drive
  const drive = await getPlacementDriveById(driveId);
  if (!drive) {
    return { success: false, error: 'Placement drive not found or no longer available.' };
  }

  // 2. Check Drive Status & Deadline
  if (drive.status !== 'open') {
    return { success: false, error: 'Registrations for this placement drive are currently closed.' };
  }

  const deadlinePassed = new Date(drive.registration_deadline).getTime() < Date.now();
  if (deadlinePassed) {
    return { success: false, error: 'Application cutoff deadline has passed for this drive.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');
  const cookieStore = await cookies();

  const fullProfile = await getFullUserProfile();
  const student = fullProfile?.role === 'student' ? (fullProfile as StudentProfileData) : null;

  let studentRecordId: string = user.id;
  let studentProfile = {
    cgpa: student ? Number(student.cgpa) : 8.75,
    department: student?.department || user.department,
    year: student ? Number(student.year) : 3,
    skills: student?.skills || ['Data Structures & Algorithms', 'TypeScript'],
  };

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();
      const { data: s } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!s) {
        return { success: false, error: 'Student academic record not found in institutional database. Please complete your profile.' };
      }

      studentRecordId = s.id;
      studentProfile = {
        cgpa: Number(s.cgpa) || 0,
        department: s.department || user.department,
        year: Number(s.year) || 3,
        skills: Array.isArray(s.skills) ? s.skills : [],
      };
    } catch {
      return { success: false, error: 'Failed to verify student record with institutional database.' };
    }
  }

  // 3. Evaluate Eligibility
  const eligibility = evaluateEligibility(studentProfile, drive);
  if (!eligibility.isEligible) {
    return {
      success: false,
      error: `You are not eligible for this drive: ${eligibility.reasons.join(' ')}`,
    };
  }

  // 4. Duplicate Check & Insertion
  let generatedAppId = `app-${Date.now()}`;

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();

      // Check existing application
      const { data: existingApp } = await supabase
        .from('applications')
        .select('id, status')
        .eq('student_id', studentRecordId)
        .eq('drive_id', driveId)
        .maybeSingle();

      if (existingApp) {
        return {
          success: false,
          error: 'You have already submitted an application for this drive. Check "My Applications" to track your status.',
        };
      }

      const { data: newApp, error: insertErr } = await supabase
        .from('applications')
        .insert({
          student_id: studentRecordId,
          drive_id: driveId,
          status: 'applied',
        })
        .select('id')
        .single();

      if (insertErr) {
        if (insertErr.code === '23505') {
          return { success: false, error: 'You have already applied for this placement drive.' };
        }
        return { success: false, error: insertErr.message || 'Database error creating application.' };
      }

      if (newApp?.id) {
        generatedAppId = newApp.id;
      }
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Failed to submit application to database.' };
    }
  } else {
    // Demo mode storage
    const demoAppsCookie = cookieStore.get('campusconnect_demo_applications')?.value;
    let list: any[] = [];
    if (demoAppsCookie) {
      try {
        const parsed = JSON.parse(demoAppsCookie);
        if (Array.isArray(parsed)) list = parsed;
      } catch {
        list = [];
      }
    }

    const alreadyApplied = list.some(
      (a) =>
        a.drive_id === driveId &&
        (a.student_id === user.id ||
          a.student_id === 'demo-student-id' ||
          a.student_id === 'demo-user-id')
    );
    if (alreadyApplied) {
      return {
        success: false,
        error: 'You have already submitted an application for this placement drive.',
      };
    }

    list.unshift({
      id: generatedAppId,
      student_id: user.id,
      drive_id: driveId,
      status: 'applied',
      applied_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      drive,
    });

    cookieStore.set('campusconnect_demo_applications', JSON.stringify(list), {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  revalidatePath('/student/placements');
  revalidatePath(`/student/placements/${driveId}`);
  revalidatePath('/student/placements/applications');
  revalidatePath('/student');

  return {
    success: true,
    message: `Application submitted successfully for ${drive.job_role} at ${drive.company?.company_name || 'the recruiter'}.`,
    applicationId: generatedAppId,
  };
}

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
 * Superadmin: Create a new placement drive
 */
export async function createPlacementDriveAction(
  prevState: unknown,
  formData: FormData
): Promise<import('../types/drive.types').DriveActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Authentication required. Please log in.' };
  }

  if (user.role !== 'administrator' && user.role !== 'placement_officer') {
    return { success: false, error: 'Unauthorized: Only Administrators and Placement Officers can create recruitment drives.' };
  }

  const company_id = (formData.get('company_id') as string)?.trim();
  const job_role = (formData.get('job_role') as string)?.trim();
  const package_details = (formData.get('package_details') as string)?.trim();
  const tier = (formData.get('tier') as string)?.trim() || 'Core Recruiter';
  const location = (formData.get('location') as string)?.trim() || null;
  const description = (formData.get('description') as string)?.trim() || null;
  const min_cgpa = Number(formData.get('min_cgpa')) || 6.0;
  const max_backlogs = Number(formData.get('max_backlogs')) || 0;
  const graduation_year = formData.get('graduation_year') ? Number(formData.get('graduation_year')) : null;
  const registration_deadline = (formData.get('registration_deadline') as string)?.trim();
  const drive_date = (formData.get('drive_date') as string)?.trim() || null;
  const drive_time = (formData.get('drive_time') as string)?.trim() || null;
  const venue = (formData.get('venue') as string)?.trim() || null;
  const vacancies = (formData.get('vacancies') as string)?.trim() || null;
  const bond_period = (formData.get('bond_period') as string)?.trim() || null;
  const status = (formData.get('status') as any) || 'open';
  const is_published = formData.get('is_published') === 'true' || formData.get('is_published') === 'on';

  // Array values
  const eligible_departments = (formData.getAll('eligible_departments') as string[])
    .map((s) => s.trim())
    .filter(Boolean);
  const eligible_programs = (formData.getAll('eligible_programs') as string[])
    .map((s) => s.trim())
    .filter(Boolean);
  const eligible_years = (formData.getAll('eligible_years') as string[])
    .map((s) => Number(s))
    .filter((n) => !isNaN(n) && n > 0);

  const rawSkills = (formData.get('required_skills') as string) || '';
  const required_skills = rawSkills
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const rawStages = (formData.get('recruitment_stages') as string) || '';
  const recruitment_stages = rawStages
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const rawInstructions = (formData.get('instructions') as string) || '';
  const instructions = rawInstructions
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const rawDocs = (formData.get('required_documents') as string) || '';
  const required_documents = rawDocs
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const fieldErrors: Record<string, string> = {};

  if (!company_id) {
    fieldErrors.company_id = 'Please select a recruiting company.';
  }
  if (!job_role || job_role.length < 2) {
    fieldErrors.job_role = 'Job role is required and must be at least 2 characters.';
  }
  if (!package_details) {
    fieldErrors.package_details = 'Compensation / Package details are required (e.g. ₹10.0 LPA).';
  }
  if (!registration_deadline) {
    fieldErrors.registration_deadline = 'Registration deadline is required.';
  } else {
    const deadlineTime = new Date(registration_deadline).getTime();
    if (isNaN(deadlineTime)) {
      fieldErrors.registration_deadline = 'Invalid registration deadline date.';
    } else if (drive_date) {
      const driveTime = new Date(drive_date).getTime();
      if (!isNaN(driveTime) && driveTime < deadlineTime) {
        fieldErrors.drive_date = 'Drive date cannot be earlier than the application registration deadline.';
      }
    }
  }

  if (min_cgpa < 0 || min_cgpa > 10) {
    fieldErrors.min_cgpa = 'CGPA threshold must be between 0.00 and 10.00.';
  }

  if (eligible_departments.length === 0) {
    fieldErrors.eligible_departments = 'Select at least one eligible academic department.';
  }

  if (eligible_years.length === 0) {
    fieldErrors.eligible_years = 'Select at least one eligible academic year.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, error: 'Please correct the highlighted validation errors.', fieldErrors };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  let generatedId = `drive-${Date.now()}`;

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();

      // Verify active company
      const { data: comp } = await supabase
        .from('companies')
        .select('id, status, company_name')
        .eq('id', company_id)
        .single();

      if (!comp || comp.status !== 'active') {
        return {
          success: false,
          error: 'The selected company is inactive or not found. Only active partner companies can host placement drives.',
          fieldErrors: { company_id: 'Selected company is not an active partner.' },
        };
      }

      const { data: newDrive, error: insertErr } = await supabase
        .from('placement_drives')
        .insert({
          company_id,
          job_role,
          package_details,
          tier,
          location,
          description,
          min_cgpa,
          eligible_departments,
          eligible_programs,
          eligible_years,
          graduation_year,
          max_backlogs,
          required_skills,
          recruitment_stages,
          registration_deadline: new Date(registration_deadline).toISOString(),
          drive_date: drive_date ? new Date(drive_date).toISOString() : null,
          drive_time,
          venue,
          instructions,
          required_documents,
          vacancies,
          bond_period,
          status,
          is_published,
          created_by: user.id !== 'demo-user-id' ? user.id : null,
        })
        .select('id')
        .single();

      if (insertErr) {
        return { success: false, error: insertErr.message || 'Database error occurred while creating drive.' };
      }

      if (newDrive?.id) {
        generatedId = newDrive.id;
      }

      await logAudit(supabase, user, 'CREATE_PLACEMENT_DRIVE', {
        drive_id: generatedId,
        company_id,
        company_name: comp.company_name,
        job_role,
        package_details,
        status,
        is_published,
      });
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Failed to connect to database.' };
    }
  }

  revalidatePath('/admin/placements');
  revalidatePath(`/admin/placements/${generatedId}`);
  revalidatePath('/placement/drives');
  revalidatePath('/student/placements');

  return {
    success: true,
    message: `Placement drive for "${job_role}" successfully scheduled and created.`,
    driveId: generatedId,
  };
}

/**
 * Superadmin: Update an existing placement drive
 */
export async function updatePlacementDriveAction(
  driveId: string,
  prevState: unknown,
  formData: FormData
): Promise<import('../types/drive.types').DriveActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Authentication required. Please log in.' };
  }

  if (user.role !== 'administrator' && user.role !== 'placement_officer') {
    return { success: false, error: 'Unauthorized: Only Administrators and Placement Officers can edit placement drives.' };
  }

  const company_id = (formData.get('company_id') as string)?.trim();
  const job_role = (formData.get('job_role') as string)?.trim();
  const package_details = (formData.get('package_details') as string)?.trim();
  const tier = (formData.get('tier') as string)?.trim() || 'Core Recruiter';
  const location = (formData.get('location') as string)?.trim() || null;
  const description = (formData.get('description') as string)?.trim() || null;
  const min_cgpa = Number(formData.get('min_cgpa')) || 6.0;
  const max_backlogs = Number(formData.get('max_backlogs')) || 0;
  const graduation_year = formData.get('graduation_year') ? Number(formData.get('graduation_year')) : null;
  const registration_deadline = (formData.get('registration_deadline') as string)?.trim();
  const drive_date = (formData.get('drive_date') as string)?.trim() || null;
  const drive_time = (formData.get('drive_time') as string)?.trim() || null;
  const venue = (formData.get('venue') as string)?.trim() || null;
  const vacancies = (formData.get('vacancies') as string)?.trim() || null;
  const bond_period = (formData.get('bond_period') as string)?.trim() || null;
  const status = (formData.get('status') as any) || 'open';
  const is_published = formData.get('is_published') === 'true' || formData.get('is_published') === 'on';

  const eligible_departments = (formData.getAll('eligible_departments') as string[])
    .map((s) => s.trim())
    .filter(Boolean);
  const eligible_programs = (formData.getAll('eligible_programs') as string[])
    .map((s) => s.trim())
    .filter(Boolean);
  const eligible_years = (formData.getAll('eligible_years') as string[])
    .map((s) => Number(s))
    .filter((n) => !isNaN(n) && n > 0);

  const rawSkills = (formData.get('required_skills') as string) || '';
  const required_skills = rawSkills
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const rawStages = (formData.get('recruitment_stages') as string) || '';
  const recruitment_stages = rawStages
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const rawInstructions = (formData.get('instructions') as string) || '';
  const instructions = rawInstructions
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const rawDocs = (formData.get('required_documents') as string) || '';
  const required_documents = rawDocs
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const fieldErrors: Record<string, string> = {};

  if (!company_id) {
    fieldErrors.company_id = 'Please select a recruiting company.';
  }
  if (!job_role || job_role.length < 2) {
    fieldErrors.job_role = 'Job role is required and must be at least 2 characters.';
  }
  if (!package_details) {
    fieldErrors.package_details = 'Compensation details are required.';
  }
  if (!registration_deadline) {
    fieldErrors.registration_deadline = 'Registration deadline is required.';
  } else {
    const deadlineTime = new Date(registration_deadline).getTime();
    if (isNaN(deadlineTime)) {
      fieldErrors.registration_deadline = 'Invalid registration deadline date.';
    } else if (drive_date) {
      const driveTime = new Date(drive_date).getTime();
      if (!isNaN(driveTime) && driveTime < deadlineTime) {
        fieldErrors.drive_date = 'Drive date cannot be earlier than the application registration deadline.';
      }
    }
  }

  if (min_cgpa < 0 || min_cgpa > 10) {
    fieldErrors.min_cgpa = 'CGPA threshold must be between 0.00 and 10.00.';
  }

  if (eligible_departments.length === 0) {
    fieldErrors.eligible_departments = 'Select at least one eligible academic department.';
  }

  if (eligible_years.length === 0) {
    fieldErrors.eligible_years = 'Select at least one eligible academic year.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, error: 'Please correct the highlighted validation errors.', fieldErrors };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();

      const { error: updateErr } = await supabase
        .from('placement_drives')
        .update({
          company_id,
          job_role,
          package_details,
          tier,
          location,
          description,
          min_cgpa,
          eligible_departments,
          eligible_programs,
          eligible_years,
          graduation_year,
          max_backlogs,
          required_skills,
          recruitment_stages,
          registration_deadline: new Date(registration_deadline).toISOString(),
          drive_date: drive_date ? new Date(drive_date).toISOString() : null,
          drive_time,
          venue,
          instructions,
          required_documents,
          vacancies,
          bond_period,
          status,
          is_published,
          updated_at: new Date().toISOString(),
        })
        .eq('id', driveId);

      if (updateErr) {
        return { success: false, error: updateErr.message || 'Database error occurred while updating drive.' };
      }

      await logAudit(supabase, user, 'UPDATE_PLACEMENT_DRIVE', {
        drive_id: driveId,
        company_id,
        job_role,
        package_details,
        status,
        is_published,
      });
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Failed to connect to database.' };
    }
  }

  revalidatePath('/admin/placements');
  revalidatePath(`/admin/placements/${driveId}`);
  revalidatePath(`/admin/placements/${driveId}/edit`);
  revalidatePath('/placement/drives');
  revalidatePath(`/student/placements/${driveId}`);

  return {
    success: true,
    message: `Placement drive "${job_role}" details successfully updated.`,
    driveId,
  };
}

/**
 * Superadmin: Toggle published state of a placement drive
 */
export async function toggleDrivePublishedAction(
  driveId: string,
  isPublished: boolean
): Promise<import('../types/drive.types').DriveActionState> {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'administrator' && user.role !== 'placement_officer')) {
    return { success: false, error: 'Unauthorized: Only Administrators can publish/unpublish placement drives.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();
      const { error } = await supabase
        .from('placement_drives')
        .update({
          is_published: isPublished,
          updated_at: new Date().toISOString(),
        })
        .eq('id', driveId);

      if (error) {
        return { success: false, error: error.message || 'Database error updating published state.' };
      }

      await logAudit(supabase, user, isPublished ? 'PUBLISH_PLACEMENT_DRIVE' : 'UNPUBLISH_PLACEMENT_DRIVE', {
        drive_id: driveId,
        is_published: isPublished,
      });
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Failed to update drive publish status.' };
    }
  }

  revalidatePath('/admin/placements');
  revalidatePath(`/admin/placements/${driveId}`);
  revalidatePath('/placement/drives');
  revalidatePath('/student/placements');

  return {
    success: true,
    message: isPublished ? 'Placement drive has been published for students.' : 'Placement drive has been unpublished (hidden from students).',
    driveId,
  };
}

/**
 * Superadmin: Postpone or reschedule drive dates, venue and time
 */
export async function rescheduleDriveAction(
  driveId: string,
  newDeadline: string,
  newDriveDate: string | null,
  newDriveTime: string | null,
  newVenue: string | null
): Promise<import('../types/drive.types').DriveActionState> {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'administrator' && user.role !== 'placement_officer')) {
    return { success: false, error: 'Unauthorized: Only Administrators can reschedule placement drives.' };
  }

  const deadlineTime = new Date(newDeadline).getTime();
  if (isNaN(deadlineTime)) {
    return { success: false, error: 'Invalid registration deadline specified.' };
  }

  if (newDriveDate) {
    const driveTime = new Date(newDriveDate).getTime();
    if (!isNaN(driveTime) && driveTime < deadlineTime) {
      return { success: false, error: 'Drive date cannot be earlier than the application registration deadline.' };
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();
      const { error } = await supabase
        .from('placement_drives')
        .update({
          registration_deadline: new Date(newDeadline).toISOString(),
          drive_date: newDriveDate ? new Date(newDriveDate).toISOString() : null,
          drive_time: newDriveTime,
          venue: newVenue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', driveId);

      if (error) {
        return { success: false, error: error.message || 'Database error rescheduling drive.' };
      }

      await logAudit(supabase, user, 'RESCHEDULE_PLACEMENT_DRIVE', {
        drive_id: driveId,
        new_deadline: newDeadline,
        new_drive_date: newDriveDate,
        new_drive_time: newDriveTime,
        new_venue: newVenue,
      });
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Failed to reschedule drive.' };
    }
  }

  revalidatePath('/admin/placements');
  revalidatePath(`/admin/placements/${driveId}`);
  revalidatePath('/placement/drives');
  revalidatePath(`/student/placements/${driveId}`);

  return {
    success: true,
    message: 'Placement drive schedule and venue updated successfully.',
    driveId,
  };
}

/**
 * Superadmin: Update status (open, in_progress, completed, cancelled, archived)
 */
export async function updateDriveStatusAction(
  driveId: string,
  targetStatus: import('../types/database.types').DriveStatus,
  reason?: string
): Promise<import('../types/drive.types').DriveActionState> {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'administrator' && user.role !== 'placement_officer')) {
    return { success: false, error: 'Unauthorized: Only Administrators can change drive status.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();
      const { error } = await supabase
        .from('placement_drives')
        .update({
          status: targetStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', driveId);

      if (error) {
        return { success: false, error: error.message || 'Database error updating drive status.' };
      }

      await logAudit(supabase, user, 'UPDATE_DRIVE_STATUS', {
        drive_id: driveId,
        target_status: targetStatus,
        reason,
      });
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Failed to update drive status.' };
    }
  }

  revalidatePath('/admin/placements');
  revalidatePath(`/admin/placements/${driveId}`);
  revalidatePath('/placement/drives');
  revalidatePath('/student/placements');

  return {
    success: true,
    message: `Drive status changed to ${targetStatus.replace('_', ' ')}.`,
    driveId,
  };
}

/**
 * Superadmin: Safely delete placement drive or block if applications exist
 */
export async function deletePlacementDriveAction(
  driveId: string,
  forceCancelIfBlocked: boolean = false
): Promise<import('../types/drive.types').DeleteDriveResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    return { success: false, error: 'Unauthorized: Only Superadmins can permanently delete or manage drive decommissioning.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();

      // Check existing applications
      const { count } = await supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .eq('drive_id', driveId);

      const applicationsCount = count || 0;

      if (applicationsCount > 0) {
        if (!forceCancelIfBlocked) {
          return {
            success: false,
            blocked: true,
            reason: `Permanent deletion blocked: This placement drive has ${applicationsCount} registered student application(s) and evaluation history. To preserve academic compliance and audit logs, please cancel or archive the drive instead.`,
          };
        }

        // Force cancel / archive safely
        const { error: cancelErr } = await supabase
          .from('placement_drives')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', driveId);

        if (cancelErr) {
          return { success: false, error: cancelErr.message || 'Failed to cancel drive.' };
        }

        await logAudit(supabase, user, 'CANCEL_DRIVE_BLOCKED_DELETE', {
          drive_id: driveId,
          applications_count: applicationsCount,
          reason: 'Hard delete blocked by active applications; cancelled instead.',
        });

        revalidatePath('/admin/placements');
        revalidatePath(`/admin/placements/${driveId}`);
        revalidatePath('/placement/drives');

        return {
          success: true,
          actionTaken: 'cancelled',
          reason: `Drive cancelled safely. Student records and ${applicationsCount} applications preserved.`,
        };
      }

      // Safe to permanently delete (0 applications)
      const { error: deleteErr } = await supabase
        .from('placement_drives')
        .delete()
        .eq('id', driveId);

      if (deleteErr) {
        return { success: false, error: deleteErr.message || 'Failed to permanently delete drive.' };
      }

      await logAudit(supabase, user, 'DELETE_PLACEMENT_DRIVE', {
        drive_id: driveId,
      });

      revalidatePath('/admin/placements');
      revalidatePath('/placement/drives');

      return {
        success: true,
        actionTaken: 'deleted',
        reason: 'Placement drive permanently deleted from institutional database.',
      };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Server error occurred during drive deletion.' };
    }
  }

  revalidatePath('/admin/placements');
  return {
    success: true,
    actionTaken: 'deleted',
    reason: 'Drive deleted from demo store.',
  };
}

/**
 * Superadmin / Placement Officer: Update student application status for a drive
 */
export async function updateApplicationStatusAction(
  applicationId: string,
  targetStatus: import('../types/database.types').ApplicationStatus,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'administrator' && user.role !== 'placement_officer')) {
    return { success: false, error: 'Unauthorized: Only Administrators and Placement Officers can update applicant stage.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();

      const updatePayload: Record<string, any> = {
        status: targetStatus,
        updated_at: new Date().toISOString(),
      };

      if (notes !== undefined) {
        updatePayload.notes = notes;
      }

      if (targetStatus === 'shortlisted') {
        updatePayload.shortlisted_at = new Date().toISOString();
      }

      const { data: updatedApp, error } = await supabase
        .from('applications')
        .update(updatePayload)
        .eq('id', applicationId)
        .select('drive_id, student_id')
        .single();

      if (error) {
        return { success: false, error: error.message || 'Database error updating application status.' };
      }

      // If placed, update student placement status
      if (targetStatus === 'placed' && updatedApp?.student_id) {
        await supabase
          .from('students')
          .update({ placement_status: 'placed', updated_at: new Date().toISOString() })
          .eq('id', updatedApp.student_id);
      }

      await logAudit(supabase, user, 'UPDATE_APPLICATION_STATUS', {
        application_id: applicationId,
        drive_id: updatedApp?.drive_id,
        target_status: targetStatus,
      });

      if (updatedApp?.drive_id) {
        revalidatePath(`/admin/placements/${updatedApp.drive_id}`);
        revalidatePath(`/placement/drives/${updatedApp.drive_id}`);
      }
      revalidatePath('/admin/placements');
      revalidatePath('/student/placements');

      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Failed to update application.' };
    }
  }

  return { success: true };
}

