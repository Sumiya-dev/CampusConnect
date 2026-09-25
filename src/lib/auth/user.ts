import { cookies } from 'next/headers';
import { createClient } from '../supabase/server';
import { Profile, UserRole } from '../types/database.types';
import {
  FullUserProfile,
  StudentProfileData,
  FacultyProfileData,
  PlacementProfileData,
  AdminProfileData,
} from '../types/profile.types';

export interface CurrentUserContext {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  contactNumber: string | null;
  identifier: string;
  accountStatus: 'active' | 'inactive' | 'pending' | 'suspended';
  profile?: Profile;
}

export async function getCurrentUser(): Promise<CurrentUserContext | null> {
  const cookieStore = await cookies();

  // 1. Try Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const userProfile = profile as Profile | null;
        const role = (userProfile?.role as UserRole) || (user.user_metadata?.role as UserRole) || 'student';
        return {
          id: user.id,
          email: user.email || '',
          name: userProfile?.name || user.user_metadata?.name || 'User',
          role,
          department: userProfile?.department || user.user_metadata?.department || 'Computer Science & Engineering',
          contactNumber: userProfile?.contact_number || user.user_metadata?.contact_number || null,
          identifier: user.user_metadata?.identifier || 'ID-2026',
          accountStatus: userProfile?.account_status || 'active',
          profile: userProfile || undefined,
        };
      }
    } catch {
      // Continue fallback
    }
  }

  // 2. Check Demo Session Cookie
  const demoRole = cookieStore.get('campusconnect_demo_role')?.value as UserRole | undefined;
  const demoUser = cookieStore.get('campusconnect_demo_user')?.value;
  const demoName = cookieStore.get('campusconnect_demo_name')?.value;
  const demoDept = cookieStore.get('campusconnect_demo_dept')?.value;
  const demoId = cookieStore.get('campusconnect_demo_id')?.value;
  const demoContact = cookieStore.get('campusconnect_demo_contact')?.value;
  const demoStatus = cookieStore.get('campusconnect_demo_account_status')?.value as
    | 'active'
    | 'inactive'
    | 'pending'
    | 'suspended'
    | undefined;

  if (demoUser && demoRole) {
    return {
      id: 'demo-user-id',
      email: demoUser,
      name: demoName || 'Demo User',
      role: demoRole,
      department: demoDept || 'Computer Science & Engineering',
      contactNumber: demoContact || '+91 98765 43210',
      identifier: demoId || 'ID-2026',
      accountStatus: demoStatus || 'active',
    };
  }

  return null;
}

