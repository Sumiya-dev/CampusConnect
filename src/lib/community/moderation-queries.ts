import { createClient } from '../supabase/server';
import {
  CommunityCategory,
  CommunityComment,
  CommunityPost,
  CommunityReport,
  CommunityReportStatus,
  ModerationFilterOptions,
  ModerationStats,
} from '../types/community.types';

/**
 * Superadmin: Fetch high-level moderation statistics
 */
export async function getModerationDashboardStats(): Promise<ModerationStats> {
  try {
    const supabase: any = await createClient();

    const [postsRes, commentsRes, reportsRes] = await Promise.all([
      supabase.from('community_posts').select('id, is_deleted, is_moderated'),
      supabase.from('community_comments').select('id, is_deleted, is_moderated'),
      supabase.from('community_reports').select('id, status'),
    ]);

    const posts = postsRes.data || [];
    const comments = commentsRes.data || [];
    const reports = reportsRes.data || [];

    const totalPosts = posts.length;
    const moderatedPosts = posts.filter((p: any) => p.is_moderated || p.is_deleted).length;

    const totalComments = comments.length;
    const moderatedComments = comments.filter((c: any) => c.is_moderated || c.is_deleted).length;

    const pendingReports = reports.filter((r: any) => r.status === 'Pending').length;
    const resolvedReports = reports.filter((r: any) => r.status === 'Resolved').length;
    const dismissedReports = reports.filter((r: any) => r.status === 'Dismissed').length;

    return {
      totalPosts,
      moderatedPosts,
      totalComments,
      moderatedComments,
      pendingReports,
      resolvedReports,
      dismissedReports,
    };
  } catch (err) {
    console.error('getModerationDashboardStats error:', err);
    return {
      totalPosts: 0,
      moderatedPosts: 0,
      totalComments: 0,
      moderatedComments: 0,
      pendingReports: 0,
      resolvedReports: 0,
      dismissedReports: 0,
    };
  }
}

/**
 * Superadmin: Fetch community posts with moderation metadata, author info, and report counts
 */
