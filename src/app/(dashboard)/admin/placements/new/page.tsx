import { PageContainer } from '@/components/layout/page-container';
import { AdminDriveForm } from '@/components/placements/admin-drive-form';
import { getDistinctDriveMetadata } from '@/lib/placements/queries';
import { getCurrentUser } from '@/lib/auth/user';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewAdminPlacementDrivePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    redirect('/login?unauthorized=true');
  }

  const metadata = await getDistinctDriveMetadata();

  return (
    <PageContainer
      title="Create Recruitment Drive"
      description="Configure corporate partner parameters, compensation, academic eligibility, and evaluation stages."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Placement Drives', href: '/admin/placements' },
        { label: 'New Drive' },
      ]}
      badgeText="Superadmin"
    >
      <AdminDriveForm
        mode="create"
        metadata={metadata}
        basePath="/admin/placements"
      />
    </PageContainer>
  );
}
