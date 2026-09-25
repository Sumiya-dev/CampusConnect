import { createClient } from '../supabase/server';
import { Resume } from '../types/resume.types';
import { getCurrentUser } from '../auth/user';

export async function getStudentResume(): Promise<Resume | null> {
  const supabase = await createClient();

  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  // First, get the student ID
  const { data: student } = await (supabase.from('students') as any)
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!student) {
    return null;
  }

  // Get the active resume
  const { data: resume } = await supabase
    .from('resumes')
    .select('*')
    .eq('student_id', student.id)
    .eq('is_active', true)
    .single();

  return resume || null;
}
