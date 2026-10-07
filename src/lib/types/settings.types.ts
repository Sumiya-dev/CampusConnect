import { ApplicationStatus } from './database.types';

export type SettingCategory = 'general' | 'placement' | 'notifications' | 'system_controls';

export interface GeneralSettings {
  university_name: string;
  university_code: string;
  support_email: string;
  support_phone: string;
  placement_cell_office: string;
  default_academic_calendar: string;
  platform_status: 'operational' | 'maintenance' | 'read_only';
  maintenance_message: string;
}

export interface PlacementSettings {
  allow_multiple_offers: boolean;
  max_active_applications: number;
  auto_lock_on_deadline: boolean;
  default_min_cgpa: number;
  default_max_backlogs: number;
  allow_student_withdraw: boolean;
  default_tier: string;
  default_status: ApplicationStatus;
  enable_backlog_grace: boolean;
  require_resume_attached: boolean;
}

export interface NotificationSettings {
  enable_placement_alerts: boolean;
  enable_drive_updates: boolean;
  enable_interview_calls: boolean;
  enable_deadline_reminders: boolean;
  enable_general_announcements: boolean;
  enable_system_alerts: boolean;
  default_delivery_in_app: boolean;
  default_email_dispatch: boolean;
  digest_frequency: 'immediate' | 'daily' | 'weekly';
}

export interface SystemControlSettings {
  maintenance_mode: boolean;
  enable_community_hub: boolean;
  enable_peer_guidance: boolean;
  enable_resume_builder: boolean;
  enable_mock_tests: boolean;
  enable_company_registration: boolean;
  allow_profile_edit: boolean;
}

export interface SystemSettingsBundle {
  general: GeneralSettings;
  placement: PlacementSettings;
  notifications: NotificationSettings;
  system_controls: SystemControlSettings;
  metadata?: Partial<Record<SettingCategory, {
    updated_at: string;
    updated_by: string | null;
  }>>;
}

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  university_name: 'CampusConnect Institute of Technology',
  university_code: 'CCIT-001',
  support_email: 'support@campusconnect.edu',
  support_phone: '+91 98765 43210',
  placement_cell_office: 'Career Guidance & Placement Center, Admin Block, Floor 2',
  default_academic_calendar: '2025-2026',
  platform_status: 'operational',
  maintenance_message: 'CampusConnect is undergoing scheduled maintenance. Normal operations will resume shortly.',
};

export const DEFAULT_PLACEMENT_SETTINGS: PlacementSettings = {
  allow_multiple_offers: false,
  max_active_applications: 5,
  auto_lock_on_deadline: true,
  default_min_cgpa: 6.00,
  default_max_backlogs: 0,
  allow_student_withdraw: true,
  default_tier: 'Core Recruiter',
  default_status: 'applied',
  enable_backlog_grace: false,
  require_resume_attached: true,
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enable_placement_alerts: true,
  enable_drive_updates: true,
  enable_interview_calls: true,
  enable_deadline_reminders: true,
  enable_general_announcements: true,
  enable_system_alerts: true,
  default_delivery_in_app: true,
  default_email_dispatch: false,
  digest_frequency: 'immediate',
};

export const DEFAULT_SYSTEM_CONTROL_SETTINGS: SystemControlSettings = {
  maintenance_mode: false,
  enable_community_hub: true,
  enable_peer_guidance: true,
  enable_resume_builder: true,
  enable_mock_tests: true,
  enable_company_registration: false,
  allow_profile_edit: true,
};
