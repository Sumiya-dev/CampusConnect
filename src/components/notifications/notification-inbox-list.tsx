'use client';

import { useState, useTransition } from 'react';
import { UserInboxNotification } from '@/lib/notifications/user-queries';
import { markNotificationAsReadAction } from '@/lib/notifications/user-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bell,
  Briefcase,
  Radio,
  Clock,
  Calendar,
  Megaphone,
  Layers,
  Check,
  CheckCheck,
} from 'lucide-react';

interface NotificationInboxListProps {
  notifications: UserInboxNotification[];
}

const TYPE_ICONS: Record<string, any> = {
  Placement: Briefcase,
  Drive: Radio,
  Deadline: Clock,
  Interview: Calendar,
  Announcement: Megaphone,
  System: Layers,
  General: Bell,
};

export function NotificationInboxList({
  notifications: initialNotifications,
}: NotificationInboxListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isPending, startTransition] = useTransition();

  const handleMarkAsRead = (userNotificationId: string) => {
    startTransition(async () => {
      const res = await markNotificationAsReadAction(userNotificationId);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.userNotificationId === userNotificationId
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n
          )
        );
      }
    });
  };

  const formatTimestamp = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center space-y-2 border border-[#222222] rounded-md bg-[#0A0A0A]">
        <Bell className="h-6 w-6 text-[#9AA1AA] mx-auto opacity-50" />
        <div className="text-sm font-medium text-[#EDEDED]">No official broadcasts</div>
        <p className="text-xs text-[#9AA1AA] max-w-sm mx-auto">
          You do not have any direct administrative circulars or placement advisories at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[#222222] rounded-md bg-[#0A0A0A] divide-y divide-[#1A1A1A] overflow-hidden">
      {notifications.map((item) => {
        const Icon = TYPE_ICONS[item.type] || Bell;

        return (
          <div
            key={item.userNotificationId}
            className={`p-4 sm:p-5 flex items-start gap-3.5 transition-colors ${
              item.isRead ? 'bg-[#0A0A0A]' : 'bg-[#121212]/80 hover:bg-[#121212]'
            }`}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded border border-[#222222] bg-[#161616] text-[#FF6B00] shrink-0 mt-0.5">
              <Icon className="h-3.5 w-3.5" />
            </div>

            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-mono">
                    {item.type}
                  </Badge>
                  <span className="text-xs text-[#9AA1AA] font-mono">
                    {formatTimestamp(item.sentAt || item.deliveredAt)}
                  </span>
                </div>

                <div>
                  {item.isRead ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#9AA1AA] font-mono">
                      <CheckCheck className="h-3 w-3 text-emerald-400" />
                      Read
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkAsRead(item.userNotificationId)}
                      disabled={isPending}
                      className="h-6 px-2 text-[10px] font-mono border-[#333333] bg-[#161616] text-[#FF6B00] hover:text-[#EDEDED]"
                    >
                      <Check className="h-2.5 w-2.5 mr-1" />
                      Acknowledge
                    </Button>
                  )}
                </div>
              </div>

              <h3 className="text-sm font-semibold text-[#EDEDED] leading-snug">
                {item.title}
              </h3>
              <p className="text-xs text-[#9AA1AA] leading-relaxed whitespace-pre-line">
                {item.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
