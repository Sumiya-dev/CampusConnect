export interface Resume {
  id: string;
  student_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UploadResumeData {
  file: File;
}
