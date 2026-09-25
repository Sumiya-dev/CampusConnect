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
