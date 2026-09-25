'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '../supabase/server';
import { getCurrentUser } from '../auth/user';
import { AccountStatus, UserRole } from '../types/database.types';
import { ManagedUserSummary, ProfileActionState } from '../types/profile.types';

/**
 * Updates Student Profile (Personal info, Academic info, Skills, CGPA, Year)
 */
export async function updateStudentProfileAction(
  prevState: unknown,
  formData: FormData
): Promise<ProfileActionState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Authentication required.' };
  }

  if (currentUser.role !== 'student' && currentUser.role !== 'administrator') {
    return { success: false, error: 'Unauthorized: only students can edit student profile.' };
  }

  const name = (formData.get('name') as string)?.trim();
  const contactNumber = (formData.get('contactNumber') as string)?.trim() || null;
  const yearStr = formData.get('year') as string;
  const cgpaStr = formData.get('cgpa') as string;
  const avatarUrl = (formData.get('avatarUrl') as string) || null;
  const rawTechSkills = (formData.get('technicalSkills') as string) || (formData.get('skills') as string);
  const rawNonTechSkills = formData.get('nonTechnicalSkills') as string;
  const resumeName = (formData.get('resumeName') as string)?.trim() || null;
  const resumeUrl = (formData.get('resumeUrl') as string) || null;
  const resumeUploadedAt = (formData.get('resumeUploadedAt') as string) || null;
  const linkedinUrl = (formData.get('linkedinUrl') as string)?.trim() || null;
  const githubUrl = (formData.get('githubUrl') as string)?.trim() || null;

  // Validation
  if (!name || name.length < 2) {
    return { success: false, error: 'Full name must contain at least 2 characters.' };
  }

  const year = parseInt(yearStr, 10);
  if (isNaN(year) || year < 1 || year > 5) {
    return { success: false, error: 'Academic year must be between 1 and 5.' };
  }

  const cgpa = parseFloat(cgpaStr);
  if (isNaN(cgpa) || cgpa < 0.0 || cgpa > 10.0) {
    return { success: false, error: 'CGPA must be a valid number between 0.00 and 10.00.' };
  }

  let technicalSkills: string[] = [];
  if (rawTechSkills) {
    try {
      technicalSkills = JSON.parse(rawTechSkills);
    } catch {
      technicalSkills = rawTechSkills.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  let nonTechnicalSkills: string[] = [];
  if (rawNonTechSkills) {
    try {
      nonTechnicalSkills = JSON.parse(rawNonTechSkills);
    } catch {
      nonTechnicalSkills = rawNonTechSkills.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  const combinedSkills = Array.from(new Set([...technicalSkills, ...nonTechnicalSkills]));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');
  const cookieStore = await cookies();

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name,
          contact_number: contactNumber,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (profileError) {
        return { success: false, error: profileError.message };
      }

      // Update students table
      const { error: studentError } = await supabase
        .from('students')
        .update({
          year,
          cgpa,
          skills: combinedSkills,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', currentUser.id);

      if (studentError) {
        return { success: false, error: studentError.message };
      }
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Failed to save student profile.' };
    }
  } else {
    // Demo Mode Persistence
    cookieStore.set('campusconnect_demo_name', name, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_contact', contactNumber || '', { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_year', year.toString(), { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_cgpa', cgpa.toFixed(2), { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_skills', JSON.stringify(combinedSkills), { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_tech_skills', JSON.stringify(technicalSkills), { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_non_tech_skills', JSON.stringify(nonTechnicalSkills), { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_avatar', avatarUrl || '', { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_resume_name', resumeName || '', { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_resume_url', resumeUrl || '', { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_resume_uploaded_at', resumeUploadedAt || '', { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_linkedin', linkedinUrl || '', { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_github', githubUrl || '', { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
  }

  revalidatePath('/profile');
  revalidatePath('/student');
  revalidatePath('/student/resume');
  return { success: true, message: 'Student profile, skills, resume, and credentials saved successfully.' };
}

/**
 * Updates Faculty Profile (Personal info, contact, designation, cabin location)
 */
export async function updateFacultyProfileAction(
  prevState: unknown,
  formData: FormData
): Promise<ProfileActionState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Authentication required.' };
  }

  if (currentUser.role !== 'faculty' && currentUser.role !== 'administrator') {
    return { success: false, error: 'Unauthorized: only faculty can edit faculty profile.' };
  }

  const name = (formData.get('name') as string)?.trim();
  const contactNumber = (formData.get('contactNumber') as string)?.trim() || null;
  const designation = (formData.get('designation') as string)?.trim() || 'Assistant Professor';
  const cabinLocation = (formData.get('cabinLocation') as string)?.trim() || null;

  if (!name || name.length < 2) {
    return { success: false, error: 'Full name must contain at least 2 characters.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');
  const cookieStore = await cookies();

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name,
          contact_number: contactNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (profileError) return { success: false, error: profileError.message };

      const { error: facultyError } = await supabase
        .from('faculty_members')
        .update({
          designation,
          cabin_location: cabinLocation,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', currentUser.id);

      if (facultyError) return { success: false, error: facultyError.message };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Failed to save faculty profile.' };
    }
  } else {
    cookieStore.set('campusconnect_demo_name', name, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_contact', contactNumber || '', { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_designation', designation, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_location', cabinLocation || '', { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
  }

  revalidatePath('/profile');
  revalidatePath('/faculty');
  return { success: true, message: 'Faculty profile updated successfully.' };
}

/**
 * Updates Placement Officer Profile
 */
export async function updatePlacementProfileAction(
  prevState: unknown,
  formData: FormData
): Promise<ProfileActionState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Authentication required.' };
  }

  if (currentUser.role !== 'placement_officer' && currentUser.role !== 'administrator') {
    return { success: false, error: 'Unauthorized: only placement officers can edit this profile.' };
  }

  const name = (formData.get('name') as string)?.trim();
  const contactNumber = (formData.get('contactNumber') as string)?.trim() || null;
  const designation = (formData.get('designation') as string)?.trim() || 'Placement Officer';
  const officeLocation = (formData.get('officeLocation') as string)?.trim() || null;

  if (!name || name.length < 2) {
    return { success: false, error: 'Full name must contain at least 2 characters.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');
  const cookieStore = await cookies();

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name,
          contact_number: contactNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (profileError) return { success: false, error: profileError.message };

      const { error: tpoError } = await supabase
        .from('placement_officers')
        .update({
          designation,
          office_location: officeLocation,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', currentUser.id);

      if (tpoError) return { success: false, error: tpoError.message };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Failed to save placement profile.' };
    }
  } else {
    cookieStore.set('campusconnect_demo_name', name, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_contact', contactNumber || '', { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_designation', designation, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_location', officeLocation || '', { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
  }

  revalidatePath('/profile');
  revalidatePath('/placement');
  return { success: true, message: 'Placement officer profile updated successfully.' };
}

/**
 * Updates Administrator Profile
 */
export async function updateAdminProfileAction(
  prevState: unknown,
  formData: FormData
): Promise<ProfileActionState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Authentication required.' };
  }

  if (currentUser.role !== 'administrator') {
    return { success: false, error: 'Unauthorized: only administrators can edit this profile.' };
  }

  const name = (formData.get('name') as string)?.trim();
  const contactNumber = (formData.get('contactNumber') as string)?.trim() || null;

  if (!name || name.length < 2) {
    return { success: false, error: 'Full name must contain at least 2 characters.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');
  const cookieStore = await cookies();

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name,
          contact_number: contactNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (profileError) return { success: false, error: profileError.message };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Failed to save administrator profile.' };
    }
  } else {
    cookieStore.set('campusconnect_demo_name', name, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
    cookieStore.set('campusconnect_demo_contact', contactNumber || '', { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 });
  }

  revalidatePath('/profile');
  revalidatePath('/admin');
  return { success: true, message: 'Administrator profile updated successfully.' };
}

// -----------------------------------------------------------------------------
// ADMIN USER DIRECTORY ACTIONS
// -----------------------------------------------------------------------------

const DEFAULT_MANAGED_USERS: ManagedUserSummary[] = [
  {
    id: 'usr-student-01',
    name: 'Aarav Sharma',
    email: 'student@university.edu',
    role: 'student',
    department: 'Computer Science & Engineering',
    contactNumber: '+91 98765 43210',
    accountStatus: 'active',
    identifier: 'CS-2026-042',
    year: 3,
    cgpa: 8.75,
    skills: ['Data Structures', 'TypeScript', 'PostgreSQL', 'React.js'],
    placementStatus: 'in_process',
    createdAt: '2026-08-15T09:30:00Z',
  },
  {
    id: 'usr-student-02',
    name: 'Ananya Iyer',
    email: 'ananya.iyer@university.edu',
    role: 'student',
    department: 'Computer Science & Engineering',
    contactNumber: '+91 98765 11223',
    accountStatus: 'active',
    identifier: 'CS-2026-028',
    year: 4,
    cgpa: 9.15,
    skills: ['Algorithms', 'Python', 'Machine Learning', 'Docker'],
    placementStatus: 'placed',
    createdAt: '2026-08-15T10:15:00Z',
  },
  {
    id: 'usr-student-03',
    name: 'Rohan Deshmukh',
    email: 'rohan.d@university.edu',
    role: 'student',
    department: 'Information Technology',
    contactNumber: '+91 98765 33445',
    accountStatus: 'pending',
    identifier: 'IT-2026-014',
    year: 4,
    cgpa: 8.92,
    skills: ['Java', 'Spring Boot', 'SQL', 'Kubernetes'],
    placementStatus: 'unplaced',
    createdAt: '2026-08-16T11:00:00Z',
  },
  {
    id: 'usr-student-04',
    name: 'Vikram Choudhury',
    email: 'vikram.c@university.edu',
    role: 'student',
    department: 'Electronics & Communication Engineering',
    contactNumber: '+91 98765 55667',
    accountStatus: 'suspended',
    identifier: 'ECE-2026-099',
    year: 2,
    cgpa: 6.80,
    skills: ['C++', 'Embedded Systems', 'MATLAB'],
    placementStatus: 'opted_out',
    createdAt: '2026-08-16T14:20:00Z',
  },
  {
    id: 'usr-faculty-01',
    name: 'Dr. Priya Raman',
    email: 'faculty@university.edu',
    role: 'faculty',
    department: 'Computer Science & Engineering',
    contactNumber: '+91 98111 22334',
    accountStatus: 'active',
    identifier: 'FAC-2026-01',
    designation: 'Associate Professor & Advisor',
    location: 'Academic Block 3, Room 304',
    createdAt: '2026-07-10T08:00:00Z',
  },
  {
    id: 'usr-faculty-02',
    name: 'Prof. Ramesh Kulkarni',
    email: 'ramesh.k@university.edu',
    role: 'faculty',
    department: 'Mechanical Engineering',
    contactNumber: '+91 98222 33445',
    accountStatus: 'active',
    identifier: 'FAC-2026-08',
    designation: 'Professor & Head',
    location: 'Mech Block, Room 102',
    createdAt: '2026-07-12T09:30:00Z',
  },
  {
    id: 'usr-placement-01',
    name: 'Mr. Vikram Verma',
    email: 'placement@university.edu',
    role: 'placement_officer',
    department: 'Central Placement Directorate',
    contactNumber: '+91 98333 44556',
    accountStatus: 'active',
    identifier: 'TPO-2026-01',
    designation: 'Placement Officer',
    location: 'Admin Block, Ground Floor',
    createdAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'usr-admin-01',
    name: 'Super Admin',
    email: 'admin@university.edu',
    role: 'administrator',
    department: 'IT Operations & Governance',
    contactNumber: '+91 98444 55667',
    accountStatus: 'active',
    identifier: 'ADMIN-2026-01',
    designation: 'Principal System Administrator',
    location: 'Data Center, Tech Block',
    createdAt: '2026-05-15T08:00:00Z',
  },
];

/**
 * Retrieves list of all users for Administrator directory
 */
export async function getAllUsersAction(): Promise<{
  users: ManagedUserSummary[];
  error?: string;
}> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'administrator') {
    return { users: [], error: 'Unauthorized: Access restricted to System Administrators.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');
  const cookieStore = await cookies();

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          role,
          department,
          contact_number,
          account_status,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return { users: [], error: error.message };
      }

      if (profiles && profiles.length > 0) {
        // Fetch supplemental role tables
        const { data: students } = await supabase.from('students').select('*');
        const { data: faculty } = await supabase.from('faculty_members').select('*');
        const { data: placement } = await supabase.from('placement_officers').select('*');
        const { data: admins } = await supabase.from('administrators').select('*');

        const studentMap = new Map((students || []).map((s: any) => [s.user_id, s]));
        const facultyMap = new Map((faculty || []).map((f: any) => [f.user_id, f]));
        const placementMap = new Map((placement || []).map((p: any) => [p.user_id, p]));
        const adminMap = new Map((admins || []).map((a: any) => [a.user_id, a]));

        const managedUsers: ManagedUserSummary[] = (profiles as any[]).map((p) => {
          let identifier = 'ID-2026';
          let year: number | undefined;
          let cgpa: number | undefined;
          let skills: string[] | undefined;
          let placementStatus = undefined;
          let designation: string | undefined;
          let location: string | null | undefined;

          if (p.role === 'student') {
            const st = studentMap.get(p.id) as any;
            identifier = st?.student_id || 'STU-' + p.id.slice(0, 6);
            year = st?.year;
            cgpa = st?.cgpa ? Number(st.cgpa) : undefined;
            skills = st?.skills;
            placementStatus = st?.placement_status;
          } else if (p.role === 'faculty') {
            const f = facultyMap.get(p.id) as any;
            identifier = f?.employee_id || 'FAC-' + p.id.slice(0, 6);
            designation = f?.designation;
            location = f?.cabin_location;
          } else if (p.role === 'placement_officer') {
            const po = placementMap.get(p.id) as any;
            identifier = po?.employee_id || 'TPO-' + p.id.slice(0, 6);
            designation = po?.designation;
            location = po?.office_location;
          } else if (p.role === 'administrator') {
            const ad = adminMap.get(p.id) as any;
            identifier = ad?.admin_code || 'ADM-' + p.id.slice(0, 6);
          }

          return {
            id: p.id,
            name: p.name,
            email: p.email,
            role: p.role,
            department: p.department,
            contactNumber: p.contact_number,
            accountStatus: p.account_status,
            identifier,
            year,
            cgpa,
            skills,
            placementStatus,
            designation,
            location,
            createdAt: p.created_at,
          };
        });

        return { users: managedUsers };
      }
    } catch {
      // Fallback to default demo list
    }
  }

  // Check if modified users cookie exists in demo mode
  const demoUsersCookie = cookieStore.get('campusconnect_demo_managed_users')?.value;
  if (demoUsersCookie) {
    try {
      const parsed = JSON.parse(demoUsersCookie);
      return { users: parsed };
    } catch {
      // Fallback
    }
  }

  return { users: DEFAULT_MANAGED_USERS };
}

/**
 * Updates a user's account status (active, inactive, pending, suspended)
 */
export async function updateUserStatusAction(
  userId: string,
  newStatus: AccountStatus
): Promise<ProfileActionState> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'administrator') {
    return { success: false, error: 'Unauthorized: Administrator access required.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');
  const cookieStore = await cookies();

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();
      const { error } = await supabase
        .from('profiles')
        .update({
          account_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) return { success: false, error: error.message };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Failed to update account status.' };
    }
  } else {
    // Update demo cookie list
    const currentList = await getAllUsersAction();
    const updated = currentList.users.map((u) =>
      u.id === userId ? { ...u, accountStatus: newStatus } : u
    );
    cookieStore.set('campusconnect_demo_managed_users', JSON.stringify(updated), {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24,
    });
  }

  revalidatePath('/admin/users');
  return { success: true, message: `Account status updated to "${newStatus}".` };
}

/**
 * Updates a user's assigned role (student, faculty, placement_officer, administrator)
 */
export async function updateUserRoleAction(
  userId: string,
  newRole: UserRole
): Promise<ProfileActionState> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'administrator') {
    return { success: false, error: 'Unauthorized: Administrator access required.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');
  const cookieStore = await cookies();

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();
      const { error } = await supabase
        .from('profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) return { success: false, error: error.message };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Failed to update user role.' };
    }
  } else {
    // Update demo cookie list
    const currentList = await getAllUsersAction();
    const updated = currentList.users.map((u) =>
      u.id === userId ? { ...u, role: newRole } : u
    );
    cookieStore.set('campusconnect_demo_managed_users', JSON.stringify(updated), {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24,
    });
  }

  revalidatePath('/admin/users');
  return { success: true, message: `Role updated to "${newRole}".` };
}
