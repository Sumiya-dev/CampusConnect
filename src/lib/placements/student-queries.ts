import { createClient } from '../supabase/server';
import {
  StudentPlacementFilter,
  StudentPlacementRosterItem,
  StudentPlacementDetail,
  StudentPlacementStats,
  StudentPlacementFilterOptions,
  StudentApplicationItem,
  ApplicationHistoryItem,
  EligibleDriveOpportunity,
} from '../types/student-placement.types';
import { evaluateEligibility, StudentEligibilityProfile } from './eligibility';

/**
 * Superadmin: Fetch student placement roster with search, filtering, and application breakdown
 */
export async function getStudentsPlacementRoster(
  filters?: StudentPlacementFilter
): Promise<StudentPlacementRosterItem[]> {
  try {
    const supabase: any = await createClient();

    let query = supabase
      .from('students')
      .select(`
        id,
        user_id,
        student_id,
        department,
        year,
        cgpa,
        skills,
        placement_status,
        created_at,
        updated_at,
        profile:profiles!students_user_id_fkey(
          name,
          email,
          avatar_url,
          contact_number
        ),
        applications(
          id,
          drive_id,
          status,
          applied_at,
          shortlisted_at,
          interview_date,
          interview_venue,
          notes,
          drive:placement_drives(
            id,
            job_role,
            package_details,
            tier,
            company:companies(id, company_name)
          )
        ),
        academic_enrollments:student_academic_enrollments(
          section:academic_sections(
            section_name,
            program:programs(name)
          )
        )
      `)
      .order('cgpa', { ascending: false });

    if (filters?.department && filters.department !== 'all') {
      query = query.eq('department', filters.department);
    }

    if (filters?.academic_year && filters.academic_year !== 'all') {
      query = query.eq('year', Number(filters.academic_year));
    }

    if (filters?.placement_status && filters.placement_status !== 'all') {
      query = query.eq('placement_status', filters.placement_status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching student placement roster:', error);
      return [];
    }

    if (!data) return [];

    let items: StudentPlacementRosterItem[] = data.map((s: any) => {
      const profile = s.profile || {};
      const apps = s.applications || [];
      const enrollment = s.academic_enrollments?.[0]?.section;
      const programName = enrollment?.program?.name || null;
      const sectionName = enrollment?.section_name || null;

      const totalApplications = apps.length;
      let shortlistedCount = 0;
      let interviewCount = 0;
      let selectedCount = 0;
      let placedCount = 0;
      let placedCompany: string | null = null;
      let placedPackage: string | null = null;
      let latestActivityAt: string | null = null;

      for (const app of apps) {
        if (app.status === 'shortlisted') shortlistedCount++;
        else if (app.status === 'interview') interviewCount++;
        else if (app.status === 'selected') selectedCount++;
        else if (app.status === 'placed') {
          placedCount++;
          if (!placedCompany) {
            placedCompany = app.drive?.company?.company_name || null;
            placedPackage = app.drive?.package_details || null;
          }
        }

        const dateToCheck = app.interview_date || app.shortlisted_at || app.applied_at;
        if (dateToCheck && (!latestActivityAt || new Date(dateToCheck) > new Date(latestActivityAt))) {
          latestActivityAt = dateToCheck;
        }
      }

      return {
        id: s.id,
        userId: s.user_id,
        studentId: s.student_id,
        name: profile.name || 'Unnamed Student',
        email: profile.email || '',
        avatarUrl: profile.avatar_url || null,
        department: s.department,
        year: s.year,
        cgpa: Number(s.cgpa) || 0,
        skills: s.skills || [],
        placementStatus: s.placement_status,
        programName,
        sectionName,
        totalApplications,
        shortlistedCount,
        interviewCount,
        selectedCount,
        placedCount,
        placedCompany,
        placedPackage,
        latestActivityAt,
      };
    });

    // Client-side filtering for search & nested company/drive
    if (filters?.search && filters.search.trim()) {
      const term = filters.search.toLowerCase().trim();
      items = items.filter((item) => {
        const matchName = item.name.toLowerCase().includes(term);
        const matchId = item.studentId.toLowerCase().includes(term);
        const matchDept = item.department.toLowerCase().includes(term);
        const matchCompany = item.placedCompany?.toLowerCase().includes(term) ?? false;
        return matchName || matchId || matchDept || matchCompany;
      });
    }

    if (filters?.company_id && filters.company_id !== 'all') {
      items = items.filter((item) => {
        const rawStudent = data.find((d: any) => d.id === item.id);
        const apps = rawStudent?.applications || [];
        return apps.some((a: any) => a.drive?.company?.id === filters.company_id);
      });
    }

    if (filters?.drive_id && filters.drive_id !== 'all') {
      items = items.filter((item) => {
        const rawStudent = data.find((d: any) => d.id === item.id);
        const apps = rawStudent?.applications || [];
        return apps.some((a: any) => a.drive_id === filters.drive_id);
      });
    }

    return items;
  } catch (err) {
    console.error('getStudentsPlacementRoster error:', err);
    return [];
  }
}

/**
 * Fetch overview statistics for student placement dashboard
 */
export async function getPlacementRosterStats(): Promise<StudentPlacementStats> {
  try {
    const supabase: any = await createClient();

    const [studentsRes, appsRes] = await Promise.all([
      supabase.from('students').select('id, placement_status'),
      supabase.from('applications').select('id, status'),
    ]);

    const students = studentsRes.data || [];
    const apps = appsRes.data || [];

    const totalStudents = students.length;
    let placedStudents = 0;
    let inProcessStudents = 0;
    let unplacedStudents = 0;
    let optedOutStudents = 0;

    for (const s of students) {
      if (s.placement_status === 'placed') placedStudents++;
      else if (s.placement_status === 'in_process') inProcessStudents++;
      else if (s.placement_status === 'opted_out') optedOutStudents++;
      else unplacedStudents++;
    }

    const totalApplications = apps.length;
    let totalOffers = 0;
    for (const a of apps) {
      if (a.status === 'placed' || a.status === 'selected') {
        totalOffers++;
      }
    }

    const placementRate = totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 1000) / 10 : 0;

    return {
      totalStudents,
      placedStudents,
      inProcessStudents,
      unplacedStudents,
      optedOutStudents,
      totalApplications,
      totalOffers,
      placementRate,
    };
  } catch (err) {
    console.error('getPlacementRosterStats error:', err);
    return {
      totalStudents: 0,
      placedStudents: 0,
      inProcessStudents: 0,
      unplacedStudents: 0,
      optedOutStudents: 0,
      totalApplications: 0,
      totalOffers: 0,
      placementRate: 0,
    };
  }
}

