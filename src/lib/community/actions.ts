'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getCurrentUser } from '../auth/user';
import { createClient } from '../supabase/server';
import {
  CommunityCategory,
  CommunityComment,
  CommunityPost,
  CommunityVisibility,
} from '../types/community.types';

export interface CommunityActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

const VALID_CATEGORIES: CommunityCategory[] = [
  'Placement',
  'Preparation',
  'Technical',
  'Career',
  'General',
];

// Helper functions for Demo Mode persistence
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

async function saveDemoPosts(posts: CommunityPost[]) {
  const cookieStore = await cookies();
  cookieStore.set('campusconnect_demo_community_posts', JSON.stringify(posts), {
    path: '/',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
  });
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

async function saveDemoComments(comments: CommunityComment[]) {
  const cookieStore = await cookies();
  cookieStore.set('campusconnect_demo_community_comments', JSON.stringify(comments), {
    path: '/',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
  });
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

async function saveDemoLikes(likes: Array<{ post_id: string; user_id: string }>) {
  const cookieStore = await cookies();
  cookieStore.set('campusconnect_demo_community_likes', JSON.stringify(likes), {
    path: '/',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
  });
}

/**
 * Creates a community discussion post with database RLS enforcement.
 */
export async function createPostAction(formData: FormData): Promise<CommunityActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Authentication required. Please sign in.' };
  }

  const title = (formData.get('title') as string)?.trim();
  const content = (formData.get('content') as string)?.trim();
  const category = (formData.get('category') as string)?.trim() as CommunityCategory;
  const visibility = (formData.get('visibility') as string)?.trim() as CommunityVisibility;

  if (!title) {
    return { success: false, error: 'Discussion title is required.' };
  }

  if (title.length > 250) {
    return { success: false, error: 'Title cannot exceed 250 characters.' };
  }

  if (!content) {
    return { success: false, error: 'Post content cannot be empty.' };
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return { success: false, error: 'Invalid discussion category selected.' };
  }

  if (visibility !== 'PUBLIC' && visibility !== 'STUDENTS_ONLY') {
    return { success: false, error: 'Invalid visibility parameter.' };
  }

  // Double-check role enforcement before database insert
  if (visibility === 'STUDENTS_ONLY' && currentUser.role !== 'student') {
    return {
      success: false,
      error: 'Access Denied: Only students are permitted to create posts in the Students Only space.',
    };
  }

  // Handle Demo Mode User
  if (currentUser.id === 'demo-user-id') {
    const posts = await getDemoPosts();
    const newPost: CommunityPost = {
      id: crypto.randomUUID(),
      author_id: currentUser.id,
      title,
      content,
      category,
      visibility,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        department: currentUser.department,
      },
      like_count: 0,
      comment_count: 0,
      has_liked: false,
    };

    posts.unshift(newPost);
    await saveDemoPosts(posts);

    revalidatePath('/student/community');
    revalidatePath('/faculty/community');
    return { success: true, data: newPost };
  }

  // Live Supabase Mode
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return { success: false, error: 'Database connection unavailable.' };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await (supabase.from('community_posts') as any)
      .insert({
        author_id: currentUser.id,
        title,
        content,
        category,
        visibility,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/student/community');
    revalidatePath('/faculty/community');
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to publish post.',
    };
  }
}

/**
 * Toggles a like on a discussion post.
 */
