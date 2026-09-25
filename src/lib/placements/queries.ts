import { cookies } from 'next/headers';
import { createClient } from '../supabase/server';
import { Application, PlacementDrive } from '../types/database.types';
import { ApplicationWithDrive, DriveFilterState, DriveWithCompany } from '../types/drive.types';
import { SEED_DRIVES } from './data';

export async function getPlacementDrives(
  filters?: DriveFilterState
): Promise<DriveWithCompany[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();
      let query = supabase
        .from('placement_drives')
        .select(`
          *,
          company:companies (*)
        `)
        .neq('status', 'cancelled');

      if (filters?.tier && filters.tier !== 'all') {
        query = query.eq('tier', filters.tier);
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.search && filters.search.trim()) {
        const term = filters.search.trim();
        query = query.or(
          `job_role.ilike.%${term}%,package_details.ilike.%${term}%,location.ilike.%${term}%`
        );
      }

      if (filters?.sortBy === 'deadline_asc') {
        query = query.order('registration_deadline', { ascending: true });
      } else if (filters?.sortBy === 'deadline_desc') {
        query = query.order('registration_deadline', { ascending: false });
      } else if (filters?.sortBy === 'cgpa_asc') {
        query = query.order('min_cgpa', { ascending: true });
      } else if (filters?.sortBy === 'cgpa_desc') {
        query = query.order('min_cgpa', { ascending: false });
      } else {
        query = query.order('registration_deadline', { ascending: true });
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as unknown as DriveWithCompany[];
      }
    } catch {
      // Fallback
    }
  }

  // Fallback store (reads from demo cookie or default SEED_DRIVES)
  const cookieStore = await cookies();
  const demoDrivesCookie = cookieStore.get('campusconnect_demo_drives')?.value;
  let drives: DriveWithCompany[] = [...SEED_DRIVES];

  if (demoDrivesCookie) {
    try {
      const parsed = JSON.parse(demoDrivesCookie);
      if (Array.isArray(parsed) && parsed.length > 0) {
        drives = parsed;
      }
    } catch {
      // Return default SEED_DRIVES if parse fails
    }
  }

  let filtered = [...drives];

  if (filters?.search && filters.search.trim()) {
    const s = filters.search.toLowerCase().trim();
    filtered = filtered.filter(
      (d) =>
        d.job_role.toLowerCase().includes(s) ||
        (d.company?.company_name && d.company.company_name.toLowerCase().includes(s)) ||
        (d.location && d.location.toLowerCase().includes(s)) ||
        d.package_details.toLowerCase().includes(s)
    );
  }

  if (filters?.tier && filters.tier !== 'all') {
    filtered = filtered.filter((d) => d.tier === filters.tier);
  }

  if (filters?.status && filters.status !== 'all') {
    filtered = filtered.filter((d) => d.status === filters.status);
  }

  if (filters?.sortBy === 'deadline_desc') {
    filtered.sort(
      (a, b) =>
        new Date(b.registration_deadline).getTime() -
        new Date(a.registration_deadline).getTime()
    );
  } else if (filters?.sortBy === 'cgpa_desc') {
    filtered.sort((a, b) => b.min_cgpa - a.min_cgpa);
  } else if (filters?.sortBy === 'cgpa_asc') {
    filtered.sort((a, b) => a.min_cgpa - b.min_cgpa);
  } else {
    filtered.sort(
      (a, b) =>
        new Date(a.registration_deadline).getTime() -
        new Date(b.registration_deadline).getTime()
    );
  }

  return filtered;
}

export async function getPlacementDriveById(
  driveId: string
): Promise<DriveWithCompany | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();
      const { data, error } = await supabase
        .from('placement_drives')
        .select(`
          *,
          company:companies (*)
        `)
        .eq('id', driveId)
        .single();

      if (!error && data) {
        return data as unknown as DriveWithCompany;
      }
    } catch {
      // Fallback
    }
  }

  // Fallback lookup
  const drives = await getPlacementDrives();
  return drives.find((d) => d.id === driveId) || null;
}

export async function getStudentApplications(
  userId: string
): Promise<ApplicationWithDrive[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();
      // First get student_id
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!student) return [];

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          drive:placement_drives (
            *,
            company:companies (*)
          )
        `)
        .eq('student_id', student.id)
        .order('applied_at', { ascending: false });

      if (!error && data) {
        return data as unknown as ApplicationWithDrive[];
      }
    } catch {
      // Fallback
    }
  }

  // Fallback demo store
  const cookieStore = await cookies();
  const demoAppsCookie = cookieStore.get('campusconnect_demo_applications')?.value;
  if (demoAppsCookie) {
    try {
      const parsed = JSON.parse(demoAppsCookie);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (a: ApplicationWithDrive) =>
            a.student_id === userId ||
            a.student_id === 'demo-student-id' ||
            a.student_id === 'demo-user-id'
        );
      }
    } catch {
      // Return empty
    }
  }

  return [];
}

export async function getStudentShortlists(
  userId: string
): Promise<ApplicationWithDrive[]> {
  const applications = await getStudentApplications(userId);
  const shortlistedStatuses = ['shortlisted', 'interview', 'selected', 'placed'];
  return applications.filter((app) => shortlistedStatuses.includes(app.status));
}

export async function getStudentApplicationForDrive(
  userId: string,
  driveId: string
): Promise<Application | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (student) {
        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .eq('student_id', student.id)
          .eq('drive_id', driveId)
          .maybeSingle();

        if (!error && data) {
          return data as Application;
        }
      }
    } catch {
      // Fallback
    }
  }

  const applications = await getStudentApplications(userId);
  return applications.find((a) => a.drive_id === driveId) || null;
}
