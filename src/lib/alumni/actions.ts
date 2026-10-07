'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getCurrentUser } from '../auth/user';
import { createClient } from '../supabase/server';
import {
  AlumniCommunityCategory,
  AlumniCommunityComment,
  AlumniCommunityPost,
  AlumniExperience,
  AlumniExperienceType,
  GuidanceRequest,
  GuidanceRequestStatus,
} from '../types/alumni.types';

export interface AlumniActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

const VALID_COMMUNITY_CATEGORIES: AlumniCommunityCategory[] = [
  'Placements',
  'Careers',
  'Interviews',
  'Technical',
  'General',
];

const VALID_EXPERIENCE_TYPES: AlumniExperienceType[] = [
  'Placement Experience',
  'Interview Experience',
  'Company Experience',
  'Career Journey',
  'Preparation Advice',
];

// Cookie helpers for demo mode
async function getDemoPosts(): Promise<AlumniCommunityPost[]> {
  const cookieStore = await cookies();
  const val = cookieStore.get('campusconnect_demo_alumni_posts')?.value;
  if (!val) return [];
  try {
    return JSON.parse(val);
  } catch {
    return [];
  }
}

async function saveDemoPosts(posts: AlumniCommunityPost[]) {
  const cookieStore = await cookies();
  cookieStore.set('campusconnect_demo_alumni_posts', JSON.stringify(posts), {
    path: '/',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
  });
}

async function getDemoComments(): Promise<AlumniCommunityComment[]> {
  const cookieStore = await cookies();
  const val = cookieStore.get('campusconnect_demo_alumni_comments')?.value;
  if (!val) return [];
  try {
    return JSON.parse(val);
  } catch {
    return [];
  }
}

async function saveDemoComments(comments: AlumniCommunityComment[]) {
  const cookieStore = await cookies();
  cookieStore.set('campusconnect_demo_alumni_comments', JSON.stringify(comments), {
    path: '/',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
  });
}

async function getDemoLikes(): Promise<Array<{ post_id: string; user_id: string }>> {
  const cookieStore = await cookies();
  const val = cookieStore.get('campusconnect_demo_alumni_likes')?.value;
  if (!val) return [];
  try {
    return JSON.parse(val);
  } catch {
    return [];
  }
}

async function saveDemoLikes(likes: Array<{ post_id: string; user_id: string }>) {
  const cookieStore = await cookies();
  cookieStore.set('campusconnect_demo_alumni_likes', JSON.stringify(likes), {
    path: '/',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
  });
}

async function getDemoGuidanceRequests(): Promise<GuidanceRequest[]> {
  const cookieStore = await cookies();
  const val = cookieStore.get('campusconnect_demo_guidance_requests')?.value;
  if (!val) return [];
  try {
    return JSON.parse(val);
  } catch {
    return [];
  }
}

async function saveDemoGuidanceRequests(reqs: GuidanceRequest[]) {
  const cookieStore = await cookies();
  cookieStore.set('campusconnect_demo_guidance_requests', JSON.stringify(reqs), {
    path: '/',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
  });
}

async function getDemoExperiences(): Promise<AlumniExperience[]> {
  const cookieStore = await cookies();
  const val = cookieStore.get('campusconnect_demo_alumni_experiences')?.value;
  if (!val) return [];
  try {
    return JSON.parse(val);
  } catch {
    return [];
  }
}

async function saveDemoExperiences(exps: AlumniExperience[]) {
  const cookieStore = await cookies();
  cookieStore.set('campusconnect_demo_alumni_experiences', JSON.stringify(exps), {
    path: '/',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
  });
}

