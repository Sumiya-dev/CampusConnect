import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { PageContainer } from '@/components/layout/page-container';
import { getSuperadminProfileDetails } from '@/lib/superadmin/profile-queries';
import { SuperadminProfileView } from '@/components/superadmin/superadmin-profile-view';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Superadmin Profile | CampusConnect AI',
  description: 'Manage personal administrator credentials, contact details, and security settings.',
};

export default async function SuperadminProfilePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    redirect('/login?error=unauthorized');
  }

  const profile = await getSuperadminProfileDetails();
  if (!profile) {
    redirect('/login');
  }

  return (
    <PageContainer
      title="Superadmin Profile & Security"
      description="Inspect identity attributes, update emergency contact points, and manage privileged access credentials."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Superadmin Profile' },
      ]}
      badgeText="Identity Governance"
    >
      <SuperadminProfileView profile={profile} />
    </PageContainer>
  );
}
