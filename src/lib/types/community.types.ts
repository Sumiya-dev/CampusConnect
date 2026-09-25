import { UserRole } from './database.types';

export type CommunityCategory =
  | 'Placement'
  | 'Preparation'
  | 'Technical'
  | 'Career'
  | 'General';

export type CommunityVisibility = 'PUBLIC' | 'STUDENTS_ONLY';

export interface CommunityAuthor {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  avatar_url?: string | null;
}

export interface CommunityPost {
  id: string;
  author_id: string;
  category: CommunityCategory;
  visibility: CommunityVisibility;
  title: string;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author?: CommunityAuthor;
  like_count: number;
  comment_count: number;
  has_liked?: boolean;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author?: CommunityAuthor;
}

export interface CommunityLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface CreatePostInput {
  title: string;
  content: string;
  category: CommunityCategory;
  visibility: CommunityVisibility;
}

export interface CreateCommentInput {
  postId: string;
  content: string;
}

export interface CommunityFilterOptions {
  visibility?: CommunityVisibility;
  category?: CommunityCategory | 'All';
  searchQuery?: string;
}
