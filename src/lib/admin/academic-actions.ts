'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '../auth/user';
import {
  AcademicStructureOverviewData,
  AcademicYearFormData,
  AcademicYearItem,
  DepartmentFormData,
  DepartmentItem,
  EntityStatus,
  ProgramFormData,
  ProgramItem,
  SectionFormData,
  SectionItem,
  TrainingGroupFormData,
  TrainingGroupItem,
} from '../types/academic-structure.types';

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
 * Internal audit logger helper.
 */
async function logAudit(
  supabase: any,
  adminUser: { id: string; email: string },
  action: string,
  details: Record<string, unknown>
) {
  try {
    await supabase.from('admin_audit_logs').insert({
      actor_id: adminUser.id,
      actor_email: adminUser.email,
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
 * Fetches complete academic structure overview with related dependency counts.
 */
export async function getAcademicStructureOverviewAction(): Promise<{
  data?: AcademicStructureOverviewData;
  error?: string;
}> {
  try {
    await verifySuperadminSession();
    const supabase: any = await createClient();

    // 1. Fetch Departments
    const { data: deptRows, error: deptErr } = await supabase
      .from('departments')
      .select('id, name, code, status, created_at')
      .order('name', { ascending: true });

    if (deptErr) throw deptErr;

    // 2. Fetch Programs with Department info
    const { data: progRows, error: progErr } = await supabase
      .from('programs')
      .select(`
        id,
        department_id,
        name,
        code,
        status,
        created_at,
        departments (
          name,
          code
        )
      `)
      .order('name', { ascending: true });

    if (progErr) throw progErr;

    // 3. Fetch Academic Years
    const { data: yearRows, error: yearErr } = await supabase
      .from('academic_years')
      .select('id, year_number, display_name, current_academic_calendar, status, created_at, updated_at')
      .order('year_number', { ascending: true });

    if (yearErr) throw yearErr;

    // 4. Fetch Sections with Program & Department info
    const { data: secRows, error: secErr } = await supabase
      .from('academic_sections')
      .select(`
        id,
        program_id,
        academic_year,
        year,
        semester,
        section_name,
        status,
        created_at,
        programs (
          name,
          code,
          department_id,
          departments (
            name,
            code
          )
        )
      `)
      .order('year', { ascending: true })
      .order('section_name', { ascending: true });

    if (secErr) throw secErr;

    // 5. Fetch Training Groups
    const { data: groupRows, error: groupErr } = await supabase
      .from('training_groups')
      .select('id, name, description, status, created_at')
      .order('name', { ascending: true });

    if (groupErr) throw groupErr;

    // 6. Fetch aggregation counts for safe UI badges
    const [
      { data: studentEnrollments },
      { data: facultyClassAssignments },
      { data: trainingEnrollments },
      { data: facultyTrainingAssignments },
      { data: studentCountsByDept },
      { data: facultyCountsByDept },
    ] = await Promise.all([
      supabase.from('student_academic_enrollments').select('section_id'),
      supabase.from('faculty_class_assignments').select('section_id'),
      supabase.from('student_training_enrollments').select('training_group_id'),
      supabase.from('faculty_training_assignments').select('training_group_id'),
      supabase.from('students').select('department'),
      supabase.from('faculty_members').select('department'),
    ]);

    // Section counts per program
    const sectionsCountByProgram: Record<string, number> = {};
    const sectionsCountByYear: Record<number, number> = {};
    (secRows || []).forEach((s: any) => {
      sectionsCountByProgram[s.program_id] = (sectionsCountByProgram[s.program_id] || 0) + 1;
      sectionsCountByYear[s.year] = (sectionsCountByYear[s.year] || 0) + 1;
    });

    // Program counts per department
    const programsCountByDept: Record<string, number> = {};
    (progRows || []).forEach((p: any) => {
      programsCountByDept[p.department_id] = (programsCountByDept[p.department_id] || 0) + 1;
    });

    // Student / Faculty counts per department (match by code or name)
    const studentsByDept: Record<string, number> = {};
    (studentCountsByDept || []).forEach((s: any) => {
      if (s.department) {
        studentsByDept[s.department.toLowerCase()] = (studentsByDept[s.department.toLowerCase()] || 0) + 1;
      }
    });

    const facultyByDept: Record<string, number> = {};
    (facultyCountsByDept || []).forEach((f: any) => {
      if (f.department) {
        facultyByDept[f.department.toLowerCase()] = (facultyByDept[f.department.toLowerCase()] || 0) + 1;
      }
    });

    // Section students & faculty counts
    const studentsBySection: Record<string, number> = {};
    (studentEnrollments || []).forEach((e: any) => {
      studentsBySection[e.section_id] = (studentsBySection[e.section_id] || 0) + 1;
    });

    const facultyBySection: Record<string, number> = {};
    (facultyClassAssignments || []).forEach((a: any) => {
      facultyBySection[a.section_id] = (facultyBySection[a.section_id] || 0) + 1;
    });

    // Training group counts
    const studentsByTrainingGroup: Record<string, number> = {};
    (trainingEnrollments || []).forEach((te: any) => {
      studentsByTrainingGroup[te.training_group_id] = (studentsByTrainingGroup[te.training_group_id] || 0) + 1;
    });

    const facultyByTrainingGroup: Record<string, number> = {};
    (facultyTrainingAssignments || []).forEach((ta: any) => {
      facultyByTrainingGroup[ta.training_group_id] = (facultyByTrainingGroup[ta.training_group_id] || 0) + 1;
    });

    // Format Departments
    const departments: DepartmentItem[] = (deptRows || []).map((d: any) => {
      const codeKey = (d.code || '').toLowerCase();
      const nameKey = (d.name || '').toLowerCase();
      const studentsCount = (studentsByDept[codeKey] || 0) + (studentsByDept[nameKey] || 0);
      const facultyCount = (facultyByDept[codeKey] || 0) + (facultyByDept[nameKey] || 0);

      return {
        id: d.id,
        name: d.name,
        code: d.code,
        status: (d.status as EntityStatus) || 'active',
        created_at: d.created_at,
        programs_count: programsCountByDept[d.id] || 0,
        students_count: studentsCount,
        faculty_count: facultyCount,
      };
    });

    // Format Programs
    const programs: ProgramItem[] = (progRows || []).map((p: any) => ({
      id: p.id,
      department_id: p.department_id,
      name: p.name,
      code: p.code,
      status: (p.status as EntityStatus) || 'active',
      created_at: p.created_at,
      department_name: p.departments?.name,
      department_code: p.departments?.code,
      sections_count: sectionsCountByProgram[p.id] || 0,
    }));

    // Format Academic Years
    const academicYears: AcademicYearItem[] = (yearRows || []).map((y: any) => ({
      id: y.id,
      year_number: y.year_number,
      display_name: y.display_name,
      current_academic_calendar: y.current_academic_calendar,
      status: (y.status as EntityStatus) || 'active',
      created_at: y.created_at,
      updated_at: y.updated_at,
      sections_count: sectionsCountByYear[y.year_number] || 0,
    }));

    // Format Sections
    const sections: SectionItem[] = (secRows || []).map((s: any) => ({
      id: s.id,
      program_id: s.program_id,
      academic_year: s.academic_year,
      year: s.year,
      semester: s.semester,
      section_name: s.section_name,
      status: (s.status as EntityStatus) || 'active',
      created_at: s.created_at,
      program_name: s.programs?.name,
      program_code: s.programs?.code,
      department_id: s.programs?.department_id,
      department_name: s.programs?.departments?.name,
      department_code: s.programs?.departments?.code,
      students_count: studentsBySection[s.id] || 0,
      faculty_count: facultyBySection[s.id] || 0,
    }));

    // Format Training Groups
    const trainingGroups: TrainingGroupItem[] = (groupRows || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      status: (g.status as EntityStatus) || 'active',
      created_at: g.created_at,
      students_count: studentsByTrainingGroup[g.id] || 0,
      faculty_count: facultyByTrainingGroup[g.id] || 0,
    }));

    return {
      data: {
        departments,
        programs,
        academicYears,
        sections,
        trainingGroups,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve academic structure.';
    return { error: msg };
  }
}

/* ========================================================================= */
/* 1. DEPARTMENTS CRUD                                                       */
/* ========================================================================= */

export async function createDepartmentAction(formData: DepartmentFormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const adminUser = await verifySuperadminSession();
    const supabase: any = await createClient();

    const name = formData.name.trim();
    const code = formData.code.trim().toUpperCase();

    if (!name || !code) {
      return { success: false, error: 'Department name and code are required.' };
    }

    const { data: created, error } = await supabase
      .from('departments')
      .insert({
        name,
        code,
        status: formData.status || 'active',
      })
      .select('id, name, code')
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'A department with this name or code already exists.' };
      }
      return { success: false, error: error.message };
    }

    await logAudit(supabase, adminUser, 'department_created', {
      department_id: created.id,
      name: created.name,
      code: created.code,
    });

    revalidatePath('/admin/departments');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

export async function updateDepartmentAction(formData: DepartmentFormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const adminUser = await verifySuperadminSession();
    if (!formData.id) return { success: false, error: 'Department ID required.' };

    const supabase: any = await createClient();
    const name = formData.name.trim();
    const code = formData.code.trim().toUpperCase();

    if (!name || !code) {
      return { success: false, error: 'Department name and code are required.' };
    }

    const { error } = await supabase
      .from('departments')
      .update({
        name,
        code,
        status: formData.status,
      })
      .eq('id', formData.id);

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'A department with this name or code already exists.' };
      }
      return { success: false, error: error.message };
    }

    await logAudit(supabase, adminUser, 'department_updated', {
      department_id: formData.id,
      name,
      code,
      status: formData.status,
    });

    revalidatePath('/admin/departments');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