export async function getModerationPosts(
  filters?: ModerationFilterOptions
): Promise<CommunityPost[]> {
  try {
    const supabase: any = await createClient();

    let query = supabase
      .from('community_posts')
      .select(`
        id,
        author_id,
        category,
        visibility,
        title,
        content,
        is_deleted,
        is_moderated,
        moderation_reason,
        moderated_at,
        moderated_by,
        created_at,
        updated_at,
        author:profiles!author_id (
          id,
          name,
          role,
          department,
          avatar_url
        ),
        likes:community_likes (
          user_id
        ),
        comments:community_comments (
          id
        ),
        reports:community_reports!post_id (
          id,
          status
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.category && filters.category !== 'All') {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('getModerationPosts error:', error);
      return [];
    }

    let posts: CommunityPost[] = (data || []).map((item: any) => {
      const likesList = Array.isArray(item.likes) ? item.likes : [];
      const commentsList = Array.isArray(item.comments) ? item.comments : [];
      const reportsList = Array.isArray(item.reports) ? item.reports : [];

      return {
        id: item.id,
        author_id: item.author_id,
        category: item.category,
        visibility: item.visibility,
        title: item.title,
        content: item.content,
        is_deleted: item.is_deleted,
        is_moderated: item.is_moderated || item.is_deleted,
        moderation_reason: item.moderation_reason,
        moderated_at: item.moderated_at,
        moderated_by: item.moderated_by,
        created_at: item.created_at,
        updated_at: item.updated_at,
        author: item.author
          ? {
              id: item.author.id,
              name: item.author.name || 'Anonymous User',
              role: item.author.role,
              department: item.author.department,
              avatar_url: item.author.avatar_url,
            }
          : undefined,
        like_count: likesList.length,
        comment_count: commentsList.length,
        reports_count: reportsList.length,
      };
    });

    // Client-side text search
    if (filters?.search && filters.search.trim()) {
      const term = filters.search.toLowerCase().trim();
      posts = posts.filter((p) => {
        const matchTitle = p.title.toLowerCase().includes(term);
        const matchContent = p.content.toLowerCase().includes(term);
        const matchAuthor = p.author?.name?.toLowerCase().includes(term) ?? false;
        const matchDept = p.author?.department?.toLowerCase().includes(term) ?? false;
        return matchTitle || matchContent || matchAuthor || matchDept;
      });
    }

    // Status filter
    if (filters?.status && filters.status !== 'all') {
      if (filters.status === 'active') {
        posts = posts.filter((p) => !p.is_deleted && !p.is_moderated);
      } else if (filters.status === 'moderated') {
        posts = posts.filter((p) => p.is_deleted || p.is_moderated);
      } else if (filters.status === 'reported') {
        posts = posts.filter((p) => (p.reports_count || 0) > 0);
      }
    }

    // Author role filter
    if (filters?.authorRole && filters.authorRole !== 'all') {
      posts = posts.filter((p) => p.author?.role === filters.authorRole);
    }

    return posts;
  } catch (err) {
    console.error('getModerationPosts error:', err);
    return [];
  }
}

/**
 * Superadmin: Fetch comments with post context and moderation metadata
 */
export async function getModerationComments(filters?: {
  search?: string;
  status?: string;
}): Promise<CommunityComment[]> {
  try {
    const supabase: any = await createClient();

    const { data, error } = await supabase
      .from('community_comments')
      .select(`
        id,
        post_id,
        author_id,
        content,
        is_deleted,
        is_moderated,
        moderation_reason,
        moderated_at,
        moderated_by,
        created_at,
        updated_at,
        author:profiles!author_id (
          id,
          name,
          role,
          department,
          avatar_url
        ),
        post:community_posts!post_id (
          id,
          title
        ),
        reports:community_reports!comment_id (
          id,
          status
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getModerationComments error:', error);
      return [];
    }

    let comments: CommunityComment[] = (data || []).map((item: any) => {
      const reportsList = Array.isArray(item.reports) ? item.reports : [];

      return {
        id: item.id,
        post_id: item.post_id,
        author_id: item.author_id,
        content: item.content,
        is_deleted: item.is_deleted,
        is_moderated: item.is_moderated || item.is_deleted,
        moderation_reason: item.moderation_reason,
        moderated_at: item.moderated_at,
        moderated_by: item.moderated_by,
        created_at: item.created_at,
        updated_at: item.updated_at,
        author: item.author
          ? {
              id: item.author.id,
              name: item.author.name || 'Anonymous User',
              role: item.author.role,
              department: item.author.department,
              avatar_url: item.author.avatar_url,
            }
          : undefined,
        post: item.post ? { id: item.post.id, title: item.post.title } : undefined,
        reports_count: reportsList.length,
      };
    });

    if (filters?.search && filters.search.trim()) {
      const term = filters.search.toLowerCase().trim();
      comments = comments.filter((c) => {
        const matchContent = c.content.toLowerCase().includes(term);
        const matchAuthor = c.author?.name?.toLowerCase().includes(term) ?? false;
        const matchPost = c.post?.title?.toLowerCase().includes(term) ?? false;
        return matchContent || matchAuthor || matchPost;
      });
    }

    if (filters?.status && filters.status !== 'all') {
      if (filters.status === 'active') {
        comments = comments.filter((c) => !c.is_deleted && !c.is_moderated);
      } else if (filters.status === 'moderated') {
        comments = comments.filter((c) => c.is_deleted || c.is_moderated);
      } else if (filters.status === 'reported') {
        comments = comments.filter((c) => (c.reports_count || 0) > 0);
      }
    }

    return comments;
  } catch (err) {
    console.error('getModerationComments error:', err);
    return [];
  }
}

/**
 * Superadmin: Fetch all community reports
 */
export async function getModerationReports(filters?: {
  status?: CommunityReportStatus | 'all';
  targetType?: string;
}): Promise<CommunityReport[]> {
  try {
    const supabase: any = await createClient();

    let query = supabase
      .from('community_reports')
      .select(`
        id,
        reporter_id,
        target_type,
        post_id,
        comment_id,
        reason,
        details,
        status,
        reviewed_by,
        reviewed_at,
        resolution_notes,
        created_at,
        updated_at,
        reporter:profiles!reporter_id (
          id,
          name,
          role,
          department,
          avatar_url
        ),
        post:community_posts!post_id (
          id,
          title,
          content,
          is_deleted,
          is_moderated,
          author:profiles!author_id (
            name,
            role,
            department
          )
        ),
        comment:community_comments!comment_id (
          id,
          content,
          is_deleted,
          is_moderated,
          author:profiles!author_id (
            name,
            role,
            department
          ),
          post:community_posts!post_id (
            id,
            title
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.targetType && filters.targetType !== 'all') {
      query = query.eq('target_type', filters.targetType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('getModerationReports error:', error);
      return [];
    }

    return (data || []).map((r: any) => ({
      id: r.id,
      reporter_id: r.reporter_id,
      target_type: r.target_type,
      post_id: r.post_id,
      comment_id: r.comment_id,
      reason: r.reason,
      details: r.details,
      status: r.status,
      reviewed_by: r.reviewed_by,
      reviewed_at: r.reviewed_at,
      resolution_notes: r.resolution_notes,
      created_at: r.created_at,
      updated_at: r.updated_at,
      reporter: r.reporter,
      post: r.post,
      comment: r.comment,
    }));
  } catch (err) {
    console.error('getModerationReports error:', err);
    return [];
  }
}

/**
 * Superadmin: Fetch a single post with complete details, author info, comments, and reports
 */
export async function getPostWithModerationDetails(
  postId: string
): Promise<{ post: CommunityPost | null; comments: CommunityComment[]; reports: CommunityReport[] }> {
  try {
    const supabase: any = await createClient();

    const [postRes, commentsRes, reportsRes] = await Promise.all([
      supabase
        .from('community_posts')
        .select(`
          id,
          author_id,
          category,
          visibility,
          title,
          content,
          is_deleted,
          is_moderated,
          moderation_reason,
          moderated_at,
          moderated_by,
          created_at,
          updated_at,
          author:profiles!author_id (
            id,
            name,
            role,
            department,
            avatar_url,
            email,
            contact_number
          ),
          likes:community_likes (
            user_id
          )
        `)
        .eq('id', postId)
        .single(),

      supabase
        .from('community_comments')
        .select(`
          id,
          post_id,
          author_id,
          content,
          is_deleted,
          is_moderated,
          moderation_reason,
          moderated_at,
          moderated_by,
          created_at,
          updated_at,
          author:profiles!author_id (
            id,
            name,
            role,
            department,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true }),

      supabase
        .from('community_reports')
        .select(`
          id,
          reporter_id,
          target_type,
          post_id,
          comment_id,
          reason,
          details,
          status,
          reviewed_by,
          reviewed_at,
          resolution_notes,
          created_at,
          reporter:profiles!reporter_id (
            id,
            name,
            role,
            department
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false }),
    ]);

    if (postRes.error || !postRes.data) {
      return { post: null, comments: [], reports: [] };
    }

    const p = postRes.data;
    const likesList = Array.isArray(p.likes) ? p.likes : [];

    const post: CommunityPost = {
      id: p.id,
      author_id: p.author_id,
      category: p.category,
      visibility: p.visibility,
      title: p.title,
      content: p.content,
      is_deleted: p.is_deleted,
      is_moderated: p.is_moderated || p.is_deleted,
      moderation_reason: p.moderation_reason,
      moderated_at: p.moderated_at,
      moderated_by: p.moderated_by,
      created_at: p.created_at,
      updated_at: p.updated_at,
      author: p.author,
      like_count: likesList.length,
      comment_count: (commentsRes.data || []).length,
      reports_count: (reportsRes.data || []).length,
    };

    const comments: CommunityComment[] = (commentsRes.data || []).map((c: any) => ({
      id: c.id,
      post_id: c.post_id,
      author_id: c.author_id,
      content: c.content,
      is_deleted: c.is_deleted,
      is_moderated: c.is_moderated || c.is_deleted,
      moderation_reason: c.moderation_reason,
      moderated_at: c.moderated_at,
      moderated_by: c.moderated_by,
      created_at: c.created_at,
      updated_at: c.updated_at,
      author: c.author,
    }));

    const reports: CommunityReport[] = (reportsRes.data || []).map((r: any) => ({
      id: r.id,
      reporter_id: r.reporter_id,
      target_type: r.target_type,
      post_id: r.post_id,
      comment_id: r.comment_id,
      reason: r.reason,
      details: r.details,
      status: r.status,
      reviewed_by: r.reviewed_by,
      reviewed_at: r.reviewed_at,
      resolution_notes: r.resolution_notes,
      created_at: r.created_at,
      updated_at: r.created_at,
      reporter: r.reporter,
    }));

    return { post, comments, reports };
  } catch (err) {
    console.error('getPostWithModerationDetails error:', err);
    return { post: null, comments: [], reports: [] };
  }
}
