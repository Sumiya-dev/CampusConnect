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
      if (!error && data) {
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

/**
 * Superadmin / Placement Officer: View all placement drives with application counts and deep filtering
 */
export async function getAllPlacementDrives(
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
          company:companies (*),
          applications (id, status)
        `);

      if (filters?.company_id && filters.company_id !== 'all') {
        query = query.eq('company_id', filters.company_id);
      }

      if (filters?.tier && filters.tier !== 'all') {
        query = query.eq('tier', filters.tier);
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.department && filters.department !== 'all') {
        query = query.contains('eligible_departments', [filters.department]);
      }

      if (filters?.academic_year && filters.academic_year !== 'all') {
        query = query.contains('eligible_years', [Number(filters.academic_year)]);
      }

      const { data, error } = await query;
      if (!error && data) {
        let drives: DriveWithCompany[] = data.map((d: any) => ({
          ...d,
          applications_count: Array.isArray(d.applications) ? d.applications.length : 0,
        }));

        // In-memory filters for complex date/text matching
        if (filters?.search && filters.search.trim()) {
          const s = filters.search.toLowerCase().trim();
          drives = drives.filter(
            (d) =>
              d.job_role.toLowerCase().includes(s) ||
              d.company?.company_name.toLowerCase().includes(s) ||
              d.location?.toLowerCase().includes(s) ||
              d.package_details.toLowerCase().includes(s) ||
              d.eligible_departments?.some((dept) => dept.toLowerCase().includes(s))
          );
        }

        if (filters?.date_filter && filters.date_filter !== 'all') {
          const now = Date.now();
          if (filters.date_filter === 'upcoming') {
            drives = drives.filter(
              (d) =>
                d.status === 'open' &&
                new Date(d.registration_deadline).getTime() >= now
            );
          } else if (filters.date_filter === 'ongoing') {
            drives = drives.filter(
              (d) =>
                d.status === 'in_progress' ||
                (d.status === 'open' && new Date(d.registration_deadline).getTime() < now)
            );
          } else if (filters.date_filter === 'completed') {
            drives = drives.filter((d) => d.status === 'completed');
          } else if (filters.date_filter === 'cancelled') {
            drives = drives.filter((d) => d.status === 'cancelled');
          } else if (filters.date_filter === 'archived') {
            drives = drives.filter((d) => d.status === 'archived');
          }
        }

        // Sorting
        if (filters?.sortBy === 'deadline_desc') {
          drives.sort(
            (a, b) =>
              new Date(b.registration_deadline).getTime() -
              new Date(a.registration_deadline).getTime()
          );
        } else if (filters?.sortBy === 'cgpa_desc') {
          drives.sort((a, b) => b.min_cgpa - a.min_cgpa);
        } else if (filters?.sortBy === 'cgpa_asc') {
          drives.sort((a, b) => a.min_cgpa - b.min_cgpa);
        } else if (filters?.sortBy === 'date_asc') {
          drives.sort((a, b) => {
            const tA = a.drive_date ? new Date(a.drive_date).getTime() : Infinity;
            const tB = b.drive_date ? new Date(b.drive_date).getTime() : Infinity;
            return tA - tB;
          });
        } else if (filters?.sortBy === 'date_desc') {
          drives.sort((a, b) => {
            const tA = a.drive_date ? new Date(a.drive_date).getTime() : 0;
            const tB = b.drive_date ? new Date(b.drive_date).getTime() : 0;
            return tB - tA;
          });
        } else {
          // Default: latest deadline / created
          drives.sort(
            (a, b) =>
              new Date(b.created_at || b.registration_deadline).getTime() -
              new Date(a.created_at || a.registration_deadline).getTime()
          );
        }

        return drives;
      }
    } catch {
      // Fallback
    }
  }

  // Fallback demo store
  const drives = await getPlacementDrives();
  return drives.map((d) => ({ ...d, applications_count: 5 }));
}

/**
 * Superadmin / Placement Officer: View drive details with statistical application breakdown and eligibility count
 */
export async function getDriveDetailWithStats(
  driveId: string
): Promise<import('../types/drive.types').DriveDetailWithStats | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();

      const [driveRes, appsRes, studentsRes] = await Promise.all([
        supabase
          .from('placement_drives')
          .select(`
            *,
            company:companies (*)
          `)
          .eq('id', driveId)
          .single(),
        supabase
          .from('applications')
          .select('id, status')
          .eq('drive_id', driveId),
        supabase
          .from('students')
          .select('id, department, year, cgpa, skills'),
      ]);

      if (!driveRes.error && driveRes.data) {
        const drive = driveRes.data as DriveWithCompany;
        const apps = appsRes.data || [];

        const breakdown = {
          applied: 0,
          shortlisted: 0,
          interview: 0,
          selected: 0,
          placed: 0,
          rejected: 0,
          withdrawn: 0,
        };

        for (const app of apps) {
          const st = app.status as keyof typeof breakdown;
          if (breakdown[st] !== undefined) {
            breakdown[st]++;
          }
        }

        // Calculate eligible students count
        const { evaluateEligibility } = await import('./eligibility');
        let eligibleCount = 0;
        if (studentsRes.data) {
          for (const s of studentsRes.data) {
            const res = evaluateEligibility(
              {
                cgpa: Number(s.cgpa) || 0,
                department: s.department,
                year: Number(s.year) || 3,
                skills: Array.isArray(s.skills) ? s.skills : [],
              },
              drive
            );
            if (res.isEligible) {
              eligibleCount++;
            }
          }
        }

        return {
          ...drive,
          applicationsCount: apps.length,
          applicationsBreakdown: breakdown,
          eligibleStudentsCount: eligibleCount,
        };
      }
    } catch {
      // Fallback
    }
  }

  const drive = await getPlacementDriveById(driveId);
  if (!drive) return null;

  return {
    ...drive,
    applicationsCount: 8,
    applicationsBreakdown: {
      applied: 3,
      shortlisted: 2,
      interview: 1,
      selected: 1,
      placed: 1,
      rejected: 0,
      withdrawn: 0,
    },
    eligibleStudentsCount: 24,
  };
}

/**
 * Superadmin / Placement Officer: View full list of applications for a drive
 */
export async function getDriveApplications(
  driveId: string
): Promise<import('../types/drive.types').ApplicationDetailWithStudent[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          student:students (
            *,
            profile:profiles (*)
          )
        `)
        .eq('drive_id', driveId)
        .order('applied_at', { ascending: false });

      if (!error && data) {
        return data as unknown as import('../types/drive.types').ApplicationDetailWithStudent[];
      }
    } catch {
      // Fallback
    }
  }

  return [];
}

