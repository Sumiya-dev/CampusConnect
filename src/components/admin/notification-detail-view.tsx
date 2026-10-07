'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AdminNotification,
  NotificationRecipientRecord,
  NotificationType,
} from '@/lib/types/notification.types';
import {
  sendNotificationNowAction,
  cancelScheduledNotificationAction,
  deleteNotificationAction,
} from '@/lib/notifications/admin-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  ArrowLeft,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  Edit,
  Users,
  Building2,
  GraduationCap,
  Briefcase,
  Megaphone,
  Radio,
  Layers,
  Loader2,
  Lock,
  Ban,
  Check,
  Search,
} from 'lucide-react';

interface NotificationDetailViewProps {
  notification: AdminNotification;
  recipients: NotificationRecipientRecord[];
}

const TYPE_ICONS: Record<NotificationType, any> = {
  Placement: Briefcase,
  Drive: Radio,
  Deadline: Clock,
  Interview: Calendar,
  Announcement: Megaphone,
  System: Layers,
  General: Bell,
};

const TYPE_COLORS: Record<NotificationType, string> = {
  Placement: 'text-amber-400 border-amber-900/40 bg-amber-950/20',
  Drive: 'text-emerald-400 border-emerald-900/40 bg-emerald-950/20',
  Deadline: 'text-rose-400 border-rose-900/40 bg-rose-950/20',
  Interview: 'text-purple-400 border-purple-900/40 bg-purple-950/20',
  Announcement: 'text-sky-400 border-sky-900/40 bg-sky-950/20',
  System: 'text-neutral-300 border-neutral-700 bg-neutral-900/40',
  General: 'text-[#FF6B00] border-[#FF6B00]/30 bg-[#FF6B00]/10',
};

