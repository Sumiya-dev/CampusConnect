'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '../auth/user';
import { AnnouncementFormData } from '../types/announcement.types';

interface FacultyMemberRow {
  id: string;
  department: string;
}

interface AnnouncementOwnershipRow {
  id: string;
  faculty_id: string;
}

interface SupabaseTableMutationClient {
  insert: (data: unknown) => {
    select: (columns?: string) => {
      single: () => Promise<{ data: unknown; error: { message: string } | null }>;
    };
  };
  update: (data: unknown) => {
    eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
  };
  delete: () => {
    eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
  };
}

function getTableClient(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tableName: string
): SupabaseTableMutationClient {
  return supabase.from(
    tableName as 'faculty_announcements'
  ) as unknown as SupabaseTableMutationClient;
}

/**
 * Creates a new faculty announcement.
 */
export async function createAnnouncementAction(formData: AnnouncementFormData): Promise<{
  success: boolean;
  id?: string;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized: Session required.' };
    }

    if (user.role !== 'faculty' && user.role !== 'administrator') {
      return {
        success: false,
        error: 'Forbidden: Only faculty members can create announcements.',
      };
    }

    // Validation
    const title = (formData.title || '').trim();
    if (!title || title.length < 3) {
      return { success: false, error: 'Title must be at least 3 characters long.' };
    }

    const content = (formData.content || '').trim();
    if (!content || content.length < 5) {
      return { success: false, error: 'Content must be at least 5 characters long.' };
    }

    const supabase = await createClient();

    // 1. Get faculty member record
    const { data: rawFaculty, error: facErr } = await supabase
      .from('faculty_members')
      .select('id, department')
      .eq('user_id', user.id)
      .maybeSingle();

    const faculty = rawFaculty as unknown as FacultyMemberRow | null;

    if (facErr || !faculty || !faculty.id) {
      return {
        success: false,
        error: 'Faculty profile record not found. Please contact administration.',
      };
    }

    // 2. Validate target parameters
    let sectionId: string | null = null;
    let trainingGroupId: string | null = null;
    let targetDept: string | null = null;
    let targetYear: number | null = null;

    if (formData.target_type === 'section') {
      if (!formData.section_id) {
        return { success: false, error: 'Please select an academic section.' };
      }
      sectionId = formData.section_id;
    } else if (formData.target_type === 'training_group') {
      if (!formData.training_group_id) {
        return { success: false, error: 'Please select a training group.' };
      }
      trainingGroupId = formData.training_group_id;
    } else if (formData.target_type === 'department') {
      targetDept = (formData.target_department || faculty.department || '').trim();
      if (!targetDept) {
        return { success: false, error: 'Please specify a target department.' };
      }
    } else if (formData.target_type === 'year') {
      if (!formData.target_year || formData.target_year < 1 || formData.target_year > 5) {
        return { success: false, error: 'Please select a valid academic year (1-4).' };
      }
      targetYear = formData.target_year;
    }

    // 3. Insert record
    const tableClient = getTableClient(supabase, 'faculty_announcements');
    const { data: newRow, error: insertErr } = await tableClient
      .insert({
        faculty_id: faculty.id,
        title,
        content,
        target_type: formData.target_type,
        target_department: targetDept,
        target_year: targetYear,
        section_id: sectionId,
        training_group_id: trainingGroupId,
        is_published: formData.is_published,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertErr) {
      return { success: false, error: insertErr.message || 'Failed to create announcement.' };
    }

    const createdId = (newRow as { id: string } | null)?.id;

    revalidatePath('/faculty/announcements');
    revalidatePath('/student');
    revalidatePath('/student/notifications');

    return { success: true, id: createdId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { success: false, error: message };
  }
}

/**
 * Updates an existing announcement owned by the faculty member.
 */
