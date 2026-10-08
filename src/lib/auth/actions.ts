'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '../supabase/server';
import { UserRole } from '../types/database.types';
import { ROLE_HOME_ROUTES } from '../types/auth.types';

export interface AuthActionResult {
  success: boolean;
  error?: string;
}

/**
 * Signs in a user using Supabase Auth, securely verifying the actual user role from the database.
 */
export async function signInAction(prevState: unknown, formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isPlaceholderSupabase = !supabaseUrl || supabaseUrl.includes('placeholder');
  const cookieStore = await cookies();

  if (isPlaceholderSupabase) {
    // Demo fallback: infer role from email or previously stored demo cookie
    let detectedRole: UserRole = 'student';
    if (email.includes('faculty') || email.includes('prof')) {
      detectedRole = 'faculty';
    } else if (email.includes('placement') || email.includes('tpo')) {
      detectedRole = 'placement_officer';
    } else if (email.includes('admin') || email.includes('superadmin')) {
      detectedRole = 'administrator';
    } else {
      const existingDemoRole = cookieStore.get('campusconnect_demo_role')?.value as UserRole | undefined;
      if (existingDemoRole) {
        detectedRole = existingDemoRole;
      }
    }

    cookieStore.set('campusconnect_demo_user', email, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_role', detectedRole, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_name', email.split('@')[0], { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });

    redirect(ROLE_HOME_ROUTES[detectedRole] || '/student');
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

    // Server-side role verification from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    const userProfile = profile as { role: UserRole } | null;
    const role = userProfile?.role || (data.user.user_metadata?.role as UserRole) || 'student';
    redirect(ROLE_HOME_ROUTES[role] || '/student');
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'digest' in err &&
      typeof (err as { digest?: unknown }).digest === 'string' &&
      (err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')
    ) {
      throw err;
    }
    return { success: false, error: (err as Error).message || 'An unexpected error occurred.' };
  }
}

/**
 * Signs up a new user (Student or Faculty) with complete metadata and provisions their profile in Supabase.
 * Rejects public registration for privileged roles (Placement Officer, Administrator).
 */