export function NotificationDetailView({
  notification,
  recipients,
}: NotificationDetailViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Recipient search
  const [recipientSearch, setRecipientSearch] = useState('');
  const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all');

  const filteredRecipients = recipients.filter((r) => {
    if (readFilter === 'read' && !r.is_read) return false;
    if (readFilter === 'unread' && r.is_read) return false;

    if (recipientSearch.trim()) {
      const q = recipientSearch.toLowerCase().trim();
      const nameMatch = r.user?.name?.toLowerCase().includes(q) ?? false;
      const emailMatch = r.user?.email?.toLowerCase().includes(q) ?? false;
      const deptMatch = r.user?.department?.toLowerCase().includes(q) ?? false;
      const roleMatch = r.user?.role?.toLowerCase().includes(q) ?? false;
      return nameMatch || emailMatch || deptMatch || roleMatch;
    }
    return true;
  });

  const handleSendNow = () => {
    setActionError(null);
    startTransition(async () => {
      const res = await sendNotificationNowAction(notification.id);
      if (!res.success) {
        setActionError(res.error || 'Failed to dispatch notification.');
      } else {
        setActionSuccess(res.message || 'Notification sent.');
        setConfirmSendOpen(false);
        router.refresh();
      }
    });
  };

  const handleCancelScheduled = () => {
    setActionError(null);
    startTransition(async () => {
      const res = await cancelScheduledNotificationAction(notification.id);
      if (!res.success) {
        setActionError(res.error || 'Failed to cancel schedule.');
      } else {
        setActionSuccess(res.message || 'Schedule cancelled.');
        setConfirmCancelOpen(false);
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    setActionError(null);
    startTransition(async () => {
      const res = await deleteNotificationAction(notification.id);
      if (!res.success) {
        setActionError(res.error || 'Failed to delete notification.');
      } else {
        setConfirmDeleteOpen(false);
        router.push('/admin/notifications');
        router.refresh();
      }
    });
  };

  const formatTimestamp = (dateStr?: string | null) => {
    if (!dateStr) return '—';
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

  const TypeIcon = TYPE_ICONS[notification.type] || Bell;
  const typeColorClass =
    TYPE_COLORS[notification.type] ||
    'text-[#FF6B00] border-[#FF6B00]/30 bg-[#FF6B00]/10';

  const readRate =
    recipients.length > 0
      ? Math.round(
          (recipients.filter((r) => r.is_read).length / recipients.length) * 100
        )
      : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back button and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div className="space-y-1">
          <Link
            href="/admin/notifications"
            className="inline-flex items-center gap-1 text-xs text-[#9AA1AA] hover:text-[#EDEDED] transition-colors mb-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Notifications Dashboard
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium border ${typeColorClass}`}
            >
              <TypeIcon className="h-3.5 w-3.5" />
              {notification.type}
            </span>

            {notification.status === 'sent' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-900/60">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Dispatched
              </span>
            )}
            {notification.status === 'scheduled' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium text-amber-400 bg-amber-950/40 border border-amber-900/60">
                <Clock className="h-3.5 w-3.5" />
                Scheduled
              </span>
            )}
            {notification.status === 'draft' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium text-neutral-400 bg-neutral-900 border border-neutral-800">
                <FileText className="h-3.5 w-3.5" />
                Draft
              </span>
            )}
            {notification.status === 'cancelled' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium text-rose-400 bg-rose-950/40 border border-rose-900/60">
                <Ban className="h-3.5 w-3.5" />
                Cancelled
              </span>
            )}
          </div>
          <h1 className="text-xl font-semibold text-[#EDEDED] tracking-tight mt-1">
            {notification.title}
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {notification.status !== 'sent' && (
            <Link href={`/admin/notifications/${notification.id}/edit`}>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs border-[#222222] bg-[#121212] hover:bg-[#1A1A1A] text-[#EDEDED]"
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
            </Link>
          )}

          {notification.status !== 'sent' && (
            <Button
              size="sm"
              onClick={() => setConfirmSendOpen(true)}
              className="h-8 px-3.5 text-xs bg-[#FF6B00] hover:bg-[#E05D00] text-black font-semibold"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Send Now
            </Button>
          )}

          {notification.status === 'scheduled' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmCancelOpen(true)}
              className="h-8 px-3 text-xs border-amber-900/60 bg-amber-950/20 hover:bg-amber-900/40 text-amber-400"
            >
              <Ban className="h-3.5 w-3.5 mr-1.5" />
              Cancel Schedule
            </Button>
          )}

          {(notification.status === 'draft' ||
            notification.status === 'cancelled') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDeleteOpen(true)}
              className="h-8 px-3 text-xs border-rose-900/60 bg-rose-950/20 hover:bg-rose-900/40 text-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
          )}

          {notification.status === 'sent' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#161616] border border-[#262626] text-xs text-[#9AA1AA]">
              <Lock className="h-3.5 w-3.5 text-emerald-400" />
              Historical Record Locked
            </div>
          )}
        </div>
      </div>

      {/* Action alerts */}
      {actionSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-950/30 border border-emerald-900/60 rounded text-emerald-400 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-2 p-3 bg-rose-950/30 border border-rose-900/60 rounded text-rose-400 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* METADATA SUMMARY & CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Full Message Body */}
        <div className="lg:col-span-2 space-y-5">
          <div className="border border-[#222222] bg-[#121212] p-5 rounded-md space-y-3">
            <div className="flex items-center justify-between text-xs text-[#9AA1AA] font-mono border-b border-[#1C1C1C] pb-2.5">
              <span>BROADCAST MESSAGE BODY</span>
              <span>
                Created by{' '}
                {notification.created_by_profile?.name ||
                  notification.created_by_profile?.email ||
                  'Superadmin'}
              </span>
            </div>
            <div className="text-xs text-[#EDEDED] leading-relaxed whitespace-pre-line font-normal">
              {notification.message}
            </div>
          </div>

          {/* Delivery & Read Analytics */}
          <div className="border border-[#222222] bg-[#121212] p-5 rounded-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#EDEDED] uppercase font-mono tracking-wider">
                Delivery & Read Status
              </h3>
              <span className="text-[11px] text-[#9AA1AA] font-mono">
                {recipients.length} inboxes targeted
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-[#0A0A0A] border border-[#222222] rounded-md">
                <div className="text-[11px] text-[#9AA1AA]">Total Inboxes</div>
                <div className="text-lg font-bold font-mono text-[#EDEDED] mt-1">
                  {recipients.length}
                </div>
              </div>

              <div className="p-3 bg-[#0A0A0A] border border-[#222222] rounded-md">
                <div className="text-[11px] text-[#9AA1AA]">Read Confirmations</div>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                  {recipients.filter((r) => r.is_read).length}
                </div>
              </div>

              <div className="p-3 bg-[#0A0A0A] border border-[#222222] rounded-md">
                <div className="text-[11px] text-[#9AA1AA]">Read Rate</div>
                <div className="text-lg font-bold font-mono text-[#FF6B00] mt-1">
                  {readRate}%
                </div>
              </div>
            </div>

            {/* Recipient Search & Filters */}
            {recipients.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9AA1AA]" />
                    <input
                      type="text"
                      placeholder="Filter recipients by name, email, or department..."
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                      className="w-full pl-8 pr-3 h-8 rounded bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] outline-none focus:border-[#FF6B00]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setReadFilter('all')}
                      className={`px-2.5 py-1 rounded text-xs font-mono border ${
                        readFilter === 'all'
                          ? 'border-[#FF6B00] text-[#FF6B00] bg-[#FF6B00]/10'
                          : 'border-[#222222] text-[#9AA1AA] bg-[#0A0A0A]'
                      }`}
                    >
                      All ({recipients.length})
                    </button>
                    <button
                      onClick={() => setReadFilter('read')}
                      className={`px-2.5 py-1 rounded text-xs font-mono border ${
                        readFilter === 'read'
                          ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                          : 'border-[#222222] text-[#9AA1AA] bg-[#0A0A0A]'
                      }`}
                    >
                      Read ({recipients.filter((r) => r.is_read).length})
                    </button>
                    <button
                      onClick={() => setReadFilter('unread')}
                      className={`px-2.5 py-1 rounded text-xs font-mono border ${
                        readFilter === 'unread'
                          ? 'border-neutral-500 text-neutral-300 bg-neutral-900'
                          : 'border-[#222222] text-[#9AA1AA] bg-[#0A0A0A]'
                      }`}
                    >
                      Unread ({recipients.filter((r) => !r.is_read).length})
                    </button>
                  </div>
                </div>

                {/* Recipient Logs Table */}
                <div className="border border-[#222222] bg-[#0A0A0A] rounded-md overflow-hidden max-h-80 overflow-y-auto divide-y divide-[#1A1A1A]">
                  {filteredRecipients.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#9AA1AA]">
                      No recipients matching filter criteria.
                    </div>
                  ) : (
                    filteredRecipients.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 hover:bg-[#121212] transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#EDEDED] truncate">
                              {r.user?.name || 'Unknown User'}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-mono capitalize"
                            >
                              {r.user?.role?.replace('_', ' ') || 'User'}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-[#9AA1AA] truncate">
                            {r.user?.email} • {r.user?.department || 'Department'}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {r.is_read ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                              <Check className="h-3 w-3" />
                              Read {formatTimestamp(r.read_at)}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#9AA1AA] font-mono">
                              Delivered (Unread)
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Targeting Specs & Timestamps */}
        <div className="space-y-5">
          <div className="border border-[#222222] bg-[#121212] p-5 rounded-md space-y-4">
            <h3 className="text-xs font-semibold text-[#EDEDED] uppercase font-mono tracking-wider">
              Target Audience Specifications
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] text-[#9AA1AA] block">Target Roles</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {!notification.target_roles ||
                  notification.target_roles.length === 0 ||
                  notification.target_roles.includes('all') ? (
                    <Badge variant="secondary" className="font-mono text-xs">
                      All Users (Campus Broadcast)
                    </Badge>
                  ) : (
                    notification.target_roles.map((role) => (
                      <Badge
                        key={role}
                        variant="secondary"
                        className="font-mono text-xs capitalize"
                      >
                        {role.replace('_', ' ')}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-[#1C1C1C]">
                <span className="text-[11px] text-[#9AA1AA] block">Department</span>
                <span className="text-[#EDEDED] font-medium mt-0.5 block">
                  {notification.target_department || 'All Departments'}
                </span>
              </div>

              <div className="pt-2 border-t border-[#1C1C1C]">
                <span className="text-[11px] text-[#9AA1AA] block">
                  Academic Year
                </span>
                <span className="text-[#EDEDED] font-medium mt-0.5 block">
                  {notification.target_year
                    ? `Year ${notification.target_year}`
                    : 'All Academic Years'}
                </span>
              </div>

              <div className="pt-2 border-t border-[#1C1C1C]">
                <span className="text-[11px] text-[#9AA1AA] block">
                  Academic Section
                </span>
                <span className="text-[#EDEDED] font-medium mt-0.5 block">
                  {notification.target_section?.section_name
                    ? `${notification.target_section.section_name} (${notification.target_section.academic_year})`
                    : 'All Sections'}
                </span>
              </div>
            </div>
          </div>

          {/* Schedule & History info */}
          <div className="border border-[#222222] bg-[#121212] p-5 rounded-md space-y-3 text-xs">
            <h3 className="text-xs font-semibold text-[#EDEDED] uppercase font-mono tracking-wider">
              Timeline & Governance
            </h3>

            <div className="space-y-2 text-[#9AA1AA]">
              <div className="flex justify-between">
                <span>Created:</span>
                <span className="text-[#EDEDED] font-mono">
                  {formatTimestamp(notification.created_at)}
                </span>
              </div>

              {notification.scheduled_at && (
                <div className="flex justify-between">
                  <span>Scheduled For:</span>
                  <span className="text-amber-400 font-mono">
                    {formatTimestamp(notification.scheduled_at)}
                  </span>
                </div>
              )}

              {notification.sent_at && (
                <div className="flex justify-between">
                  <span>Dispatched At:</span>
                  <span className="text-emerald-400 font-mono">
                    {formatTimestamp(notification.sent_at)}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="text-[#EDEDED] font-mono">
                  {formatTimestamp(notification.updated_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRM SEND MODAL */}
      {confirmSendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="border border-[#222222] bg-[#121212] max-w-md w-full rounded-lg p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00] shrink-0 mt-0.5">
                <Send className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[#EDEDED]">
                  Dispatch Notification Now?
                </h3>
                <p className="text-xs text-[#9AA1AA]">
                  This will immediately deliver this notification to all matching
                  targeted users. Historical records will be locked.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmSendOpen(false)}
                disabled={isPending}
                className="border-[#222222] bg-[#161616] text-[#EDEDED] text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSendNow}
                disabled={isPending}
                className="bg-[#FF6B00] hover:bg-[#E05D00] text-black font-semibold text-xs h-8"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Confirm & Send'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM CANCEL MODAL */}
      {confirmCancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="border border-[#222222] bg-[#121212] max-w-md w-full rounded-lg p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-amber-950/30 border border-amber-900/60 text-amber-400 shrink-0 mt-0.5">
                <Ban className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[#EDEDED]">
                  Cancel Scheduled Broadcast?
                </h3>
                <p className="text-xs text-[#9AA1AA]">
                  This notification will be marked as cancelled and will not be
                  dispatched to recipients.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmCancelOpen(false)}
                disabled={isPending}
                className="border-[#222222] bg-[#161616] text-[#EDEDED] text-xs h-8"
              >
                Keep Scheduled
              </Button>
              <Button
                size="sm"
                onClick={handleCancelScheduled}
                disabled={isPending}
                className="bg-amber-600 hover:bg-amber-700 text-black font-semibold text-xs h-8"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Yes, Cancel Dispatch'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="border border-[#222222] bg-[#121212] max-w-md w-full rounded-lg p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-rose-950/30 border border-rose-900/60 text-rose-400 shrink-0 mt-0.5">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[#EDEDED]">
                  Permanently Delete Notification?
                </h3>
                <p className="text-xs text-[#9AA1AA]">
                  This will permanently delete this notification record.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDeleteOpen(false)}
                disabled={isPending}
                className="border-[#222222] bg-[#161616] text-[#EDEDED] text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDelete}
                disabled={isPending}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-8"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Notification'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