export async function toggleDepartmentStatusAction(
  id: string,
  newStatus: EntityStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminUser = await verifySuperadminSession();
    const supabase: any = await createClient();

    const { error } = await supabase
      .from('departments')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await logAudit(supabase, adminUser, 'department_status_changed', {
      department_id: id,
      new_status: newStatus,
    });

    revalidatePath('/admin/departments');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

export async function deleteDepartmentAction(
  id: string,
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

    // 1. Dependency check
    const [{ count: progCount }, { data: deptData }] = await Promise.all([
      supabase.from('programs').select('id', { count: 'exact', head: true }).eq('department_id', id),
      supabase.from('departments').select('name, code').eq('id', id).single(),
    ]);

    const hasDependencies = (progCount || 0) > 0;

    if (hasDependencies) {
      if (forceDeactivateIfBlocked) {
        // Safe deactivation
        const { error: deactErr } = await supabase
          .from('departments')
          .update({ status: 'inactive' })
          .eq('id', id);

        if (deactErr) return { success: false, error: deactErr.message };

        await logAudit(supabase, adminUser, 'department_deactivated_safely', {
          department_id: id,
          reason: 'Has existing linked programs. Applied safe deactivation.',
        });

        revalidatePath('/admin/departments');
        return {
          success: true,
          actionTaken: 'deactivated',
          reason: `Department has ${progCount} program(s) linked to it. Safely deactivated to preserve academic records.`,
        };
      }

      return {
        success: false,
        blocked: true,
        reason: `Cannot permanently delete: this department contains ${progCount} linked program(s). You can safely deactivate it instead.`,
      };
    }

    // Safe to delete
    const { error: delErr } = await supabase.from('departments').delete().eq('id', id);
    if (delErr) {
      if (delErr.code === '23503') {
        return {
          success: false,
          blocked: true,
          reason: 'Cannot delete: existing student or faculty records reference this department. Deactivation is recommended.',
        };
      }
      return { success: false, error: delErr.message };
    }

    await logAudit(supabase, adminUser, 'department_deleted', {
      department_id: id,
      dept_info: deptData,
    });

    revalidatePath('/admin/departments');
    return { success: true, actionTaken: 'deleted' };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

/* ========================================================================= */
/* 2. PROGRAMS CRUD                                                          */
/* ========================================================================= */

export async function createProgramAction(formData: ProgramFormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const adminUser = await verifySuperadminSession();
    const supabase: any = await createClient();

    const name = formData.name.trim();
    const code = formData.code.trim().toUpperCase();

    if (!name || !code || !formData.department_id) {
      return { success: false, error: 'Program name, code, and parent department are required.' };
    }

    const { data: created, error } = await supabase
      .from('programs')
      .insert({
        department_id: formData.department_id,
        name,
        code,
        status: formData.status || 'active',
      })
      .select('id, name, code, department_id')
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'A program with this name or code already exists.' };
      }
      return { success: false, error: error.message };
    }

    await logAudit(supabase, adminUser, 'program_created', {
      program_id: created.id,
      name: created.name,
      code: created.code,
      department_id: created.department_id,
    });

    revalidatePath('/admin/departments');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

