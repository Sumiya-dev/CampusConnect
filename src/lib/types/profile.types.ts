import { AccountStatus, PlacementStatus, UserRole } from './database.types';

export interface BaseProfileData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  contactNumber: string | null;
  accountStatus: AccountStatus;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentProfileData extends BaseProfileData {
  role: 'student';
  studentId: string;
  year: number;
  cgpa: number;
  skills: string[];
  technicalSkills?: string[];
  nonTechnicalSkills?: string[];
  resumeName?: string | null;
  resumeUrl?: string | null;
  resumeUploadedAt?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  placementStatus: PlacementStatus;
}

export interface FacultyProfileData extends BaseProfileData {
  role: 'faculty';
  employeeId: string;
  designation: string;
  cabinLocation: string | null;
}

export interface PlacementProfileData extends BaseProfileData {
  role: 'placement_officer';
  employeeId: string;
  designation: string;
  officeLocation: string | null;
}

export interface AdminProfileData extends BaseProfileData {
  role: 'administrator';
  adminCode: string;
  accessLevel: string;
}

export type FullUserProfile =
  | StudentProfileData
  | FacultyProfileData
  | PlacementProfileData
  | AdminProfileData;

export interface ManagedUserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  contactNumber: string | null;
  accountStatus: AccountStatus;
  identifier: string; // student_id, employee_id, or admin_code
  year?: number;
  cgpa?: number;
  skills?: string[];
  placementStatus?: PlacementStatus;
  designation?: string;
  location?: string | null;
  createdAt: string;
}

export interface ProfileActionState {
  success?: boolean;
  message?: string;
  error?: string;
}