// ==========================================
// 1. COMMUNITY POST ACTIONS
// ==========================================
export async function createAlumniPostAction(formData: FormData): Promise<AlumniActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Authentication required. Please sign in.' };
  }

  // RBAC: Only Student and Alumni can participate in Alumni Community
  if (currentUser.role !== 'student' && currentUser.role !== 'alumni') {
    return {
      success: false,
      error: 'Access Denied: The Alumni Community is exclusively for students and alumni.',
    };
  }

  const title = (formData.get('title') as string)?.trim();
  const content = (formData.get('content') as string)?.trim();
  const category = (formData.get('category') as string)?.trim() as AlumniCommunityCategory;

  if (!title) return { success: false, error: 'Discussion title is required.' };
  if (title.length > 250) return { success: false, error: 'Title cannot exceed 250 characters.' };
  if (!content) return { success: false, error: 'Post content cannot be empty.' };
  if (!VALID_COMMUNITY_CATEGORIES.includes(category)) {
    return { success: false, error: 'Invalid discussion category selected.' };
  }

  // Demo user fallback
  if (currentUser.id === 'demo-user-id') {
    const posts = await getDemoPosts();
    const newPost: AlumniCommunityPost = {
      id: crypto.randomUUID(),
      author_id: currentUser.id,
      category: category as any,
      title,
      content,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes_count: 0,
      comments_count: 0,
      is_liked: false,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        department: currentUser.department,
      },
    };
    posts.unshift(newPost);
    await saveDemoPosts(posts);

    revalidatePath('/student/alumni/community');
    return { success: true, data: newPost };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return { success: false, error: 'Database connection unavailable.' };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await (supabase.from('alumni_community_posts') as any)
      .insert({
        author_id: currentUser.id,
        category,
        title,
        content,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/student/alumni/community');
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to publish post.',
    };
  }
}

export async function toggleAlumniLikeAction(postId: string): Promise<AlumniActionResult<{ liked: boolean }>> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Authentication required.' };

  if (currentUser.role !== 'student' && currentUser.role !== 'alumni') {
    return { success: false, error: 'Access Denied.' };
  }

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

    revalidatePath('/student/alumni/community');
    revalidatePath(`/student/alumni/community/${postId}`);
    return { success: true, data: { liked: !exists } };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return { success: false, error: 'Database connection unavailable.' };
  }

  try {
    const supabase = await createClient();
    const { data: existing, error: checkError } = await (supabase.from('alumni_community_likes') as any)
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (checkError) return { success: false, error: checkError.message };

    if (existing) {
      const { error: deleteError } = await (supabase.from('alumni_community_likes') as any)
        .delete()
        .eq('id', existing.id);

      if (deleteError) return { success: false, error: deleteError.message };

      revalidatePath('/student/alumni/community');
      revalidatePath(`/student/alumni/community/${postId}`);
      return { success: true, data: { liked: false } };
    } else {
      const { error: insertError } = await (supabase.from('alumni_community_likes') as any)
        .insert({
          post_id: postId,
          user_id: currentUser.id,
        });

      if (insertError) return { success: false, error: insertError.message };

      revalidatePath('/student/alumni/community');
      revalidatePath(`/student/alumni/community/${postId}`);
      return { success: true, data: { liked: true } };
    }
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to update like status.',
    };
  }
}