export async function updateProgramAction(formData: ProgramFormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const adminUser = await verifySuperadminSession();
    if (!formData.id) return { success: false, error: 'Program ID required.' };

    const supabase: any = await createClient();
    const name = formData.name.trim();
    const code = formData.code.trim().toUpperCase();

    if (!name || !code || !formData.department_id) {
      return { success: false, error: 'Program name, code, and parent department are required.' };
    }

    const { error } = await supabase
      .from('programs')
      .update({
        department_id: formData.department_id,
        name,
        code,
        status: formData.status,
      })
      .eq('id', formData.id);

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'A program with this code already exists.' };
      }
      return { success: false, error: error.message };
    }

    await logAudit(supabase, adminUser, 'program_updated', {
      program_id: formData.id,
      name,
      code,
      status: formData.status,
    });

    revalidatePath('/admin/departments');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

export async function toggleProgramStatusAction(
  id: string,
  newStatus: EntityStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminUser = await verifySuperadminSession();
    const supabase: any = await createClient();

    const { error } = await supabase
      .from('programs')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await logAudit(supabase, adminUser, 'program_status_changed', {
      program_id: id,
      new_status: newStatus,
    });

    revalidatePath('/admin/departments');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

export async function deleteProgramAction(
  id: string,
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

    // Check linked sections
    const { count: secCount } = await supabase
      .from('academic_sections')
      .select('id', { count: 'exact', head: true })
      .eq('program_id', id);

    const hasDependencies = (secCount || 0) > 0;

    if (hasDependencies) {
      if (forceDeactivateIfBlocked) {
        const { error: deactErr } = await supabase
          .from('programs')
          .update({ status: 'inactive' })
          .eq('id', id);

        if (deactErr) return { success: false, error: deactErr.message };

        await logAudit(supabase, adminUser, 'program_deactivated_safely', {
          program_id: id,
          reason: `Has ${secCount} linked sections. Deactivated safely.`,
        });

        revalidatePath('/admin/departments');
        return {
          success: true,
          actionTaken: 'deactivated',
          reason: `Program has ${secCount} linked section(s). Safely deactivated.`,
        };
      }

      return {
        success: false,
        blocked: true,
        reason: `Cannot delete: Program contains ${secCount} linked academic section(s). Please safely deactivate instead.`,
      };
    }

    const { error: delErr } = await supabase.from('programs').delete().eq('id', id);
    if (delErr) {
      if (delErr.code === '23503') {
        return {
          success: false,
          blocked: true,
          reason: 'Cannot delete: existing records reference this program. Deactivation is recommended.',
        };
      }
      return { success: false, error: delErr.message };
    }

    await logAudit(supabase, adminUser, 'program_deleted', { program_id: id });

    revalidatePath('/admin/departments');
    return { success: true, actionTaken: 'deleted' };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

/* ========================================================================= */
/* 3. SECTIONS CRUD                                                          */
/* ========================================================================= */

export async function createSectionAction(formData: SectionFormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const adminUser = await verifySuperadminSession();
    const supabase: any = await createClient();

    const section_name = formData.section_name.trim();
    const academic_year = formData.academic_year.trim();

    if (!section_name || !formData.program_id || !formData.year || !academic_year) {
      return { success: false, error: 'Program, Academic Year, Year, and Section Name are required.' };
    }

    const { data: created, error } = await supabase
      .from('academic_sections')
      .insert({
        program_id: formData.program_id,
        academic_year,
        year: Number(formData.year),
        semester: formData.semester ? Number(formData.semester) : null,
        section_name,
        status: formData.status || 'active',
      })
      .select('id, section_name, program_id, year')
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'This section already exists for the selected program and year.' };
      }
      return { success: false, error: error.message };
    }

    await logAudit(supabase, adminUser, 'section_created', {
      section_id: created.id,
      section_name: created.section_name,
      program_id: created.program_id,
      year: created.year,
    });

    revalidatePath('/admin/departments');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

