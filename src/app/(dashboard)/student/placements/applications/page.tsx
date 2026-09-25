import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth/user';
import { getPlacementDrives, getStudentApplications, getStudentShortlists } from '@/lib/placements/queries';
import {
  Clock,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Calendar,
  MapPin,
  Building,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function getStatusBadge(status: string) {
  switch (status) {
    case 'applied':
      return (
        <span className="text-sm font-medium px-2 py-0.5 rounded border border-[#222222] bg-[#121212] text-[#EDEDED]">
          Applied
        </span>
      );
    case 'shortlisted':
      return (
        <span className="text-sm font-medium px-2 py-0.5 rounded border border-[#FF6B00]/30 bg-[#FF6B00]/10 text-[#FF6B00]">
          Shortlisted
        </span>
      );
    case 'interview':
      return (
        <span className="text-sm font-medium px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400">
          Interview
        </span>
      );
    case 'selected':
      return (
        <span className="text-sm font-medium px-2 py-0.5 rounded border border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]">
          Selected
        </span>
      );
    case 'placed':
      return (
        <span className="text-sm font-medium px-2 py-0.5 rounded border border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]">
          Placed
        </span>
      );
    case 'rejected':
      return (
        <span className="text-sm font-medium px-2 py-0.5 rounded border border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444]">
          Rejected
        </span>
      );
    case 'withdrawn':
      return (
        <span className="text-sm font-medium px-2 py-0.5 rounded border border-[#9AA1AA]/30 bg-[#9AA1AA]/10 text-[#9AA1AA]">
          Withdrawn
        </span>
      );
    default:
      return (
        <span className="text-sm font-medium px-2 py-0.5 rounded border border-[#222222] bg-[#121212] text-[#9AA1AA]">
          {status}
        </span>
      );
  }
}

export default async function StudentApplicationsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') {
    redirect('/login?unauthorized=true');
  }

  const [drives, applications, shortlists] = await Promise.all([
    getPlacementDrives(),
    getStudentApplications(user.id),
    getStudentShortlists(user.id),
  ]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <PageContainer
      title="My Drive Applications"
      description="Track submitted applications, stage milestones, clearance records, and recruiter updates in real time."
      badgeText={`${applications.length} Submissions`}
      breadcrumbs={[
        { label: 'Student Home', href: '/student' },
        { label: 'Placements', href: '/student/placements' },
        { label: 'My Applications' },
      ]}
      actions={
        <Link href="/student/placements">
          <Button variant="outline" size="sm" className="text-sm gap-1 border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]">
            <ArrowLeft className="h-3 w-3" />
            <span>All Opportunities</span>
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#222222] pb-2 text-sm">
          <Link
            href="/student/placements"
            className="px-3 py-1.5 rounded-md font-medium text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#121212] transition-colors"
          >
            Opportunities ({drives.length})
          </Link>
          <Link
            href="/student/placements/applications"
            className="px-3 py-1.5 rounded-md font-medium bg-[#121212] text-[#FF6B00] border border-[#FF6B00]/30"
          >
            My Applications ({applications.length})
          </Link>
          <Link
            href="/student/placements/shortlists"
            className="px-3 py-1.5 rounded-md font-medium text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#121212] transition-colors"
          >
            My Shortlists ({shortlists.length})
          </Link>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="border border-[#222222] rounded-md bg-[#0A0A0A] py-16 px-4 text-center space-y-3">
            <Briefcase className="h-9 w-8 text-[#9AA1AA] mx-auto opacity-50" />
            <div className="text-base font-medium text-[#EDEDED]">No Applications Submitted Yet</div>
            <p className="text-sm text-[#9AA1AA] max-w-sm mx-auto">
              You haven&apos;t submitted applications to any campus recruitment drives yet. Explore available opportunities to verify your eligibility and apply.
            </p>
            <Link href="/student/placements">
              <Button size="sm" className="text-sm font-medium mt-2">
                Browse Placement Drives
              </Button>
            </Link>
          </div>
        ) : (
          <div className="border border-[#222222] rounded-md bg-[#0A0A0A] divide-y divide-[#222222] overflow-hidden">
            {applications.map((app) => (
              <div
                key={app.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#121212]/50 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(app.status)}
                    <span className="text-sm text-[#9AA1AA]">
                      Submitted on {formatDate(app.applied_at)}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-[#EDEDED]">
                    {app.drive?.company?.company_name || 'Corporate Partner'}
                  </h3>

                  <p className="text-sm text-[#9AA1AA]">
                    {app.drive?.job_role || 'Job Role'} • {app.drive?.package_details || 'Compensation upon selection'}
                  </p>

                  {app.drive?.drive_date && (
                    <div className="flex items-center gap-2 text-sm text-[#9AA1AA] pt-1">
                      <Calendar className="h-3 w-3 text-[#FF6B00]" />
                      <span>Drive Date: {formatDate(app.drive.drive_date)}</span>
                      {app.drive.venue && (
                        <>
                          <span className="text-[#222222]">|</span>
                          <span className="truncate max-w-[250px]">{app.drive.venue}</span>
                        </>
                      )}
                    </div>
                  )}

                  {app.notes && (
                    <p className="text-sm text-[#EDEDED] bg-[#121212] p-2 rounded border border-[#222222] mt-1 max-w-lg">
                      {app.notes}
                    </p>
                  )}
                </div>

                <div className="sm:shrink-0 pt-2 sm:pt-0">
                  <Link href={`/student/placements/${app.drive_id}`}>
                    <Button variant="outline" size="sm" className="text-sm gap-1.5 border-[#222222] text-[#EDEDED] hover:border-[#FF6B00] hover:text-[#FF6B00]">
                      <span>Drive Details</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
