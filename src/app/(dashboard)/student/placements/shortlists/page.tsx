import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth/user';
import { getPlacementDrives, getStudentApplications, getStudentShortlists } from '@/lib/placements/queries';
import {
  Award,
  ArrowRight,
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StudentShortlistsPage() {
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
      title="My Shortlists & Offers"
      description="Official shortlisting circulars, technical interview stages, and offers released by recruitment partners."
      badgeText={`${shortlists.length} Cleared Stages`}
      breadcrumbs={[
        { label: 'Student Home', href: '/student' },
        { label: 'Placements', href: '/student/placements' },
        { label: 'My Shortlists' },
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
            className="px-3 py-1.5 rounded-md font-medium text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#121212] transition-colors"
          >
            My Applications ({applications.length})
          </Link>
          <Link
            href="/student/placements/shortlists"
            className="px-3 py-1.5 rounded-md font-medium bg-[#121212] text-[#FF6B00] border border-[#FF6B00]/30"
          >
            My Shortlists ({shortlists.length})
          </Link>
        </div>

        {/* Shortlists List */}
        {shortlists.length === 0 ? (
          <div className="border border-[#222222] rounded-md bg-[#0A0A0A] py-16 px-4 text-center space-y-3">
            <Award className="h-9 w-8 text-[#9AA1AA] mx-auto opacity-50" />
            <div className="text-base font-medium text-[#EDEDED]">No Shortlists Announced Yet</div>
            <p className="text-sm text-[#9AA1AA] max-w-sm mx-auto">
              Once corporate recruiters review applicant profiles and publish shortlisted candidates or interview schedules, they will appear here automatically.
            </p>
            <Link href="/student/placements/applications">
              <Button size="sm" variant="outline" className="text-sm font-medium border-[#222222] text-[#EDEDED] mt-2">
                Track Application Statuses
              </Button>
            </Link>
          </div>
        ) : (
          <div className="border border-[#222222] rounded-md bg-[#0A0A0A] divide-y divide-[#222222] overflow-hidden">
            {shortlists.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#121212]/50 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[#FF6B00] bg-[#FF6B00]/10 border border-[#FF6B00]/30 px-2 py-0.5 rounded">
                      {item.status === 'selected' || item.status === 'placed'
                        ? 'Confirmed Offer'
                        : 'Shortlisted for Round'}
                    </span>
                    {item.shortlisted_at && (
                      <span className="text-sm text-[#9AA1AA]">
                        Announced {formatDate(item.shortlisted_at)}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-[#EDEDED]">
                    {item.drive?.company?.company_name}
                  </h3>

                  <p className="text-sm text-[#9AA1AA]">
                    {item.drive?.job_role} • {item.drive?.package_details}
                  </p>

                  {item.interview_date && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#FF6B00] pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Interview: {formatDate(item.interview_date)}</span>
                      </span>
                      {item.interview_venue && (
                        <span className="flex items-center gap-1 text-[#9AA1AA]">
                          <MapPin className="h-3 w-3" />
                          <span>{item.interview_venue}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="sm:shrink-0 pt-2 sm:pt-0">
                  <Link href={`/student/placements/${item.drive_id}`}>
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