export async function createAlumniCommentAction(formData: FormData): Promise<AlumniActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Authentication required. Please sign in.' };

  if (currentUser.role !== 'student' && currentUser.role !== 'alumni') {
    return { success: false, error: 'Access Denied.' };
  }

  const postId = (formData.get('postId') as string)?.trim();
  const parentCommentId = (formData.get('parentCommentId') as string)?.trim() || null;
  const content = (formData.get('content') as string)?.trim();

  if (!postId) return { success: false, error: 'Post ID is required.' };
  if (!content) return { success: false, error: 'Comment content cannot be empty.' };

  if (currentUser.id === 'demo-user-id') {
    const comments = await getDemoComments();
    const newComment: AlumniCommunityComment = {
      id: crypto.randomUUID(),
      post_id: postId,
      author_id: currentUser.id,
      parent_comment_id: parentCommentId,
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

    revalidatePath(`/student/alumni/community/${postId}`);
    revalidatePath('/student/alumni/community');
    return { success: true, data: newComment };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return { success: false, error: 'Database connection unavailable.' };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await (supabase.from('alumni_community_comments') as any)
      .insert({
        post_id: postId,
        author_id: currentUser.id,
        parent_comment_id: parentCommentId,
        content,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath(`/student/alumni/community/${postId}`);
    revalidatePath('/student/alumni/community');
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to submit comment.',
    };
  }
}

export async function deleteAlumniCommentAction(
  commentId: string,
  postId: string
): Promise<AlumniActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Authentication required.' };

  if (currentUser.id === 'demo-user-id') {
    const comments = await getDemoComments();
    const updated = comments.map((c) =>
      c.id === commentId && c.author_id === currentUser.id ? { ...c, is_deleted: true } : c
    );
    await saveDemoComments(updated);

    revalidatePath(`/student/alumni/community/${postId}`);
    return { success: true };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return { success: false, error: 'Database connection unavailable.' };
  }

  try {
    const supabase = await createClient();
    const { error } = await (supabase.from('alumni_community_comments') as any)
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .eq('author_id', currentUser.id);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/student/alumni/community/${postId}`);
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to delete comment.',
    };
  }
}

export async function deleteAlumniPostAction(postId: string): Promise<AlumniActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Authentication required.' };

  if (currentUser.id === 'demo-user-id') {
    const posts = await getDemoPosts();
    const updated = posts.map((p) =>
      p.id === postId && p.author_id === currentUser.id ? { ...p, is_deleted: true } : p
    );
    await saveDemoPosts(updated);

    revalidatePath('/student/alumni/community');
    return { success: true };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return { success: false, error: 'Database connection unavailable.' };
  }

  try {
    const supabase = await createClient();
    const { error } = await (supabase.from('alumni_community_posts') as any)
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', postId)
      .eq('author_id', currentUser.id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/student/alumni/community');
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to delete post.',
    };
  }
}

// ==========================================
// 2. GUIDANCE REQUEST ACTIONS
// ==========================================
export async function createGuidanceRequestAction(formData: FormData): Promise<AlumniActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Authentication required. Please sign in.' };

  // Only students can create guidance requests
  if (currentUser.role !== 'student') {
    return { success: false, error: 'Only current students can submit guidance requests.' };
  }

  const alumniId = (formData.get('alumniId') as string)?.trim();
  const message = (formData.get('message') as string)?.trim();

  if (!alumniId) return { success: false, error: 'Target alumni ID is required.' };
  if (!message || message.length < 10) {
    return { success: false, error: 'Please describe the guidance or advice you are seeking (at least 10 characters).' };
  }

  if (currentUser.id === 'demo-user-id') {
    const reqs = await getDemoGuidanceRequests();
    const newReq: GuidanceRequest = {
      id: crypto.randomUUID(),
      student_id: currentUser.id,
      alumni_id: alumniId,
      message,
      status: 'PENDING',
      response_note: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      student: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        department: currentUser.department,
      },
    };
    reqs.unshift(newReq);
    await saveDemoGuidanceRequests(reqs);

    revalidatePath('/student/alumni/guidance');
    revalidatePath(`/student/alumni/${alumniId}`);
    return { success: true, data: newReq };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return { success: false, error: 'Database connection unavailable.' };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await (supabase.from('guidance_requests') as any)
      .insert({
        student_id: currentUser.id,
        alumni_id: alumniId,
        message,
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath('/student/alumni/guidance');
    revalidatePath(`/student/alumni/${alumniId}`);
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to submit guidance request.',
    };
  }
}

export async function updateGuidanceRequestStatusAction(
  requestId: string,
  status: GuidanceRequestStatus,
  responseNote?: string
): Promise<AlumniActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Authentication required.' };

  const validStatuses: GuidanceRequestStatus[] = ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'];
  if (!validStatuses.includes(status)) {
    return { success: false, error: 'Invalid guidance status.' };
  }

  if (currentUser.id === 'demo-user-id') {
    const reqs = await getDemoGuidanceRequests();
    const updated = reqs.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status,
            response_note: responseNote || r.response_note,
            updated_at: new Date().toISOString(),
          }
        : r
    );
    await saveDemoGuidanceRequests(updated);

    revalidatePath('/student/alumni/guidance');
    return { success: true };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return { success: false, error: 'Database connection unavailable.' };
  }

  try {
    const supabase = await createClient();
    const updatePayload: any = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (responseNote !== undefined) {
      updatePayload.response_note = responseNote;
    }

    const { error } = await (supabase.from('guidance_requests') as any)
      .update(updatePayload)
      .eq('id', requestId);

    if (error) return { success: false, error: error.message };

    revalidatePath('/student/alumni/guidance');
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to update guidance status.',
    };
  }
}

// ==========================================
// 3. ALUMNI EXPERIENCES ACTIONS
// ==========================================
export async function createAlumniExperienceAction(formData: FormData): Promise<AlumniActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Authentication required. Please sign in.' };

  // Only Alumni role can publish alumni experiences
  if (currentUser.role !== 'alumni') {
    return { success: false, error: 'Access Denied: Only alumni can share experiences.' };
  }

  const type = (formData.get('type') as string)?.trim() as AlumniExperienceType;
  const title = (formData.get('title') as string)?.trim();
  const company = (formData.get('company') as string)?.trim() || null;
  const jobRole = (formData.get('jobRole') as string)?.trim() || null;
  const content = (formData.get('content') as string)?.trim();
  const selectionProcess = (formData.get('selectionProcess') as string)?.trim() || null;
  const preparationTips = (formData.get('preparationTips') as string)?.trim() || null;
  const adviceForJuniors = (formData.get('adviceForJuniors') as string)?.trim() || null;

  if (!type || !VALID_EXPERIENCE_TYPES.includes(type)) {
    return { success: false, error: 'Invalid experience type.' };
  }
  if (!title) return { success: false, error: 'Experience title is required.' };
  if (!content) return { success: false, error: 'Experience content cannot be empty.' };

  if (currentUser.id === 'demo-user-id') {
    const experiences = await getDemoExperiences();
    const newExp: AlumniExperience = {
      id: crypto.randomUUID(),
      alumni_id: currentUser.id,
      type,
      title,
      company,
      job_role: jobRole,
      content,
      selection_process: selectionProcess,
      preparation_tips: preparationTips,
      advice_for_juniors: adviceForJuniors,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    experiences.unshift(newExp);
    await saveDemoExperiences(experiences);

    revalidatePath('/student/alumni/experiences');
    return { success: true, data: newExp };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return { success: false, error: 'Database connection unavailable.' };
  }

  try {
    const supabase = await createClient();

    // Find this alumni's profile id
    const { data: myProfile, error: profileError } = await (supabase.from('alumni_profiles') as any)
      .select('id')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (profileError || !myProfile) {
      return {
        success: false,
        error: 'Alumni profile record not found. Please ensure your alumni profile is complete.',
      };
    }

    const { data, error } = await (supabase.from('alumni_experiences') as any)
      .insert({
        alumni_id: myProfile.id,
        type,
        title,
        company,
        job_role: jobRole,
        content,
        selection_process: selectionProcess,
        preparation_tips: preparationTips,
        advice_for_juniors: adviceForJuniors,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath('/student/alumni/experiences');
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to publish experience.',
    };
  }
}

export async function deleteAlumniExperienceAction(experienceId: string): Promise<AlumniActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Authentication required.' };

  if (currentUser.id === 'demo-user-id') {
    const experiences = await getDemoExperiences();
    const updated = experiences.map((e) =>
      e.id === experienceId ? { ...e, is_deleted: true } : e
    );
    await saveDemoExperiences(updated);

    revalidatePath('/student/alumni/experiences');
    return { success: true };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return { success: false, error: 'Database connection unavailable.' };
  }

  try {
    const supabase = await createClient();
    const { error } = await (supabase.from('alumni_experiences') as any)
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', experienceId);

    if (error) return { success: false, error: error.message };

    revalidatePath('/student/alumni/experiences');
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to delete experience.',
    };
  }
}
