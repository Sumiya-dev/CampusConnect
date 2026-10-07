import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { PageContainer } from '@/components/layout/page-container';
import { getSystemSettings } from '@/lib/settings/queries';
import { SettingsManager } from '@/components/admin/settings-manager';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'System Settings | Superadmin | CampusConnect AI',
  description:
    'Manage university platform configuration, placement rules, notification channels, and operational safeguards.',
};

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    redirect('/login?error=unauthorized');
  }

  const { bundle, academicYears } = await getSystemSettings();

  return (
    <PageContainer
      title="System Architecture & Settings"
      description="Configure institutional parameters, recruitment rules, global notification channels, and platform feature gates."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'System Settings' },
      ]}
      badgeText="Platform Governance"
    >
      <SettingsManager
        initialBundle={bundle}
        academicYears={academicYears}
      />
    </PageContainer>
  );
}
