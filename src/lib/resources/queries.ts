import { createClient } from '../supabase/server';
import { getCurrentUser } from '../auth/user';
import {
  FacultyResource,
  ResourceAllocationOptions,
  AllocatedSectionOption,
  AllocatedTrainingGroupOption,
} from '../types/resource.types';
import { formatSectionCode, cleanTrainingName } from '../faculty/queries';

interface DatabaseSectionRow {
  id: string;
  year: number;
  section_name: string;
  academic_year: string;
  program?: {
    code?: string;
    department?: {
      code?: string;
    } | null;
  } | null;
}

interface DatabaseResourceRow {
  id: string;
  faculty_id: string;
  title: string;
  description: string | null;
  subject: string;
  target_type: 'all' | 'section' | 'training_group';
  section_id: string | null;
  training_group_id: string | null;
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  section?: {
    id: string;
    section_name: string;
    year: number;
    program?: {
      code?: string;
      department?: {
        code?: string;
      } | null;
    } | null;
  } | null;
  training_group?: {
    id: string;
    name: string;
  } | null;
  faculty?: {
    id: string;
    department?: string;
    profile?: {
      name?: string;
    } | null;
  } | null;
}

interface FacultyIdRow {
  id: string;
  department: string;
}

interface TrainingGroupRow {
  id: string;
  name: string;
}

/**
 * Returns allocated sections and training groups for a faculty member.
 */
export async function getFacultyAllocatedOptions(
  facultyUserId: string
): Promise<ResourceAllocationOptions> {
  const supabase = await createClient();

  // 1. Get faculty member record
  const { data: rawFaculty } = await supabase
    .from('faculty_members')
    .select('id, department')
    .eq('user_id', facultyUserId)
    .maybeSingle();

  const faculty = rawFaculty as unknown as FacultyIdRow | null;

  const sections: AllocatedSectionOption[] = [];
  const trainingGroups: AllocatedTrainingGroupOption[] = [];

  if (faculty && faculty.id) {
    // 2. Query assigned academic sections
    const { data: assignedSections } = await supabase
      .from('faculty_class_assignments')
      .select(`
        section:academic_sections (
          id,
          year,
          section_name,
          academic_year,
          program:programs (
            code,
            department:departments (code)
          )
        )
      `)
      .eq('faculty_id', faculty.id);

    if (assignedSections && assignedSections.length > 0) {
      for (const item of assignedSections) {
        const sec = (item as unknown as { section: DatabaseSectionRow }).section;
        if (sec && sec.id) {
          const deptCode =
            sec.program?.department?.code || sec.program?.code || 'CSE';
          const code = formatSectionCode(deptCode, sec.section_name);
          sections.push({
            id: sec.id,
            section_code: `${code} (Year ${sec.year})`,
            year: sec.year,
            academic_year: sec.academic_year || '2025-2026',
          });
        }
      }
    }

    // 3. Query assigned training groups
    const { data: assignedGroups } = await supabase
      .from('faculty_training_assignments')
      .select(`
        group:training_groups (
          id,
          name
        )
      `)
      .eq('faculty_id', faculty.id);

    if (assignedGroups && assignedGroups.length > 0) {
      for (const item of assignedGroups) {
        const grp = (item as unknown as { group: TrainingGroupRow }).group;
        if (grp && grp.id) {
          trainingGroups.push({
            id: grp.id,
            name: cleanTrainingName(grp.name),
          });
        }
      }
    }
  }

  // Fallback: If no explicit assignments found, fetch active sections & training groups
  if (sections.length === 0) {
    const { data: allSections } = await supabase
      .from('academic_sections')
      .select(`
        id,
        year,
        section_name,
        academic_year,
        program:programs (
          code,
          department:departments (code)
        )
      `)
      .order('year', { ascending: false });

    if (allSections) {
      for (const sec of allSections as unknown as DatabaseSectionRow[]) {
        const deptCode =
          sec.program?.department?.code || sec.program?.code || 'CSE';
        const code = formatSectionCode(deptCode, sec.section_name);
        sections.push({
          id: sec.id,
          section_code: `${code} (Year ${sec.year})`,
          year: sec.year,
          academic_year: sec.academic_year || '2025-2026',
        });
      }
    }
  }

  if (trainingGroups.length === 0) {
    const { data: allGroups } = await supabase
      .from('training_groups')
      .select('id, name')
      .order('name');

    if (allGroups) {
      const groups = allGroups as unknown as TrainingGroupRow[];
      for (const grp of groups) {
        trainingGroups.push({
          id: grp.id,
          name: cleanTrainingName(grp.name),
        });
      }
    }
  }

  return { sections, training_groups: trainingGroups };
}

