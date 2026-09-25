export interface Department {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'inactive';
  created_at?: string;
}

export interface Program {
  id: string;
  department_id: string;
  name: string;
  code: string;
  department?: Department;
  created_at?: string;
}

export interface AcademicSection {
  id: string;
  program_id: string;
  academic_year: string;
  year: number;
  semester?: number | null;
  section_name: string;
  status: 'active' | 'inactive';
  program?: Program;
  created_at?: string;
}

export interface TrainingGroup {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
  created_at?: string;
}

export interface EnrolledStudent {
  id: string;
  user_id: string;
  student_id: string; // Roll number e.g. 24CSE001
  name: string;
  email: string;
  department: string;
  year: number;
  cgpa: number;
  section_id: string;
  section_name: string;
  program_name: string;
  academic_year: string;
  training_groups: {
    id: string;
    name: string;
  }[];
}

export interface ClassWithDetails {
  id: string;
  department_name: string;
  department_code: string;
  program_name: string;
  program_code: string;
  academic_year: string;
  year: number;
  section_name: string;
  student_count: number;
}

export interface TrainingGroupSectionBreakdown {
  section_id: string;
  section_name: string;
  program_code: string;
  count: number;
}

export interface TrainingGroupWithDetails {
  id: string;
  name: string;
  description: string | null;
  student_count: number;
  sections_breakdown: TrainingGroupSectionBreakdown[];
}

export interface ClassDetailsData {
  class_info: ClassWithDetails;
  training_groups_in_class: {
    id: string;
    name: string;
    count: number;
  }[];
  students: EnrolledStudent[];
}

export interface TrainingGroupDetailsData {
  group_info: TrainingGroupWithDetails;
  students: EnrolledStudent[];
}

export interface FacultyDashboardSummary {
  faculty_name: string;
  department: string;
  employee_id: string;
  classes_count: number;
  training_groups_count: number;
  total_students_monitored: number;
  assigned_classes: ClassWithDetails[];
  assigned_training_groups: TrainingGroupWithDetails[];
}

// -----------------------------------------------------------------------------
// FACULTY ALLOCATION → SCHEDULE → REGISTERED STUDENTS
// -----------------------------------------------------------------------------
export type ScheduleBucket = 'TODAY' | 'TOMORROW' | 'UPCOMING';

export interface FacultySessionItem {
  id: string;
  title: string;                 // e.g. "Java Training"
  training_name: string;         // e.g. "Java"
  year: number;                  // 4
  year_label: string;            // "4th Year"
  department_code: string;       // "CSE"
  section_code: string;          // "CSE-A"
  session_date: string;          // "2026-09-24"
  start_time: string;            // "10:00 AM"
  end_time: string;              // "11:00 AM"
  time_range: string;            // "10:00 AM – 11:00 AM"
  venue: string;                 // "Room 204"
  registered_count: number;      // 32
  bucket: ScheduleBucket;        // 'TODAY' | 'TOMORROW' | 'UPCOMING'
  status: string;                // 'scheduled'
}

export interface SessionRegisteredStudent {
  id: string;
  student_id: string;            // "24CSE001"
  name: string;                  // "Student 1" / "Aarav Sharma"
  training_groups: {
    id: string;
    name: string;                // "Java", "Aptitude"
  }[];
  registered_at?: string;
}

export interface FacultySessionDetails {
  session: FacultySessionItem;
  students: SessionRegisteredStudent[];
  available_training_groups: {
    id: string;
    name: string;
  }[];
}

// Legacy hierarchy types (kept for backwards compatibility)
export interface FacultyAcademicYear {
  year: number;
  label: string;
}

export interface FacultySectionSummary {
  id: string;
  section_code: string;
  year: number;
}

export interface SectionStudentItem {
  id: string;
  student_id: string;
  name: string;
  training_groups: {
    id: string;
    name: string;
  }[];
}

export interface SectionStudentsData {
  section_id: string;
  section_code: string;
  year: number;
  students: SectionStudentItem[];
  available_training_groups: {
    id: string;
    name: string;
  }[];
}
