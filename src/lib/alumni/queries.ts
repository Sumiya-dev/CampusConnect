import { cookies } from 'next/headers';
import { createClient } from '../supabase/server';
import {
  AlumniAuthorMeta,
  AlumniCommunityCategory,
  AlumniCommunityComment,
  AlumniCommunityPost,
  AlumniDirectoryFilters,
  AlumniExperience,
  AlumniProfile,
  GuidanceRequest,
} from '../types/alumni.types';
import { UserRole } from '../types/database.types';

// ==========================================
// DEMO COOKIE HELPERS (for demo-user-id support)
// ==========================================
async function getDemoAlumniProfiles(): Promise<AlumniProfile[]> {
  const cookieStore = await cookies();
  const val = cookieStore.get('campusconnect_demo_alumni_profiles')?.value;
  if (!val) return [];
  try {
    return JSON.parse(val);
  } catch {
    return [];
  }
}

async function getDemoAlumniExperiences(): Promise<AlumniExperience[]> {
  const cookieStore = await cookies();
  const val = cookieStore.get('campusconnect_demo_alumni_experiences')?.value;
  if (!val) return [];
  try {
    return JSON.parse(val);
  } catch {
    return [];
  }
}

async function getDemoAlumniPosts(): Promise<AlumniCommunityPost[]> {
  const cookieStore = await cookies();
  const val = cookieStore.get('campusconnect_demo_alumni_posts')?.value;
  if (!val) return [];
  try {
    return JSON.parse(val);
  } catch {
    return [];
  }
}

async function getDemoAlumniComments(): Promise<AlumniCommunityComment[]> {
  const cookieStore = await cookies();
  const val = cookieStore.get('campusconnect_demo_alumni_comments')?.value;
  if (!val) return [];
  try {
    return JSON.parse(val);
  } catch {
    return [];
  }
}

