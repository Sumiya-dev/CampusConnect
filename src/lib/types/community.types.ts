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
  is_moderated?: boolean;
  moderation_reason?: string | null;
  moderated_at?: string | null;
  moderated_by?: string | null;
  created_at: string;
  updated_at: string;
  author?: CommunityAuthor;
  like_count: number;
  comment_count: number;
  has_liked?: boolean;
  reports_count?: number;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  is_deleted: boolean;
  is_moderated?: boolean;
  moderation_reason?: string | null;
  moderated_at?: string | null;
  moderated_by?: string | null;
  created_at: string;
  updated_at: string;
  author?: CommunityAuthor;
  post?: {
    id: string;
    title: string;
  };
  reports_count?: number;
}

export type CommunityReportStatus = 'Pending' | 'Reviewed' | 'Resolved' | 'Dismissed';
export type CommunityReportTargetType = 'post' | 'comment';

export interface CommunityReport {
  id: string;
  reporter_id: string;
  target_type: CommunityReportTargetType;
  post_id: string | null;
  comment_id: string | null;
  reason: string;
  details?: string | null;
  status: CommunityReportStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  resolution_notes?: string | null;
  created_at: string;
  updated_at: string;
  reporter?: CommunityAuthor;
  post?: CommunityPost;
  comment?: CommunityComment;
}

export interface ModerationStats {
  totalPosts: number;
  moderatedPosts: number;
  totalComments: number;
  moderatedComments: number;
  pendingReports: number;
  resolvedReports: number;
  dismissedReports: number;
}

export interface ModerationFilterOptions {
  search?: string;
  category?: CommunityCategory | 'All';
  authorRole?: string;
  status?: 'all' | 'active' | 'moderated' | 'reported';
  dateRange?: string;
}

export interface ModerationActionResult {
  success: boolean;
  message?: string;
  error?: string;
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
