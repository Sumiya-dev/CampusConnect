'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '../auth/user';
import { ResourceTargetType } from '../types/resource.types';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt', '.zip'];

interface IdResult {
  id: string;
}

interface ResourceWithFaculty {
  id: string;
  faculty_id: string;
  file_path: string;
  faculty?: {
    user_id?: string;
  } | null;
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

function getTableClient(supabase: Awaited<ReturnType<typeof createClient>>, tableName: string): SupabaseTableMutationClient {
  return supabase.from(tableName as 'faculty_resources') as unknown as SupabaseTableMutationClient;
}

function validateFile(file: File): string | null {
  if (!file || file.size === 0) {
    return 'Please select a file to upload.';
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'File size exceeds maximum limit of 20MB.';
  }

  const name = file.name.toLowerCase();
  const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  if (!hasValidExt) {
    return 'Invalid file format. Allowed formats: PDF, DOC, DOCX, PPT, PPTX, TXT, ZIP.';
  }

  return null;
}

/**
 * Ensures faculty member profile exists for authenticated user.
 */
async function ensureFacultyMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string> {
  const { data: existingData } = await supabase
    .from('faculty_members')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  const existing = existingData as unknown as IdResult | null;
  if (existing && existing.id) {
    return existing.id;
  }

  const user = await getCurrentUser();
  const facultyTable = getTableClient(supabase, 'faculty_members');
  const { data: newFacultyData, error } = await facultyTable
    .insert({
      user_id: userId,
      employee_id: user?.identifier || `FAC-${userId.substring(0, 8)}`,
      department: user?.department || 'Computer Science & Engineering',
      designation: 'Faculty Member',
    })
    .select('id')
    .single();

  const newFaculty = newFacultyData as unknown as IdResult | null;
  if (error || !newFaculty || !newFaculty.id) {
    throw new Error('Failed to initialize faculty profile: ' + (error?.message || 'Unknown'));
  }

  return newFaculty.id;
}

/**
 * Uploads a new resource.
 */
export async function uploadResource(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'faculty' && user.role !== 'administrator')) {
      return { error: 'Unauthorized: Only faculty members can upload resources.' };
    }

    const title = (formData.get('title') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() || null;
    const subject = (formData.get('subject') as string)?.trim();
    const targetType = (formData.get('target_type') as ResourceTargetType) || 'all';
    const sectionId = (formData.get('section_id') as string)?.trim() || null;
    const trainingGroupId = (formData.get('training_group_id') as string)?.trim() || null;
    const isPublished = formData.get('is_published') === 'true';
    const file = formData.get('file') as File;

    if (!title) {
      return { error: 'Title is required.' };
    }
    if (!subject) {
      return { error: 'Subject/Topic is required.' };
    }

    const fileError = validateFile(file);
    if (fileError) {
      return { error: fileError };
    }

    if (targetType === 'section' && !sectionId) {
      return { error: 'Please select an academic section for this resource.' };
    }
    if (targetType === 'training_group' && !trainingGroupId) {
      return { error: 'Please select a training group for this resource.' };
    }

    const supabase = await createClient();
    const facultyId = await ensureFacultyMember(supabase, user.id);

    // Upload to Supabase Storage
    const safeBaseName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${user.id}/${Date.now()}-${safeBaseName}`;

    const { error: uploadError } = await supabase.storage
      .from('faculty-resources')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { error: `Failed to upload file to storage: ${uploadError.message}` };
    }

    // Insert database record
    const resourcesTable = getTableClient(supabase, 'faculty_resources');
    const { data: insertData, error: dbError } = await resourcesTable
      .insert({
        faculty_id: facultyId,
        title,
        description,
        subject,
        target_type: targetType,
        section_id: targetType === 'section' ? sectionId : null,
        training_group_id: targetType === 'training_group' ? trainingGroupId : null,
        file_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type || 'application/octet-stream',
        is_published: isPublished,
      })
      .select('id')
      .single();

    const newResource = insertData as unknown as IdResult | null;

    if (dbError || !newResource || !newResource.id) {
      console.error('Database insert error:', dbError);
      // Clean up uploaded file
      await supabase.storage.from('faculty-resources').remove([storagePath]);
      return { error: `Failed to save resource record: ${dbError?.message}` };
    }

    revalidatePath('/faculty/resources');
    revalidatePath('/student/resources');
    return { success: true, resourceId: newResource.id };
  } catch (err: unknown) {
    console.error('uploadResource error:', err);
    const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { error: msg };
  }
}

/**
 * Updates an existing resource and optionally replaces the file.
 */
export async function updateResource(resourceId: string, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'faculty' && user.role !== 'administrator')) {
      return { error: 'Unauthorized: Only faculty members can edit resources.' };
    }

    const title = (formData.get('title') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() || null;
    const subject = (formData.get('subject') as string)?.trim();
    const targetType = (formData.get('target_type') as ResourceTargetType) || 'all';
    const sectionId = (formData.get('section_id') as string)?.trim() || null;
    const trainingGroupId = (formData.get('training_group_id') as string)?.trim() || null;
    const isPublished = formData.get('is_published') === 'true';
    const replacementFile = formData.get('file') as File | null;

    if (!title) {
      return { error: 'Title is required.' };
    }
    if (!subject) {
      return { error: 'Subject/Topic is required.' };
    }
    if (targetType === 'section' && !sectionId) {
      return { error: 'Please select an academic section for this resource.' };
    }
    if (targetType === 'training_group' && !trainingGroupId) {
      return { error: 'Please select a training group for this resource.' };
    }

    const supabase = await createClient();

    // Verify ownership
    const { data: rawExisting, error: fetchErr } = await supabase
      .from('faculty_resources')
      .select('id, faculty_id, file_path, faculty:faculty_members(user_id)')
      .eq('id', resourceId)
      .single();

    const existing = rawExisting as unknown as ResourceWithFaculty | null;

    if (fetchErr || !existing) {
      return { error: 'Resource not found.' };
    }

    const facultyUserId = existing.faculty?.user_id;
    if (facultyUserId !== user.id && user.role !== 'administrator') {
      return { error: 'Forbidden: You can only edit your own resources.' };
    }

    let newFilePath = existing.file_path;
    let newFileName: string | undefined;
    let newFileSize: number | undefined;
    let newFileType: string | undefined;

    // Check if replacing file
    if (replacementFile && replacementFile.size > 0) {
      const fileError = validateFile(replacementFile);
      if (fileError) {
        return { error: fileError };
      }

      const safeBaseName = replacementFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      newFilePath = `${user.id}/${Date.now()}-${safeBaseName}`;

      const { error: uploadError } = await supabase.storage
        .from('faculty-resources')
        .upload(newFilePath, replacementFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        return { error: `Failed to upload replacement file: ${uploadError.message}` };
      }

      newFileName = replacementFile.name;
      newFileSize = replacementFile.size;
      newFileType = replacementFile.type || 'application/octet-stream';

      // Remove old file
      if (existing.file_path && existing.file_path !== newFilePath) {
        await supabase.storage.from('faculty-resources').remove([existing.file_path]);
      }
    }

    interface UpdatePayload {
      title: string;
      description: string | null;
      subject: string;
      target_type: ResourceTargetType;
      section_id: string | null;
      training_group_id: string | null;
      is_published: boolean;
      updated_at: string;
      file_path?: string;
      file_name?: string;
      file_size?: number;
      file_type?: string;
    }

    const updateData: UpdatePayload = {
      title,
      description,
      subject,
      target_type: targetType,
      section_id: targetType === 'section' ? sectionId : null,
      training_group_id: targetType === 'training_group' ? trainingGroupId : null,
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    };

    if (newFileName) {
      updateData.file_path = newFilePath;
      updateData.file_name = newFileName;
      updateData.file_size = newFileSize;
      updateData.file_type = newFileType;
    }

    const resourcesTable = getTableClient(supabase, 'faculty_resources');
    const { error: updateErr } = await resourcesTable
      .update(updateData)
      .eq('id', resourceId);

    if (updateErr) {
      console.error('Database update error:', updateErr);
      return { error: `Failed to update resource: ${updateErr.message}` };
    }

    revalidatePath('/faculty/resources');
    revalidatePath('/student/resources');
    return { success: true };
  } catch (err: unknown) {
    console.error('updateResource error:', err);
    const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { error: msg };
  }
}

/**
 * Toggles publication state.
 */
export async function togglePublishResource(resourceId: string, publishState: boolean) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'faculty' && user.role !== 'administrator')) {
      return { error: 'Unauthorized.' };
    }

    const supabase = await createClient();
    const resourcesTable = getTableClient(supabase, 'faculty_resources');

    const { error } = await resourcesTable
      .update({
        is_published: publishState,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resourceId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/faculty/resources');
    revalidatePath('/student/resources');
    return { success: true };
  } catch (err: unknown) {
    console.error('togglePublishResource error:', err);
    const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { error: msg };
  }
}

/**
 * Deletes a faculty resource and its underlying file in storage.
 */
export async function deleteResource(resourceId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'faculty' && user.role !== 'administrator')) {
      return { error: 'Unauthorized: Only faculty members can delete resources.' };
    }

    const supabase = await createClient();

    // Fetch resource to get file_path
    const { data: rawExisting, error: fetchErr } = await supabase
      .from('faculty_resources')
      .select('id, file_path, faculty:faculty_members(user_id)')
      .eq('id', resourceId)
      .single();

    const existing = rawExisting as unknown as ResourceWithFaculty | null;

    if (fetchErr || !existing) {
      return { error: 'Resource not found.' };
    }

    const facultyUserId = existing.faculty?.user_id;
    if (facultyUserId !== user.id && user.role !== 'administrator') {
      return { error: 'Forbidden: You can only delete your own resources.' };
    }

    // Delete record from database
    const resourcesTable = getTableClient(supabase, 'faculty_resources');
    const { error: deleteErr } = await resourcesTable
      .delete()
      .eq('id', resourceId);

    if (deleteErr) {
      return { error: `Failed to delete resource: ${deleteErr.message}` };
    }

    // Delete file from storage
    if (existing.file_path) {
      await supabase.storage
        .from('faculty-resources')
        .remove([existing.file_path]);
    }

    revalidatePath('/faculty/resources');
    revalidatePath('/student/resources');
    return { success: true };
  } catch (err: unknown) {
    console.error('deleteResource error:', err);
    const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { error: msg };
  }
}
