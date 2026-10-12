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
          <Button variant="outline" size="sm" className="text-sm gap-1 border-border text-muted hover:text-foreground">
            <ArrowLeft className="h-3 w-3" />
            <span>All Opportunities</span>
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-2 text-sm">
          <Link
            href="/student/placements"
            className="px-3 py-1.5 rounded-md font-medium text-muted hover:text-foreground hover:bg-elevated transition-colors"
          >
            Opportunities ({drives.length})
          </Link>
          <Link
            href="/student/placements/applications"
            className="px-3 py-1.5 rounded-md font-medium text-muted hover:text-foreground hover:bg-elevated transition-colors"
          >
            My Applications ({applications.length})
          </Link>
          <Link
            href="/student/placements/shortlists"
            className="px-3 py-1.5 rounded-md font-medium bg-elevated text-accent border border-accent/30"
          >
            My Shortlists ({shortlists.length})
          </Link>
        </div>

        {/* Shortlists List */}
        {shortlists.length === 0 ? (
          <div className="border border-border rounded-md bg-surface py-16 px-4 text-center space-y-3">
            <Award className="h-9 w-8 text-muted mx-auto opacity-50" />
            <div className="text-base font-medium text-foreground">No Shortlists Announced Yet</div>
            <p className="text-sm text-muted max-w-sm mx-auto">
              Once corporate recruiters review applicant profiles and publish shortlisted candidates or interview schedules, they will appear here automatically.
            </p>
            <Link href="/student/placements/applications">
              <Button size="sm" variant="outline" className="text-sm font-medium border-border text-foreground mt-2">
                Track Application Statuses
              </Button>
            </Link>
          </div>
        ) : (
          <div className="border border-border rounded-md bg-surface divide-y divide-border overflow-hidden">
            {shortlists.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-elevated/50 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-accent bg-accent/10 border border-accent/30 px-2 py-0.5 rounded">
                      {item.status === 'selected' || item.status === 'placed'
                        ? 'Confirmed Offer'
                        : 'Shortlisted for Round'}
                    </span>
                    {item.shortlisted_at && (
                      <span className="text-sm text-muted">
                        Announced {formatDate(item.shortlisted_at)}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-foreground">
                    {item.drive?.company?.company_name}
                  </h3>

                  <p className="text-sm text-muted">
                    {item.drive?.job_role} • {item.drive?.package_details}
                  </p>

                  {item.interview_date && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-accent pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Interview: {formatDate(item.interview_date)}</span>
                      </span>
                      {item.interview_venue && (
                        <span className="flex items-center gap-1 text-muted">
                          <MapPin className="h-3 w-3" />
                          <span>{item.interview_venue}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="sm:shrink-0 pt-2 sm:pt-0">
                  <Link href={`/student/placements/${item.drive_id}`}>
                    <Button variant="outline" size="sm" className="text-sm gap-1.5 border-border text-foreground hover:border-accent hover:text-accent">
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
