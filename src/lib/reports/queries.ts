import { createClient } from '../supabase/server';
import { getCurrentUser } from '../auth/user';
import {
  AnalyticsFilterMetadata,
  AnalyticsFilterOptions,
  CompanyPlacementStat,
  DepartmentPlacementStat,
  DrivePerformanceStat,
  OverviewMetrics,
  PlacementAnalyticsReportData,
  StudentPlacementReportRow,
  YearPlacementStat,
} from '../types/reports.types';

const ACADEMIC_YEAR_LABELS: Record<number, string> = {
  1: '1st Year (Freshman)',
  2: '2nd Year (Sophomore)',
  3: '3rd Year (Pre-Final)',
  4: '4th Year (Graduating)',
  5: '5th Year (Dual Degree)',
};

/**
 * Superadmin authorization check
 */
async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    throw new Error('Unauthorized: Superadmin privileges required for reports & analytics.');
  }
  return user;
}

/**
 * Fetch filter dropdown metadata
 */
export async function getAnalyticsFilterMetadata(): Promise<AnalyticsFilterMetadata> {
  const supabase: any = await createClient();

  const [deptsRes, progsRes, yearsRes, compsRes, drivesRes] = await Promise.all([
    supabase.from('departments').select('id, name, code').eq('status', 'active').order('name'),
    supabase.from('programs').select('id, name, code, department_id').order('name'),
    supabase.from('academic_years').select('id, year_number, display_name').order('year_number'),
    supabase.from('companies').select('id, company_name').order('company_name'),
    supabase
      .from('placement_drives')
      .select('id, job_role, companies!placement_drives_company_id_fkey(company_name)')
      .order('job_role'),
  ]);

  const drivesList = (drivesRes.data || []).map((d: any) => ({
    id: d.id,
    job_role: d.job_role,
    company_name: d.companies?.company_name || 'Enterprise Recruiter',
  }));

  return {
    departments: deptsRes.data || [],
    programs: progsRes.data || [],
    academicYears: yearsRes.data || [],
    companies: compsRes.data || [],
    drives: drivesList,
    placementStatuses: ['placed', 'unplaced', 'in_process', 'opted_out'],
  };
}

/**
 * Compute real placement analytics and reports based on active filters
 */
