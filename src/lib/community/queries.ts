import { cookies } from 'next/headers';
import { createClient } from '../supabase/server';
import {
  CommunityCategory,
  CommunityComment,
  CommunityPost,
  CommunityVisibility,
} from '../types/community.types';
import { UserRole } from '../types/database.types';

export interface GetPostsOptions {
  visibility?: CommunityVisibility;
  category?: CommunityCategory | 'All';
  currentUserId?: string;
  currentUserRole?: UserRole;
}

// Helpers for Demo Mode posts & comments
async function getDemoPosts(): Promise<CommunityPost[]> {
  const cookieStore = await cookies();
  const val = cookieStore.get('campusconnect_demo_community_posts')?.value;
  if (!val) return [];
  try {
    return JSON.parse(val);
  } catch {
    return [];
  }
}

async function getDemoComments(): Promise<CommunityComment[]> {
  const cookieStore = await cookies();
  const val = cookieStore.get('campusconnect_demo_community_comments')?.value;
  if (!val) return [];
  try {
    return JSON.parse(val);
  } catch {
    return [];
  }
}

async function getDemoLikes(): Promise<Array<{ post_id: string; user_id: string }>> {
  const cookieStore = await cookies();
  const val = cookieStore.get('campusconnect_demo_community_likes')?.value;
  if (!val) return [];
  try {
    return JSON.parse(val);
  } catch {
    return [];
  }
}

/**
 * Fetches community posts respecting RLS and Demo Mode.
 * Non-students querying STUDENTS_ONLY posts will receive 0 rows from Postgres RLS and demo filters.
 */
