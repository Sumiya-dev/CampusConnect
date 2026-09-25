'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '../supabase/server';
import { getCurrentUser } from '../auth/user';
import {
  PreparationProgressStatus,
  ProgressActionState,
  StudentPreparationProgress,
} from '../types/preparation.types';

export async function updatePreparationProgressAction(
  materialId: string,
  newStatus: PreparationProgressStatus,
  notes?: string
): Promise<ProgressActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: 'Authentication required. Please log in to update your progress.',
    };
  }

  if (user.role !== 'student') {
    return {
      success: false,
      error: 'Unauthorized: Only registered students can track preparation progress.',
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  const nowIso = new Date().toISOString();
  const completedAt = newStatus === 'completed' ? nowIso : null;

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!student) {
        return {
          success: false,
          error: 'Student record not found in institutional database.',
        };
      }

      const { error } = await supabase
        .from('student_preparation_progress')
        .upsert(
          {
            student_id: student.id,
            material_id: materialId,
            status: newStatus,
            notes: notes !== undefined ? notes : null,
            last_accessed_at: nowIso,
            completed_at: completedAt,
          },
          {
            onConflict: 'student_id,material_id',
          }
        );

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to update progress in database.',
        };
      }
    } catch (err: unknown) {
      return {
        success: false,
        error: (err as Error).message || 'Database error occurred.',
      };
    }
  } else {
    // Demo cookie storage
    const cookieStore = await cookies();
    const demoProgressCookie = cookieStore.get('campusconnect_demo_prep_progress')?.value;
    let list: StudentPreparationProgress[] = [];

    if (demoProgressCookie) {
      try {
        const parsed = JSON.parse(demoProgressCookie);
        if (Array.isArray(parsed)) list = parsed;
      } catch {
        list = [];
      }
    }

    const existingIndex = list.findIndex(
      (p) =>
        p.material_id === materialId &&
        (p.student_id === user.id ||
          p.student_id === 'demo-user-id' ||
          p.student_id === 'demo-student-id')
    );

    if (existingIndex >= 0) {
      list[existingIndex] = {
        ...list[existingIndex],
        status: newStatus,
        notes: notes !== undefined ? notes : list[existingIndex].notes,
        last_accessed_at: nowIso,
        completed_at: completedAt,
        updated_at: nowIso,
      };
    } else {
      list.push({
        id: `prog-${Date.now()}`,
        student_id: user.id,
        material_id: materialId,
        status: newStatus,
        notes: notes || null,
        last_accessed_at: nowIso,
        completed_at: completedAt,
        created_at: nowIso,
        updated_at: nowIso,
      });
    }

    cookieStore.set('campusconnect_demo_prep_progress', JSON.stringify(list), {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  revalidatePath('/student/preparation');
  revalidatePath(`/student/preparation/${materialId}`);
  revalidatePath(`/student/preparation/material/${materialId}`);
  revalidatePath('/student');

  return {
    success: true,
    message:
      newStatus === 'completed'
        ? 'Module marked as Completed!'
        : newStatus === 'in_progress'
        ? 'Module set to In Progress.'
        : 'Module reset to Not Started.',
    newStatus,
  };
}
