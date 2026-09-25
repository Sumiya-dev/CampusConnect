import { Application, Company, PlacementDrive } from './database.types';

export interface DriveWithCompany extends PlacementDrive {
  company: Company;
}

export interface ApplicationWithDrive extends Application {
  drive: DriveWithCompany;
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
  department?: string;
  status?: string;
  sortBy?: 'deadline_asc' | 'deadline_desc' | 'cgpa_asc' | 'cgpa_desc' | 'package_desc';
}

export interface ApplyActionState {
  success: boolean;
  message?: string;
  error?: string;
  applicationId?: string;
}
