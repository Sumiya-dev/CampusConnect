import { createClient } from '../supabase/server';
import { getCurrentUser } from '../auth/user';
import { formatSectionCode, getYearLabel } from '../faculty/queries';
import {
  FacultyAnnouncement,
  AnnouncementAllocationOptions,
  AnnouncementSectionOption,
  AnnouncementTrainingGroupOption,
  AnnouncementTargetType,
} from '../types/announcement.types';

interface FacultyIdRow {
  id: string;
  department: string;
}

interface DatabaseSectionRow {
  id: string;
  year: number;
  section_name: string;
  academic_year: string | null;
  program?: {
    code?: string;
    department?: {
      code?: string;
    } | null;
  } | null;
}

interface DatabaseTrainingGroupRow {
  id: string;
  name: string;
}

interface RawAnnouncementRow {
  id: string;
  faculty_id: string;
  title: string;
  content: string;
  target_type: AnnouncementTargetType;
  target_department: string | null;
  target_year: number | null;
  section_id: string | null;
  training_group_id: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  section?: DatabaseSectionRow | null;
  training_group?: DatabaseTrainingGroupRow | null;
  faculty?: {
    id: string;
    designation: string;
    department: string;
    user?: {
      name?: string;
      department?: string;
    } | null;
  } | null;
}

function resolveTargetLabel(row: RawAnnouncementRow): string {
  switch (row.target_type) {
    case 'all':
      return 'All Students';
    case 'department':
      return row.target_department
        ? `Department: ${row.target_department}`
        : 'Department Level';
    case 'year':
      return row.target_year
        ? `Class: ${getYearLabel(row.target_year)}`
        : 'Academic Year';
    case 'section': {
      if (row.section) {
        const deptCode =
          row.section.program?.department?.code ||
          row.section.program?.code ||
          'CSE';
        const formattedCode = formatSectionCode(
          deptCode,
          row.section.section_name
        );
        return `Section: ${formattedCode} (${getYearLabel(row.section.year)})`;
      }
      return 'Academic Section';
    }
    case 'training_group':
      return row.training_group?.name
        ? `Training: ${row.training_group.name}`
        : 'Training Group';
    default:
      return 'General Audience';
  }
}

/**
 * Returns announcements created by the faculty member.
 */
export async function getFacultyAnnouncements(
  facultyUserId?: string
): Promise<FacultyAnnouncement[]> {
  const user = await getCurrentUser();
  const activeUserId = facultyUserId || user?.id;

  if (!activeUserId) return [];

  const supabase = await createClient();

  // 1. Get faculty member record
  const { data: rawFaculty } = await supabase
    .from('faculty_members')
    .select('id, department')
    .eq('user_id', activeUserId)
    .maybeSingle();

  const faculty = rawFaculty as unknown as FacultyIdRow | null;

  if (!faculty || !faculty.id) {
    return [];
  }

  // 2. Fetch announcements for this faculty member
  const { data: rows, error } = await supabase
    .from('faculty_announcements')
    .select(`
      id,
      faculty_id,
      title,
      content,
      target_type,
      target_department,
      target_year,
      section_id,
      training_group_id,
      is_published,
      created_at,
      updated_at,
      section:academic_sections (
        id,
        year,
        section_name,
        academic_year,
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
        designation,
        department,
        user:profiles (
          name,
          department
        )
      )
    `)
    .eq('faculty_id', faculty.id)
    .order('created_at', { ascending: false });

  if (error || !rows) {
    return [];
  }

  return (rows as unknown as RawAnnouncementRow[]).map((row) => {
    let sectionCode: string | undefined;
    if (row.section) {
      const deptCode =
        row.section.program?.department?.code ||
        row.section.program?.code ||
        'CSE';
      sectionCode = formatSectionCode(deptCode, row.section.section_name);
    }

    return {
      id: row.id,
      faculty_id: row.faculty_id,
      title: row.title,
      content: row.content,
      target_type: row.target_type,
      target_department: row.target_department,
      target_year: row.target_year,
      section_id: row.section_id,
      training_group_id: row.training_group_id,
      is_published: row.is_published,
      created_at: row.created_at,
      updated_at: row.updated_at,
      faculty_name: row.faculty?.user?.name || user?.name || 'Faculty Member',
      faculty_designation: row.faculty?.designation || 'Faculty Advisor',
      faculty_department: row.faculty?.department || faculty.department,
      section_name: row.section?.section_name,
      section_code: sectionCode,
      training_group_name: row.training_group?.name,
      target_label: resolveTargetLabel(row),
    };
  });
}