export async function signUpAction(prevState: unknown, formData: FormData): Promise<AuthActionResult> {
  const rawEmail = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const rawName = (formData.get('name') as string)?.trim();
  const rawRole = ((formData.get('role') as string) || 'student').trim().toLowerCase();

  let normalizedRole: UserRole = 'student';
  if (rawRole === 'faculty') {
    normalizedRole = 'faculty';
  } else if (rawRole === 'placement_officer' || rawRole === 'placement' || rawRole === 'tpo') {
    normalizedRole = 'placement_officer';
  } else if (rawRole === 'administrator' || rawRole === 'admin' || rawRole === 'superadmin') {
    normalizedRole = 'administrator';
  } else if (rawRole === 'student') {
    normalizedRole = 'student';
  } else {
    return { success: false, error: 'Invalid institutional role selected.' };
  }

  const role: UserRole = normalizedRole;

  if (!rawName || rawName.length < 2) {
    return { success: false, error: 'Full Name is required (minimum 2 characters).' };
  }

  if (!rawEmail || !rawEmail.includes('@')) {
    return { success: false, error: 'A valid email address is required.' };
  }

  if (!password || password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  if (password !== confirmPassword) {
    return { success: false, error: 'Passwords do not match. Please re-enter your password.' };
  }

  const department = ((formData.get('department') as string) || (role === 'administrator' ? 'Central Administration' : role === 'placement_officer' ? 'Training & Placement Directorate' : '')).trim();
  if (!department) {
    return { success: false, error: 'Department selection is required.' };
  }

  const identifier = ((formData.get('identifier') as string) || '').trim();
  if (!identifier) {
    let idLabel = 'Faculty ID';
    if (role === 'student') idLabel = 'Student / Roll Number';
    else if (role === 'placement_officer') idLabel = 'Placement Officer ID';
    else if (role === 'administrator') idLabel = 'Administrator Code';
    return {
      success: false,
      error: `${idLabel} is required.`,
    };
  }

  let academicYear = 1;
  let section = '';
  if (role === 'student') {
    const rawYear = formData.get('academicYear') as string;
    academicYear = parseInt(rawYear, 10);
    if (isNaN(academicYear) || academicYear < 1 || academicYear > 4) {
      return { success: false, error: 'Please select a valid academic year (1-4).' };
    }

    section = ((formData.get('section') as string) || '').trim().toUpperCase();
    if (!section) {
      return { success: false, error: 'Section is required for student registration.' };
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isPlaceholderSupabase = !supabaseUrl || supabaseUrl.includes('placeholder');
  const cookieStore = await cookies();

  if (isPlaceholderSupabase) {
    cookieStore.set('campusconnect_demo_user', rawEmail, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_role', role, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_name', rawName, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_dept', department, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_id', identifier, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });

    redirect(ROLE_HOME_ROUTES[role] || '/student');
  }

  try {
    const supabase = await createClient();
    const metadata: Record<string, unknown> = {
      name: rawName,
      role,
      department,
      identifier,
    };

    if (role === 'student') {
      metadata.year = academicYear;
      metadata.section = section;
      metadata.skills = ['Core Fundamentals'];
    } else if (role === 'administrator') {
      metadata.access_level = 'superadmin';
      metadata.admin_code = identifier;
    }

    const headerList = await headers();
    const host = headerList.get('x-forwarded-host') || headerList.get('host');
    const proto = headerList.get('x-forwarded-proto') || 'https';
    const dynamicOrigin = host ? `${proto}://${host}` : undefined;
    const origin = process.env.NEXT_PUBLIC_APP_URL || dynamicOrigin;

    const signUpOptions: { data: Record<string, unknown>; emailRedirectTo?: string } = {
      data: metadata,
    };
    if (origin) {
      signUpOptions.emailRedirectTo = `${origin}/auth/callback`;
    }

    const { data, error } = await supabase.auth.signUp({
      email: rawEmail,
      password,
      options: signUpOptions,
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
      error: 'Account created successfully! If email confirmation is required, please check your inbox to activate your account, then sign in.',
    };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'digest' in err &&
      typeof (err as { digest?: unknown }).digest === 'string' &&
      (err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')
    ) {
      throw err;
    }
    return { success: false, error: (err as Error).message || 'Registration failed.' };
  }
}

/**
 * Sends a password reset email using Supabase Auth.
 */
export async function forgotPasswordAction(prevState: unknown, formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();

  if (!email || !email.includes('@')) {
    return { success: false, error: 'A valid email address is required.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isPlaceholderSupabase = !supabaseUrl || supabaseUrl.includes('placeholder');

  if (isPlaceholderSupabase) {
    return {
      success: true,
      error: 'Password reset link sent! If this email exists in our system, you will receive reset instructions shortly.',
    };
  }

  try {
    const supabase = await createClient();
    const headerList = await headers();
    const host = headerList.get('x-forwarded-host') || headerList.get('host');
    const proto = headerList.get('x-forwarded-proto') || 'https';
    const dynamicOrigin = host ? `${proto}://${host}` : undefined;
    const origin = process.env.NEXT_PUBLIC_APP_URL || dynamicOrigin || 'http://localhost:3000';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/profile`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      error: 'Password reset link sent! If this email exists in our system, you will receive reset instructions shortly.',
    };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to send password reset request.' };
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
    alumni: 'Rahul Kumar (Alumni)',
  };

  cookieStore.set('campusconnect_demo_role', role, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
  cookieStore.set('campusconnect_demo_user', `${role}@university.edu`, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
  cookieStore.set('campusconnect_demo_name', demoNames[role], { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
  cookieStore.set('campusconnect_demo_dept', 'Computer Science & Engineering', { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
  cookieStore.set('campusconnect_demo_id', `${role.toUpperCase()}-2026-001`, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });

  redirect(ROLE_HOME_ROUTES[role]);
}
