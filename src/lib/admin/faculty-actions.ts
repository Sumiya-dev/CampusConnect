'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '../auth/user';
import { AccountStatus } from '../types/database.types';
import {
  AssignClassSectionFormData,
  AssignTrainingGroupFormData,
  CreateFacultyFormData,
  EditFacultyFormData,
  FacultyClassAssignmentDetail,
  FacultyManagementOverviewData,
  FacultyMemberDetail,
  FacultyTrainingAssignmentDetail,
} from '../types/faculty-allocations.types';

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
 * Audit logger helper for faculty management operations.
 */
async function logAudit(
  supabase: any,
  adminUser: { id: string; email: string },
  action: string,
  targetUserId: string | null,
  targetUserEmail: string | null,
  details: Record<string, unknown>
) {
  try {
    await supabase.from('admin_audit_logs').insert({
      actor_id: adminUser.id,
      actor_email: adminUser.email,
      action,
      target_user_id: targetUserId,
      target_user_email: targetUserEmail,
      details,
      status: 'success',
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Audit logging failed:', err);
  }
}

/**
 * Fetches all faculty profiles, their class allocations, training group allocations,
 * and academic master lookup tables.
 */
export async function getFacultyManagementOverviewAction(): Promise<{
  data?: FacultyManagementOverviewData;
  error?: string;
}> {
  try {
    await verifySuperadminSession();
    const supabase: any = await createClient();

    // 1. Fetch all faculty members joined with their user profiles
    const { data: facultyRows, error: facErr } = await supabase
      .from('faculty_members')
      .select(`
        id,
        user_id,
        employee_id,
        department,
        designation,
        cabin_location,
        created_at,
        profiles (
          id,
          name,
          email,
          contact_number,
          account_status
        )
      `)
      .order('created_at', { ascending: false });

    if (facErr) throw facErr;

    // 2. Fetch class assignments with section, program, and department info
    const { data: classAssignRows, error: caErr } = await supabase
      .from('faculty_class_assignments')
      .select(`
        id,
        faculty_id,
        section_id,
        created_at,
        academic_sections (
          id,
          section_name,
          year,
          academic_year,
          programs (
            id,
            name,
            code,
            departments (
              name,
              code
            )
          )
        )
      `);

    if (caErr) throw caErr;

    // 3. Fetch training group assignments with group info
    const { data: trainAssignRows, error: taErr } = await supabase
      .from('faculty_training_assignments')
      .select(`
        id,
        faculty_id,
        training_group_id,
        created_at,
        training_groups (
          id,
          name,
          description
        )
      `);

    if (taErr) throw taErr;

    // 4. Fetch counts: students per section, students per training group, sessions per faculty
    const [
      { data: studentEnrollments },
      { data: trainingEnrollments },
      { data: sessionRows },
      { data: depts },
      { data: progs },
      { data: secs },
      { data: tgs },
    ] = await Promise.all([
      supabase.from('student_academic_enrollments').select('section_id'),
      supabase.from('student_training_enrollments').select('training_group_id'),
      supabase.from('class_sessions').select('faculty_id'),
      supabase.from('departments').select('id, name, code').eq('status', 'active').order('name'),
      supabase.from('programs').select('id, department_id, name, code, departments(code)').eq('status', 'active').order('name'),
      supabase.from('academic_sections').select('id, program_id, section_name, year, academic_year, programs(code, departments(code))').eq('status', 'active').order('year').order('section_name'),
      supabase.from('training_groups').select('id, name, description').eq('status', 'active').order('name'),
    ]);

    const studentsBySection: Record<string, number> = {};
    (studentEnrollments || []).forEach((e: any) => {
      studentsBySection[e.section_id] = (studentsBySection[e.section_id] || 0) + 1;
    });

    const studentsByGroup: Record<string, number> = {};
    (trainingEnrollments || []).forEach((te: any) => {
      studentsByGroup[te.training_group_id] = (studentsByGroup[te.training_group_id] || 0) + 1;
    });

    const sessionsByFaculty: Record<string, number> = {};
    (sessionRows || []).forEach((s: any) => {
      sessionsByFaculty[s.faculty_id] = (sessionsByFaculty[s.faculty_id] || 0) + 1;
    });

    // Group class assignments by faculty_id
    const classAssignByFac: Record<string, FacultyClassAssignmentDetail[]> = {};
    (classAssignRows || []).forEach((r: any) => {
      const sec = r.academic_sections;
      const prog = sec?.programs;
      const dept = prog?.departments;
      const sCount = studentsBySection[r.section_id] || 0;

      const detail: FacultyClassAssignmentDetail = {
        id: r.id,
        faculty_id: r.faculty_id,
        section_id: r.section_id,
        section_name: sec?.section_name || 'Section',
        year: sec?.year || 4,
        academic_year: sec?.academic_year || '2025-2026',
        program_id: prog?.id || '',
        program_name: prog?.name || 'Program',
        program_code: prog?.code || '',
        department_name: dept?.name || 'Department',
        department_code: dept?.code || '',
        students_count: sCount,
        created_at: r.created_at,
      };

      if (!classAssignByFac[r.faculty_id]) {
        classAssignByFac[r.faculty_id] = [];
      }
      classAssignByFac[r.faculty_id].push(detail);
    });

    // Group training assignments by faculty_id
    const trainAssignByFac: Record<string, FacultyTrainingAssignmentDetail[]> = {};
    (trainAssignRows || []).forEach((r: any) => {
      const tg = r.training_groups;
      const sCount = studentsByGroup[r.training_group_id] || 0;

      const detail: FacultyTrainingAssignmentDetail = {
        id: r.id,
        faculty_id: r.faculty_id,
        training_group_id: r.training_group_id,
        training_group_name: tg?.name || 'Training Group',
        description: tg?.description || null,
        students_count: sCount,
        created_at: r.created_at,
      };

      if (!trainAssignByFac[r.faculty_id]) {
        trainAssignByFac[r.faculty_id] = [];
      }
      trainAssignByFac[r.faculty_id].push(detail);
    });

    // Build complete faculty list
    const facultyList: FacultyMemberDetail[] = (facultyRows || []).map((fm: any) => {
      const prof = fm.profiles;
      const cAssignments = classAssignByFac[fm.id] || [];
      const tAssignments = trainAssignByFac[fm.id] || [];

      // Calculate total student reach (sum of enrolled students in assigned sections and groups)
      const sectionStudents = cAssignments.reduce((sum, a) => sum + a.students_count, 0);
      const trainingStudents = tAssignments.reduce((sum, a) => sum + a.students_count, 0);

      return {
        id: fm.id,
        user_id: fm.user_id,
        name: prof?.name || 'Faculty Member',
        email: prof?.email || '',
        employee_id: fm.employee_id,
        department: fm.department,
        designation: fm.designation,
        cabin_location: fm.cabin_location,
        contact_number: prof?.contact_number || null,
        account_status: (prof?.account_status as AccountStatus) || 'active',
        created_at: fm.created_at,
        class_assignments: cAssignments,
        training_assignments: tAssignments,
        total_sessions_count: sessionsByFaculty[fm.id] || 0,
        total_students_reach: sectionStudents + trainingStudents,
      };
    });

    // Format lookup data
    const formattedPrograms = (progs || []).map((p: any) => ({
      id: p.id,
      department_id: p.department_id,
      name: p.name,
      code: p.code,
      department_code: p.departments?.code,
    }));

    const formattedSections = (secs || []).map((s: any) => ({
      id: s.id,
      program_id: s.program_id,
      section_name: s.section_name,
      year: s.year,
      academic_year: s.academic_year,
      department_code: s.programs?.departments?.code,
      program_code: s.programs?.code,
    }));

    return {
      data: {
        facultyList,
        departments: depts || [],
        programs: formattedPrograms,
        sections: formattedSections,
        trainingGroups: tgs || [],
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve faculty overview.';
    return { error: msg };
  }
}

/**
 * Creates a new faculty account with profile, role metadata, and employee ID.
 */
export async function createFacultyAction(formData: CreateFacultyFormData): Promise<{
  success: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    const adminUser = await verifySuperadminSession();

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const department = formData.department.trim();
    const designation = formData.designation.trim();
    const employee_id = formData.employee_id.trim();

    if (!name || !email || !password || !department || !designation || !employee_id) {
      return { success: false, error: 'Name, email, password, department, designation, and employee ID are required.' };
    }

    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters.' };
    }

    const supabase: any = await createClient();

    // Call stored procedure
    const { data: newUserId, error: rpcErr } = await supabase.rpc('admin_provision_user', {
      p_email: email,
      p_password: password,
      p_name: name,
      p_role: 'faculty',
      p_department: department,
      p_contact_number: formData.contact_number?.trim() || null,
      p_extra_data: {
        identifier: employee_id,
        designation,
        cabin_location: formData.cabin_location?.trim() || null,
      },
    });

    if (rpcErr) {
      return { success: false, error: rpcErr.message || 'Failed to provision faculty user.' };
    }

    await logAudit(supabase, adminUser, 'faculty_member_created', newUserId, email, {
      name,
      department,
      designation,
      employee_id,
    });

    revalidatePath('/admin/faculty');
    return { success: true, userId: newUserId };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

/**
 * Updates basic faculty details, employee ID, designation, and location.
 */
export async function updateFacultyAction(formData: EditFacultyFormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const adminUser = await verifySuperadminSession();

    const name = formData.name.trim();
    const department = formData.department.trim();
    const designation = formData.designation.trim();
    const employee_id = formData.employee_id.trim();

    if (!name || !department || !designation || !employee_id) {
      return { success: false, error: 'Name, department, designation, and employee ID are required.' };
    }

    const supabase: any = await createClient();

    // 1. Update profiles table
    const { error: profErr } = await supabase
      .from('profiles')
      .update({
        name,
        department,
        contact_number: formData.contact_number?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', formData.user_id);

    if (profErr) return { success: false, error: profErr.message };

    // 2. Update faculty_members table
    const { error: facErr } = await supabase
      .from('faculty_members')
      .update({
        employee_id,
        department,
        designation,
        cabin_location: formData.cabin_location?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', formData.faculty_id);

    if (facErr) {
      if (facErr.code === '23505') {
        return { success: false, error: 'Another faculty member with this employee ID already exists.' };
      }
      return { success: false, error: facErr.message };
    }

    await logAudit(supabase, adminUser, 'faculty_member_updated', formData.user_id, null, {
      faculty_id: formData.faculty_id,
      name,
      department,
      designation,
      employee_id,
    });

    revalidatePath('/admin/faculty');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

/**
 * Activates or deactivates a faculty member account.
 */
export async function toggleFacultyStatusAction(
  userId: string,
  newStatus: AccountStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminUser = await verifySuperadminSession();
    const supabase: any = await createClient();

    const { error } = await supabase
      .from('profiles')
      .update({
        account_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) return { success: false, error: error.message };

    await logAudit(supabase, adminUser, 'faculty_status_changed', userId, null, {
      new_status: newStatus,
    });

    revalidatePath('/admin/faculty');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

/**
 * Safely deletes or deactivates a faculty member depending on active institutional dependencies.
 */
export async function safeDeleteFacultyAction(
  facultyId: string,
  userId: string,
  forceDeactivateIfBlocked: boolean = false
): Promise<{
  success: boolean;
  blocked?: boolean;
  actionTaken?: 'deleted' | 'deactivated';
  reason?: string;
  error?: string;
}> {
  try {
    const adminUser = await verifySuperadminSession();
    const supabase: any = await createClient();

    // 1. Dependency checks: class assignments, training assignments, sessions, resources, announcements
    const [
      { count: classCount },
      { count: trainCount },
      { count: sessionCount },
      { count: resCount },
      { count: annCount },
      { data: profData },
    ] = await Promise.all([
      supabase.from('faculty_class_assignments').select('id', { count: 'exact', head: true }).eq('faculty_id', facultyId),
      supabase.from('faculty_training_assignments').select('id', { count: 'exact', head: true }).eq('faculty_id', facultyId),
      supabase.from('class_sessions').select('id', { count: 'exact', head: true }).eq('faculty_id', facultyId),
      supabase.from('faculty_resources').select('id', { count: 'exact', head: true }).eq('faculty_id', facultyId),
      supabase.from('faculty_announcements').select('id', { count: 'exact', head: true }).eq('faculty_id', facultyId),
      supabase.from('profiles').select('email, name').eq('id', userId).single(),
    ]);

    const totalDeps = (classCount || 0) + (trainCount || 0) + (sessionCount || 0) + (resCount || 0) + (annCount || 0);

    if (totalDeps > 0) {
      if (forceDeactivateIfBlocked) {
        // Safe deactivation
        const { error: deactErr } = await supabase
          .from('profiles')
          .update({ account_status: 'inactive', updated_at: new Date().toISOString() })
          .eq('id', userId);

        if (deactErr) return { success: false, error: deactErr.message };

        await logAudit(supabase, adminUser, 'faculty_deactivated_safely', userId, profData?.email, {
          faculty_id: facultyId,
          dependencies: {
            class_assignments: classCount || 0,
            training_assignments: trainCount || 0,
            class_sessions: sessionCount || 0,
            resources: resCount || 0,
            announcements: annCount || 0,
          },
        });

        revalidatePath('/admin/faculty');
        return {
          success: true,
          actionTaken: 'deactivated',
          reason: `Faculty has ${classCount || 0} class section(s), ${trainCount || 0} training group(s), and ${sessionCount || 0} scheduled session(s). Safely deactivated account to protect historical records.`,
        };
      }

      return {
        success: false,
        blocked: true,
        reason: `Cannot permanently delete: This faculty member has active allocations (${classCount || 0} class sections, ${trainCount || 0} training groups, ${sessionCount || 0} sessions, ${resCount || 0} resources). Please deactivate their account instead.`,
      };
    }

    // Safe to delete completely
    const { error: delFacErr } = await supabase.from('faculty_members').delete().eq('id', facultyId);
    if (delFacErr) return { success: false, error: delFacErr.message };

    const { error: delProfErr } = await supabase.from('profiles').delete().eq('id', userId);
    if (delProfErr) return { success: false, error: delProfErr.message };

    // Delete auth user via RPC or direct admin call if available
    try {
      await supabase.rpc('admin_safe_delete_user', {
        p_target_user_id: userId,
        p_force_hard_delete: true,
      });
    } catch {
      // Ignored if handled
    }

    await logAudit(supabase, adminUser, 'faculty_deleted', userId, profData?.email, {
      faculty_id: facultyId,
      name: profData?.name,
    });

    revalidatePath('/admin/faculty');
    return { success: true, actionTaken: 'deleted' };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

/* ========================================================================= */
/* ALLOCATION MANAGEMENT SERVER ACTIONS                                      */
/* ========================================================================= */

/**
 * Assigns a faculty member to an academic class section.
 * Validates against duplicate allocations.
 */
export async function assignFacultyToSectionAction(formData: AssignClassSectionFormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const adminUser = await verifySuperadminSession();
    const supabase: any = await createClient();

    if (!formData.faculty_id || !formData.section_id) {
      return { success: false, error: 'Faculty ID and Section ID are required.' };
    }

    // 1. Check for duplicate assignment
    const { data: existing } = await supabase
      .from('faculty_class_assignments')
      .select('id')
      .eq('faculty_id', formData.faculty_id)
      .eq('section_id', formData.section_id)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'This faculty member is already allocated to this section.' };
    }

    // 2. Insert allocation
    const { data: created, error: insertErr } = await supabase
      .from('faculty_class_assignments')
      .insert({
        faculty_id: formData.faculty_id,
        section_id: formData.section_id,
      })
      .select(`
        id,
        academic_sections (
          section_name,
          year,
          programs (code, departments(code))
        )
      `)
      .single();

    if (insertErr) {
      if (insertErr.code === '23505') {
        return { success: false, error: 'This faculty member is already allocated to this section.' };
      }
      return { success: false, error: insertErr.message };
    }

    await logAudit(supabase, adminUser, 'faculty_class_allocated', null, null, {
      allocation_id: created?.id,
      faculty_id: formData.faculty_id,
      section_id: formData.section_id,
      section_info: created?.academic_sections,
    });

    revalidatePath('/admin/faculty');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

/**
 * Removes a faculty member's allocation from an academic class section.
 */
export async function removeFacultyFromSectionAction(assignmentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const adminUser = await verifySuperadminSession();
    const supabase: any = await createClient();

    // Check if assignment exists
    const { data: assignment, error: fetchErr } = await supabase
      .from('faculty_class_assignments')
      .select('id, faculty_id, section_id')
      .eq('id', assignmentId)
      .single();

    if (fetchErr || !assignment) {
      return { success: false, error: 'Class allocation record not found.' };
    }

    // Delete allocation
    const { error: delErr } = await supabase
      .from('faculty_class_assignments')
      .delete()
      .eq('id', assignmentId);

    if (delErr) return { success: false, error: delErr.message };

    await logAudit(supabase, adminUser, 'faculty_class_deallocated', null, null, {
      allocation_id: assignmentId,
      faculty_id: assignment.faculty_id,
      section_id: assignment.section_id,
    });

    revalidatePath('/admin/faculty');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

/**
 * Assigns a faculty member to a specialized training group (e.g. Java, Python).
 * Validates against duplicate allocations.
 */
export async function assignFacultyToTrainingGroupAction(formData: AssignTrainingGroupFormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const adminUser = await verifySuperadminSession();
    const supabase: any = await createClient();

    if (!formData.faculty_id || !formData.training_group_id) {
      return { success: false, error: 'Faculty ID and Training Group ID are required.' };
    }

    // 1. Check for duplicate assignment
    const { data: existing } = await supabase
      .from('faculty_training_assignments')
      .select('id')
      .eq('faculty_id', formData.faculty_id)
      .eq('training_group_id', formData.training_group_id)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'This faculty member is already mentor/instructor for this training group.' };
    }

    // 2. Insert allocation
    const { data: created, error: insertErr } = await supabase
      .from('faculty_training_assignments')
      .insert({
        faculty_id: formData.faculty_id,
        training_group_id: formData.training_group_id,
      })
      .select(`
        id,
        training_groups (name)
      `)
      .single();

    if (insertErr) {
      if (insertErr.code === '23505') {
        return { success: false, error: 'This faculty member is already mentor/instructor for this training group.' };
      }
      return { success: false, error: insertErr.message };
    }

    await logAudit(supabase, adminUser, 'faculty_training_allocated', null, null, {
      allocation_id: created?.id,
      faculty_id: formData.faculty_id,
      training_group_id: formData.training_group_id,
      training_group_name: created?.training_groups?.name,
    });

    revalidatePath('/admin/faculty');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

/**
 * Removes a faculty member's allocation from a specialized training group.
 */
export async function removeFacultyFromTrainingGroupAction(assignmentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const adminUser = await verifySuperadminSession();
    const supabase: any = await createClient();

    // Check if assignment exists
    const { data: assignment, error: fetchErr } = await supabase
      .from('faculty_training_assignments')
      .select('id, faculty_id, training_group_id')
      .eq('id', assignmentId)
      .single();

    if (fetchErr || !assignment) {
      return { success: false, error: 'Training allocation record not found.' };
    }

    // Delete allocation
    const { error: delErr } = await supabase
      .from('faculty_training_assignments')
      .delete()
      .eq('id', assignmentId);

    if (delErr) return { success: false, error: delErr.message };

    await logAudit(supabase, adminUser, 'faculty_training_deallocated', null, null, {
      allocation_id: assignmentId,
      faculty_id: assignment.faculty_id,
      training_group_id: assignment.training_group_id,
    });

    revalidatePath('/admin/faculty');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}