/**
 * Returns all resources uploaded by the logged-in faculty member.
 */
export async function getFacultyResources(
  facultyUserId: string
): Promise<FacultyResource[]> {
  const supabase = await createClient();

  const { data: rawFaculty } = await supabase
    .from('faculty_members')
    .select('id')
    .eq('user_id', facultyUserId)
    .maybeSingle();

  const faculty = rawFaculty as unknown as { id: string } | null;

  if (!faculty || !faculty.id) {
    return [];
  }

  const { data: rows, error } = await supabase
    .from('faculty_resources')
    .select(`
      id,
      faculty_id,
      title,
      description,
      subject,
      target_type,
      section_id,
      training_group_id,
      file_path,
      file_name,
      file_size,
      file_type,
      is_published,
      created_at,
      updated_at,
      section:academic_sections (
        id,
        section_name,
        year,
        program:programs (
          code,
          department:departments (code)
        )
      ),
      training_group:training_groups (
        id,
        name
      )
    `)
    .eq('faculty_id', faculty.id)
    .order('created_at', { ascending: false });

  if (error || !rows) {
    console.error('Error fetching faculty resources:', error);
    return [];
  }

  return (rows as unknown as DatabaseResourceRow[]).map((r) => {
    let sectionName: string | undefined;
    if (r.section) {
      const deptCode =
        r.section.program?.department?.code || r.section.program?.code || 'CSE';
      sectionName = `${formatSectionCode(deptCode, r.section.section_name)} (Year ${r.section.year})`;
    }

    return {
      id: r.id,
      faculty_id: r.faculty_id,
      title: r.title,
      description: r.description,
      subject: r.subject,
      target_type: r.target_type,
      section_id: r.section_id,
      training_group_id: r.training_group_id,
      file_path: r.file_path,
      file_name: r.file_name,
      file_size: Number(r.file_size || 0),
      file_type: r.file_type,
      is_published: r.is_published,
      created_at: r.created_at,
      updated_at: r.updated_at,
      section_name: sectionName,
      training_group_name: r.training_group?.name
        ? cleanTrainingName(r.training_group.name)
        : undefined,
    };
  });
}

/**
 * Returns published resources accessible to a student based on their class/section/training groups.
 */
export async function getStudentResources(): Promise<FacultyResource[]> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') {
    return [];
  }

  const supabase = await createClient();

  // Query resources with RLS
  const { data: rows, error } = await supabase
    .from('faculty_resources')
    .select(`
      id,
      faculty_id,
      title,
      description,
      subject,
      target_type,
      section_id,
      training_group_id,
      file_path,
      file_name,
      file_size,
      file_type,
      is_published,
      created_at,
      updated_at,
      section:academic_sections (
        id,
        section_name,
        year,
        program:programs (
          code,
          department:departments (code)
        )
      ),
      training_group:training_groups (
        id,
        name
      ),
      faculty:faculty_members (
        id,
        department,
        profile:profiles (name)
      )
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error || !rows) {
    console.error('Error fetching student resources:', error);
    return [];
  }

  return (rows as unknown as DatabaseResourceRow[]).map((r) => {
    let sectionName: string | undefined;
    if (r.section) {
      const deptCode =
        r.section.program?.department?.code || r.section.program?.code || 'CSE';
      sectionName = `${formatSectionCode(deptCode, r.section.section_name)} (Year ${r.section.year})`;
    }

    return {
      id: r.id,
      faculty_id: r.faculty_id,
      title: r.title,
      description: r.description,
      subject: r.subject,
      target_type: r.target_type,
      section_id: r.section_id,
      training_group_id: r.training_group_id,
      file_path: r.file_path,
      file_name: r.file_name,
      file_size: Number(r.file_size || 0),
      file_type: r.file_type,
      is_published: r.is_published,
      created_at: r.created_at,
      updated_at: r.updated_at,
      section_name: sectionName,
      training_group_name: r.training_group?.name
        ? cleanTrainingName(r.training_group.name)
        : undefined,
      faculty_name: r.faculty?.profile?.name || 'Department Faculty',
      faculty_department: r.faculty?.department,
    };
  });
}
