import { AccountStatus } from './database.types';

export interface FacultyClassAssignmentDetail {
  id: string;
  faculty_id: string;
  section_id: string;
  section_name: string;
  year: number;
  academic_year: string;
  program_id: string;
  program_name: string;
  program_code: string;
  department_name: string;
  department_code: string;
  students_count: number;
  created_at: string;
}

export interface FacultyTrainingAssignmentDetail {
  id: string;
  faculty_id: string;
  training_group_id: string;
  training_group_name: string;
  description: string | null;
  students_count: number;
  created_at: string;
}

export interface FacultyMemberDetail {
  id: string; // faculty_members.id
  user_id: string; // profiles.id
  name: string;
  email: string;
  employee_id: string;
  department: string;
  designation: string;
  cabin_location: string | null;
  contact_number: string | null;
  account_status: AccountStatus;
  created_at: string;
  class_assignments: FacultyClassAssignmentDetail[];
  training_assignments: FacultyTrainingAssignmentDetail[];
  total_sessions_count: number;
  total_students_reach: number;
}

export interface CreateFacultyFormData {
  name: string;
  email: string;
  password: string;
  department: string;
  designation: string;
  employee_id: string;
  cabin_location?: string;
  contact_number?: string;
}

export interface EditFacultyFormData {
  faculty_id: string;
  user_id: string;
  name: string;
  department: string;
  designation: string;
  employee_id: string;
  cabin_location?: string;
  contact_number?: string;
}

export interface AssignClassSectionFormData {
  faculty_id: string;
  section_id: string;
}

export interface AssignTrainingGroupFormData {
  faculty_id: string;
  training_group_id: string;
}

export interface FacultyManagementOverviewData {
  facultyList: FacultyMemberDetail[];
  departments: { id: string; name: string; code: string }[];
  programs: { id: string; department_id: string; name: string; code: string; department_code?: string }[];
  sections: {
    id: string;
    program_id: string;
    section_name: string;
    year: number;
    academic_year: string;
    department_code?: string;
    program_code?: string;
    program_name?: string;
  }[];
  trainingGroups: { id: string; name: string; description: string | null }[];
}
