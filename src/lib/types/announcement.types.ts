export type AnnouncementTargetType =
  | 'all'
  | 'department'
  | 'year'
  | 'section'
  | 'training_group';

export interface FacultyAnnouncement {
  id: string;
  faculty_id: string;
  title: string;
  content: string;
  target_type: AnnouncementTargetType;
  target_department: string | null;
  target_year: number | null;
  section_id: string | null;
  training_group_id: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;

  // Enriched joins for display
  faculty_name?: string;
  faculty_designation?: string;
  faculty_department?: string;
  section_name?: string;
  section_code?: string;
  training_group_name?: string;
  target_label?: string;
}

export interface AnnouncementSectionOption {
  id: string;
  section_code: string;
  year: number;
  academic_year: string;
}

export interface AnnouncementTrainingGroupOption {
  id: string;
  name: string;
}

export interface AnnouncementAllocationOptions {
  departments: string[];
  years: number[];
  sections: AnnouncementSectionOption[];
  training_groups: AnnouncementTrainingGroupOption[];
  faculty_department: string;
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  target_type: AnnouncementTargetType;
  target_department?: string | null;
  target_year?: number | null;
  section_id?: string | null;
  training_group_id?: string | null;
  is_published: boolean;
}