export async function updateSectionAction(formData: SectionFormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const adminUser = await verifySuperadminSession();
    if (!formData.id) return { success: false, error: 'Section ID required.' };

    const supabase: any = await createClient();
    const section_name = formData.section_name.trim();
    const academic_year = formData.academic_year.trim();

    if (!section_name || !formData.program_id || !formData.year || !academic_year) {
      return { success: false, error: 'Program, Academic Year, Year, and Section Name are required.' };
    }

    const { error } = await supabase
      .from('academic_sections')
      .update({
        program_id: formData.program_id,
        academic_year,
        year: Number(formData.year),
        semester: formData.semester ? Number(formData.semester) : null,
        section_name,
        status: formData.status,
      })
      .eq('id', formData.id);

    if (error) {
      return { success: false, error: error.message };
    }

    await logAudit(supabase, adminUser, 'section_updated', {
      section_id: formData.id,
      section_name,
      status: formData.status,
    });

    revalidatePath('/admin/departments');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

export async function toggleSectionStatusAction(
  id: string,
  newStatus: EntityStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminUser = await verifySuperadminSession();
    const supabase: any = await createClient();

    const { error } = await supabase
      .from('academic_sections')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await logAudit(supabase, adminUser, 'section_status_changed', {
      section_id: id,
      new_status: newStatus,
    });

    revalidatePath('/admin/departments');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

export async function deleteSectionAction(
  id: string,
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

    // Check enrollments and assignments
    const [{ count: enrollCount }, { count: facCount }] = await Promise.all([
      supabase.from('student_academic_enrollments').select('id', { count: 'exact', head: true }).eq('section_id', id),
      supabase.from('faculty_class_assignments').select('id', { count: 'exact', head: true }).eq('section_id', id),
    ]);

    const totalDeps = (enrollCount || 0) + (facCount || 0);

    if (totalDeps > 0) {
      if (forceDeactivateIfBlocked) {
        const { error: deactErr } = await supabase
          .from('academic_sections')
          .update({ status: 'inactive' })
          .eq('id', id);

        if (deactErr) return { success: false, error: deactErr.message };

        await logAudit(supabase, adminUser, 'section_deactivated_safely', {
          section_id: id,
          reason: `Has ${enrollCount} student enrollments and ${facCount} faculty assignments. Safely deactivated.`,
        });

        revalidatePath('/admin/departments');
        return {
          success: true,
          actionTaken: 'deactivated',
          reason: `Section has ${enrollCount} student(s) and ${facCount} faculty assignment(s). Safely deactivated to protect records.`,
        };
      }

      return {
        success: false,
        blocked: true,
        reason: `Cannot delete: This section has ${enrollCount} enrolled student(s) and ${facCount} faculty assignment(s). Safely deactivate instead.`,
      };
    }

    const { error: delErr } = await supabase.from('academic_sections').delete().eq('id', id);
    if (delErr) {
      if (delErr.code === '23503') {
        return {
          success: false,
          blocked: true,
          reason: 'Cannot delete: existing timetable, resource, or announcement records reference this section. Deactivation is recommended.',
        };
      }
      return { success: false, error: delErr.message };
    }

    await logAudit(supabase, adminUser, 'section_deleted', { section_id: id });

    revalidatePath('/admin/departments');
    return { success: true, actionTaken: 'deleted' };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

/* ========================================================================= */
/* 4. TRAINING GROUPS CRUD                                                   */
/* ========================================================================= */

export async function createTrainingGroupAction(formData: TrainingGroupFormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const adminUser = await verifySuperadminSession();
    const supabase: any = await createClient();

    const name = formData.name.trim();

    if (!name) {
      return { success: false, error: 'Training group name is required.' };
    }

    const { data: created, error } = await supabase
      .from('training_groups')
      .insert({
        name,
        description: formData.description?.trim() || null,
        status: formData.status || 'active',
      })
      .select('id, name')
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'A training group with this name already exists.' };
      }
      return { success: false, error: error.message };
    }

    await logAudit(supabase, adminUser, 'training_group_created', {
      training_group_id: created.id,
      name: created.name,
    });

    revalidatePath('/admin/departments');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

export async function updateTrainingGroupAction(formData: TrainingGroupFormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const adminUser = await verifySuperadminSession();
    if (!formData.id) return { success: false, error: 'Training Group ID required.' };

    const supabase: any = await createClient();
    const name = formData.name.trim();

    if (!name) {
      return { success: false, error: 'Training group name is required.' };
    }

    const { error } = await supabase
      .from('training_groups')
      .update({
        name,
        description: formData.description?.trim() || null,
        status: formData.status,
      })
      .eq('id', formData.id);

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'A training group with this name already exists.' };
      }
      return { success: false, error: error.message };
    }

    await logAudit(supabase, adminUser, 'training_group_updated', {
      training_group_id: formData.id,
      name,
      status: formData.status,
    });

    revalidatePath('/admin/departments');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

