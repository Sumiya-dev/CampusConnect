import { Application, Company, DriveStatus, PlacementDrive, Profile, Student } from './database.types';

export interface DriveWithCompany extends PlacementDrive {
  company: Company;
  applications_count?: number;
}

export interface ApplicationWithDrive extends Application {
  drive: DriveWithCompany;
}

export interface ApplicationDetailWithStudent extends Application {
  student: Student & {
    profile?: Profile;
  };
}

export interface DriveDetailWithStats extends DriveWithCompany {
  applicationsCount: number;
  applicationsBreakdown: {
    applied: number;
    shortlisted: number;
    interview: number;
    selected: number;
    placed: number;
    rejected: number;
    withdrawn: number;
  };
  eligibleStudentsCount?: number;
}

export interface EligibilityResult {
  isEligible: boolean;
  reasons: string[];
  passedChecks: string[];
  matchedSkills: string[];
  missingSkills: string[];
  cgpaDelta: number;
}

export interface DriveFilterState {
  search?: string;
  tier?: string;
  company_id?: string;
  department?: string;
  academic_year?: number | 'all';
  status?: string;
  date_filter?: 'all' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'archived';
  sortBy?: 'deadline_asc' | 'deadline_desc' | 'cgpa_asc' | 'cgpa_desc' | 'package_desc' | 'date_asc' | 'date_desc';
}

export interface ApplyActionState {
  success: boolean;
  message?: string;
  error?: string;
  applicationId?: string;
}

export interface DriveActionState {
  success: boolean;
  message?: string;
  error?: string;
  driveId?: string;
  fieldErrors?: Record<string, string>;
}

export interface DeleteDriveResult {
  success: boolean;
  blocked?: boolean;
  actionTaken?: 'deleted' | 'cancelled' | 'archived';
  reason?: string;
  error?: string;
}

