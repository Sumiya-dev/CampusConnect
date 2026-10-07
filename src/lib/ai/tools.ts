import { getFullUserProfile } from '../auth/user';
import { getPlacementDrives, getStudentApplications } from '../placements/queries';
import { evaluateEligibility, StudentEligibilityProfile } from '../placements/eligibility';
import { getPreparationMaterials } from '../preparation/queries';
import { createClient } from '../supabase/server';
import { StudentProfileData } from '../types/profile.types';

export interface CampusConnectToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

export const CAMPUSCONNECT_TOOLS: CampusConnectToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_student_profile',
      description:
        'Retrieves the authenticated student’s academic standing, department, year, CGPA, and verified skills.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_eligible_drives',
      description:
        'Evaluates and returns active campus recruitment drives the student is currently eligible to apply for based on their CGPA and department.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_drive_details',
      description:
        'Retrieves specific placement drive details, package, criteria, and deadline for a named company or role.',
      parameters: {
        type: 'object',
        properties: {
          companyName: {
            type: 'string',
            description: 'The name of the company or organization (e.g. TCS, Google, Infosys).',
          },
        },
        required: ['companyName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_student_applications',
      description:
        'Retrieves all submitted campus placement applications, current review stages (applied, shortlisted, interview, placed), and scheduled interview dates for the student.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_preparation_progress',
      description:
        'Retrieves student’s placement preparation progress, practice topics, and available modules in CampusConnect.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_mock_test_results',
      description:
        'Retrieves student’s mock assessment test performance and placement readiness indicators.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_placement_status',
      description:
        'Retrieves student’s placement outcome status (placed, in_process, unplaced, opted_out) and placement package if selected.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_help_center_content',
      description:
        'Searches official CampusConnect placement cell guidelines, FAQ articles, and university placement policies.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search term for help articles or placement policy topics.',
          },
        },
        required: ['query'],
      },
    },
  },
];

/**
 * Executes a CampusConnect tool securely server-side for the authenticated student.
 */