export async function toggleTrainingGroupStatusAction(
  id: string,
  newStatus: EntityStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminUser = await verifySuperadminSession();
    const supabase: any = await createClient();

    const { error } = await supabase
      .from('training_groups')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await logAudit(supabase, adminUser, 'training_group_status_changed', {
      training_group_id: id,
      new_status: newStatus,
    });

    revalidatePath('/admin/departments');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

export async function deleteTrainingGroupAction(
  id: string,
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

    // Check enrollments and assignments
    const [{ count: enrollCount }, { count: facCount }] = await Promise.all([
      supabase.from('student_training_enrollments').select('id', { count: 'exact', head: true }).eq('training_group_id', id),
      supabase.from('faculty_training_assignments').select('id', { count: 'exact', head: true }).eq('training_group_id', id),
    ]);

    const totalDeps = (enrollCount || 0) + (facCount || 0);

    if (totalDeps > 0) {
      if (forceDeactivateIfBlocked) {
        const { error: deactErr } = await supabase
          .from('training_groups')
          .update({ status: 'inactive' })
          .eq('id', id);

        if (deactErr) return { success: false, error: deactErr.message };

        await logAudit(supabase, adminUser, 'training_group_deactivated_safely', {
          training_group_id: id,
          reason: `Has ${enrollCount} student enrollments and ${facCount} faculty assignments. Safely deactivated.`,
        });

        revalidatePath('/admin/departments');
        return {
          success: true,
          actionTaken: 'deactivated',
          reason: `Training group has ${enrollCount} student(s) and ${facCount} faculty mentor(s). Safely deactivated to preserve academic training histories.`,
        };
      }

      return {
        success: false,
        blocked: true,
        reason: `Cannot delete: Training group currently has ${enrollCount} student enrollment(s) and ${facCount} faculty mentor(s). Please safely deactivate instead.`,
      };
    }

    const { error: delErr } = await supabase.from('training_groups').delete().eq('id', id);
    if (delErr) {
      if (delErr.code === '23503') {
        return {
          success: false,
          blocked: true,
          reason: 'Cannot delete: existing schedule, resource, or announcement records reference this training group. Deactivation is recommended.',
        };
      }
      return { success: false, error: delErr.message };
    }

    await logAudit(supabase, adminUser, 'training_group_deleted', { training_group_id: id });

    revalidatePath('/admin/departments');
    return { success: true, actionTaken: 'deleted' };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

/* ========================================================================= */
/* 5. ACADEMIC YEARS CRUD                                                    */
/* ========================================================================= */

export async function createAcademicYearAction(formData: AcademicYearFormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const adminUser = await verifySuperadminSession();
    const supabase: any = await createClient();

    const display_name = formData.display_name.trim();
    const current_academic_calendar = formData.current_academic_calendar.trim();
    const year_number = Number(formData.year_number);

    if (!display_name || !current_academic_calendar || !year_number) {
      return { success: false, error: 'Year number, display name, and academic calendar are required.' };
    }

    const { data: created, error } = await supabase
      .from('academic_years')
      .insert({
        year_number,
        display_name,
        current_academic_calendar,
        status: formData.status || 'active',
      })
      .select('id, year_number, display_name')
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: `Academic Year ${year_number} already exists.` };
      }
      return { success: false, error: error.message };
    }

    await logAudit(supabase, adminUser, 'academic_year_created', {
      academic_year_id: created.id,
      year_number: created.year_number,
      display_name: created.display_name,
    });

    revalidatePath('/admin/departments');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

