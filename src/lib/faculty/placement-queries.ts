import { createClient } from '../supabase/server';
import { getCurrentUser } from '../auth/user';
import { formatSectionCode } from './queries';
import {
  FacultyPlacementDriveSummary,
  FacultyDriveCandidate,
  AllocatedSectionFilterOption,
  FacultyPlacementsOverviewData,
  FacultyDriveDetailsData,
  CandidateApplicationStatus,
} from '../types/faculty-placements.types';
import { DriveStatus } from '../types/database.types';

interface StudentQueryRow {
  id: string;
  user_id: string;
  student_id: string;
  department: string;
  year: number;
  cgpa: number;
  skills: string[];
  placement_status: 'unplaced' | 'placed' | 'opted_out' | 'in_process';
  profile?: {
    name?: string;
    email?: string;
  } | null;
  academic_enrollment?: Array<{
    section?: {
      id: string;
      section_name: string;
      year: number;
      program?: {
        code?: string;
        department?: {
          code?: string;
        } | null;
      } | null;
    } | null;
  }> | null;
}

interface ApplicationQueryRow {
  id: string;
  student_id: string;
  drive_id: string;
  status: 'applied' | 'shortlisted' | 'interview' | 'rejected' | 'selected' | 'placed' | 'withdrawn';
  applied_at: string;
  shortlisted_at: string | null;
  interview_date: string | null;
  interview_venue: string | null;
  notes: string | null;
}

interface RawDriveRow {
  id: string;
  company_id: string;
  job_role: string;
  package_details: string;
  tier: string;
  location: string | null;
  status: DriveStatus;
  registration_deadline: string;
  drive_date: string | null;
  drive_time: string | null;
  venue: string | null;
  min_cgpa: number;
  max_backlogs: number;
  eligible_departments: string[];
  eligible_years: number[];
  recruitment_stages: string[];
  required_skills: string[];
  description: string | null;
  instructions: string[];
  required_documents: string[];
  vacancies: string | null;
  bond_period: string | null;
  company?: {
    id: string;
    company_name: string;
    website?: string | null;
    industry?: string | null;
    location?: string | null;
  } | null;
}

function checkStudentEligibility(
  student: { department: string; year: number; cgpa: number },
  drive: { eligible_departments: string[]; eligible_years: number[]; min_cgpa: number }
): { is_eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];

  const deptMatch =
    drive.eligible_departments.length === 0 ||
    drive.eligible_departments.some(
      (d) =>
        d.toLowerCase().trim() === student.department.toLowerCase().trim() ||
        (student.department.includes('Computer Science') && d.includes('Computer Science')) ||
        (student.department.includes('Data Science') && d.includes('Data Science'))
    );

  if (!deptMatch) {
    reasons.push(`Department ${student.department} is not in eligible branches.`);
  }

  const yearMatch =
    drive.eligible_years.length === 0 || drive.eligible_years.includes(student.year);

  if (!yearMatch) {
    reasons.push(`Year ${student.year} is not eligible.`);
  }

  const cgpaMatch = student.cgpa >= Number(drive.min_cgpa);
  if (!cgpaMatch) {
    reasons.push(
      `CGPA ${student.cgpa.toFixed(2)} is below minimum cutoff of ${Number(drive.min_cgpa).toFixed(2)}.`
    );
  }

  return {
    is_eligible: reasons.length === 0,
    reasons,
  };
}

/**
 * Returns faculty placement drives overview data, including drives filtered/metrics for authorized students.
 */