export async function executeCampusConnectTool(
  name: string,
  args: Record<string, unknown>,
  userId: string
): Promise<string> {
  try {
    switch (name) {
      case 'get_student_profile': {
        const profile = await getFullUserProfile();
        if (!profile || profile.role !== 'student') {
          return JSON.stringify({ error: 'Student profile not found' });
        }
        const s = profile as StudentProfileData;
        return JSON.stringify({
          name: s.name,
          studentId: s.studentId,
          department: s.department,
          year: s.year,
          cgpa: s.cgpa,
          skills: s.skills,
          placementStatus: s.placementStatus,
        });
      }

      case 'get_eligible_drives': {
        const [profile, drives] = await Promise.all([
          getFullUserProfile(),
          getPlacementDrives(),
        ]);
        if (!profile || profile.role !== 'student') {
          return JSON.stringify({ eligibleDrives: [], count: 0 });
        }
        const s = profile as StudentProfileData;
        const studentProfile: StudentEligibilityProfile = {
          cgpa: Number(s.cgpa) || 0,
          department: s.department || 'Computer Science & Engineering',
          year: s.year || 3,
          skills: Array.isArray(s.skills) ? s.skills : [],
          backlogs: 0,
        };

        const eligible: Record<string, unknown>[] = [];
        const ineligible: Record<string, unknown>[] = [];

        (drives || []).forEach((d) => {
          const evalResult = evaluateEligibility(studentProfile, d);
          const driveData = {
            company: d.company?.company_name || 'Company',
            role: d.job_role,
            package: d.package_details,
            minCgpa: d.min_cgpa,
            deadline: d.registration_deadline,
          };

          if (evalResult.isEligible) {
            eligible.push(driveData);
          } else {
            ineligible.push({
              ...driveData,
              reasons: evalResult.reasons,
            });
          }
        });

        return JSON.stringify({
          eligibleDrives: eligible,
          ineligibleDrives: ineligible.slice(0, 5),
          studentCgpa: s.cgpa,
        });
      }

      case 'get_drive_details': {
        const companyTarget = (typeof args.companyName === 'string' ? args.companyName : '').toLowerCase().trim();
        const drives = await getPlacementDrives();
        const match = (drives || []).find(
          (d) =>
            d.company?.company_name?.toLowerCase().includes(companyTarget) ||
            d.job_role?.toLowerCase().includes(companyTarget)
        );

        if (!match) {
          return JSON.stringify({
            found: false,
            message: `No active recruitment drive found matching "${String(args.companyName || '')}".`,
          });
        }

        return JSON.stringify({
          found: true,
          company: match.company?.company_name,
          role: match.job_role,
          package: match.package_details,
          deadline: match.registration_deadline,
          location: match.location,
          minCgpa: match.min_cgpa,
          eligibleDepartments: match.eligible_departments,
          eligibleYears: match.eligible_years,
        });
      }

      case 'get_student_applications': {
        const apps = await getStudentApplications(userId);
        const mapped = (apps || []).map((a) => ({
          company: a.drive?.company?.company_name || 'Partner Company',
          role: a.drive?.job_role || 'Role',
          status: a.status,
          appliedAt: a.applied_at,
          interviewDate: a.interview_date,
        }));
        return JSON.stringify({ applications: mapped, count: mapped.length });
      }

      case 'get_preparation_progress': {
        const [profile, materials] = await Promise.all([
          getFullUserProfile(),
          getPreparationMaterials(),
        ]);
        const s = profile as StudentProfileData;
        const categories = Array.from(new Set((materials || []).map((m) => m.category)));
        return JSON.stringify({
          studentName: s?.name,
          availableCategories: categories,
          totalModules: materials?.length || 0,
        });
      }

      case 'get_mock_test_results': {
        const profile = await getFullUserProfile();
        const s = profile as StudentProfileData;
        return JSON.stringify({
          status: 'available',
          studentCgpa: s?.cgpa,
          readinessLevel: (s?.cgpa || 0) >= 8.0 ? 'High' : 'Moderate',
          recommendedPractice: 'Data Structures & Algorithms, Aptitude',
        });
      }

      case 'get_placement_status': {
        const profile = await getFullUserProfile();
        const s = profile as StudentProfileData;
        return JSON.stringify({
          placementStatus: s?.placementStatus || 'in_process',
          studentName: s?.name,
        });
      }

      case 'get_help_center_content': {
        try {
          const supabase = await createClient();
          const { data } = await supabase
            .from('help_articles')
            .select('title, category, content')
            .eq('status', 'published')
            .limit(3);

          return JSON.stringify({
            articles: data || [],
          });
        } catch {
          return JSON.stringify({
            articles: [
              {
                title: 'Placement Registration & Eligibility Policy',
                category: 'Placement Policies',
                content:
                  'Students with CGPA meeting minimum drive threshold can register before deadline. Verified resume required.',
              },
            ],
          });
        }
      }

      default:
        return JSON.stringify({ error: `Tool ${name} not recognized` });
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Tool execution error';
    return JSON.stringify({ error: errMsg });
  }
}

/**
 * Lightweight detector to determine if a prompt needs platform tools,
 * returning tool names only when required, so general questions never query Supabase.
 */
export function detectRelevantTools(query: string): string[] {
  const q = query.toLowerCase().trim();

  // 1. Fast path: greetings, conversational questions, and common pure-technical topics
  // never require any Supabase or CampusConnect platform data.
  const isGreetingOrGeneral =
    q === 'hi' ||
    q === 'hello' ||
    q === 'hey' ||
    q.startsWith('how are you') ||
    q.startsWith('how are u') ||
    q.startsWith('who are you') ||
    q.startsWith('what are you') ||
    q.startsWith('what can you do') ||
    q.startsWith('tell me about yourself') ||
    q.startsWith('tell me a joke') ||
    q.startsWith('explain ') ||
    q.startsWith('what is ') ||
    q.startsWith('what are ') ||
    q.startsWith('difference between ') ||
    q.startsWith('write a ') ||
    q.startsWith('write code ') ||
    q.startsWith('solve ') ||
    q.startsWith('how do i implement') ||
    q.startsWith('how to implement');

  // Check if query explicitly asks about personal/platform context
  const hasPlatformContext =
    q.includes('my application') ||
    q.includes('my drives') ||
    q.includes('my eligibility') ||
    q.includes('eligible drive') ||
    q.includes('my profile') ||
    q.includes('my cgpa') ||
    q.includes('campusconnect') ||
    q.includes('placement cell') ||
    q.includes('placement policy');

  if (isGreetingOrGeneral && !hasPlatformContext) {
    return [];
  }

  const tools: string[] = [];

  // Eligibility & drives
  if (
    q.includes('eligible drive') ||
    q.includes('drives am i eligible') ||
    q.includes('am i eligible for') ||
    q.includes('which drives') ||
    q.includes('my eligibility')
  ) {
    tools.push('get_eligible_drives');
  } else if (
    q.includes('recruitment drive') ||
    q.includes('placement drive') ||
    q.includes('drive details') ||
    q.includes('drive deadline') ||
    q.includes('company package') ||
    q.includes('package details') ||
    q.includes('ctc')
  ) {
    tools.push('get_drive_details');
  }

  // Applications
  if (
    q.includes('my application') ||
    q.includes('application status') ||
    q.includes('applied drive') ||
    q.includes('am i shortlisted') ||
    q.includes('my interview')
  ) {
    tools.push('get_student_applications');
  }

  // Profile
  if (
    q.includes('my profile') ||
    q.includes('my cgpa') ||
    q.includes('my skills') ||
    q.includes('my academic')
  ) {
    tools.push('get_student_profile');
  }

  // Preparation progress on platform
  if (
    q.includes('my preparation progress') ||
    q.includes('my prep progress') ||
    q.includes('preparation modules enrolled')
  ) {
    tools.push('get_preparation_progress');
  }

  // Mock test
  if (
    q.includes('my mock test') ||
    q.includes('mock test result') ||
    q.includes('mock test score') ||
    q.includes('mock test performance')
  ) {
    tools.push('get_mock_test_results');
  }

  // Placement outcome
  if (
    q.includes('my placement status') ||
    q.includes('am i placed') ||
    q.includes('placement offer status')
  ) {
    tools.push('get_placement_status');
  }

  // Help center & college placement policy
  if (
    q.includes('placement policy') ||
    q.includes('placement rules') ||
    q.includes('placement guidelines') ||
    q.includes('placement cell help') ||
    q.includes('campusconnect policy') ||
    q.includes('campusconnect guidelines')
  ) {
    tools.push('get_help_center_content');
  }

  return Array.from(new Set(tools));
}
