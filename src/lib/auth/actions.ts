'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '../supabase/server';
import { UserRole } from '../types/database.types';
import { ROLE_HOME_ROUTES } from '../types/auth.types';

export interface AuthActionResult {
  success: boolean;
  error?: string;
}

/**
 * Signs in a user using Supabase or local demo session fallback
 */
export async function signInAction(prevState: unknown, formData: FormData): Promise<AuthActionResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const selectedRole = (formData.get('role') as UserRole) || 'student';

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isPlaceholderSupabase = !supabaseUrl || supabaseUrl.includes('placeholder');

  const cookieStore = await cookies();

  if (isPlaceholderSupabase) {
    // Graceful demo mode: simulate authentication and store demo session cookie
    cookieStore.set('campusconnect_demo_user', email, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_role', selectedRole, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_name', email.split('@')[0], { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });

    redirect(ROLE_HOME_ROUTES[selectedRole] || '/student');
  }

  // Live Supabase Auth
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Authentication failed. Please try again.' };
    }

    // Fetch user profile to identify role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    const userProfile = profile as { role: UserRole } | null;
    const role = userProfile?.role || (data.user.user_metadata?.role as UserRole) || 'student';
    redirect(ROLE_HOME_ROUTES[role] || '/student');
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'digest' in err && typeof (err as { digest?: unknown }).digest === 'string' && (err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) {
      throw err;
    }
    return { success: false, error: (err as Error).message || 'An unexpected error occurred.' };
  }
}

/**
 * Signs up a new user with metadata and provisions role in Supabase
 */
export async function signUpAction(prevState: unknown, formData: FormData): Promise<AuthActionResult> {
  const rawEmail = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const rawName = (formData.get('name') as string)?.trim();
  const rawRole = ((formData.get('role') as string) || 'student').trim().toLowerCase() as UserRole;
  const role: UserRole = ['student', 'faculty', 'placement_officer', 'administrator'].includes(rawRole)
    ? rawRole
    : 'student';
  const department = ((formData.get('department') as string) || 'Computer Science & Engineering').trim();
  const contactNumber = ((formData.get('contactNumber') as string) || '').trim();
  const rawIdentifier = ((formData.get('identifier') as string) || '').trim();
  const identifier = rawIdentifier || `${role === 'student' ? 'STU' : role === 'faculty' ? 'FAC' : role === 'placement_officer' ? 'TPO' : 'ADM'}-${Date.now().toString().slice(-6)}`;

  if (!rawEmail || !password || !rawName) {
    return { success: false, error: 'Please provide all required fields.' };
  }

  const email = rawEmail;
  const name = rawName;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isPlaceholderSupabase = !supabaseUrl || supabaseUrl.includes('placeholder');
  const cookieStore = await cookies();

  if (isPlaceholderSupabase) {
    cookieStore.set('campusconnect_demo_user', email, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_role', role, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_name', name, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_dept', department, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_id', identifier, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });

    redirect(ROLE_HOME_ROUTES[role] || '/student');
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          department,
          contact_number: contactNumber,
          identifier,
          year: 3,
          skills: ['JavaScript', 'TypeScript'],
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes('rate limit')) {
        return {
          success: false,
          error: 'Email confirmation rate limit exceeded on authentication server. Please wait a few minutes before trying again.',
        };
      }
      return { success: false, error: error.message };
    }

    if (data.session) {
      redirect(ROLE_HOME_ROUTES[role] || '/student');
    }

    return {
      success: true,
      error: 'Account created! If email confirmation is enabled on your institutional portal, please check your inbox to activate your account.',
    };
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'digest' in err && typeof (err as { digest?: unknown }).digest === 'string' && (err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) {
      throw err;
    }
    return { success: false, error: (err as Error).message || 'Registration failed.' };
  }
}

/**
 * Sign out action clearing Supabase cookies and local demo cookies
 */
export async function signOutAction() {
  const cookieStore = await cookies();

  // Clear demo cookies
  cookieStore.delete('campusconnect_demo_user');
  cookieStore.delete('campusconnect_demo_role');
  cookieStore.delete('campusconnect_demo_name');
  cookieStore.delete('campusconnect_demo_dept');
  cookieStore.delete('campusconnect_demo_id');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // Continue cleanup
    }
  }

  redirect('/login');
}

/**
 * Quick switch helper for testing all 4 roles in Phase 1
 */
export async function switchDemoRoleAction(role: UserRole) {
  const cookieStore = await cookies();
  const demoNames: Record<UserRole, string> = {
    student: 'Aarav Sharma (Student)',
    faculty: 'Dr. Priya Raman (Faculty Advisor)',
    placement_officer: 'Mr. Vikram Verma (Placement Head)',
    administrator: 'Super Admin (System Admin)',
  };

  cookieStore.set('campusconnect_demo_role', role, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
  cookieStore.set('campusconnect_demo_user', `${role}@university.edu`, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
  cookieStore.set('campusconnect_demo_name', demoNames[role], { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
  cookieStore.set('campusconnect_demo_dept', 'Computer Science & Engineering', { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
  cookieStore.set('campusconnect_demo_id', `${role.toUpperCase()}-2026-001`, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });

  redirect(ROLE_HOME_ROUTES[role]);
}
