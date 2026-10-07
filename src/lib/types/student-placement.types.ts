import { ApplicationStatus, PlacementStatus, UserRole } from './database.types';

export interface StudentPlacementRosterItem {
  id: string; // student UUID
  userId: string;
  studentId: string; // Roll number
  name: string;
  email: string;
  avatarUrl: string | null;
  department: string;
  year: number;
  cgpa: number;
  skills: string[];
  placementStatus: PlacementStatus;
  programName?: string | null;
  sectionName?: string | null;
  totalApplications: number;
  shortlistedCount: number;
  interviewCount: number;
  selectedCount: number;
  placedCount: number;
  placedCompany?: string | null;
  placedPackage?: string | null;
  latestActivityAt: string | null;
}

export interface StudentApplicationItem {
  id: string;
  driveId: string;
  jobRole: string;
  packageDetails: string;
  tier: string;
  companyId: string;
  companyName: string;
  companyIndustry?: string | null;
  status: ApplicationStatus;
  appliedAt: string;
  shortlistedAt: string | null;
  interviewDate: string | null;
  interviewVenue: string | null;
  notes: string | null;
  updatedAt: string;
}

export interface ApplicationHistoryItem {
  id: string;
  applicationId: string;
  driveId: string;
  jobRole: string;
  companyName: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  notes: string | null;
  interviewDate: string | null;
  interviewVenue: string | null;
  changedByName?: string | null;
  changedByEmail?: string | null;
  createdAt: string;
}

export interface EligibleDriveOpportunity {
  driveId: string;
  jobRole: string;
  companyName: string;
  companyIndustry?: string | null;
  packageDetails: string;
  tier: string;
  location: string | null;
  registrationDeadline: string;
  driveDate: string | null;
  status: string;
  isEligible: boolean;
  eligibilityReasons: string[];
  hasApplied: boolean;
  applicationStatus?: ApplicationStatus;
}

export interface StudentPlacementDetail {
  id: string;
  userId: string;
  studentId: string; // Roll number
  name: string;
  email: string;
  contactNumber: string | null;
  avatarUrl: string | null;
  department: string;
  year: number;
  cgpa: number;
  skills: string[];
  placementStatus: PlacementStatus;
  programName?: string | null;
  sectionName?: string | null;
  academicYear?: string | null;
  resume?: {
    id: string;
    fileName: string;
    filePath: string;
    fileType: string;
    updatedAt: string;
  } | null;
  applications: StudentApplicationItem[];
  history: ApplicationHistoryItem[];
  eligibleDrives: EligibleDriveOpportunity[];
  placedDetails?: {
    companyName: string;
    jobRole: string;
    packageDetails: string;
    placedAt: string;
  } | null;
}

export interface StudentPlacementStats {
  totalStudents: number;
  placedStudents: number;
  inProcessStudents: number;
  unplacedStudents: number;
  optedOutStudents: number;
  totalApplications: number;
  totalOffers: number;
  placementRate: number; // percentage
}

export interface StudentPlacementFilter {
  search?: string;
  department?: string;
  academic_year?: number | 'all';
  placement_status?: string;
  company_id?: string;
  drive_id?: string;
}

export interface StudentPlacementFilterOptions {
  departments: string[];
  academicYears: number[];
  companies: { id: string; name: string }[];
  drives: { id: string; job_role: string; company_name: string }[];
}

export interface StudentPlacementActionState {
  success: boolean;
  message?: string;
  error?: string;
}
