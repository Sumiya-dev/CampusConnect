import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { PageContainer } from '@/components/layout/page-container';
import { getTargetStructureOptions } from '@/lib/notifications/admin-queries';
import { NotificationForm } from '@/components/admin/notification-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Compose Notification | Superadmin | CampusConnect AI',
  description: 'Create and target a new campus notification broadcast.',
};

export default async function AdminNewNotificationPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    redirect('/login?error=unauthorized');
  }

  const structureOptions = await getTargetStructureOptions();

  return (
    <PageContainer
      title="Compose Notification"
      description="Configure broadcast message, cohort targeting rules, and scheduling triggers."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Notifications', href: '/admin/notifications' },
        { label: 'New Broadcast' },
      ]}
      badgeText="Official Bulletin"
    >
      <NotificationForm
        structureOptions={structureOptions}
        isEditing={false}
      />
    </PageContainer>
  );
}
