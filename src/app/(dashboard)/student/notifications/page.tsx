import { PageContainer } from '@/components/layout/page-container';
import { getStudentAnnouncements } from '@/lib/announcements/queries';
import { getUserDeliveredNotifications } from '@/lib/notifications/user-queries';
import { UnifiedNotificationFeed } from '@/components/notifications/unified-notification-feed';



export type UnifiedNotification = {
  id: string;
  sourceId: string;
  sourceType: 'admin' | 'faculty';
  title: string;
  message: string;
  type: string;
  date: string;
  isRead: boolean;
};

export default async function StudentNotificationsPage() {
  const [announcements, deliveredNotifications] = await Promise.all([
    getStudentAnnouncements(),
    getUserDeliveredNotifications(),
  ]);

  // Normalize into a single feed
  const feed: UnifiedNotification[] = [];

  for (const n of deliveredNotifications) {
    feed.push({
      id: n.userNotificationId,
      sourceId: n.notificationId,
      sourceType: 'admin',
      title: n.title,
      message: n.message,
      type: n.type || 'General',
      date: n.sentAt || n.deliveredAt,
      isRead: n.isRead,
    });
  }

  for (const a of announcements) {
    feed.push({
      id: a.id,
      sourceId: a.id,
      sourceType: 'faculty',
      title: a.title,
      message: a.content,
      type: 'Faculty',
      date: a.created_at,
      isRead: true, // Announcements don't have read state tracked per user currently
    });
  }

  // Sort by date descending
  feed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <PageContainer
      title="Notifications"
      description="Stay updated with placements, preparation, applications, and important campus activity."
      breadcrumbs={[
        { label: 'Student Home', href: '/student' },
        { label: 'Notifications' },
      ]}
    >
      <div className="mt-6 max-w-4xl">
        <UnifiedNotificationFeed initialNotifications={feed} />
      </div>
    </PageContainer>
  );
}
