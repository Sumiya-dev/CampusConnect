import { notFound, redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { AdminDriveForm } from '@/components/placements/admin-drive-form';
import { getPlacementDriveById, getDistinctDriveMetadata } from '@/lib/placements/queries';
import { getCurrentUser } from '@/lib/auth/user';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditAdminPlacementDrivePage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    redirect('/login?unauthorized=true');
  }

  const { id } = await params;
  const [drive, metadata] = await Promise.all([
    getPlacementDriveById(id),
    getDistinctDriveMetadata(),
  ]);

  if (!drive) {
    notFound();
  }

  return (
    <PageContainer
      title={`Edit ${drive.job_role}`}
      description={`Update recruitment specifications for ${drive.company?.company_name || 'recruiting partner'}.`}
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Placement Drives', href: '/admin/placements' },
        { label: drive.job_role, href: `/admin/placements/${drive.id}` },
        { label: 'Edit' },
      ]}
      badgeText="Superadmin"
    >
      <AdminDriveForm
        mode="edit"
        initialDrive={drive}
        metadata={metadata}
        basePath="/admin/placements"
      />
    </PageContainer>
  );
}