export async function getPlacementAnalyticsReport(
  filters: AnalyticsFilterOptions = {}
): Promise<PlacementAnalyticsReportData> {
  await requireSuperAdmin();
  const supabase: any = await createClient();

  const metadata = await getAnalyticsFilterMetadata();

  // 1. Fetch Students
  let studentQuery = supabase
    .from('students')
    .select(
      `
      id,
      student_id,
      department,
      year,
      cgpa,
      placement_status,
      profiles!students_user_id_fkey(
        name,
        email,
        account_status
      )
    `
    );

  if (filters.department && filters.department !== 'all') {
    studentQuery = studentQuery.eq('department', filters.department);
  }
  if (filters.year && filters.year !== 'all') {
    studentQuery = studentQuery.eq('year', parseInt(filters.year, 10));
  }
  if (filters.placement_status && filters.placement_status !== 'all') {
    studentQuery = studentQuery.eq('placement_status', filters.placement_status);
  }

  const { data: rawStudents, error: studentError } = await studentQuery;
  if (studentError) {
    console.error('Error fetching analytics students:', studentError);
  }

  let students = (rawStudents || []).filter(
    (s: any) => s.profiles?.account_status !== 'suspended'
  );

  // If program_id filter is specified, filter students by their section's program
  if (filters.program_id && filters.program_id !== 'all') {
    const studentIds = students.map((s: any) => s.id);
    if (studentIds.length > 0) {
      const { data: enrollments } = await supabase
        .from('student_academic_enrollments')
        .select('student_id, academic_sections!inner(program_id)')
        .eq('academic_sections.program_id', filters.program_id)
        .in('student_id', studentIds);

      const enrolledIds = new Set((enrollments || []).map((e: any) => e.student_id));
      students = students.filter((s: any) => enrolledIds.has(s.id));
    } else {
      students = [];
    }
  }

  // 2. Fetch Companies
  let companyQuery = supabase.from('companies').select('id, company_name, industry, status');
  if (filters.company_id && filters.company_id !== 'all') {
    companyQuery = companyQuery.eq('id', filters.company_id);
  }
  const { data: rawCompanies } = await companyQuery;
  const companies = rawCompanies || [];
  const companyMap = new Map<string, any>(companies.map((c: any) => [c.id, c]));

  // 3. Fetch Drives
  let driveQuery = supabase
    .from('placement_drives')
    .select('id, company_id, job_role, tier, status, package_details, eligible_departments, eligible_years');

  if (filters.company_id && filters.company_id !== 'all') {
    driveQuery = driveQuery.eq('company_id', filters.company_id);
  }
  if (filters.drive_id && filters.drive_id !== 'all') {
    driveQuery = driveQuery.eq('id', filters.drive_id);
  }
  const { data: rawDrives } = await driveQuery;
  const drives = rawDrives || [];
  const driveMap = new Map<string, any>(drives.map((d: any) => [d.id, d]));

  // 4. Fetch Applications
  let appQuery = supabase
    .from('applications')
    .select('id, student_id, drive_id, status, applied_at, shortlisted_at');

  if (filters.drive_id && filters.drive_id !== 'all') {
    appQuery = appQuery.eq('drive_id', filters.drive_id);
  }
  const { data: rawApps } = await appQuery;
  let applications = rawApps || [];

  // Filter applications by active student pool and active drive pool
  const studentIdSet = new Set(students.map((s: any) => s.id));
  const driveIdSet = new Set(drives.map((d: any) => d.id));

  // If specific company was filtered, ensure drive belongs to that company
  if (filters.company_id && filters.company_id !== 'all') {
    applications = applications.filter((app: any) => driveIdSet.has(app.drive_id));
  }

  // Applications relevant to the active student filter set
  const filteredApps = applications.filter((app: any) => studentIdSet.has(app.student_id));

  // If company or drive filter is active, refine the students list to those who participated
  if (
    (filters.company_id && filters.company_id !== 'all') ||
    (filters.drive_id && filters.drive_id !== 'all')
  ) {
    const participatingStudentIds = new Set(filteredApps.map((a: any) => a.student_id));
    students = students.filter((s: any) => participatingStudentIds.has(s.id));
  }

  // Compute student application count and highest placed offer
  const studentAppStats = new Map<
    string,
    { appCount: number; placedCompany?: string; placedRole?: string }
  >();

  filteredApps.forEach((app: any) => {
    const curr = studentAppStats.get(app.student_id) || { appCount: 0 };
    curr.appCount++;

    if (app.status === 'selected' || app.status === 'placed') {
      const drive = driveMap.get(app.drive_id);
      if (drive) {
        const company = companyMap.get(drive.company_id);
        curr.placedCompany = company?.company_name || 'Enterprise Recruiter';
        curr.placedRole = drive.job_role;
      }
    }
    studentAppStats.set(app.student_id, curr);
  });

  // OVERVIEW METRICS
  const totalStudents = students.length;
  const placedStudents = students.filter((s: any) => s.placement_status === 'placed').length;
  const unplacedStudents = students.filter((s: any) => s.placement_status === 'unplaced').length;
  const inProcessStudents = students.filter((s: any) => s.placement_status === 'in_process').length;
  const optedOutStudents = students.filter((s: any) => s.placement_status === 'opted_out').length;
  const placementPercentage =
    totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 1000) / 10 : 0;

  const totalCompanies = companies.length;
  const totalDrives = drives.length;
  const totalApplications = filteredApps.length;
  const totalSelections = filteredApps.filter(
    (a: any) => a.status === 'selected' || a.status === 'placed'
  ).length;

  const overview: OverviewMetrics = {
    totalStudents,
    placedStudents,
    unplacedStudents,
    inProcessStudents,
    optedOutStudents,
    placementPercentage,
    totalCompanies,
    totalDrives,
    totalApplications,
    totalSelections,
  };

  // DEPARTMENT-WISE STATISTICS
  const deptStatsMap = new Map<
    string,
    {
      total: number;
      placed: number;
      unplaced: number;
      inProcess: number;
      apps: number;
      selections: number;
    }
  >();

  students.forEach((s: any) => {
    const dept = s.department || 'General';
    const curr = deptStatsMap.get(dept) || {
      total: 0,
      placed: 0,
      unplaced: 0,
      inProcess: 0,
      apps: 0,
      selections: 0,
    };
    curr.total++;
    if (s.placement_status === 'placed') curr.placed++;
    else if (s.placement_status === 'unplaced') curr.unplaced++;
    else if (s.placement_status === 'in_process') curr.inProcess++;

    const studentStats = studentAppStats.get(s.id);
    if (studentStats) {
      curr.apps += studentStats.appCount;
    }
    deptStatsMap.set(dept, curr);
  });

  filteredApps.forEach((app: any) => {
    if (app.status === 'selected' || app.status === 'placed') {
      const student = students.find((s: any) => s.id === app.student_id);
      if (student) {
        const dept = student.department || 'General';
        const curr = deptStatsMap.get(dept);
        if (curr) curr.selections++;
      }
    }
  });

  const departmentStats: DepartmentPlacementStat[] = Array.from(deptStatsMap.entries())
    .map(([dept, d]) => ({
      department: dept,
      totalStudents: d.total,
      placedStudents: d.placed,
      unplacedStudents: d.unplaced,
      inProcessStudents: d.inProcess,
      placementPercentage: d.total > 0 ? Math.round((d.placed / d.total) * 1000) / 10 : 0,
      totalApplications: d.apps,
      totalSelections: d.selections,
    }))
    .sort((a, b) => b.placementPercentage - a.placementPercentage);

  // ACADEMIC-YEAR STATISTICS
  const yearStatsMap = new Map<
    number,
    { total: number; placed: number; unplaced: number; apps: number; selections: number }
  >();

  students.forEach((s: any) => {
    const yr = s.year || 1;
    const curr = yearStatsMap.get(yr) || {
      total: 0,
      placed: 0,
      unplaced: 0,
      apps: 0,
      selections: 0,
    };
    curr.total++;
    if (s.placement_status === 'placed') curr.placed++;
    else if (s.placement_status === 'unplaced') curr.unplaced++;

    const studentStats = studentAppStats.get(s.id);
    if (studentStats) {
      curr.apps += studentStats.appCount;
    }
    yearStatsMap.set(yr, curr);
  });

  filteredApps.forEach((app: any) => {
    if (app.status === 'selected' || app.status === 'placed') {
      const student = students.find((s: any) => s.id === app.student_id);
      if (student) {
        const yr = student.year || 1;
        const curr = yearStatsMap.get(yr);
        if (curr) curr.selections++;
      }
    }
  });

  const yearStats: YearPlacementStat[] = Array.from(yearStatsMap.entries())
    .map(([yr, y]) => ({
      year: yr,
      yearLabel: ACADEMIC_YEAR_LABELS[yr] || `Year ${yr}`,
      totalStudents: y.total,
      placedStudents: y.placed,
      unplacedStudents: y.unplaced,
      placementPercentage: y.total > 0 ? Math.round((y.placed / y.total) * 1000) / 10 : 0,
      totalApplications: y.apps,
      totalSelections: y.selections,
    }))
    .sort((a, b) => a.year - b.year);

  // COMPANY-WISE STATISTICS
  const compStatsMap = new Map<
    string,
    { drivesCount: number; apps: number; shortlisted: number; selections: number }
  >();

  drives.forEach((d: any) => {
    const curr = compStatsMap.get(d.company_id) || {
      drivesCount: 0,
      apps: 0,
      shortlisted: 0,
      selections: 0,
    };
    curr.drivesCount++;
    compStatsMap.set(d.company_id, curr);
  });

  filteredApps.forEach((app: any) => {
    const drive = driveMap.get(app.drive_id);
    if (drive) {
      const curr = compStatsMap.get(drive.company_id) || {
        drivesCount: 0,
        apps: 0,
        shortlisted: 0,
        selections: 0,
      };
      curr.apps++;
      if (
        app.status === 'shortlisted' ||
        app.status === 'interview' ||
        app.status === 'selected' ||
        app.status === 'placed'
      ) {
        curr.shortlisted++;
      }
      if (app.status === 'selected' || app.status === 'placed') {
        curr.selections++;
      }
      compStatsMap.set(drive.company_id, curr);
    }
  });

  const companyStats: CompanyPlacementStat[] = Array.from(compStatsMap.entries())
    .map(([compId, cs]) => {
      const comp = companyMap.get(compId);
      return {
        companyId: compId,
        companyName: comp?.company_name || 'Enterprise Recruiter',
        industry: comp?.industry || 'Technology',
        drivesCount: cs.drivesCount,
        applicationsCount: cs.apps,
        shortlistedCount: cs.shortlisted,
        selectionsCount: cs.selections,
      };
    })
    .sort((a, b) => b.selectionsCount - a.selectionsCount);

  // DRIVE PERFORMANCE STATISTICS
  const drivePerformanceMap = new Map<
    string,
    { apps: number; shortlisted: number; interview: number; selections: number }
  >();

  filteredApps.forEach((app: any) => {
    const curr = drivePerformanceMap.get(app.drive_id) || {
      apps: 0,
      shortlisted: 0,
      interview: 0,
      selections: 0,
    };
    curr.apps++;
    if (
      app.status === 'shortlisted' ||
      app.status === 'interview' ||
      app.status === 'selected' ||
      app.status === 'placed'
    ) {
      curr.shortlisted++;
    }
    if (app.status === 'interview' || app.status === 'selected' || app.status === 'placed') {
      curr.interview++;
    }
    if (app.status === 'selected' || app.status === 'placed') {
      curr.selections++;
    }
    drivePerformanceMap.set(app.drive_id, curr);
  });

  const driveStats: DrivePerformanceStat[] = drives.map((d: any) => {
    const comp = companyMap.get(d.company_id);
    const counts = drivePerformanceMap.get(d.id) || {
      apps: 0,
      shortlisted: 0,
      interview: 0,
      selections: 0,
    };
    const conversionRate =
      counts.apps > 0 ? Math.round((counts.selections / counts.apps) * 1000) / 10 : 0;

    return {
      driveId: d.id,
      companyName: comp?.company_name || 'Enterprise Recruiter',
      jobRole: d.job_role,
      tier: d.tier,
      status: d.status,
      applicationsCount: counts.apps,
      shortlistedCount: counts.shortlisted,
      interviewCount: counts.interview,
      selectionsCount: counts.selections,
      conversionRate,
    };
  });

  // STUDENT STATUS REPORT ROWS
  const studentRows: StudentPlacementReportRow[] = students.map((s: any) => {
    const appInfo = studentAppStats.get(s.id);
    return {
      studentDbId: s.id,
      studentRollNumber: s.student_id,
      name: s.profiles?.name || 'Student Candidate',
      email: s.profiles?.email || '—',
      department: s.department,
      year: s.year,
      cgpa: Number(s.cgpa) || 0,
      placementStatus: s.placement_status,
      applicationsCount: appInfo?.appCount || 0,
      placedCompany: appInfo?.placedCompany || null,
      placedRole: appInfo?.placedRole || null,
    };
  });

  return {
    overview,
    departmentStats,
    companyStats,
    yearStats,
    driveStats,
    studentRows,
    metadata,
  };
}
