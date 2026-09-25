'use server';

import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '../auth/user';
import { Resume } from '../types/resume.types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export async function uploadResume(formData: FormData) {
  try {
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

    // Read the actual uploaded file bytes
    const bytes = await file.arrayBuffer();
    const fileBuffer = Buffer.from(bytes);

    // Save actual file to public/uploads/resumes directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    const safeBaseName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storedFileName = `${Date.now()}-${safeBaseName}`;
    const filePathOnDisk = path.join(uploadsDir, storedFileName);
    await fs.promises.writeFile(filePathOnDisk, fileBuffer);

    const localRelativeUrl = `/uploads/resumes/${storedFileName}`;

    // Handle Demo Mode
    if (user.id === 'demo-user-id') {
      const cookieStore = await cookies();
      cookieStore.set('campusconnect_demo_resume_name', file.name, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 * 7 });
      cookieStore.set('campusconnect_demo_resume_path', localRelativeUrl, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 * 7 });
      cookieStore.set('campusconnect_demo_resume_uploaded_at', new Date().toISOString(), { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 * 7 });
      cookieStore.set('campusconnect_demo_resume_size', file.size.toString(), { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 * 7 });
      cookieStore.set('campusconnect_demo_resume_type', file.type, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 * 7 });
      cookieStore.set('campusconnect_demo_resume_url', localRelativeUrl, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 * 7 });

      revalidatePath('/student/resume');
      revalidatePath('/profile');
      return { success: true };
    }

    // Live Supabase Mode
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      return { error: 'A real Supabase project must be configured in .env.local to upload resumes.' };
    }

    const supabase = await createClient();

    let { data: student } = await (supabase.from('students') as any)
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!student) {
      // Ensure base profile exists
      await (supabase.from('profiles') as any).upsert({
        id: user.id,
        name: user.name || 'Student',
        email: user.email,
        role: 'student',
        department: user.department || 'Computer Science & Engineering',
      }, { onConflict: 'id' });

      // Auto-provision student profile
      const { data: newStudent, error: createError } = await (supabase.from('students') as any)
        .insert({
          user_id: user.id,
          student_id: user.identifier || `STU-${user.id.substring(0, 8)}`,
          department: user.department || 'Computer Science & Engineering',
          year: 3,
          cgpa: 8.00,
          skills: ['JavaScript', 'TypeScript'],
        })
        .select('id')
        .single();

      if (createError || !newStudent) {
        console.error('Failed to auto-create student profile:', createError);
        return { error: 'Student profile not found. Please complete your profile first.' };
      }
      student = newStudent;
    }

    // Check for existing active resume and delete it first
    const { data: existingResume } = await (supabase.from('resumes') as any)
      .select('*')
      .eq('student_id', student.id)
      .eq('is_active', true)
      .maybeSingle();

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
      return { error: 'Failed to upload file to storage: ' + uploadError.message };
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
      // Clean up uploaded file
      await supabase.storage.from('resumes').remove([filePath]);
      return { error: 'Failed to save resume record: ' + dbError.message };
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
    revalidatePath('/profile');
    return { success: true };
  } catch (err) {
    console.error('Upload catch error:', err);
    return { error: 'An unexpected error occurred while uploading resume.' };
  }
}

export async function deleteResume(resumeId: string, filePath: string) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    // Handle Demo Mode
    if (user.id === 'demo-user-id') {
      const cookieStore = await cookies();
      const existingPath = cookieStore.get('campusconnect_demo_resume_path')?.value;
      if (existingPath && existingPath.startsWith('/uploads/resumes/')) {
        const fullDiskPath = path.join(process.cwd(), 'public', existingPath);
        try {
          if (fs.existsSync(fullDiskPath)) {
            await fs.promises.unlink(fullDiskPath);
          }
        } catch (e) {
          console.error('Error removing local demo resume:', e);
        }
      }

      cookieStore.delete('campusconnect_demo_resume_name');
      cookieStore.delete('campusconnect_demo_resume_path');
      cookieStore.delete('campusconnect_demo_resume_url');
      cookieStore.delete('campusconnect_demo_resume_uploaded_at');
      cookieStore.delete('campusconnect_demo_resume_size');
      cookieStore.delete('campusconnect_demo_resume_type');

      revalidatePath('/student/resume');
      revalidatePath('/profile');
      return { success: true };
    }

    const supabase = await createClient();

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
    }

    revalidatePath('/student/resume');
    revalidatePath('/profile');
    return { success: true };
  } catch (err) {
    console.error('Delete catch error:', err);
    return { error: 'An unexpected error occurred' };
  }
}

export async function getResumeUrl(filePath: string): Promise<string | null> {
  // Always proxy via local same-origin preview endpoint to avoid iframe X-Frame-Options or CORS blocking
  return `/api/resume/preview?path=${encodeURIComponent(filePath)}`;
}
