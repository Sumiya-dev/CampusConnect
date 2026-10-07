import { AccountStatus, UserRole } from './database.types';

export interface SuperadminProfileDetails {
  id: string;
  name: string;
  email: string;
  contactNumber: string | null;
  avatarUrl: string | null;
  role: UserRole;
  department: string;
  accountStatus: AccountStatus;
  adminCode: string;
  accessLevel: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSuperadminProfileInput {
  name: string;
  contactNumber?: string | null;
  avatarUrl?: string | null;
}

export interface SuperadminProfileActionResult {
  success: boolean;
  message?: string;
  error?: string;
}
