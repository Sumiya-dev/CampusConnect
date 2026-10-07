import { AccountStatus, PlacementStatus, UserRole } from './database.types';
import { ManagedUserSummary } from './profile.types';

export interface AdminAuditLogEntry {
  id: string;
  actor_id: string;
  actor_email: string;
  action:
    | 'user_created'
    | 'user_updated'
    | 'role_changed'
    | 'user_status_changed'
    | 'user_deactivated'
    | 'user_activated'
    | 'user_deleted'
    | 'security_event';
  target_user_id: string | null;
  target_user_email: string | null;
  details: Record<string, unknown>;
  status: 'success' | 'failure';
  created_at: string;
}

export interface CreateUserFormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  contactNumber?: string;
  identifier?: string;
  cgpa?: number;
  year?: number;
  designation?: string;
  cabinLocation?: string;
  officeLocation?: string;
  adminCode?: string;
  accessLevel?: string;
}

export interface EditUserFormData {
  id: string;
  name: string;
  department: string;
  contactNumber?: string;
  identifier?: string;
  cgpa?: number;
  year?: number;
  designation?: string;
  cabinLocation?: string;
  officeLocation?: string;
}

export interface UserManagementOverviewData {
  users: ManagedUserSummary[];
  auditLogs: AdminAuditLogEntry[];
  departments: string[];
  currentUserAdminId: string;
  totalActiveAdmins: number;
}