async function getDemoAlumniLikes(): Promise<Array<{ post_id: string; user_id: string }>> {
  const cookieStore = await cookies();
  const val = cookieStore.get('campusconnect_demo_alumni_likes')?.value;
  if (!val) return [];
  try {
    return JSON.parse(val);
  } catch {
    return [];
  }
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

// ==========================================
// 1. ALUMNI DIRECTORY QUERIES
// ==========================================
export async function getAlumniProfiles(
  filters: AlumniDirectoryFilters = {},
  currentUserId?: string
): Promise<{ profiles: AlumniProfile[]; error?: string }> {
  const demoProfiles = await getDemoAlumniProfiles();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder') || currentUserId === 'demo-user-id') {
    // Return filtered demo profiles
    let filtered = [...demoProfiles];
    if (filters.query) {
      const q = filters.query.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.user?.name.toLowerCase().includes(q) ||
          p.current_company?.toLowerCase().includes(q) ||
          p.job_role?.toLowerCase().includes(q) ||
          p.department?.toLowerCase().includes(q) ||
          p.skills?.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (filters.department && filters.department !== 'all') {
      filtered = filtered.filter((p) => p.department === filters.department);
    }
    if (filters.graduation_year && filters.graduation_year !== 'all') {
      filtered = filtered.filter((p) => String(p.graduation_year) === filters.graduation_year);
    }
    if (filters.company && filters.company !== 'all') {
      filtered = filtered.filter(
        (p) => p.current_company?.toLowerCase() === filters.company?.toLowerCase()
      );
    }
    if (filters.job_role && filters.job_role !== 'all') {
      filtered = filtered.filter((p) =>
        p.job_role?.toLowerCase().includes((filters.job_role || '').toLowerCase())
      );
    }
    return { profiles: filtered };
  }

  try {
    const supabase = await createClient();
    let query = (supabase.from('alumni_profiles') as any)
      .select(`
        id,
        user_id,
        graduation_year,
        department,
        degree,
        current_company,
        job_role,
        location,
        bio,
        skills,
        profile_visibility,
        linkedin_url,
        created_at,
        updated_at,
        user:profiles!user_id (
          id,
          name,
          email,
          role,
          avatar_url,
          department
        )
      `)
      .order('created_at', { ascending: false });

    if (filters.department && filters.department !== 'all') {
      query = query.eq('department', filters.department);
    }
    if (filters.graduation_year && filters.graduation_year !== 'all') {
      query = query.eq('graduation_year', parseInt(filters.graduation_year, 10));
    }
    if (filters.company && filters.company !== 'all') {
      query = query.ilike('current_company', `%${filters.company}%`);
    }
    if (filters.job_role && filters.job_role !== 'all') {
      query = query.ilike('job_role', `%${filters.job_role}%`);
    }

    const { data, error } = await query;
    if (error) {
      return { profiles: demoProfiles, error: error.message };
    }

    let results: AlumniProfile[] = ((data as any[]) || []).map((item) => ({
      id: item.id,
      user_id: item.user_id,
      graduation_year: item.graduation_year,
      department: item.department || item.user?.department || null,
      degree: item.degree || 'B.Tech',
      current_company: item.current_company,
      job_role: item.job_role,
      location: item.location,
      bio: item.bio,
      skills: Array.isArray(item.skills) ? item.skills : [],
      profile_visibility: item.profile_visibility || 'public',
      linkedin_url: item.linkedin_url,
      created_at: item.created_at,
      updated_at: item.updated_at,
      user: item.user
        ? {
            id: item.user.id,
            name: item.user.name,
            email: item.user.email,
            role: item.user.role,
            avatar_url: item.user.avatar_url,
            department: item.user.department,
          }
        : null,
    }));

    if (filters.query) {
      const q = filters.query.toLowerCase();
      results = results.filter(
        (p) =>
          p.user?.name.toLowerCase().includes(q) ||
          p.current_company?.toLowerCase().includes(q) ||
          p.job_role?.toLowerCase().includes(q) ||
          p.department?.toLowerCase().includes(q) ||
          p.skills?.some((s) => s.toLowerCase().includes(q))
      );
    }

    const combined = [...demoProfiles, ...results];
    return { profiles: combined };
  } catch (err: unknown) {
    return {
      profiles: demoProfiles,
      error: (err as Error).message || 'Failed to fetch alumni directory.',
    };
  }
}

export async function getAlumniProfileById(
  alumniId: string,
  currentUserId?: string
): Promise<{ profile: AlumniProfile | null; experiences: AlumniExperience[]; error?: string }> {
  // Check demo profiles first
  const demoProfiles = await getDemoAlumniProfiles();
  const demoExp = await getDemoAlumniExperiences();
  const foundDemo = demoProfiles.find((p) => p.id === alumniId || p.user_id === alumniId);
  if (foundDemo) {
    const experiences = demoExp.filter((e) => e.alumni_id === foundDemo.id && !e.is_deleted);
    return { profile: foundDemo, experiences };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder') || currentUserId === 'demo-user-id') {
    return { profile: null, experiences: [] };
  }

  try {
    const supabase = await createClient();

    // Query by alumni_profiles.id or user_id
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(alumniId);
    if (!isUuid) {
      return { profile: null, experiences: [] };
    }

    const { data, error } = await (supabase.from('alumni_profiles') as any)
      .select(`
        id,
        user_id,
        graduation_year,
        department,
        degree,
        current_company,
        job_role,
        location,
        bio,
        skills,
        profile_visibility,
        linkedin_url,
        created_at,
        updated_at,
        user:profiles!user_id (
          id,
          name,
          email,
          role,
          avatar_url,
          department
        )
      `)
      .or(`id.eq.${alumniId},user_id.eq.${alumniId}`)
      .maybeSingle();

    if (error) {
      return { profile: null, experiences: [], error: error.message };
    }
    if (!data) {
      return { profile: null, experiences: [] };
    }

    const item = data as any;
    const profile: AlumniProfile = {
      id: item.id,
      user_id: item.user_id,
      graduation_year: item.graduation_year,
      department: item.department || item.user?.department || null,
      degree: item.degree || 'B.Tech',
      current_company: item.current_company,
      job_role: item.job_role,
      location: item.location,
      bio: item.bio,
      skills: Array.isArray(item.skills) ? item.skills : [],
      profile_visibility: item.profile_visibility || 'public',
      linkedin_url: item.linkedin_url,
      created_at: item.created_at,
      updated_at: item.updated_at,
      user: item.user
        ? {
            id: item.user.id,
            name: item.user.name,
            email: item.user.email,
            role: item.user.role,
            avatar_url: item.user.avatar_url,
            department: item.user.department,
          }
        : null,
    };

    // Fetch this alumni's experiences
    const { data: expData } = await (supabase.from('alumni_experiences') as any)
      .select('*')
      .eq('alumni_id', profile.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    const experiences: AlumniExperience[] = ((expData as any[]) || []).map((e) => ({
      id: e.id,
      alumni_id: e.alumni_id,
      type: e.type,
      title: e.title,
      company: e.company,
      job_role: e.job_role,
      content: e.content,
      selection_process: e.selection_process,
      preparation_tips: e.preparation_tips,
      advice_for_juniors: e.advice_for_juniors,
      is_deleted: e.is_deleted,
      created_at: e.created_at,
      updated_at: e.updated_at,
      alumni: profile,
    }));

    return { profile, experiences };
  } catch (err: unknown) {
    return {
      profile: null,
      experiences: [],
      error: (err as Error).message || 'Failed to fetch alumni profile.',
    };
  }
}

// ==========================================
// 2. ALUMNI EXPERIENCES QUERIES
// ==========================================
export async function getAlumniExperiences(options: {
  type?: string;
  company?: string;
  query?: string;
  currentUserId?: string;
} = {}): Promise<{ experiences: AlumniExperience[]; error?: string }> {
  const demoExp = await getDemoAlumniExperiences();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder') || options.currentUserId === 'demo-user-id') {
    let filtered = demoExp.filter((e) => !e.is_deleted);
    if (options.type && options.type !== 'All') {
      filtered = filtered.filter((e) => e.type === options.type);
    }
    if (options.company) {
      filtered = filtered.filter((e) =>
        e.company?.toLowerCase().includes(options.company!.toLowerCase())
      );
    }
    if (options.query) {
      const q = options.query.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q) ||
          e.company?.toLowerCase().includes(q) ||
          e.job_role?.toLowerCase().includes(q)
      );
    }
    return { experiences: filtered };
  }

  try {
    const supabase = await createClient();
    let query = (supabase.from('alumni_experiences') as any)
      .select(`
        id,
        alumni_id,
        type,
        title,
        company,
        job_role,
        content,
        selection_process,
        preparation_tips,
        advice_for_juniors,
        is_deleted,
        created_at,
        updated_at,
        alumni:alumni_profiles!alumni_id (
          id,
          user_id,
          graduation_year,
          department,
          current_company,
          job_role,
          user:profiles!user_id (
            id,
            name,
            role,
            avatar_url,
            department
          )
        )
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (options.type && options.type !== 'All') {
      query = query.eq('type', options.type);
    }
    if (options.company) {
      query = query.ilike('company', `%${options.company}%`);
    }

    const { data, error } = await query;
    if (error) {
      return { experiences: demoExp, error: error.message };
    }

    let results: AlumniExperience[] = ((data as any[]) || []).map((e) => {
      const a = e.alumni;
      return {
        id: e.id,
        alumni_id: e.alumni_id,
        type: e.type,
        title: e.title,
        company: e.company,
        job_role: e.job_role,
        content: e.content,
        selection_process: e.selection_process,
        preparation_tips: e.preparation_tips,
        advice_for_juniors: e.advice_for_juniors,
        is_deleted: e.is_deleted,
        created_at: e.created_at,
        updated_at: e.updated_at,
        alumni: a
          ? {
              id: a.id,
              user_id: a.user_id,
              graduation_year: a.graduation_year,
              department: a.department,
              degree: 'B.Tech',
              current_company: a.current_company,
              job_role: a.job_role,
              location: null,
              bio: null,
              skills: [],
              profile_visibility: 'public',
              created_at: '',
              updated_at: '',
              user: a.user
                ? {
                    id: a.user.id,
                    name: a.user.name,
                    email: '',
                    role: a.user.role,
                    avatar_url: a.user.avatar_url,
                    department: a.user.department,
                  }
                : null,
            }
          : null,
      };
    });

    if (options.query) {
      const q = options.query.toLowerCase();
      results = results.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q) ||
          e.company?.toLowerCase().includes(q) ||
          e.job_role?.toLowerCase().includes(q) ||
          e.alumni?.user?.name.toLowerCase().includes(q)
      );
    }

    const combined = [...demoExp, ...results];
    return { experiences: combined };
  } catch (err: unknown) {
    return {
      experiences: demoExp,
      error: (err as Error).message || 'Failed to fetch experiences.',
    };
  }
}

export async function getAlumniExperienceById(
  experienceId: string,
  currentUserId?: string
): Promise<{ experience: AlumniExperience | null; error?: string }> {
  const demoExp = await getDemoAlumniExperiences();
  const foundDemo = demoExp.find((e) => e.id === experienceId && !e.is_deleted);
  if (foundDemo) {
    return { experience: foundDemo };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder') || currentUserId === 'demo-user-id') {
    return { experience: null };
  }

  try {
    const supabase = await createClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(experienceId);
    if (!isUuid) return { experience: null };

    const { data, error } = await (supabase.from('alumni_experiences') as any)
      .select(`
        id,
        alumni_id,
        type,
        title,
        company,
        job_role,
        content,
        selection_process,
        preparation_tips,
        advice_for_juniors,
        is_deleted,
        created_at,
        updated_at,
        alumni:alumni_profiles!alumni_id (
          id,
          user_id,
          graduation_year,
          department,
          current_company,
          job_role,
          user:profiles!user_id (
            id,
            name,
            role,
            avatar_url,
            department
          )
        )
      `)
      .eq('id', experienceId)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error || !data) {
      return { experience: null, error: error?.message };
    }

    const e = data as any;
    const a = e.alumni;
    const experience: AlumniExperience = {
      id: e.id,
      alumni_id: e.alumni_id,
      type: e.type,
      title: e.title,
      company: e.company,
      job_role: e.job_role,
      content: e.content,
      selection_process: e.selection_process,
      preparation_tips: e.preparation_tips,
      advice_for_juniors: e.advice_for_juniors,
      is_deleted: e.is_deleted,
      created_at: e.created_at,
      updated_at: e.updated_at,
      alumni: a
        ? {
            id: a.id,
            user_id: a.user_id,
            graduation_year: a.graduation_year,
            department: a.department,
            degree: 'B.Tech',
            current_company: a.current_company,
            job_role: a.job_role,
            location: null,
            bio: null,
            skills: [],
            profile_visibility: 'public',
            created_at: '',
            updated_at: '',
            user: a.user
              ? {
                  id: a.user.id,
                  name: a.user.name,
                  email: '',
                  role: a.user.role,
                  avatar_url: a.user.avatar_url,
                  department: a.user.department,
                }
              : null,
          }
        : null,
    };

    return { experience };
  } catch (err: unknown) {
    return {
      experience: null,
      error: (err as Error).message || 'Failed to fetch experience details.',
    };
  }
}

// ==========================================
// 3. ALUMNI COMMUNITY QUERIES
// ==========================================
export async function getAlumniCommunityPosts(options: {
  category?: AlumniCommunityCategory | 'All';
  currentUserId?: string;
  currentUserRole?: UserRole;
} = {}): Promise<{ posts: AlumniCommunityPost[]; error?: string }> {
  // Authorization check: Only student and alumni allowed
  if (
    options.currentUserRole &&
    options.currentUserRole !== 'student' &&
    options.currentUserRole !== 'alumni'
  ) {
    return { posts: [] };
  }

  const demoPosts = (await getDemoAlumniPosts()).filter((p) => !p.is_deleted);
  const demoLikes = await getDemoAlumniLikes();
  const demoComments = (await getDemoAlumniComments()).filter((c) => !c.is_deleted);

  const enrichedDemoPosts: AlumniCommunityPost[] = demoPosts
    .filter((p) => {
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
        likes_count: pLikes.length,
        comments_count: pComments.length,
        is_liked: Boolean(
          options.currentUserId && pLikes.some((l) => l.user_id === options.currentUserId)
        ),
      };
    });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder') || options.currentUserId === 'demo-user-id') {
    return { posts: enrichedDemoPosts };
  }

  try {
    const supabase = await createClient();
    let query = (supabase.from('alumni_community_posts') as any)
      .select(`
        id,
        author_id,
        category,
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
        likes:alumni_community_likes (
          user_id
        ),
        comments:alumni_community_comments (
          id
        )
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (options.category && options.category !== 'All') {
      query = query.eq('category', options.category);
    }

    const { data, error } = await query;
    if (error) {
      return { posts: enrichedDemoPosts, error: error.message };
    }

    // Also fetch alumni profiles for author details to show company/role/year
    const authorIds = Array.from(new Set(((data as any[]) || []).map((p) => p.author_id)));
    let alumniMetaMap: Record<string, { company?: string; role?: string; year?: number }> = {};

    if (authorIds.length > 0) {
      const { data: alumniProfilesData } = await (supabase.from('alumni_profiles') as any)
        .select('user_id, current_company, job_role, graduation_year')
        .in('user_id', authorIds);

      if (alumniProfilesData) {
        for (const ap of alumniProfilesData) {
          alumniMetaMap[ap.user_id] = {
            company: ap.current_company,
            role: ap.job_role,
            year: ap.graduation_year,
          };
        }
      }
    }

    const livePosts: AlumniCommunityPost[] = ((data as any[]) || []).map((item) => {
      const likesList = Array.isArray(item.likes) ? item.likes : [];
      const commentsList = Array.isArray(item.comments) ? item.comments : [];
      const hasLiked = options.currentUserId
        ? likesList.some((l: any) => l.user_id === options.currentUserId)
        : false;

      const meta = alumniMetaMap[item.author_id] || {};

      const authorMeta: AlumniAuthorMeta = {
        id: item.author?.id || item.author_id,
        name: item.author?.name || 'Community Member',
        role: item.author?.role || 'student',
        department: item.author?.department || null,
        graduation_year: meta.year || null,
        current_company: meta.company || null,
        job_role: meta.role || null,
        avatar_url: item.author?.avatar_url || null,
      };

      return {
        id: item.id,
        author_id: item.author_id,
        category: item.category,
        title: item.title,
        content: item.content,
        is_deleted: item.is_deleted,
        created_at: item.created_at,
        updated_at: item.updated_at,
        likes_count: likesList.length,
        comments_count: commentsList.length,
        is_liked: hasLiked,
        author: authorMeta,
      };
    });

    const combined = [...enrichedDemoPosts, ...livePosts].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return { posts: combined };
  } catch (err: unknown) {
    return {
      posts: enrichedDemoPosts,
      error: (err as Error).message || 'Failed to fetch community posts.',
    };
  }
}

