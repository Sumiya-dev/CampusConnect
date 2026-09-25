export type UserRole = 'student' | 'faculty' | 'placement_officer' | 'administrator';
export type AccountStatus = 'active' | 'inactive' | 'pending' | 'suspended';
export type PlacementStatus = 'unplaced' | 'placed' | 'opted_out' | 'in_process';
export type CompanyStatus = 'active' | 'inactive';
export type DriveStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type ApplicationStatus =
  | 'applied'
  | 'shortlisted'
  | 'interview'
  | 'rejected'
  | 'selected'
  | 'placed'
  | 'withdrawn';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  contact_number: string | null;
  account_status: AccountStatus;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  company_name: string;
  industry: string | null;
  description: string | null;
  website: string | null;
  location: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: CompanyStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  creator?: {
    name: string;
    email: string;
    role: UserRole;
  } | null;
}

export interface PlacementDrive {
  id: string;
  company_id: string;
  job_role: string;
  package_details: string;
  tier: string;
  location: string | null;
  description: string | null;
  min_cgpa: number;
  eligible_departments: string[];
  eligible_years: number[];
  max_backlogs: number;
  required_skills: string[];
  recruitment_stages: string[];
  registration_deadline: string;
  drive_date: string | null;
  drive_time: string | null;
  venue: string | null;
  instructions: string[];
  required_documents: string[];
  vacancies: string | null;
  bond_period: string | null;
  status: DriveStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  company?: Company;
}

export interface Application {
  id: string;
  student_id: string;
  drive_id: string;
  status: ApplicationStatus;
  shortlisted_at: string | null;
  interview_date: string | null;
  interview_venue: string | null;
  notes: string | null;
  applied_at: string;
  updated_at: string;
  drive?: PlacementDrive;
  student?: Student;
}

export interface Student {
  id: string;
  user_id: string;
  student_id: string;
  department: string;
  year: number;
  cgpa: number;
  skills: string[];
  placement_status: PlacementStatus;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface FacultyMember {
  id: string;
  user_id: string;
  employee_id: string;
  department: string;
  designation: string;
  cabin_location: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface PlacementOfficer {
  id: string;
  user_id: string;
  employee_id: string;
  designation: string;
  office_location: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Administrator {
  id: string;
  user_id: string;
  admin_code: string;
  access_level: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id'>>;
        Relationships: [];
      };
      companies: {
        Row: Company;
        Insert: Omit<Company, 'id' | 'created_at' | 'updated_at' | 'creator'>;
        Update: Partial<Omit<Company, 'id' | 'creator'>>;
        Relationships: [];
      };
      placement_drives: {
        Row: PlacementDrive;
        Insert: Omit<PlacementDrive, 'id' | 'created_at' | 'updated_at' | 'company'>;
        Update: Partial<Omit<PlacementDrive, 'id' | 'company'>>;
        Relationships: [];
      };
      applications: {
        Row: Application;
        Insert: Omit<Application, 'id' | 'created_at' | 'updated_at' | 'drive' | 'student'>;
        Update: Partial<Omit<Application, 'id' | 'drive' | 'student'>>;
        Relationships: [];
      };
      students: {
        Row: Student;
        Insert: Omit<Student, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Student, 'id' | 'user_id'>>;
        Relationships: [];
      };
      faculty_members: {
        Row: FacultyMember;
        Insert: Omit<FacultyMember, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<FacultyMember, 'id' | 'user_id'>>;
        Relationships: [];
      };
      placement_officers: {
        Row: PlacementOfficer;
        Insert: Omit<PlacementOfficer, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PlacementOfficer, 'id' | 'user_id'>>;
        Relationships: [];
      };
      administrators: {
        Row: Administrator;
        Insert: Omit<Administrator, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Administrator, 'id' | 'user_id'>>;
        Relationships: [];
      };
      preparation_materials: {
        Row: import('./preparation.types').PreparationMaterial;
        Insert: Omit<import('./preparation.types').PreparationMaterial, 'id' | 'created_at' | 'updated_at' | 'company' | 'questions' | 'progress'>;
        Update: Partial<Omit<import('./preparation.types').PreparationMaterial, 'id' | 'company' | 'questions' | 'progress'>>;
        Relationships: [];
      };
      interview_questions: {
        Row: import('./preparation.types').InterviewQuestion;
        Insert: Omit<import('./preparation.types').InterviewQuestion, 'id' | 'created_at' | 'company'>;
        Update: Partial<Omit<import('./preparation.types').InterviewQuestion, 'id' | 'company'>>;
        Relationships: [];
      };
      student_preparation_progress: {
        Row: import('./preparation.types').StudentPreparationProgress;
        Insert: Omit<import('./preparation.types').StudentPreparationProgress, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<import('./preparation.types').StudentPreparationProgress, 'id' | 'student_id' | 'material_id'>>;
        Relationships: [];
      };
      resumes: {
        Row: import('./resume.types').Resume;
        Insert: Omit<import('./resume.types').Resume, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<import('./resume.types').Resume, 'id' | 'student_id'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      account_status: AccountStatus;
      placement_status: PlacementStatus;
      company_status: CompanyStatus;
      drive_status: DriveStatus;
      application_status: ApplicationStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
