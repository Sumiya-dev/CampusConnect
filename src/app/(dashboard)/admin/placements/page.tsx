import { PageContainer } from '@/components/layout/page-container';
import { AdminDrivesListView } from '@/components/placements/admin-drives-list-view';
import { getAllPlacementDrives, getDistinctDriveMetadata } from '@/lib/placements/queries';
import { getCurrentUser } from '@/lib/auth/user';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminPlacementsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    redirect('/login?unauthorized=true');
  }

  const [drives, metadata] = await Promise.all([
    getAllPlacementDrives(),
    getDistinctDriveMetadata(),
  ]);

  return (
    <PageContainer
      title="Placement Drives Governance"
      description="Superadmin oversight, scheduling, and applicant pipeline governance for campus recruitment campaigns."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Placement Drives' },
      ]}
      badgeText={`${drives.length} Drives`}
    >
      <AdminDrivesListView
        initialDrives={drives}
        metadata={metadata}
        basePath="/admin/placements"
        roleTitle="Administrator"
      />
    </PageContainer>
  );
}