/**
 * Superadmin: Fetch eligible students list evaluated against drive rules
 */
export async function getDriveEligibleStudents(
  driveId: string
): Promise<{ student: any; isEligible: boolean; reasons: string[]; passedChecks: string[] }[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();
      const [driveRes, studentsRes] = await Promise.all([
        supabase.from('placement_drives').select('*').eq('id', driveId).single(),
        supabase.from('students').select('*, profile:profiles (*)').order('cgpa', { ascending: false }),
      ]);

      if (!driveRes.error && driveRes.data && studentsRes.data) {
        const drive = driveRes.data;
        const { evaluateEligibility } = await import('./eligibility');

        return studentsRes.data.map((student: any) => {
          const evalResult = evaluateEligibility(
            {
              cgpa: Number(student.cgpa) || 0,
              department: student.department,
              year: Number(student.year) || 3,
              skills: Array.isArray(student.skills) ? student.skills : [],
            },
            drive
          );

          return {
            student,
            isEligible: evalResult.isEligible,
            reasons: evalResult.reasons,
            passedChecks: evalResult.passedChecks,
          };
        });
      }
    } catch {
      // Fallback
    }
  }

  return [];
}

/**
 * Fetches distinct metadata for placement drive filters and creation dropdowns
 */
export async function getDistinctDriveMetadata(): Promise<{
  departments: string[];
  programs: string[];
  years: number[];
  companies: { id: string; company_name: string; industry: string | null; location: string | null }[];
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  const defaultDepts = [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication Engineering',
    'Electrical & Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
  ];

  const defaultPrograms = [
    'B.Tech - Computer Science',
    'B.Tech - Information Technology',
    'B.Tech - Electronics & Communication',
    'B.Tech - Artificial Intelligence & Data Science',
    'M.Tech - Software Engineering',
    'MCA',
  ];

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();
      const [compRes, deptRes, progRes] = await Promise.all([
        supabase
          .from('companies')
          .select('id, company_name, industry, location')
          .eq('status', 'active')
          .order('company_name', { ascending: true }),
        supabase.from('departments').select('name').eq('status', 'active'),
        supabase.from('programs').select('name').eq('status', 'active'),
      ]);

      const companies = compRes.data || [];
      const departments =
        deptRes.data && deptRes.data.length > 0
          ? deptRes.data.map((d: any) => d.name)
          : defaultDepts;
      const programs =
        progRes.data && progRes.data.length > 0
          ? progRes.data.map((p: any) => p.name)
          : defaultPrograms;

      return {
        departments: Array.from(new Set<string>(departments)).sort(),
        programs: Array.from(new Set<string>(programs)).sort(),
        years: [1, 2, 3, 4],
        companies,
      };
    } catch {
      // Fallback
    }
  }

  return {
    departments: defaultDepts,
    programs: defaultPrograms,
    years: [1, 2, 3, 4],
    companies: [],
  };
}

