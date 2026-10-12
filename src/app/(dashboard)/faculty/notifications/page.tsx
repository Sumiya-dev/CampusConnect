import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getUserDeliveredNotifications } from '@/lib/notifications/user-queries';
import { NotificationInboxList } from '@/components/notifications/notification-inbox-list';



export default async function FacultyNotificationsPage() {
  const notifications = await getUserDeliveredNotifications();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-border pb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-mono tracking-wider text-accent">
            Account
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight mt-1">
          Faculty Notifications
        </h1>
        <p className="text-sm text-muted mt-1">
          System alerts, institutional directives, and administrative communications.
        </p>
      </div>

      <NotificationInboxList notifications={notifications} />

      <div className="pt-2">
        <Link
          href="/faculty"
          className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Faculty Home
        </Link>
      </div>
    </div>
  );
}