/**
 * Superadmin: Fetch complete placement details, applications, history, and eligible drives for a student
 */
export async function getStudentPlacementDetail(studentId: string): Promise<StudentPlacementDetail | null> {
  try {
    const supabase: any = await createClient();

    // 1. Fetch student with profile, enrollment, and resume
    const { data: s, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        user_id,
        student_id,
        department,
        year,
        cgpa,
        skills,
        placement_status,
        created_at,
        updated_at,
        profile:profiles!students_user_id_fkey(
          name,
          email,
          contact_number,
          avatar_url
        ),
        academic_enrollments:student_academic_enrollments(
          section:academic_sections(
            section_name,
            academic_year,
            program:programs(name)
          )
        )
      `)
      .eq('id', studentId)
      .single();

    if (studentError || !s) {
      console.error('Error fetching student detail:', studentError);
      return null;
    }

    const profile = s.profile || {};
    const enrollment = s.academic_enrollments?.[0]?.section;
    const programName = enrollment?.program?.name || null;
    const sectionName = enrollment?.section_name || null;
    const academicYear = enrollment?.academic_year || null;

    // 2. Fetch active resume if present
    const { data: resumeData } = await supabase
      .from('resumes')
      .select('id, file_name, file_path, file_type, updated_at')
      .eq('student_id', s.id)
      .eq('is_active', true)
      .maybeSingle();

    // 3. Fetch student applications with drive & company info
    const { data: appsData } = await supabase
      .from('applications')
      .select(`
        id,
        drive_id,
        status,
        applied_at,
        shortlisted_at,
        interview_date,
        interview_venue,
        notes,
        updated_at,
        drive:placement_drives(
          id,
          job_role,
          package_details,
          tier,
          company:companies(id, company_name, industry)
        )
      `)
      .eq('student_id', s.id)
      .order('applied_at', { ascending: false });

    const rawApps = appsData || [];
    const applications: StudentApplicationItem[] = rawApps.map((a: any) => ({
      id: a.id,
      driveId: a.drive_id,
      jobRole: a.drive?.job_role || 'Role',
      packageDetails: a.drive?.package_details || 'Negotiable',
      tier: a.drive?.tier || 'Regular',
      companyId: a.drive?.company?.id || '',
      companyName: a.drive?.company?.company_name || 'Company',
      companyIndustry: a.drive?.company?.industry || null,
      status: a.status,
      appliedAt: a.applied_at,
      shortlistedAt: a.shortlisted_at || null,
      interviewDate: a.interview_date || null,
      interviewVenue: a.interview_venue || null,
      notes: a.notes || null,
      updatedAt: a.updated_at,
    }));

    // Find placed details if any
    let placedDetails: StudentPlacementDetail['placedDetails'] = null;
    const placedApp = applications.find((a) => a.status === 'placed');
    if (placedApp) {
      placedDetails = {
        companyName: placedApp.companyName,
        jobRole: placedApp.jobRole,
        packageDetails: placedApp.packageDetails,
        placedAt: placedApp.updatedAt || placedApp.appliedAt,
      };
    }

    // 4. Fetch application status history
    const { data: historyData } = await supabase
      .from('application_status_history')
      .select(`
        id,
        application_id,
        drive_id,
        from_status,
        to_status,
        notes,
        interview_date,
        interview_venue,
        changed_by,
        changed_by_email,
        created_at,
        drive:placement_drives(
          job_role,
          company:companies(company_name)
        )
      `)
      .eq('student_id', s.id)
      .order('created_at', { ascending: false });

    const history: ApplicationHistoryItem[] = (historyData || []).map((h: any) => ({
      id: h.id,
      applicationId: h.application_id,
      driveId: h.drive_id,
      jobRole: h.drive?.job_role || 'Job Role',
      companyName: h.drive?.company?.company_name || 'Corporate Partner',
      fromStatus: h.from_status,
      toStatus: h.to_status,
      notes: h.notes,
      interviewDate: h.interview_date,
      interviewVenue: h.interview_venue,
      changedByName: null,
      changedByEmail: h.changed_by_email,
      createdAt: h.created_at,
    }));

    // 5. Evaluate eligibility against active/open placement drives
    const { data: openDrives } = await supabase
      .from('placement_drives')
      .select(`
        id,
        job_role,
        package_details,
        tier,
        location,
        registration_deadline,
        drive_date,
        status,
        min_cgpa,
        max_backlogs,
        eligible_departments,
        eligible_years,
        eligible_programs,
        graduation_year,
        required_skills,
        company:companies(id, company_name, industry)
      `)
      .in('status', ['open', 'in_progress'])
      .order('registration_deadline', { ascending: true });

    const studentEligibilityProfile: StudentEligibilityProfile = {
      cgpa: Number(s.cgpa) || 0,
      department: s.department,
      year: s.year,
      skills: s.skills || [],
      backlogs: 0,
      program: programName || undefined,
    };

    const eligibleDrives: EligibleDriveOpportunity[] = (openDrives || []).map((d: any) => {
      const eligibility = evaluateEligibility(studentEligibilityProfile, d);
      const existingApp = applications.find((a) => a.driveId === d.id);

      return {
        driveId: d.id,
        jobRole: d.job_role,
        companyName: d.company?.company_name || 'Company',
        companyIndustry: d.company?.industry || null,
        packageDetails: d.package_details,
        tier: d.tier,
        location: d.location,
        registrationDeadline: d.registration_deadline,
        driveDate: d.drive_date,
        status: d.status,
        isEligible: eligibility.isEligible,
        eligibilityReasons: eligibility.isEligible ? eligibility.passedChecks : eligibility.reasons,
        hasApplied: Boolean(existingApp),
        applicationStatus: existingApp?.status,
      };
    });

    return {
      id: s.id,
      userId: s.user_id,
      studentId: s.student_id,
      name: profile.name || 'Student',
      email: profile.email || '',
      contactNumber: profile.contact_number || null,
      avatarUrl: profile.avatar_url || null,
      department: s.department,
      year: s.year,
      cgpa: Number(s.cgpa) || 0,
      skills: s.skills || [],
      placementStatus: s.placement_status,
      programName,
      sectionName,
      academicYear,
      resume: resumeData
        ? {
            id: resumeData.id,
            fileName: resumeData.file_name,
            filePath: resumeData.file_path,
            fileType: resumeData.file_type,
            updatedAt: resumeData.updated_at,
          }
        : null,
      applications,
      history,
      eligibleDrives,
      placedDetails,
    };
  } catch (err) {
    console.error('getStudentPlacementDetail error:', err);
    return null;
  }
}

/**
 * Fetch filter options for student placement view
 */
export async function getStudentPlacementFilterOptions(): Promise<StudentPlacementFilterOptions> {
  const defaultDepts = [
    'Computer Science & Engineering',
    'Electronics & Communication Engineering',
    'Electrical & Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Information Technology',
  ];

  try {
    const supabase: any = await createClient();

    const [deptRes, compRes, driveRes] = await Promise.all([
      supabase.from('departments').select('name').eq('status', 'active'),
      supabase.from('companies').select('id, company_name').eq('status', 'active').order('company_name'),
      supabase
        .from('placement_drives')
        .select('id, job_role, company:companies(company_name)')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(40),
    ]);

    const departments =
      deptRes.data && deptRes.data.length > 0 ? deptRes.data.map((d: any) => d.name) : defaultDepts;

    const companies = (compRes.data || []).map((c: any) => ({
      id: c.id,
      name: c.company_name,
    }));

    const drives = (driveRes.data || []).map((d: any) => ({
      id: d.id,
      job_role: d.job_role,
      company_name: d.company?.company_name || 'Company',
    }));

    return {
      departments: Array.from(new Set<string>(departments)).sort(),
      academicYears: [1, 2, 3, 4],
      companies,
      drives,
    };
  } catch {
    return {
      departments: defaultDepts,
      academicYears: [1, 2, 3, 4],
      companies: [],
      drives: [],
    };
  }
}
