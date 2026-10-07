import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { PageContainer } from '@/components/layout/page-container';
import {
  getAdminNotifications,
  getNotificationDashboardStats,
} from '@/lib/notifications/admin-queries';
import { NotificationsDashboard } from '@/components/admin/notifications-dashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Notifications Management | Superadmin | CampusConnect AI',
  description:
    'Broadcast campus directives, manage scheduled announcements, and audit delivery analytics.',
};

export default async function AdminNotificationsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    redirect('/login?error=unauthorized');
  }

  const [notifications, stats] = await Promise.all([
    getAdminNotifications(),
    getNotificationDashboardStats(),
  ]);

  return (
    <PageContainer
      title="Notifications Management"
      description="Publish official campus broadcasts, target cohort distributions, schedule alerts, and monitor read receipts."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Notifications' },
      ]}
      badgeText="Superadmin Dispatch"
    >
      <NotificationsDashboard
        initialNotifications={notifications}
        initialStats={stats}
      />
    </PageContainer>
  );
}