export async function updateAcademicYearAction(formData: AcademicYearFormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const adminUser = await verifySuperadminSession();
    if (!formData.id) return { success: false, error: 'Academic Year ID required.' };

    const supabase: any = await createClient();
    const display_name = formData.display_name.trim();
    const current_academic_calendar = formData.current_academic_calendar.trim();
    const year_number = Number(formData.year_number);

    if (!display_name || !current_academic_calendar || !year_number) {
      return { success: false, error: 'Year number, display name, and academic calendar are required.' };
    }

    const { error } = await supabase
      .from('academic_years')
      .update({
        year_number,
        display_name,
        current_academic_calendar,
        status: formData.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', formData.id);

    if (error) {
      return { success: false, error: error.message };
    }

    await logAudit(supabase, adminUser, 'academic_year_updated', {
      academic_year_id: formData.id,
      year_number,
      display_name,
      status: formData.status,
    });

    revalidatePath('/admin/departments');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

export async function toggleAcademicYearStatusAction(
  id: string,
  newStatus: EntityStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminUser = await verifySuperadminSession();
    const supabase: any = await createClient();

    const { error } = await supabase
      .from('academic_years')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await logAudit(supabase, adminUser, 'academic_year_status_changed', {
      academic_year_id: id,
      new_status: newStatus,
    });

    revalidatePath('/admin/departments');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}

export async function deleteAcademicYearAction(
  id: string,
  yearNumber: number,
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

    // Check if sections exist for this year
    const { count: secCount } = await supabase
      .from('academic_sections')
      .select('id', { count: 'exact', head: true })
      .eq('year', yearNumber);

    if ((secCount || 0) > 0) {
      if (forceDeactivateIfBlocked) {
        const { error: deactErr } = await supabase
          .from('academic_years')
          .update({ status: 'inactive', updated_at: new Date().toISOString() })
          .eq('id', id);

        if (deactErr) return { success: false, error: deactErr.message };

        await logAudit(supabase, adminUser, 'academic_year_deactivated_safely', {
          academic_year_id: id,
          year_number: yearNumber,
          reason: `Has ${secCount} sections. Safely deactivated.`,
        });

        revalidatePath('/admin/departments');
        return {
          success: true,
          actionTaken: 'deactivated',
          reason: `Year has ${secCount} linked section(s). Safely deactivated to preserve academic hierarchies.`,
        };
      }

      return {
        success: false,
        blocked: true,
        reason: `Cannot delete: Academic Year ${yearNumber} has ${secCount} active section(s) assigned. Deactivate it instead.`,
      };
    }

    const { error: delErr } = await supabase.from('academic_years').delete().eq('id', id);
    if (delErr) {
      return { success: false, error: delErr.message };
    }

    await logAudit(supabase, adminUser, 'academic_year_deleted', {
      academic_year_id: id,
      year_number: yearNumber,
    });

    revalidatePath('/admin/departments');
    return { success: true, actionTaken: 'deleted' };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Server error.' };
  }
}
