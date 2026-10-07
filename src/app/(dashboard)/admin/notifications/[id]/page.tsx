import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { PageContainer } from '@/components/layout/page-container';
import {
  getNotificationDetail,
  getNotificationRecipients,
} from '@/lib/notifications/admin-queries';
import { NotificationDetailView } from '@/components/admin/notification-detail-view';

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
      ? `${notification.title} | Notifications | CampusConnect AI`
      : 'Notification Detail | CampusConnect AI',
  };
}

export default async function AdminNotificationDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    redirect('/login?error=unauthorized');
  }

  const { id } = await params;
  const [notification, recipients] = await Promise.all([
    getNotificationDetail(id),
    getNotificationRecipients(id),
  ]);

  if (!notification) {
    notFound();
  }

  return (
    <PageContainer
      title={notification.title}
      description={`Broadcast Type: ${notification.type} • Status: ${notification.status}`}
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Notifications', href: '/admin/notifications' },
        { label: notification.title },
      ]}
      badgeText={notification.status.toUpperCase()}
    >
      <NotificationDetailView
        notification={notification}
        recipients={recipients}
      />
    </PageContainer>
  );
}
