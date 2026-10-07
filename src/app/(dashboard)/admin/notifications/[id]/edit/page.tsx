import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { PageContainer } from '@/components/layout/page-container';
import {
  getNotificationDetail,
  getTargetStructureOptions,
} from '@/lib/notifications/admin-queries';
import { NotificationForm } from '@/components/admin/notification-form';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const notification = await getNotificationDetail(id);
  return {
    title: notification
      ? `Edit: ${notification.title} | Notifications | CampusConnect AI`
      : 'Edit Notification | CampusConnect AI',
  };
}

export default async function AdminEditNotificationPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    redirect('/login?error=unauthorized');
  }

  const { id } = await params;
  const [notification, structureOptions] = await Promise.all([
    getNotificationDetail(id),
    getTargetStructureOptions(),
  ]);

  if (!notification) {
    notFound();
  }

  return (
    <PageContainer
      title={`Edit Notification`}
      description={`Editing ${notification.title} (${notification.status})`}
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Notifications', href: '/admin/notifications' },
        { label: notification.title, href: `/admin/notifications/${notification.id}` },
        { label: 'Edit' },
      ]}
      badgeText={notification.status.toUpperCase()}
    >
      <NotificationForm
        initialData={notification}
        structureOptions={structureOptions}
        isEditing={true}
      />
    </PageContainer>
  );
}
