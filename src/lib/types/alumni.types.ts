import { UserRole } from './database.types';

export type AlumniExperienceType =
  | 'Placement Experience'
  | 'Interview Experience'
  | 'Company Experience'
  | 'Career Journey'
  | 'Preparation Advice';

export type AlumniCommunityCategory =
  | 'All'
  | 'Placements'
  | 'Careers'
  | 'Interviews'
  | 'Technical'
  | 'General';

export type GuidanceRequestStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'COMPLETED';

export interface AlumniProfile {
  id: string;
  user_id: string;
  graduation_year: number | null;
  department: string | null;
  degree: string | null;
  current_company: string | null;
  job_role: string | null;
  location: string | null;
  bio: string | null;
  skills: string[];
  profile_visibility: 'public' | 'students_only' | 'private';
  linkedin_url?: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar_url?: string | null;
    department?: string | null;
  } | null;
}

export interface AlumniExperience {
  id: string;
  alumni_id: string;
  type: AlumniExperienceType;
  title: string;
  company: string | null;
  job_role: string | null;
  content: string;
  selection_process: string | null;
  preparation_tips: string | null;
  advice_for_juniors: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  alumni?: AlumniProfile | null;
}

export interface AlumniAuthorMeta {
  id: string;
  name: string;
  role: UserRole;
  department?: string | null;
  graduation_year?: number | null;
  current_company?: string | null;
  job_role?: string | null;
  avatar_url?: string | null;
}

export interface AlumniCommunityPost {
  id: string;
  author_id: string;
  category: 'Placements' | 'Careers' | 'Interviews' | 'Technical' | 'General';
  title: string;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  author: AlumniAuthorMeta;
}

export interface AlumniCommunityComment {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id: string | null;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author: AlumniAuthorMeta;
  replies?: AlumniCommunityComment[];
}

export interface AlumniCommunityLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface GuidanceRequest {
  id: string;
  student_id: string;
  alumni_id: string;
  message: string;
  status: GuidanceRequestStatus;
  response_note: string | null;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    name: string;
    email: string;
    department?: string | null;
    year?: number | null;
  } | null;
  alumni?: AlumniProfile | null;
}

export interface AlumniDirectoryFilters {
  query?: string;
  department?: string;
  graduation_year?: string;
  company?: string;
  job_role?: string;
}