/**
 * Returns available allocation options for the announcement composer.
 */
export async function getFacultyAnnouncementAllocations(
  facultyUserId?: string
): Promise<AnnouncementAllocationOptions> {
  const user = await getCurrentUser();
  const activeUserId = facultyUserId || user?.id;

  const defaultResult: AnnouncementAllocationOptions = {
    departments: ['Computer Science & Engineering'],
    years: [1, 2, 3, 4],
    sections: [],
    training_groups: [],
    faculty_department: user?.department || 'Computer Science & Engineering',
  };

  if (!activeUserId) return defaultResult;

  const supabase = await createClient();

  // 1. Get faculty member record
  const { data: rawFaculty } = await supabase
    .from('faculty_members')
    .select('id, department')
    .eq('user_id', activeUserId)
    .maybeSingle();

  const faculty = rawFaculty as unknown as FacultyIdRow | null;

  const sections: AnnouncementSectionOption[] = [];
  const trainingGroups: AnnouncementTrainingGroupOption[] = [];

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
            department:departments (code, name)
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
            section_code: `${code} (${getYearLabel(sec.year)})`,
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
        const grp = (item as unknown as { group: DatabaseTrainingGroupRow }).group;
        if (grp && grp.id) {
          trainingGroups.push({
            id: grp.id,
            name: grp.name,
          });
        }
      }
    }
  }

  // 4. Fetch list of departments
  const { data: depts } = await supabase
    .from('departments')
    .select('name')
    .order('name');

  const departmentList =
    depts && depts.length > 0
      ? depts.map((d: { name: string }) => d.name)
      : [faculty?.department || 'Computer Science & Engineering'];

  return {
    departments: departmentList,
    years: [1, 2, 3, 4],
    sections,
    training_groups: trainingGroups,
    faculty_department:
      faculty?.department || user?.department || 'Computer Science & Engineering',
  };
}

/**
 * Returns published announcements targeted to the current student, enforced by Supabase RLS.
 */
export async function getStudentAnnouncements(): Promise<FacultyAnnouncement[]> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from('faculty_announcements')
    .select(`
      id,
      faculty_id,
      title,
      content,
      target_type,
      target_department,
      target_year,
      section_id,
      training_group_id,
      is_published,
      created_at,
      updated_at,
      section:academic_sections (
        id,
        year,
        section_name,
        academic_year,
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
        designation,
        department,
        user:profiles (
          name,
          department
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error || !rows) {
    return [];
  }

  return (rows as unknown as RawAnnouncementRow[]).map((row) => {
    let sectionCode: string | undefined;
    if (row.section) {
      const deptCode =
        row.section.program?.department?.code ||
        row.section.program?.code ||
        'CSE';
      sectionCode = formatSectionCode(deptCode, row.section.section_name);
    }

    return {
      id: row.id,
      faculty_id: row.faculty_id,
      title: row.title,
      content: row.content,
      target_type: row.target_type,
      target_department: row.target_department,
      target_year: row.target_year,
      section_id: row.section_id,
      training_group_id: row.training_group_id,
      is_published: row.is_published,
      created_at: row.created_at,
      updated_at: row.updated_at,
      faculty_name: row.faculty?.user?.name || 'Faculty Member',
      faculty_designation: row.faculty?.designation || 'Faculty Advisor',
      faculty_department: row.faculty?.department,
      section_name: row.section?.section_name,
      section_code: sectionCode,
      training_group_name: row.training_group?.name,
      target_label: resolveTargetLabel(row),
    };
  });
}
