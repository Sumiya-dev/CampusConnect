import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { getCurrentUser, getFullUserProfile } from '@/lib/auth/user';
import { StudentProfileData } from '@/lib/types/profile.types';
import { getPlacementDriveById, getStudentApplicationForDrive } from '@/lib/placements/queries';
import { evaluateEligibility } from '@/lib/placements/eligibility';
import { ApplyButton } from '@/components/placements/apply-button';
import {
  Building,
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Award,
  FileCheck,
  Layers,
  XCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    driveId: string;
  }>;
}

export default async function StudentPlacementDriveDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') {
    redirect('/login?unauthorized=true');
  }

  const { driveId } = await params;
  const [drive, fullProfile, existingApplication] = await Promise.all([
    getPlacementDriveById(driveId),
    getFullUserProfile(),
    getStudentApplicationForDrive(user.id, driveId),
  ]);

  if (!drive) {
    notFound();
  }

  const student = fullProfile?.role === 'student' ? (fullProfile as StudentProfileData) : null;

  const studentProfile = {
    cgpa: student?.cgpa ?? 8.5,
    department: student?.department || user.department,
    year: student?.year ?? 3,
    skills: student?.skills || ['Data Structures & Algorithms', 'TypeScript'],
  };

  const eligibility = evaluateEligibility(studentProfile, drive);

  const deadlinePassed = new Date(drive.registration_deadline).getTime() < Date.now();
  const isClosed = drive.status !== 'open' || deadlinePassed;

  const formatDeadline = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <PageContainer
      title={drive.job_role}
      description={`${drive.company?.company_name || 'Recruiter'} • ${drive.location || 'Pan-India'}`}
      badgeText={drive.tier}
      breadcrumbs={[
        { label: 'Student Home', href: '/student' },
        { label: 'Placements', href: '/student/placements' },
        { label: drive.company?.company_name || 'Drive Details' },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/student/placements">
            <Button variant="outline" size="sm" className="text-sm gap-1 border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]">
              <ArrowLeft className="h-3 w-3" />
              <span>Back to Opportunities</span>
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-8 max-w-4xl">
        {/* Core Compensation & Status Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#222222] border border-[#222222] rounded-md overflow-hidden text-sm">
          <div className="bg-[#0A0A0A] p-4">
            <span className="text-sm uppercase font-semibold text-[#9AA1AA] tracking-wider block">
              Package / Compensation
            </span>
            <div className="text-base font-semibold text-[#FF6B00] mt-1">{drive.package_details}</div>
            <span className="text-sm text-[#9AA1AA]">Annual Package (CTC)</span>
          </div>

          <div className="bg-[#0A0A0A] p-4">
            <span className="text-sm uppercase font-semibold text-[#9AA1AA] tracking-wider block">
              Registration Cutoff
            </span>
            <div className="text-base font-semibold text-[#EDEDED] mt-1">
              {formatDeadline(drive.registration_deadline)}
            </div>
            <span className={`text-sm ${deadlinePassed ? 'text-[#EF4444]' : 'text-amber-400'}`}>
              {deadlinePassed ? 'Deadline Passed' : 'Strict Institutional Cutoff'}
            </span>
          </div>

          <div className="bg-[#0A0A0A] p-4">
            <span className="text-sm uppercase font-semibold text-[#9AA1AA] tracking-wider block">
              Drive Date & Venue
            </span>
            <div className="text-base font-semibold text-[#EDEDED] mt-1">
              {drive.drive_date ? formatDeadline(drive.drive_date) : 'To be notified'}
            </div>
            <span className="text-sm text-[#9AA1AA] truncate block">
              {drive.venue || 'Campus Placement Cell / Virtual'}
            </span>
          </div>

          <div className="bg-[#0A0A0A] p-4">
            <span className="text-sm uppercase font-semibold text-[#9AA1AA] tracking-wider block">
              Recruitment Status
            </span>
            <div className="mt-1">
              {isClosed ? (
                <span className="inline-flex items-center text-sm font-medium text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 px-2 py-0.5 rounded">
                  Registrations Closed
                </span>
              ) : (
                <span className="inline-flex items-center text-sm font-medium text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2 py-0.5 rounded">
                  Open for Applications
                </span>
              )}
            </div>
            <span className="text-sm text-[#9AA1AA] block mt-1">
              {drive.vacancies || 'Multiple Positions'}
            </span>
          </div>
        </div>

        {/* SECTION 1: ELIGIBILITY CHECK SYSTEM */}
        <section className="space-y-3">
          <div className="border-b border-[#222222] pb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold uppercase tracking-wider text-[#EDEDED]">
              Academic Eligibility Verification
            </h2>
            <span className="text-sm text-[#9AA1AA]">
              Minimum CGPA: {Number(drive.min_cgpa).toFixed(2)}
            </span>
          </div>

          <div className="border border-[#222222] rounded-md bg-[#0A0A0A] p-5 space-y-4">
            {/* Verdict Badge */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                {eligibility.isEligible ? (
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/30 px-3 py-1.5 rounded-md">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Eligible for this Placement Drive</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/30 px-3 py-1.5 rounded-md">
                    <XCircle className="h-4 w-4 shrink-0" />
                    <span>Not Eligible to Apply</span>
                  </div>
                )}
              </div>

              <div className="text-sm text-[#9AA1AA]">
                Your Profile CGPA: <strong className="text-[#EDEDED]">{studentProfile.cgpa.toFixed(2)}</strong>
              </div>
            </div>

            {/* Ineligibility Reasons (if any) */}
            {!eligibility.isEligible && eligibility.reasons.length > 0 && (
              <div className="p-3.5 rounded border border-[#EF4444]/25 bg-[#EF4444]/5 space-y-1.5">
                <div className="text-sm font-semibold text-[#EF4444] flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>Eligibility Criteria Not Met:</span>
                </div>
                <ul className="text-sm text-[#EF4444] space-y-1 pl-5 list-disc">
                  {eligibility.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Criteria Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-sm">
              <div className="p-3 rounded border border-[#222222] bg-[#121212]/60">
                <span className="text-sm text-[#9AA1AA] uppercase font-semibold block">
                  Eligible Branches
                </span>
                <div className="text-[#EDEDED] font-medium mt-1">
                  {drive.eligible_departments && drive.eligible_departments.length > 0
                    ? drive.eligible_departments.join(', ')
                    : 'All Engineering & Tech Disciplines'}
                </div>
              </div>

              <div className="p-3 rounded border border-[#222222] bg-[#121212]/60">
                <span className="text-sm text-[#9AA1AA] uppercase font-semibold block">
                  Eligible Graduating Cohort
                </span>
                <div className="text-[#EDEDED] font-medium mt-1">
                  {drive.eligible_years && drive.eligible_years.length > 0
                    ? `Year ${drive.eligible_years.join(', ')} Students`
                    : 'All Academic Years'}
                </div>
              </div>

              <div className="p-3 rounded border border-[#222222] bg-[#121212]/60">
                <span className="text-sm text-[#9AA1AA] uppercase font-semibold block">
                  Active Backlogs Limit
                </span>
                <div className="text-[#EDEDED] font-medium mt-1">
                  {drive.max_backlogs === 0 ? 'Zero Active Backlogs' : `Max ${drive.max_backlogs} Backlogs`}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: COMPANY & OVERVIEW */}
        <section className="space-y-3">
          <div className="border-b border-[#222222] pb-2">
            <h2 className="text-base font-semibold uppercase tracking-wider text-[#EDEDED]">
              Recruiter & Role Profile
            </h2>
          </div>

          <div className="rounded-md border border-[#222222] bg-[#0A0A0A] p-5 space-y-4 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[#EDEDED]">
                  {drive.company?.company_name}
                </h3>
                <p className="text-[#9AA1AA] mt-0.5">
                  {drive.company?.industry || 'Corporate Partner'} • {drive.location || 'Location upon selection'}
                </p>
              </div>

              {drive.company?.website && (
                <a
                  href={drive.company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-[#FF6B00] hover:underline"
                >
                  <span>Company Portal</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {drive.description && (
              <p className="text-[#EDEDED] leading-relaxed pt-2 border-t border-[#222222]">
                {drive.description}
              </p>
            )}

            {drive.company?.description && !drive.description && (
              <p className="text-[#EDEDED] leading-relaxed pt-2 border-t border-[#222222]">
                {drive.company.description}
              </p>
            )}
          </div>
        </section>

        {/* SECTION 3: TECHNICAL COMPETENCIES */}
        {drive.required_skills && drive.required_skills.length > 0 && (
          <section className="space-y-3">
            <div className="border-b border-[#222222] pb-2 flex items-center justify-between">
              <h2 className="text-base font-semibold uppercase tracking-wider text-[#EDEDED]">
                Required Competencies & Skills
              </h2>
              {eligibility.matchedSkills.length > 0 && (
                <span className="text-sm text-[#22C55E]">
                  {eligibility.matchedSkills.length} of {drive.required_skills.length} skills in your profile
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 p-4 border border-[#222222] rounded-md bg-[#0A0A0A]">
              {drive.required_skills.map((skill) => {
                const isMatched = eligibility.matchedSkills.includes(skill);
                return (
                  <span
                    key={skill}
                    className={`text-sm px-2.5 py-1 rounded border font-medium flex items-center gap-1.5 ${
                      isMatched
                        ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]'
                        : 'bg-[#121212] border-[#222222] text-[#EDEDED]'
                    }`}
                  >
                    {isMatched && <CheckCircle2 className="h-3 w-3" />}
                    <span>{skill}</span>
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 4: RECRUITMENT STAGES */}
        {drive.recruitment_stages && drive.recruitment_stages.length > 0 && (
          <section className="space-y-3">
            <div className="border-b border-[#222222] pb-2">
              <h2 className="text-base font-semibold uppercase tracking-wider text-[#EDEDED]">
                Recruitment Stages & Evaluation
              </h2>
            </div>

            <div className="border border-[#222222] rounded-md bg-[#0A0A0A] divide-y divide-[#222222]">
              {drive.recruitment_stages.map((stage, idx) => (
                <div key={idx} className="p-3.5 flex items-start gap-3 text-sm">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#121212] border border-[#222222] text-[#FF6B00] font-semibold text-sm shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="text-[#EDEDED] leading-relaxed">{stage}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 5: INSTRUCTIONS & DOCUMENTS */}
        {((drive.instructions && drive.instructions.length > 0) ||
          (drive.required_documents && drive.required_documents.length > 0)) && (
          <section className="space-y-3">
            <div className="border-b border-[#222222] pb-2">
              <h2 className="text-base font-semibold uppercase tracking-wider text-[#EDEDED]">
                Guidelines & Required Credentials
              </h2>
            </div>

            <div className="border border-[#222222] rounded-md bg-[#0A0A0A] p-5 space-y-4 text-sm">
              {drive.required_documents && drive.required_documents.length > 0 && (
                <div>
                  <span className="text-sm uppercase font-semibold text-[#9AA1AA] tracking-wider block mb-2">
                    Mandatory Physical & Digital Documents
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {drive.required_documents.map((doc, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded border border-[#222222] bg-[#121212] text-[#EDEDED] flex items-center gap-1.5"
                      >
                        <FileCheck className="h-3.5 w-3.5 text-[#FF6B00]" />
                        <span>{doc}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {drive.instructions && drive.instructions.length > 0 && (
                <div className="pt-3 border-t border-[#222222] space-y-2">
                  <span className="text-sm uppercase font-semibold text-[#9AA1AA] tracking-wider block">
                    Candidate Code of Conduct
                  </span>
                  {drive.instructions.map((inst, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[#9AA1AA]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E] shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{inst}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* SECTION 6: APPLICATION SUBMISSION FOOTER */}
        <div className="pt-6 border-t border-[#222222] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-[#9AA1AA]">
            Drive System ID: <span className="font-mono text-[#EDEDED]">{drive.id}</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link href="/student/placements" className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full sm:w-auto text-sm border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]">
                All Opportunities
              </Button>
            </Link>

            <ApplyButton
              driveId={drive.id}
              isEligible={eligibility.isEligible}
              hasApplied={Boolean(existingApplication)}
              isClosed={isClosed}
            />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
