import { getFullUserProfile } from '../auth/user';
import { getPlacementDrives, getStudentApplications } from '../placements/queries';
import { evaluateEligibility, StudentEligibilityProfile } from '../placements/eligibility';
import { getStudentResume } from '../resume/queries';
import { getPreparationMaterials } from '../preparation/queries';
import { StudentProfileData } from '../types/profile.types';

export type PlatformDataDomain =
  | 'placement'
  | 'eligibility'
  | 'application'
  | 'preparation'
  | 'resume'
  | null;

/**
 * Identifies whether the student's question requires CampusConnect platform data,
 * and if so, exactly which domain. For normal/general questions, returns null (0 DB queries).
 */
export function identifyPlatformDomain(query: string): PlatformDataDomain {
  const q = query.toLowerCase();

  // 1. Resume analysis
  if (
    q.includes('resume') ||
    q.includes('cv') ||
    q.includes('upload my resume') ||
    q.includes('analyze my resume') ||
    q.includes('review my resume')
  ) {
    return 'resume';
  }

  // 2. Application status
  if (
    q.includes('my application') ||
    q.includes('application status') ||
    q.includes('have i applied') ||
    q.includes('am i shortlisted') ||
    q.includes('shortlisting status') ||
    q.includes('my interview') ||
    q.includes('interview date')
  ) {
    return 'application';
  }

  // 3. Eligibility questions
  if (
    q.includes('eligible') ||
    q.includes('eligibility') ||
    q.includes('can i apply') ||
    q.includes('am i allowed') ||
    q.includes('criteria') ||
    q.includes('cutoff')
  ) {
    return 'eligibility';
  }

  // 4. Placement questions (drives, deadlines, company packages)
  if (
    q.includes('placement drive') ||
    q.includes('which drives') ||
    q.includes('what drives') ||
    q.includes('which companies') ||
    q.includes('what companies') ||
    q.includes('registration deadline') ||
    q.includes('package details') ||
    q.includes('ctc')
  ) {
    return 'placement';
  }

  // 5. Preparation analysis
  if (
    q.includes('my preparation') ||
    q.includes('preparation progress') ||
    q.includes('analyze my preparation') ||
    q.includes('prep progress') ||
    q.includes('mock test analysis') ||
    q.includes('mock test performance')
  ) {
    return 'preparation';
  }

  // General / Technical question: NO platform data needed
  return null;
}

/**
 * Conditionally retrieves ONLY the required domain data.
 * Does NOT query Supabase if domain is null.
 */
export async function getTargetedPlatformContext(
  domain: PlatformDataDomain,
  userId: string
): Promise<string | null> {
  if (!domain) return null;

  try {
    // Domain 1: Applications
    if (domain === 'application') {
      const apps = await getStudentApplications(userId);
      if (!apps || apps.length === 0) {
        return 'VERIFIED PLATFORM DATA: Student currently has 0 submitted applications.';
      }

      const lines = apps.slice(0, 5).map((a: any) => {
        const company = a.drive?.company?.company_name || 'Partner Company';
        const role = a.drive?.job_role || 'Role';
        return `- ${company} (${role}): Status is ${a.status.toUpperCase()}${
          a.interview_date ? `, Interview Scheduled: ${a.interview_date}` : ''
        }`;
      });

      return `VERIFIED STUDENT APPLICATIONS:\n${lines.join('\n')}`;
    }

    // Domain 2: Eligibility
    if (domain === 'eligibility') {
      const [profile, drives] = await Promise.all([
        getFullUserProfile(),
        getPlacementDrives(),
      ]);

      if (!profile || profile.role !== 'student') return null;
      const s = profile as StudentProfileData;

      const studentProfile: StudentEligibilityProfile = {
        cgpa: Number(s.cgpa) || 0,
        department: s.department || 'Computer Science & Engineering',
        year: s.year || 3,
        skills: Array.isArray(s.skills) ? s.skills : [],
        backlogs: 0,
      };

      const eligibleList: string[] = [];
      const ineligibleList: string[] = [];

      (drives || []).forEach((d: any) => {
        const company = d.company?.company_name || 'Company';
        const role = d.job_role || 'Role';
        const evalResult = evaluateEligibility(studentProfile, d);
        if (evalResult.isEligible) {
          eligibleList.push(
            `- ${company} (${role}) | Package: ${d.package_details || 'N/A'} | Min CGPA: ${d.min_cgpa}`
          );
        } else {
          ineligibleList.push(
            `- ${company} (${role}): Criteria not met (${evalResult.reasons[0] || 'Requirements not satisfied'})`
          );
        }
      });

      return `VERIFIED ELIGIBILITY DATA:
Student: ${s.name}, CGPA ${s.cgpa.toFixed(2)}, ${s.department}, Year ${s.year}.
Eligible Drives (${eligibleList.length}):
${eligibleList.length > 0 ? eligibleList.slice(0, 5).join('\n') : '0 drives currently match criteria.'}
Ineligible Drives:
${ineligibleList.slice(0, 3).join('\n')}`;
    }

    // Domain 3: Placement Drives
    if (domain === 'placement') {
      const drives = await getPlacementDrives();
      if (!drives || drives.length === 0) {
        return 'VERIFIED PLATFORM DATA: No active placement drives currently open.';
      }

      const lines = drives.slice(0, 6).map((d: any) => {
        const company = d.company?.company_name || 'Company';
        const role = d.job_role || 'Job Role';
        const deadline = d.registration_deadline
          ? new Date(d.registration_deadline).toLocaleDateString()
          : 'Open';
        return `- ${company} (${role}): Package ${d.package_details || 'Standard'}, Min CGPA ${d.min_cgpa}, Deadline: ${deadline}`;
      });

      return `VERIFIED ACTIVE PLACEMENT DRIVES:\n${lines.join('\n')}`;
    }

    // Domain 4: Resume Data
    if (domain === 'resume') {
      const [profile, resume] = await Promise.all([
        getFullUserProfile(),
        getStudentResume(),
      ]);

      const skills = profile?.role === 'student' ? (profile as StudentProfileData).skills : [];
      return `VERIFIED RESUME DATA:
- Status: ${resume ? `Uploaded (${resume.file_name})` : 'No resume uploaded yet'}
- Upload Workflow: Go to /student/resume to upload a verified PDF resume.
- Profile Skills: ${skills.length > 0 ? skills.join(', ') : 'None listed'}`;
    }

    // Domain 5: Preparation Data
    if (domain === 'preparation') {
      const [profile, prepMaterials] = await Promise.all([
        getFullUserProfile(),
        getPreparationMaterials(),
      ]);

      const s = profile as StudentProfileData;
      const categories = Array.from(new Set((prepMaterials || []).map((m: any) => m.category)));

      return `VERIFIED PREPARATION DATA:
- Student: ${s?.name || 'Student'} (${s?.department || 'Engineering'})
- Available Modules: ${categories.join(', ') || 'Quantitative Aptitude, Logical Reasoning, Technical'}
- Portal: Practice questions are available at /student/preparation.`;
    }
  } catch (err) {
    console.warn('Error fetching targeted platform context:', err);
    return null;
  }

  return null;
}
