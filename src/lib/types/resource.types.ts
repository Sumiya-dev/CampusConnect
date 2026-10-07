export type ResourceTargetType = 'all' | 'section' | 'training_group';

export interface FacultyResource {
  id: string;
  faculty_id: string;
  title: string;
  description: string | null;
  subject: string;
  target_type: ResourceTargetType;
  section_id: string | null;
  training_group_id: string | null;
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  // Enriched joins
  section_name?: string;
  training_group_name?: string;
  faculty_name?: string;
  faculty_department?: string;
}

export interface AllocatedSectionOption {
  id: string;
  section_code: string;
  year: number;
  academic_year: string;
}

export interface AllocatedTrainingGroupOption {
  id: string;
  name: string;
}

export interface ResourceAllocationOptions {
  sections: AllocatedSectionOption[];
  training_groups: AllocatedTrainingGroupOption[];
}
