import { Company } from './database.types';

export type PreparationCategory = 'Technical' | 'Aptitude' | 'HR';
export type PreparationDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type PreparationProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface PreparationMaterial {
  id: string;
  title: string;
  description: string | null;
  category: PreparationCategory;
  sub_category: string | null;
  difficulty: PreparationDifficulty;
  company_id: string | null;
  job_role: string | null;
  estimated_time: string | null;
  content: string;
  key_takeaways: string[];
  technical_type?: 'theory' | 'coding';
  created_at: string;
  updated_at: string;
  company?: Company | null;
  questions?: InterviewQuestion[];
  progress?: StudentPreparationProgress | null;
}

export interface InterviewQuestion {
  id: string;
  material_id: string | null;
  category: PreparationCategory;
  question: string;
  answer_guide: string;
  company_id: string | null;
  job_role: string | null;
  interview_type: string;
  difficulty: PreparationDifficulty;
  sample_code: string | null;
  technical_type?: 'theory' | 'coding';
  tips: string[];
  created_at: string;
  company?: Company | null;
}

export interface StudentPreparationProgress {
  id: string;
  student_id: string;
  material_id: string;
  status: PreparationProgressStatus;
  notes: string | null;
  last_accessed_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PreparationFilterState {
  search?: string;
  category?: string;
  companyId?: string;
  jobRole?: string;
  difficulty?: string;
  status?: string;
}

export interface ProgressActionState {
  success: boolean;
  message?: string;
  error?: string;
  newStatus?: PreparationProgressStatus;
}
