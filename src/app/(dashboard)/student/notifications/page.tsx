import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Bell, Megaphone } from 'lucide-react';
import { getStudentAnnouncements } from '@/lib/announcements/queries';
import { getUserDeliveredNotifications } from '@/lib/notifications/user-queries';
import { NotificationInboxList } from '@/components/notifications/notification-inbox-list';

export const dynamic = 'force-dynamic';

function formatNotificationDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

export default async function StudentNotificationsPage() {
  const [announcements, deliveredNotifications] = await Promise.all([
    getStudentAnnouncements(),
    getUserDeliveredNotifications(),
  ]);

  return (
    <PageContainer
      title="Notifications & Directorate Bulletins"
      description="Official circulars, academic notices, and department directives targeted to your cohort."
      badgeText="Official Broadcasts"
      breadcrumbs={[
        { label: 'Student Home', href: '/student' },
        { label: 'Notifications' },
      ]}
    >
      <div className="space-y-8">
        {/* 1. OFFICIAL ADMINISTRATIVE BROADCASTS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#222222] pb-2">
            <div>
              <h2 className="text-sm font-semibold text-[#EDEDED] uppercase tracking-wider font-mono">
                Official Directorate & Placement Broadcasts
              </h2>
              <p className="text-xs text-[#9AA1AA]">
                Directives, placement alerts, and campus-wide notifications.
              </p>
            </div>
            <span className="text-xs font-mono text-[#9AA1AA]">
              {deliveredNotifications.length} Broadcast(s)
            </span>
          </div>

          <NotificationInboxList notifications={deliveredNotifications} />
        </section>

        {/* 2. FACULTY BULLETINS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#222222] pb-2">
            <div>
              <h2 className="text-sm font-semibold text-[#EDEDED] uppercase tracking-wider font-mono">
                Faculty Advisories & Cohort Notices
              </h2>
              <p className="text-xs text-[#9AA1AA]">
                Academic notices issued directly by assigned faculty advisors.
              </p>
            </div>
            <span className="text-xs font-mono text-[#9AA1AA]">
              {announcements.length} Notice(s)
            </span>
          </div>

          <div className="border border-[#222222] rounded-md bg-[#0A0A0A] divide-y divide-[#1A1A1A]">
            {announcements.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Megaphone className="h-6 w-6 text-[#9AA1AA] mx-auto opacity-50" />
                <div className="text-sm font-medium text-[#EDEDED]">
                  No faculty advisories available
                </div>
                <p className="text-xs text-[#9AA1AA] max-w-sm mx-auto">
                  You do not have any published announcements or directives for
                  your academic section at this time.
                </p>
              </div>
            ) : (
              announcements.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex items-start gap-3.5 hover:bg-[#121212] transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded border border-[#222222] bg-[#121212] text-[#FF6B00] shrink-0 mt-0.5">
                    <Megaphone className="h-3.5 w-3.5" />
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-xs font-mono">
                        {item.target_label || 'Department Notice'}
                      </Badge>
                      <span className="text-xs text-[#9AA1AA]">
                        • {item.faculty_name} ({item.faculty_designation || 'Faculty'})
                      </span>
                      <span className="text-[#262626]">•</span>
                      <span className="text-xs text-[#9AA1AA] font-mono">
                        {formatNotificationDate(item.created_at)}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-[#EDEDED] leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#9AA1AA] leading-relaxed whitespace-pre-line">
                      {item.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