export async function toggleLikeAction(postId: string): Promise<CommunityActionResult<{ liked: boolean }>> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Authentication required.' };
  }

  // Handle Demo Mode
  if (currentUser.id === 'demo-user-id') {
    const likes = await getDemoLikes();
    const exists = likes.some((l) => l.post_id === postId && l.user_id === currentUser.id);
    let nextLikes;
    if (exists) {
      nextLikes = likes.filter((l) => !(l.post_id === postId && l.user_id === currentUser.id));
    } else {
      nextLikes = [...likes, { post_id: postId, user_id: currentUser.id }];
    }
    await saveDemoLikes(nextLikes);

    revalidatePath('/student/community');
    revalidatePath(`/student/community/${postId}`);
    revalidatePath(`/faculty/community/${postId}`);
    return { success: true, data: { liked: !exists } };
  }

  // Live Supabase Mode
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return { success: false, error: 'Database connection unavailable.' };
  }

  try {
    const supabase = await createClient();

    // Check if like exists
    const { data: existing, error: checkError } = await (supabase.from('community_likes') as any)
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (checkError) {
      return { success: false, error: checkError.message };
    }

    if (existing) {
      const { error: deleteError } = await (supabase.from('community_likes') as any)
        .delete()
        .eq('id', existing.id);

      if (deleteError) return { success: false, error: deleteError.message };

      revalidatePath('/student/community');
      revalidatePath(`/student/community/${postId}`);
      return { success: true, data: { liked: false } };
    } else {
      const { error: insertError } = await (supabase.from('community_likes') as any)
        .insert({
          post_id: postId,
          user_id: currentUser.id,
        });

      if (insertError) return { success: false, error: insertError.message };

      revalidatePath('/student/community');
      revalidatePath(`/student/community/${postId}`);
      return { success: true, data: { liked: true } };
    }
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to update like status.',
    };
  }
}

/**
 * Adds a comment to a discussion post.
 */
export async function createCommentAction(formData: FormData): Promise<CommunityActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Authentication required. Please sign in.' };
  }

  const postId = (formData.get('postId') as string)?.trim();
  const content = (formData.get('content') as string)?.trim();

  if (!postId) {
    return { success: false, error: 'Post ID is required.' };
  }

  if (!content) {
    return { success: false, error: 'Comment text cannot be empty.' };
  }

  // Handle Demo Mode
  if (currentUser.id === 'demo-user-id') {
    const comments = await getDemoComments();
    const newComment: CommunityComment = {
      id: crypto.randomUUID(),
      post_id: postId,
      author_id: currentUser.id,
      content,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        department: currentUser.department,
      },
    };

    comments.push(newComment);
    await saveDemoComments(comments);

    revalidatePath(`/student/community/${postId}`);
    revalidatePath('/student/community');
    return { success: true, data: newComment };
  }

  // Live Supabase Mode
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return { success: false, error: 'Database connection unavailable.' };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await (supabase.from('community_comments') as any)
      .insert({
        post_id: postId,
        author_id: currentUser.id,
        content,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/student/community/${postId}`);
    revalidatePath('/student/community');
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to submit comment.',
    };
  }
}

/**
 * Deletes a user's own comment.
 */
export async function deleteCommentAction(commentId: string, postId: string): Promise<CommunityActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Authentication required.' };
  }

  // Handle Demo Mode
  if (currentUser.id === 'demo-user-id') {
    const comments = await getDemoComments();
    const updated = comments.map((c) =>
      c.id === commentId && c.author_id === currentUser.id ? { ...c, is_deleted: true } : c
    );
    await saveDemoComments(updated);

    revalidatePath(`/student/community/${postId}`);
    revalidatePath('/student/community');
    return { success: true };
  }

  // Live Supabase Mode
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return { success: false, error: 'Database connection unavailable.' };
  }

  try {
    const supabase = await createClient();

    const { error } = await (supabase.from('community_comments') as any)
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .eq('author_id', currentUser.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/student/community/${postId}`);
    revalidatePath('/student/community');
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to delete comment.',
    };
  }
}

/**
 * Deletes a user's own post.
 */
export async function deletePostAction(postId: string): Promise<CommunityActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Authentication required.' };
  }

  // Handle Demo Mode
  if (currentUser.id === 'demo-user-id') {
    const posts = await getDemoPosts();
    const updated = posts.map((p) =>
      p.id === postId && p.author_id === currentUser.id ? { ...p, is_deleted: true } : p
    );
    await saveDemoPosts(updated);

    revalidatePath('/student/community');
    revalidatePath('/faculty/community');
    return { success: true };
  }

  // Live Supabase Mode
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return { success: false, error: 'Database connection unavailable.' };
  }

  try {
    const supabase = await createClient();

    const { error } = await (supabase.from('community_posts') as any)
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', postId)
      .eq('author_id', currentUser.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/student/community');
    revalidatePath('/faculty/community');
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to delete post.',
    };
  }
}
