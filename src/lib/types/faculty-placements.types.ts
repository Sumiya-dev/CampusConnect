import { DriveStatus } from './database.types';

export interface FacultyPlacementDriveSummary {
  id: string;
  company_id: string;
  company_name: string;
  company_website?: string | null;
  company_industry?: string | null;
  company_location?: string | null;
  job_role: string;
  package_details: string;
  tier: string;
  location: string | null;
  status: DriveStatus;
  registration_deadline: string;
  drive_date: string | null;
  drive_time: string | null;
  venue: string | null;
  min_cgpa: number;
  max_backlogs: number;
  eligible_departments: string[];
  eligible_years: number[];
  recruitment_stages: string[];
  required_skills: string[];
  description: string | null;
  instructions: string[];
  required_documents: string[];
  vacancies: string | null;
  bond_period: string | null;
  // Scoped metrics for the faculty member's authorized students
  authorized_students_count: number;
  authorized_eligible_count: number;
  authorized_applied_count: number;
  authorized_shortlisted_count: number;
  authorized_selected_count: number;
}

export type CandidateApplicationStatus =
  | 'applied'
  | 'shortlisted'
  | 'interview'
  | 'rejected'
  | 'selected'
  | 'placed'
  | 'not_applied';

export interface FacultyDriveCandidate {
  id: string; // student id
  user_id: string;
  name: string;
  email: string;
  student_id: string; // roll no
  department: string;
  year: number;
  section_id?: string;
  section_name: string;
  cgpa: number;
  skills: string[];
  is_eligible: boolean;
  eligibility_reasons: string[];
  application_id: string | null;
  application_status: CandidateApplicationStatus;
  applied_at: string | null;
  shortlisted_at: string | null;
  interview_date: string | null;
  interview_venue: string | null;
  notes: string | null;
  overall_placement_status: 'unplaced' | 'placed' | 'opted_out' | 'in_process';
}

export interface AllocatedSectionFilterOption {
  id: string;
  code: string;
  year: number;
}

export interface FacultyPlacementsOverviewData {
  drives: FacultyPlacementDriveSummary[];
  allocated_departments: string[];
  allocated_years: number[];
  allocated_sections: AllocatedSectionFilterOption[];
  faculty_department: string;
  total_authorized_students: number;
  total_placed_authorized_students: number;
}

export interface FacultyDriveDetailsData {
  drive: FacultyPlacementDriveSummary;
  candidates: FacultyDriveCandidate[];
  allocated_sections: AllocatedSectionFilterOption[];
  faculty_department: string;
}
