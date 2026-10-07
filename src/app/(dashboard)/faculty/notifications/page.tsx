import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getUserDeliveredNotifications } from '@/lib/notifications/user-queries';
import { NotificationInboxList } from '@/components/notifications/notification-inbox-list';

export const dynamic = 'force-dynamic';

export default async function FacultyNotificationsPage() {
  const notifications = await getUserDeliveredNotifications();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-[#222222] pb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-mono tracking-wider text-[#FF6B00]">
            Account
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-[#EDEDED] tracking-tight mt-1">
          Faculty Notifications
        </h1>
        <p className="text-sm text-[#9AA1AA] mt-1">
          System alerts, institutional directives, and administrative communications.
        </p>
      </div>

      <NotificationInboxList notifications={notifications} />

      <div className="pt-2">
        <Link
          href="/faculty"
          className="inline-flex items-center gap-1.5 text-xs text-[#FF6B00] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Faculty Home
        </Link>
      </div>
    </div>
  );
}