export async function updateAnnouncementAction(
  announcementId: string,
  formData: Partial<AnnouncementFormData>
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized: Session required.' };
    }

    if (user.role !== 'faculty' && user.role !== 'administrator') {
      return {
        success: false,
        error: 'Forbidden: Only faculty members can edit announcements.',
      };
    }

    const supabase = await createClient();

    // 1. Get faculty member record
    const { data: rawFaculty } = await supabase
      .from('faculty_members')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const faculty = rawFaculty as unknown as FacultyMemberRow | null;

    if (!faculty || !faculty.id) {
      return { success: false, error: 'Faculty profile not found.' };
    }

    // 2. Verify ownership
    const { data: rawAnnouncement, error: fetchErr } = await supabase
      .from('faculty_announcements')
      .select('id, faculty_id')
      .eq('id', announcementId)
      .maybeSingle();

    const announcement = rawAnnouncement as unknown as AnnouncementOwnershipRow | null;

    if (fetchErr || !announcement) {
      return { success: false, error: 'Announcement not found.' };
    }

    if (user.role !== 'administrator' && announcement.faculty_id !== faculty.id) {
      return {
        success: false,
        error: 'Access denied: You can only edit announcements you authored.',
      };
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (formData.title !== undefined) {
      const title = formData.title.trim();
      if (!title || title.length < 3) {
        return { success: false, error: 'Title must be at least 3 characters long.' };
      }
      updates.title = title;
    }

    if (formData.content !== undefined) {
      const content = formData.content.trim();
      if (!content || content.length < 5) {
        return { success: false, error: 'Content must be at least 5 characters long.' };
      }
      updates.content = content;
    }

    if (formData.is_published !== undefined) {
      updates.is_published = formData.is_published;
    }

    if (formData.target_type !== undefined) {
      updates.target_type = formData.target_type;
      updates.section_id = null;
      updates.training_group_id = null;
      updates.target_department = null;
      updates.target_year = null;

      if (formData.target_type === 'section') {
        if (!formData.section_id) {
          return { success: false, error: 'Please select an academic section.' };
        }
        updates.section_id = formData.section_id;
      } else if (formData.target_type === 'training_group') {
        if (!formData.training_group_id) {
          return { success: false, error: 'Please select a training group.' };
        }
        updates.training_group_id = formData.training_group_id;
      } else if (formData.target_type === 'department') {
        if (!formData.target_department) {
          return { success: false, error: 'Please specify a target department.' };
        }
        updates.target_department = formData.target_department.trim();
      } else if (formData.target_type === 'year') {
        if (!formData.target_year) {
          return { success: false, error: 'Please select an academic year.' };
        }
        updates.target_year = formData.target_year;
      }
    }

    const tableClient = getTableClient(supabase, 'faculty_announcements');
    const { error: updateErr } = await tableClient.update(updates).eq('id', announcementId);

    if (updateErr) {
      return { success: false, error: updateErr.message || 'Failed to update announcement.' };
    }

    revalidatePath('/faculty/announcements');
    revalidatePath('/student');
    revalidatePath('/student/notifications');

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { success: false, error: message };
  }
}

/**
 * Toggles published status of an announcement owned by the faculty member.
 */
export async function toggleAnnouncementPublishAction(
  announcementId: string,
  isPublished: boolean
): Promise<{ success: boolean; is_published?: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized: Session required.' };
    }

    if (user.role !== 'faculty' && user.role !== 'administrator') {
      return { success: false, error: 'Forbidden.' };
    }

    const supabase = await createClient();

    // Verify ownership
    const { data: rawFaculty } = await supabase
      .from('faculty_members')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const faculty = rawFaculty as unknown as FacultyMemberRow | null;

    if (!faculty || !faculty.id) {
      return { success: false, error: 'Faculty profile not found.' };
    }

    const { data: rawAnnouncement } = await supabase
      .from('faculty_announcements')
      .select('id, faculty_id')
      .eq('id', announcementId)
      .maybeSingle();

    const announcement = rawAnnouncement as unknown as AnnouncementOwnershipRow | null;

    if (!announcement) {
      return { success: false, error: 'Announcement not found.' };
    }

    if (user.role !== 'administrator' && announcement.faculty_id !== faculty.id) {
      return {
        success: false,
        error: 'Access denied: You can only publish/unpublish your own announcements.',
      };
    }

    const tableClient = getTableClient(supabase, 'faculty_announcements');
    const { error: updateErr } = await tableClient
      .update({
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      })
      .eq('id', announcementId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    revalidatePath('/faculty/announcements');
    revalidatePath('/student');
    revalidatePath('/student/notifications');

    return { success: true, is_published: isPublished };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { success: false, error: message };
  }
}

/**
 * Deletes an announcement owned by the faculty member.
 */
export async function deleteAnnouncementAction(
  announcementId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized: Session required.' };
    }

    if (user.role !== 'faculty' && user.role !== 'administrator') {
      return { success: false, error: 'Forbidden.' };
    }

    const supabase = await createClient();

    const { data: rawFaculty } = await supabase
      .from('faculty_members')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const faculty = rawFaculty as unknown as FacultyMemberRow | null;

    if (!faculty || !faculty.id) {
      return { success: false, error: 'Faculty profile not found.' };
    }

    const { data: rawAnnouncement } = await supabase
      .from('faculty_announcements')
      .select('id, faculty_id')
      .eq('id', announcementId)
      .maybeSingle();

    const announcement = rawAnnouncement as unknown as AnnouncementOwnershipRow | null;

    if (!announcement) {
      return { success: false, error: 'Announcement not found.' };
    }

    if (user.role !== 'administrator' && announcement.faculty_id !== faculty.id) {
      return {
        success: false,
        error: 'Access denied: You can only delete your own announcements.',
      };
    }

    const tableClient = getTableClient(supabase, 'faculty_announcements');
    const { error: deleteErr } = await tableClient.delete().eq('id', announcementId);

    if (deleteErr) {
      return { success: false, error: deleteErr.message };
    }

    revalidatePath('/faculty/announcements');
    revalidatePath('/student');
    revalidatePath('/student/notifications');

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { success: false, error: message };
  }
}
