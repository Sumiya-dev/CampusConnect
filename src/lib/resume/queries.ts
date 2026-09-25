import { cookies } from 'next/headers';
import { createClient } from '../supabase/server';
import { Resume } from '../types/resume.types';
import { getCurrentUser } from '../auth/user';

export async function getStudentResume(): Promise<Resume | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  // Handle Demo Mode
  if (user.id === 'demo-user-id') {
    const cookieStore = await cookies();
    const demoResumeName = cookieStore.get('campusconnect_demo_resume_name')?.value;
    const demoResumePath = cookieStore.get('campusconnect_demo_resume_path')?.value;
    if (demoResumeName) {
      const sizeStr = cookieStore.get('campusconnect_demo_resume_size')?.value;
      const typeStr = cookieStore.get('campusconnect_demo_resume_type')?.value;
      const uploadedAt = cookieStore.get('campusconnect_demo_resume_uploaded_at')?.value;
      return {
        id: 'demo-resume-id',
        student_id: 'demo-student-id',
        file_name: demoResumeName,
        file_path: demoResumePath || '/uploads/resumes/demo-resume.pdf',
        file_type: typeStr || 'application/pdf',
        file_size: sizeStr ? parseInt(sizeStr, 10) : 1024 * 1024,
        is_active: true,
        created_at: uploadedAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    return null;
  }

  // Live Supabase Mode
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return null;
  }

  const supabase = await createClient();

  // First, get the student ID
  const { data: student } = await (supabase.from('students') as any)
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!student) {
    return null;
  }

  // Get the active resume
  const { data: resume } = await (supabase.from('resumes') as any)
    .select('*')
    .eq('student_id', student.id)
    .eq('is_active', true)
    .maybeSingle();

  return (resume as Resume) || null;
}