export async function getFacultyPlacementsOverview(
  userId?: string
): Promise<FacultyPlacementsOverviewData> {
  const user = await getCurrentUser();
  const activeUserId = userId || user?.id || '';
  const facultyDept = user?.department || 'Computer Science & Engineering';

  const supabase = await createClient();

  // 1. Fetch drives with company
  const { data: rawDrives, error: drivesErr } = await supabase
    .from('placement_drives')
    .select(`
      *,
      company:companies (
        id,
        company_name,
        website,
        industry,
        location
      )
    `)
    .order('registration_deadline', { ascending: true });

  if (drivesErr) {
    console.error('Error fetching placement drives for faculty:', drivesErr);
  }

  const drivesList = (rawDrives || []) as unknown as RawDriveRow[];

  // 2. Fetch authorized students for this faculty
  // Supabase RLS ensures only authorized students are returned!
  const { data: rawStudents, error: studentsErr } = await supabase
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
      profile:profiles (
        name,
        email
      ),
      academic_enrollment:student_academic_enrollments (
        section:academic_sections (
          id,
          section_name,
          year,
          program:programs (
            code,
            department:departments (code)
          )
        )
      )
    `);

  if (studentsErr) {
    console.error('Error fetching authorized students for faculty:', studentsErr);
  }

  const students = (rawStudents || []) as unknown as StudentQueryRow[];

  // 3. Fetch applications for these authorized students
  const { data: rawApplications, error: appsErr } = await supabase
    .from('applications')
    .select('*');

  if (appsErr) {
    console.error('Error fetching applications for faculty:', appsErr);
  }

  const applications = (rawApplications || []) as unknown as ApplicationQueryRow[];

  // 4. Extract allocated sections and years
  const sectionMap = new Map<string, AllocatedSectionFilterOption>();
  const yearSet = new Set<number>();
  const deptSet = new Set<string>([facultyDept]);

  students.forEach((st) => {
    yearSet.add(st.year);
    deptSet.add(st.department);

    const enrollment = st.academic_enrollment?.[0]?.section;
    if (enrollment) {
      const deptCode =
        enrollment.program?.department?.code || enrollment.program?.code || 'CSE';
      const secCode = formatSectionCode(deptCode, enrollment.section_name);
      sectionMap.set(enrollment.id, {
        id: enrollment.id,
        code: `${secCode} (Year ${enrollment.year})`,
        year: enrollment.year,
      });
    }
  });

  const allocatedSections = Array.from(sectionMap.values());
  const allocatedYears = Array.from(yearSet).sort((a, b) => b - a);

  // 5. Compute metrics per drive for the authorized cohort
  const driveSummaries: FacultyPlacementDriveSummary[] = drivesList.map((d) => {
    // Find applications for this drive
    const driveApps = applications.filter((a) => a.drive_id === d.id);
    const appliedStudentIds = new Set(driveApps.map((a) => a.student_id));

    let eligibleCount = 0;
    students.forEach((st) => {
      const { is_eligible } = checkStudentEligibility(st, d);
      if (is_eligible) eligibleCount++;
    });

    const appliedCount = driveApps.length;
    const shortlistedCount = driveApps.filter((a) =>
      ['shortlisted', 'interview', 'selected', 'placed'].includes(a.status)
    ).length;
    const selectedCount = driveApps.filter((a) =>
      ['selected', 'placed'].includes(a.status)
    ).length;

    return {
      id: d.id,
      company_id: d.company_id,
      company_name: d.company?.company_name || 'Partner Company',
      company_website: d.company?.website,
      company_industry: d.company?.industry,
      company_location: d.company?.location,
      job_role: d.job_role,
      package_details: d.package_details,
      tier: d.tier,
      location: d.location,
      status: d.status,
      registration_deadline: d.registration_deadline,
      drive_date: d.drive_date,
      drive_time: d.drive_time,
      venue: d.venue,
      min_cgpa: Number(d.min_cgpa || 0),
      max_backlogs: d.max_backlogs,
      eligible_departments: d.eligible_departments || [],
      eligible_years: d.eligible_years || [],
      recruitment_stages: d.recruitment_stages || [],
      required_skills: d.required_skills || [],
      description: d.description,
      instructions: d.instructions || [],
      required_documents: d.required_documents || [],
      vacancies: d.vacancies,
      bond_period: d.bond_period,
      authorized_students_count: students.length,
      authorized_eligible_count: eligibleCount,
      authorized_applied_count: appliedCount,
      authorized_shortlisted_count: shortlistedCount,
      authorized_selected_count: selectedCount,
    };
  });

  const totalPlaced = students.filter((s) => s.placement_status === 'placed').length;

  return {
    drives: driveSummaries,
    allocated_departments: Array.from(deptSet),
    allocated_years: allocatedYears.length > 0 ? allocatedYears : [4, 3],
    allocated_sections: allocatedSections,
    faculty_department: facultyDept,
    total_authorized_students: students.length,
    total_placed_authorized_students: totalPlaced,
  };
}

/**
 * Returns complete drive details and authorized students' applications/eligibility pipeline.
 */
export async function getFacultyDriveDetailsWithCandidates(
  driveId: string,
  userId?: string
): Promise<FacultyDriveDetailsData | null> {
  const user = await getCurrentUser();
  const activeUserId = userId || user?.id || '';
  const facultyDept = user?.department || 'Computer Science & Engineering';

  const supabase = await createClient();

  // 1. Fetch the drive
  const { data: rawDrive, error: driveErr } = await supabase
    .from('placement_drives')
    .select(`
      *,
      company:companies (
        id,
        company_name,
        website,
        industry,
        location
      )
    `)
    .eq('id', driveId)
    .single();

  if (driveErr || !rawDrive) {
    return null;
  }

  const d = rawDrive as unknown as RawDriveRow;

  // 2. Fetch authorized students
  const { data: rawStudents } = await supabase
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
      profile:profiles (
        name,
        email
      ),
      academic_enrollment:student_academic_enrollments (
        section:academic_sections (
          id,
          section_name,
          year,
          program:programs (
            code,
            department:departments (code)
          )
        )
      )
    `);

  const students = (rawStudents || []) as unknown as StudentQueryRow[];

  // 3. Fetch applications for this drive
  const { data: rawApplications } = await supabase
    .from('applications')
    .select('*')
    .eq('drive_id', driveId);

  const applications = (rawApplications || []) as unknown as ApplicationQueryRow[];
  const appMap = new Map<string, ApplicationQueryRow>();
  applications.forEach((a) => {
    appMap.set(a.student_id, a);
  });

  // 4. Map candidates and compute eligibility
  const sectionMap = new Map<string, AllocatedSectionFilterOption>();
  let eligibleCount = 0;

  const candidates: FacultyDriveCandidate[] = students.map((st) => {
    const sec = st.academic_enrollment?.[0]?.section;
    let sectionName = 'Unassigned';
    if (sec) {
      const deptCode =
        sec.program?.department?.code || sec.program?.code || 'CSE';
      const secCode = formatSectionCode(deptCode, sec.section_name);
      sectionName = `${secCode} (Yr ${sec.year})`;
      sectionMap.set(sec.id, {
        id: sec.id,
        code: `${secCode} (Year ${sec.year})`,
        year: sec.year,
      });
    }

    const { is_eligible, reasons } = checkStudentEligibility(st, d);
    if (is_eligible) eligibleCount++;

    const app = appMap.get(st.id);
    const appStatus: CandidateApplicationStatus = app
      ? (app.status as CandidateApplicationStatus)
      : 'not_applied';

    return {
      id: st.id,
      user_id: st.user_id,
      name: st.profile?.name || 'Student Candidate',
      email: st.profile?.email || '',
      student_id: st.student_id,
      department: st.department,
      year: st.year,
      section_id: sec?.id,
      section_name: sectionName,
      cgpa: Number(st.cgpa),
      skills: st.skills || [],
      is_eligible,
      eligibility_reasons: reasons,
      application_id: app?.id || null,
      application_status: appStatus,
      applied_at: app?.applied_at || null,
      shortlisted_at: app?.shortlisted_at || null,
      interview_date: app?.interview_date || null,
      interview_venue: app?.interview_venue || null,
      notes: app?.notes || null,
      overall_placement_status: st.placement_status,
    };
  });

  // Sort candidates: placed/selected first, then interview/shortlisted, then applied, then eligible, then others
  const statusWeight: Record<CandidateApplicationStatus, number> = {
    selected: 1,
    placed: 2,
    interview: 3,
    shortlisted: 4,
    applied: 5,
    not_applied: 6,
    rejected: 7,
  };

  candidates.sort((a, b) => {
    const wA = statusWeight[a.application_status] ?? 99;
    const wB = statusWeight[b.application_status] ?? 99;
    if (wA !== wB) return wA - wB;
    return b.cgpa - a.cgpa;
  });

  const appliedCount = applications.length;
  const shortlistedCount = applications.filter((a) =>
    ['shortlisted', 'interview', 'selected', 'placed'].includes(a.status)
  ).length;
  const selectedCount = applications.filter((a) =>
    ['selected', 'placed'].includes(a.status)
  ).length;

  const driveSummary: FacultyPlacementDriveSummary = {
    id: d.id,
    company_id: d.company_id,
    company_name: d.company?.company_name || 'Partner Company',
    company_website: d.company?.website,
    company_industry: d.company?.industry,
    company_location: d.company?.location,
    job_role: d.job_role,
    package_details: d.package_details,
    tier: d.tier,
    location: d.location,
    status: d.status,
    registration_deadline: d.registration_deadline,
    drive_date: d.drive_date,
    drive_time: d.drive_time,
    venue: d.venue,
    min_cgpa: Number(d.min_cgpa || 0),
    max_backlogs: d.max_backlogs,
    eligible_departments: d.eligible_departments || [],
    eligible_years: d.eligible_years || [],
    recruitment_stages: d.recruitment_stages || [],
    required_skills: d.required_skills || [],
    description: d.description,
    instructions: d.instructions || [],
    required_documents: d.required_documents || [],
    vacancies: d.vacancies,
    bond_period: d.bond_period,
    authorized_students_count: students.length,
    authorized_eligible_count: eligibleCount,
    authorized_applied_count: appliedCount,
    authorized_shortlisted_count: shortlistedCount,
    authorized_selected_count: selectedCount,
  };

  return {
    drive: driveSummary,
    candidates,
    allocated_sections: Array.from(sectionMap.values()),
    faculty_department: facultyDept,
  };
}