export async function getAlumniCommunityPostById(
  postId: string,
  currentUserId?: string,
  currentUserRole?: UserRole
): Promise<{ post: AlumniCommunityPost | null; comments: AlumniCommunityComment[]; error?: string }> {
  if (currentUserRole && currentUserRole !== 'student' && currentUserRole !== 'alumni') {
    return { post: null, comments: [] };
  }

  // Check demo posts first
  const demoPosts = await getDemoAlumniPosts();
  const foundDemo = demoPosts.find((p) => p.id === postId && !p.is_deleted);
  if (foundDemo) {
    const demoLikes = await getDemoAlumniLikes();
    const demoComments = await getDemoAlumniComments();
    const pLikes = demoLikes.filter((l) => l.post_id === postId);
    const pComments = demoComments.filter((c) => c.post_id === postId && !c.is_deleted);

    const post: AlumniCommunityPost = {
      ...foundDemo,
      likes_count: pLikes.length,
      comments_count: pComments.length,
      is_liked: Boolean(currentUserId && pLikes.some((l) => l.user_id === currentUserId)),
    };
    return { post, comments: pComments };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder') || currentUserId === 'demo-user-id') {
    return { post: null, comments: [] };
  }

  try {
    const supabase = await createClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId);
    if (!isUuid) return { post: null, comments: [] };

    // 1. Fetch Post
    const { data: postData, error: postError } = await (supabase
      .from('alumni_community_posts') as any)
      .select(`
        id,
        author_id,
        category,
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
        likes:alumni_community_likes (
          user_id
        ),
        comments:alumni_community_comments (
          id
        )
      `)
      .eq('id', postId)
      .eq('is_deleted', false)
      .maybeSingle();

    if (postError || !postData) {
      return { post: null, comments: [], error: postError?.message };
    }

    const item = postData as any;
    const likesList = Array.isArray(item.likes) ? item.likes : [];
    const commentsList = Array.isArray(item.comments) ? item.comments : [];
    const hasLiked = currentUserId
      ? likesList.some((l: any) => l.user_id === currentUserId)
      : false;

    // Fetch author's alumni profile if alumni
    let authorMeta: AlumniAuthorMeta = {
      id: item.author?.id || item.author_id,
      name: item.author?.name || 'Community Member',
      role: item.author?.role || 'student',
      department: item.author?.department || null,
      avatar_url: item.author?.avatar_url || null,
    };

    if (authorMeta.role === 'alumni') {
      const { data: ap } = await (supabase.from('alumni_profiles') as any)
        .select('current_company, job_role, graduation_year')
        .eq('user_id', item.author_id)
        .maybeSingle();

      if (ap) {
        authorMeta.current_company = ap.current_company;
        authorMeta.job_role = ap.job_role;
        authorMeta.graduation_year = ap.graduation_year;
      }
    }

    const post: AlumniCommunityPost = {
      id: item.id,
      author_id: item.author_id,
      category: item.category,
      title: item.title,
      content: item.content,
      is_deleted: item.is_deleted,
      created_at: item.created_at,
      updated_at: item.updated_at,
      likes_count: likesList.length,
      comments_count: commentsList.length,
      is_liked: hasLiked,
      author: authorMeta,
    };

    // 2. Fetch Comments
    const { data: commentsData, error: commentsError } = await (supabase
      .from('alumni_community_comments') as any)
      .select(`
        id,
        post_id,
        author_id,
        parent_comment_id,
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

    const cList = (commentsData as any[]) || [];
    const commentAuthorIds = Array.from(new Set(cList.map((c) => c.author_id)));
    let cAlumniMeta: Record<string, any> = {};
    if (commentAuthorIds.length > 0) {
      const { data: cApData } = await (supabase.from('alumni_profiles') as any)
        .select('user_id, current_company, job_role, graduation_year')
        .in('user_id', commentAuthorIds);

      if (cApData) {
        for (const cap of cApData) {
          cAlumniMeta[cap.user_id] = cap;
        }
      }
    }

    const allComments: AlumniCommunityComment[] = cList.map((c) => {
      const meta = cAlumniMeta[c.author_id] || {};
      return {
        id: c.id,
        post_id: c.post_id,
        author_id: c.author_id,
        parent_comment_id: c.parent_comment_id,
        content: c.content,
        is_deleted: c.is_deleted,
        created_at: c.created_at,
        updated_at: c.updated_at,
        author: {
          id: c.author?.id || c.author_id,
          name: c.author?.name || 'User',
          role: c.author?.role || 'student',
          department: c.author?.department || null,
          avatar_url: c.author?.avatar_url || null,
          current_company: meta.current_company || null,
          job_role: meta.job_role || null,
          graduation_year: meta.graduation_year || null,
        },
      };
    });

    // Group replies into parent comments
    const topLevel: AlumniCommunityComment[] = [];
    const replyMap = new Map<string, AlumniCommunityComment[]>();

    allComments.forEach((c) => {
      if (c.parent_comment_id) {
        if (!replyMap.has(c.parent_comment_id)) {
          replyMap.set(c.parent_comment_id, []);
        }
        replyMap.get(c.parent_comment_id)!.push(c);
      } else {
        topLevel.push(c);
      }
    });

    topLevel.forEach((c) => {
      c.replies = replyMap.get(c.id) || [];
    });

    return { post, comments: topLevel };
  } catch (err: unknown) {
    return {
      post: null,
      comments: [],
      error: (err as Error).message || 'Failed to fetch post details.',
    };
  }
}

// ==========================================
// 4. GUIDANCE REQUESTS QUERIES
// ==========================================
export async function getGuidanceRequests(
  userId: string,
  userRole: UserRole
): Promise<{ requests: GuidanceRequest[]; error?: string }> {
  const demoReqs = await getDemoGuidanceRequests();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder') || userId === 'demo-user-id') {
    if (userRole === 'student') {
      return { requests: demoReqs.filter((r) => r.student_id === userId) };
    } else {
      return { requests: demoReqs };
    }
  }

  try {
    const supabase = await createClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) return { requests: [] };

    let query = (supabase.from('guidance_requests') as any).select(`
      id,
      student_id,
      alumni_id,
      message,
      status,
      response_note,
      created_at,
      updated_at,
      student:profiles!student_id (
        id,
        name,
        email,
        department
      ),
      alumni:alumni_profiles!alumni_id (
        id,
        user_id,
        graduation_year,
        department,
        current_company,
        job_role,
        user:profiles!user_id (
          id,
          name,
          email,
          avatar_url
        )
      )
    `);

    if (userRole === 'student') {
      query = query.eq('student_id', userId);
    } else if (userRole === 'alumni') {
      // Find this alumni's profile id
      const { data: myProfile } = await (supabase.from('alumni_profiles') as any)
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!myProfile) {
        return { requests: [] };
      }
      query = query.eq('alumni_id', myProfile.id);
    } else {
      // Non-students and non-alumni don't have guidance requests
      return { requests: [] };
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      return { requests: demoReqs, error: error.message };
    }

    const requests: GuidanceRequest[] = ((data as any[]) || []).map((item) => ({
      id: item.id,
      student_id: item.student_id,
      alumni_id: item.alumni_id,
      message: item.message,
      status: item.status,
      response_note: item.response_note,
      created_at: item.created_at,
      updated_at: item.updated_at,
      student: item.student
        ? {
            id: item.student.id,
            name: item.student.name,
            email: item.student.email,
            department: item.student.department,
          }
        : null,
      alumni: item.alumni
        ? {
            id: item.alumni.id,
            user_id: item.alumni.user_id,
            graduation_year: item.alumni.graduation_year,
            department: item.alumni.department,
            degree: 'B.Tech',
            current_company: item.alumni.current_company,
            job_role: item.alumni.job_role,
            location: null,
            bio: null,
            skills: [],
            profile_visibility: 'public',
            created_at: '',
            updated_at: '',
            user: item.alumni.user
              ? {
                  id: item.alumni.user.id,
                  name: item.alumni.user.name,
                  email: item.alumni.user.email,
                  role: 'alumni',
                  avatar_url: item.alumni.user.avatar_url,
                }
              : null,
          }
        : null,
    }));

    return { requests: [...demoReqs, ...requests] };
  } catch (err: unknown) {
    return {
      requests: demoReqs,
      error: (err as Error).message || 'Failed to fetch guidance requests.',
    };
  }
}
