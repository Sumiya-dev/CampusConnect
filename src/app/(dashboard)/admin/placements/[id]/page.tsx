import { notFound, redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { AdminDriveDetailsView } from '@/components/placements/admin-drive-details-view';
import {
  getDriveDetailWithStats,
  getDriveApplications,
  getDriveEligibleStudents,
} from '@/lib/placements/queries';
import { getCurrentUser } from '@/lib/auth/user';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminPlacementDriveDetailsPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    redirect('/login?unauthorized=true');
  }

  const { id } = await params;
  const [drive, applications, eligiblePool] = await Promise.all([
    getDriveDetailWithStats(id),
    getDriveApplications(id),
    getDriveEligibleStudents(id),
  ]);

  if (!drive) {
    notFound();
  }

  return (
    <PageContainer
      title={drive.job_role}
      description={`${drive.company?.company_name || 'Recruitment Partner'} • ${drive.tier} • ${drive.package_details}`}
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Placement Drives', href: '/admin/placements' },
        { label: drive.job_role },
      ]}
      badgeText={drive.status === 'open' ? 'Active Drive' : drive.status.replace('_', ' ')}
    >
      <AdminDriveDetailsView
        drive={drive}
        applications={applications}
        eligibleStudentsPool={eligiblePool}
        basePath="/admin/placements"
        roleTitle="Administrator"
      />
    </PageContainer>
  );
}
