'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

import { getCurrentUser } from '../auth/user';
import { Resume } from '../types/resume.types';

export async function uploadResume(formData: FormData) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      return { error: 'A real Supabase project must be configured in .env.local to upload resumes.' };
    }

    const supabase = await createClient();

    const user = await getCurrentUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const file = formData.get('file') as File;
    
    if (!file) {
      return { error: 'No file provided' };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { error: 'File size must be less than 5MB' };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return { error: 'Invalid file type. Only PDF and DOC/DOCX are allowed.' };
    }

    const { data: student } = await (supabase.from('students') as any)
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!student) {
      return { error: 'Student profile not found' };
    }

    // Check for existing active resume and delete it first
    const { data: existingResume } = await (supabase.from('resumes') as any)
      .select('*')
      .eq('student_id', student.id)
      .eq('is_active', true)
      .single();

    // Generate unique filename to avoid cache issues
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { error: 'Failed to upload file to storage' };
    }

    // Add record to database
    const { error: dbError } = await (supabase.from('resumes') as any).insert({
      student_id: student.id,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      is_active: true,
    });

    if (dbError) {
      console.error('Database error:', dbError);
      // Try to clean up the uploaded file
      await supabase.storage.from('resumes').remove([filePath]);
      return { error: 'Failed to save resume record' };
    }

    // If there was an existing resume, deactivate it and delete the old file
    if (existingResume) {
      await (supabase.from('resumes') as any)
        .delete()
        .eq('id', existingResume.id);
        
      await supabase.storage
        .from('resumes')
        .remove([existingResume.file_path]);
    }

    revalidatePath('/student/resume');
    return { success: true };
  } catch (err) {
    console.error('Upload catch error:', err);
    return { error: 'An unexpected error occurred' };
  }
}

export async function deleteResume(resumeId: string, filePath: string) {
  try {
    const supabase = await createClient();

    const user = await getCurrentUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    // Verify ownership indirectly by deleting via ID (RLS will enforce ownership)
    const { error: dbError } = await (supabase
      .from('resumes') as any)
      .delete()
      .eq('id', resumeId);

    if (dbError) {
      console.error('Database delete error:', dbError);
      return { error: 'Failed to delete resume record' };
    }

    const { error: storageError } = await supabase.storage
      .from('resumes')
      .remove([filePath]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      // Even if storage fails, the record is gone, which is okay for the user, but bad for our bucket.
      // Ideally this wouldn't happen, but we'll return success since the UI reflects deletion.
    }

    revalidatePath('/student/resume');
    return { success: true };
  } catch (err) {
    console.error('Delete catch error:', err);
    return { error: 'An unexpected error occurred' };
  }
}

export async function getResumeUrl(filePath: string): Promise<string | null> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .storage
    .from('resumes')
    .createSignedUrl(filePath, 3600); // 1 hour expiry
    
  return data?.signedUrl || null;
}
