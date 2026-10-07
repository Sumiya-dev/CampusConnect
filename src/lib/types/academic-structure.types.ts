export type EntityStatus = 'active' | 'inactive';

export interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  status: EntityStatus;
  created_at: string;
  programs_count?: number;
  students_count?: number;
  faculty_count?: number;
}

export interface ProgramItem {
  id: string;
  department_id: string;
  name: string;
  code: string;
  status: EntityStatus;
  created_at: string;
  department_name?: string;
  department_code?: string;
  sections_count?: number;
}

export interface AcademicYearItem {
  id: string;
  year_number: number;
  display_name: string;
  current_academic_calendar: string;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
  sections_count?: number;
}

export interface SectionItem {
  id: string;
  program_id: string;
  academic_year: string;
  year: number;
  semester: number | null;
  section_name: string;
  status: EntityStatus;
  created_at: string;
  program_name?: string;
  program_code?: string;
  department_id?: string;
  department_name?: string;
  department_code?: string;
  students_count?: number;
  faculty_count?: number;
}

export interface TrainingGroupItem {
  id: string;
  name: string;
  description: string | null;
  status: EntityStatus;
  created_at: string;
  students_count?: number;
  faculty_count?: number;
}

export interface DepartmentFormData {
  id?: string;
  name: string;
  code: string;
  status: EntityStatus;
}

export interface ProgramFormData {
  id?: string;
  department_id: string;
  name: string;
  code: string;
  status: EntityStatus;
}

export interface AcademicYearFormData {
  id?: string;
  year_number: number;
  display_name: string;
  current_academic_calendar: string;
  status: EntityStatus;
}

export interface SectionFormData {
  id?: string;
  program_id: string;
  academic_year: string;
  year: number;
  semester?: number | null;
  section_name: string;
  status: EntityStatus;
}

export interface TrainingGroupFormData {
  id?: string;
  name: string;
  description?: string;
  status: EntityStatus;
}

export interface AcademicStructureOverviewData {
  departments: DepartmentItem[];
  programs: ProgramItem[];
  academicYears: AcademicYearItem[];
  sections: SectionItem[];
  trainingGroups: TrainingGroupItem[];
}