export async function getCommunityPosts(
  options: GetPostsOptions = {}
): Promise<{ posts: CommunityPost[]; error?: string }> {
  const isStudent = options.currentUserRole === 'student';

  // 1. Collect Demo Mode posts
  const demoPosts = (await getDemoPosts()).filter((p) => !p.is_deleted);
  const demoLikes = await getDemoLikes();
  const demoComments = (await getDemoComments()).filter((c) => !c.is_deleted);

  const enrichedDemoPosts: CommunityPost[] = demoPosts
    .filter((p) => {
      // Non-students must never see students-only posts
      if (p.visibility === 'STUDENTS_ONLY' && !isStudent) return false;
      if (options.visibility && p.visibility !== options.visibility) return false;
      if (options.category && options.category !== 'All' && p.category !== options.category) {
        return false;
      }
      return true;
    })
    .map((post) => {
      const pLikes = demoLikes.filter((l) => l.post_id === post.id);
      const pComments = demoComments.filter((c) => c.post_id === post.id);
      return {
        ...post,
        like_count: pLikes.length,
        comment_count: pComments.length,
        has_liked: Boolean(
          options.currentUserId && pLikes.some((l) => l.user_id === options.currentUserId)
        ),
      };
    });

  // 2. Collect Live Supabase posts if user is authenticated with a real Supabase session
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder') || options.currentUserId === 'demo-user-id') {
    return { posts: enrichedDemoPosts };
  }

  try {
    const supabase = await createClient();
    let query = (supabase.from('community_posts') as any)
      .select(`
        id,
        author_id,
        category,
        visibility,
        title,
        content,
        is_deleted,
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
        )
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (options.visibility) {
      query = query.eq('visibility', options.visibility);
    }

    if (options.category && options.category !== 'All') {
      query = query.eq('category', options.category);
    }

    const { data, error } = await query;

    if (error) {
      // If Supabase table is empty or error occurs, return demo posts
      return { posts: enrichedDemoPosts, error: error.message };
    }

    const livePosts: CommunityPost[] = (data || []).map((item: any) => {
      const likesList = Array.isArray(item.likes) ? item.likes : [];
      const commentsList = Array.isArray(item.comments) ? item.comments : [];
      const hasLiked = options.currentUserId
        ? likesList.some((l: any) => l.user_id === options.currentUserId)
        : false;

      return {
        id: item.id,
        author_id: item.author_id,
        category: item.category,
        visibility: item.visibility,
        title: item.title,
        content: item.content,
        is_deleted: item.is_deleted,
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
        has_liked: hasLiked,
      };
    });

    // Merge demo posts and live posts
    const allPosts = [...enrichedDemoPosts, ...livePosts].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return { posts: allPosts };
  } catch (err: unknown) {
    return {
      posts: enrichedDemoPosts,
      error: (err as Error).message || 'Failed to fetch community posts.',
    };
  }
}

/**
 * Fetches a single community post and its comments respecting RLS and Demo Mode.
 */
export async function getCommunityPostById(
  postId: string,
  currentUserId?: string,
  currentUserRole?: UserRole
): Promise<{ post: CommunityPost | null; comments: CommunityComment[]; error?: string }> {
  const isStudent = currentUserRole === 'student';

  // 1. Check Demo Posts first
  const demoPosts = await getDemoPosts();
  const foundDemo = demoPosts.find((p) => p.id === postId && !p.is_deleted);

  if (foundDemo) {
    if (foundDemo.visibility === 'STUDENTS_ONLY' && !isStudent) {
      return { post: null, comments: [] };
    }

    const demoLikes = await getDemoLikes();
    const demoComments = await getDemoComments();

    const postLikes = demoLikes.filter((l) => l.post_id === postId);
    const postComments = demoComments.filter((c) => c.post_id === postId && !c.is_deleted);

    const post: CommunityPost = {
      ...foundDemo,
      like_count: postLikes.length,
      comment_count: postComments.length,
      has_liked: Boolean(
        currentUserId && postLikes.some((l) => l.user_id === currentUserId)
      ),
    };

    return { post, comments: postComments };
  }

  // 2. Fetch from Live Supabase if not demo
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder') || currentUserId === 'demo-user-id') {
    return { post: null, comments: [] };
  }

  try {
    const supabase = await createClient();

    // 1. Fetch Post
    const { data: postData, error: postError } = await (supabase
      .from('community_posts') as any)
      .select(`
        id,
        author_id,
        category,
        visibility,
        title,
        content,
        is_deleted,
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
        )
      `)
      .eq('id', postId)
      .eq('is_deleted', false)
      .maybeSingle();

    if (postError) {
      return { post: null, comments: [], error: postError.message };
    }

    if (!postData) {
      return { post: null, comments: [] };
    }

    const rawPost = postData as any;
    const likesList = Array.isArray(rawPost.likes) ? rawPost.likes : [];
    const commentsList = Array.isArray(rawPost.comments) ? rawPost.comments : [];
    const hasLiked = currentUserId
      ? likesList.some((l: any) => l.user_id === currentUserId)
      : false;

    const post: CommunityPost = {
      id: rawPost.id,
      author_id: rawPost.author_id,
      category: rawPost.category,
      visibility: rawPost.visibility,
      title: rawPost.title,
      content: rawPost.content,
      is_deleted: rawPost.is_deleted,
      created_at: rawPost.created_at,
      updated_at: rawPost.updated_at,
      author: rawPost.author
        ? {
            id: rawPost.author.id,
            name: rawPost.author.name || 'Anonymous User',
            role: rawPost.author.role,
            department: rawPost.author.department,
            avatar_url: rawPost.author.avatar_url,
          }
        : undefined,
      like_count: likesList.length,
      comment_count: commentsList.length,
      has_liked: hasLiked,
    };

    // 2. Fetch Comments
    const { data: commentsData, error: commentsError } = await (supabase
      .from('community_comments') as any)
      .select(`
        id,
        post_id,
        author_id,
        content,
        is_deleted,
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
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (commentsError) {
      return { post, comments: [], error: commentsError.message };
    }

    const comments: CommunityComment[] = ((commentsData as any[]) || []).map((c: any) => ({
      id: c.id,
      post_id: c.post_id,
      author_id: c.author_id,
      content: c.content,
      is_deleted: c.is_deleted,
      created_at: c.created_at,
      updated_at: c.updated_at,
      author: c.author
        ? {
            id: c.author.id,
            name: c.author.name || 'User',
            role: c.author.role,
            department: c.author.department,
            avatar_url: c.author.avatar_url,
          }
        : undefined,
    }));

    return { post, comments };
  } catch (err: unknown) {
    return {
      post: null,
      comments: [],
      error: (err as Error).message || 'Failed to fetch discussion details.',
    };
  }
}