export async function getFullUserProfile(): Promise<FullUserProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  if (isLiveSupabase) {
    try {
      const supabase = await createClient();

      if (user.role === 'student') {
        const { data: studentRecord } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .single();

        const s = studentRecord as {
          student_id: string;
          department: string;
          year: number;
          cgpa: number;
          skills: string[];
          placement_status: 'unplaced' | 'placed' | 'opted_out' | 'in_process';
        } | null;

        const studentProfile: StudentProfileData = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'student',
          department: s?.department || user.department,
          contactNumber: user.contactNumber,
          accountStatus: user.accountStatus,
          studentId: s?.student_id || user.identifier || 'CS-2026-042',
          year: s?.year ?? 3,
          cgpa: Number(s?.cgpa ?? 8.75),
          skills: Array.isArray(s?.skills) ? s.skills : ['Data Structures & Algorithms', 'TypeScript', 'PostgreSQL'],
          placementStatus: s?.placement_status || 'in_process',
        };
        return studentProfile;
      }

      if (user.role === 'faculty') {
        const { data: facultyRecord } = await supabase
          .from('faculty_members')
          .select('*')
          .eq('user_id', user.id)
          .single();

        const f = facultyRecord as {
          employee_id: string;
          department: string;
          designation: string;
          cabin_location: string | null;
        } | null;

        const facultyProfile: FacultyProfileData = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'faculty',
          department: f?.department || user.department,
          contactNumber: user.contactNumber,
          accountStatus: user.accountStatus,
          employeeId: f?.employee_id || user.identifier || 'FAC-2026-01',
          designation: f?.designation || 'Assistant Professor & Advisor',
          cabinLocation: f?.cabin_location || 'Academic Block 3, Room 304',
        };
        return facultyProfile;
      }

      if (user.role === 'placement_officer') {
        const { data: placementRecord } = await supabase
          .from('placement_officers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        const p = placementRecord as {
          employee_id: string;
          designation: string;
          office_location: string | null;
        } | null;

        const placementProfile: PlacementProfileData = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'placement_officer',
          department: user.department || 'Central Placement Directorate',
          contactNumber: user.contactNumber,
          accountStatus: user.accountStatus,
          employeeId: p?.employee_id || user.identifier || 'TPO-2026-01',
          designation: p?.designation || 'Placement Officer',
          officeLocation: p?.office_location || 'Placement Cell, Administrative Block',
        };
        return placementProfile;
      }

      if (user.role === 'administrator') {
        const { data: adminRecord } = await supabase
          .from('administrators')
          .select('*')
          .eq('user_id', user.id)
          .single();

        const a = adminRecord as {
          admin_code: string;
          access_level: string;
        } | null;

        const adminProfile: AdminProfileData = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'administrator',
          department: user.department || 'IT Operations & Governance',
          contactNumber: user.contactNumber,
          accountStatus: user.accountStatus,
          adminCode: a?.admin_code || user.identifier || 'SYS-ADMIN-001',
          accessLevel: a?.access_level || 'Super Administrator (Full System Scope)',
        };
        return adminProfile;
      }
    } catch {
      // Fall through to demo cookie values
    }
  }

  // Demo Mode Fallback
  if (user.role === 'student') {
    const rawSkills = cookieStore.get('campusconnect_demo_skills')?.value;
    let skillsList: string[] = ['Data Structures', 'TypeScript', 'React.js', 'PostgreSQL', 'Python'];
    if (rawSkills) {
      try {
        skillsList = JSON.parse(rawSkills);
      } catch {
        skillsList = rawSkills.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    const rawTechSkills = cookieStore.get('campusconnect_demo_tech_skills')?.value;
    let techSkillsList: string[] = ['Data Structures', 'TypeScript', 'React.js', 'PostgreSQL', 'Python'];
    if (rawTechSkills) {
      try {
        techSkillsList = JSON.parse(rawTechSkills);
      } catch {
        techSkillsList = rawTechSkills.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    const rawNonTechSkills = cookieStore.get('campusconnect_demo_non_tech_skills')?.value;
    let nonTechSkillsList: string[] = ['Problem Solving', 'Team Leadership', 'Verbal Communication'];
    if (rawNonTechSkills) {
      try {
        nonTechSkillsList = JSON.parse(rawNonTechSkills);
      } catch {
        nonTechSkillsList = rawNonTechSkills.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    const yearVal = parseInt(cookieStore.get('campusconnect_demo_year')?.value || '3', 10);
    const cgpaVal = parseFloat(cookieStore.get('campusconnect_demo_cgpa')?.value || '8.75');
    const placementStatus = (cookieStore.get('campusconnect_demo_placement_status')?.value || 'in_process') as
      | 'unplaced'
      | 'placed'
      | 'opted_out'
      | 'in_process';

    const avatarUrl = cookieStore.get('campusconnect_demo_avatar')?.value || null;
    const resumeName = cookieStore.get('campusconnect_demo_resume_name')?.value || null;
    const resumeUrl = cookieStore.get('campusconnect_demo_resume_url')?.value || null;
    const resumeUploadedAt = cookieStore.get('campusconnect_demo_resume_uploaded_at')?.value || null;
    const linkedinUrl = cookieStore.get('campusconnect_demo_linkedin')?.value || null;
    const githubUrl = cookieStore.get('campusconnect_demo_github')?.value || null;

    const studentProfile: StudentProfileData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'student',
      department: user.department,
      contactNumber: user.contactNumber,
      accountStatus: user.accountStatus,
      avatarUrl,
      studentId: user.identifier || 'CS-2026-042',
      year: isNaN(yearVal) ? 3 : yearVal,
      cgpa: isNaN(cgpaVal) ? 8.75 : cgpaVal,
      skills: skillsList,
      technicalSkills: techSkillsList,
      nonTechnicalSkills: nonTechSkillsList,
      resumeName,
      resumeUrl,
      resumeUploadedAt,
      linkedinUrl,
      githubUrl,
      placementStatus,
    };
    return studentProfile;
  }

  if (user.role === 'faculty') {
    const designation = cookieStore.get('campusconnect_demo_designation')?.value || 'Assistant Professor & Advisor';
    const cabinLocation = cookieStore.get('campusconnect_demo_location')?.value || 'Academic Block 3, Room 304';

    const facultyProfile: FacultyProfileData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'faculty',
      department: user.department,
      contactNumber: user.contactNumber,
      accountStatus: user.accountStatus,
      employeeId: user.identifier || 'FAC-2026-01',
      designation,
      cabinLocation,
    };
    return facultyProfile;
  }

  if (user.role === 'placement_officer') {
    const designation = cookieStore.get('campusconnect_demo_designation')?.value || 'Senior Placement Officer';
    const officeLocation = cookieStore.get('campusconnect_demo_location')?.value || 'Placement Cell, Ground Floor';

    const placementProfile: PlacementProfileData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'placement_officer',
      department: user.department || 'Central Placement Directorate',
      contactNumber: user.contactNumber,
      accountStatus: user.accountStatus,
      employeeId: user.identifier || 'TPO-2026-01',
      designation,
      officeLocation,
    };
    return placementProfile;
  }

  // Administrator
  const adminProfile: AdminProfileData = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: 'administrator',
    department: user.department || 'IT Operations & Governance',
    contactNumber: user.contactNumber,
    accountStatus: user.accountStatus,
    adminCode: user.identifier || 'SYS-ADMIN-001',
    accessLevel: 'Super Administrator (Full System Scope)',
  };
  return adminProfile;
}
