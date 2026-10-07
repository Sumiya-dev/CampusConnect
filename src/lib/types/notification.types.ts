export type NotificationType =
  | 'Placement'
  | 'Drive'
  | 'Deadline'
  | 'Interview'
  | 'Announcement'
  | 'System'
  | 'General';

export type NotificationStatus = 'draft' | 'scheduled' | 'sent' | 'cancelled';

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  target_roles: string[];
  target_department: string | null;
  target_year: number | null;
  target_section_id: string | null;
  target_section?: {
    id: string;
    section_name: string;
    year: number;
    academic_year: string;
    program?: {
      code: string;
      name: string;
    } | null;
  } | null;
  scheduled_at: string | null;
  sent_at: string | null;
  status: NotificationStatus;
  created_by: string | null;
  created_by_profile?: {
    id: string;
    name: string;
    email: string;
  } | null;
  created_at: string;
  updated_at: string;
  recipient_count?: number;
  read_count?: number;
}

export interface NotificationRecipientRecord {
  id: string;
  notification_id: string;
  user_id: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
  } | null;
}

export interface CreateNotificationInput {
  title: string;
  message: string;
  type: NotificationType;
  target_roles: string[];
  target_department?: string | null;
  target_year?: number | null;
  target_section_id?: string | null;
  scheduled_at?: string | null;
  send_now?: boolean;
}

export interface UpdateNotificationInput {
  title?: string;
  message?: string;
  type?: NotificationType;
  target_roles?: string[];
  target_department?: string | null;
  target_year?: number | null;
  target_section_id?: string | null;
  scheduled_at?: string | null;
}

export interface NotificationFilterOptions {
  search?: string;
  type?: string;
  target_role?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

export interface NotificationDashboardStats {
  total: number;
  sent: number;
  scheduled: number;
  draft: number;
  cancelled: number;
  totalDelivered: number;
  totalRead: number;
}

export interface TargetStructureOptions {
  departments: { id: string; name: string; code: string }[];
  academicYears: { id: string; year_number: number; display_name: string }[];
  sections: {
    id: string;
    section_name: string;
    year: number;
    academic_year: string;
    program?: {
      name: string;
      code: string;
      department_id: string;
    } | null;
  }[];
}
