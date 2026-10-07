'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AdminNotification,
  NotificationDashboardStats,
  NotificationFilterOptions,
  NotificationStatus,
  NotificationType,
} from '@/lib/types/notification.types';
import {
  sendNotificationNowAction,
  cancelScheduledNotificationAction,
  deleteNotificationAction,
} from '@/lib/notifications/admin-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Search,
  Plus,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  Trash2,
  Eye,
  Edit,
  Users,
  Building2,
  GraduationCap,
  Briefcase,
  Megaphone,
  Radio,
  Layers,
  Loader2,
  Filter,
  Check,
  Ban,
} from 'lucide-react';

interface NotificationsDashboardProps {
  initialNotifications: AdminNotification[];
  initialStats: NotificationDashboardStats;
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

export function NotificationsDashboard({
  initialNotifications,
  initialStats,
}: NotificationsDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Filters state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals state
  const [confirmSendId, setConfirmSendId] = useState<AdminNotification | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<AdminNotification | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<AdminNotification | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Client-side filtering
  const filteredNotifications = useMemo(() => {
    return initialNotifications.filter((item) => {
      // Search
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesMessage = item.message.toLowerCase().includes(query);
        const matchesDept = item.target_department
          ? item.target_department.toLowerCase().includes(query)
          : false;
        if (!matchesTitle && !matchesMessage && !matchesDept) return false;
      }

      // Type
      if (typeFilter !== 'all' && item.type !== typeFilter) {
        return false;
      }

      // Status
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // Target Role
      if (roleFilter !== 'all') {
        const roles = item.target_roles || [];
        if (roles.length > 0 && !roles.includes('all') && !roles.includes(roleFilter)) {
          return false;
        }
      }

      // Date from
      if (dateFrom) {
        const itemDate = new Date(item.created_at).getTime();
        const fromDate = new Date(dateFrom).getTime();
        if (itemDate < fromDate) return false;
      }

      // Date to
      if (dateTo) {
        const itemDate = new Date(item.created_at).getTime();
        const toDate = new Date(`${dateTo}T23:59:59.999Z`).getTime();
        if (itemDate > toDate) return false;
      }

      return true;
    });
  }, [initialNotifications, search, typeFilter, statusFilter, roleFilter, dateFrom, dateTo]);

  // Handler: Send Notification Now
  const handleSendNow = async () => {
    if (!confirmSendId) return;
    setActionError(null);
    setActionMessage(null);

    startTransition(async () => {
      const res = await sendNotificationNowAction(confirmSendId.id);
      if (!res.success) {
        setActionError(res.error || 'Failed to dispatch notification.');
      } else {
        setActionMessage(res.message || 'Notification sent successfully.');
        setConfirmSendId(null);
        router.refresh();
      }
    });
  };

  // Handler: Cancel Scheduled Notification
  const handleCancelScheduled = async () => {
    if (!confirmCancelId) return;
    setActionError(null);
    setActionMessage(null);

    startTransition(async () => {
      const res = await cancelScheduledNotificationAction(confirmCancelId.id);
      if (!res.success) {
        setActionError(res.error || 'Failed to cancel scheduled notification.');
      } else {
        setActionMessage(res.message || 'Notification schedule cancelled.');
        setConfirmCancelId(null);
        router.refresh();
      }
    });
  };

  // Handler: Delete Notification
  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setActionError(null);
    setActionMessage(null);

    startTransition(async () => {
      const res = await deleteNotificationAction(confirmDeleteId.id);
      if (!res.success) {
        setActionError(res.error || 'Failed to delete notification.');
      } else {
        setActionMessage(res.message || 'Notification removed.');
        setConfirmDeleteId(null);
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

  return (
    <div className="space-y-6">
      {/* Action feedback notifications */}
      {actionMessage && (
        <div className="flex items-center justify-between gap-3 p-3.5 bg-emerald-950/30 border border-emerald-900/60 rounded-md text-emerald-400 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-neutral-400 hover:text-neutral-200 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {actionError && (
        <div className="flex items-center justify-between gap-3 p-3.5 bg-rose-950/30 border border-rose-900/60 rounded-md text-rose-400 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-neutral-400 hover:text-neutral-200 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* METRICS STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="border border-[#222222] bg-[#121212] p-4 rounded-md">
          <div className="flex items-center justify-between text-xs text-[#9AA1AA]">
            <span>Total Broadcasts</span>
            <Bell className="h-3.5 w-3.5 text-[#FF6B00]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#EDEDED] mt-2">
            {initialStats.total}
          </div>
        </div>

        <div className="border border-[#222222] bg-[#121212] p-4 rounded-md">
          <div className="flex items-center justify-between text-xs text-[#9AA1AA]">
            <span>Sent / Dispatched</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-2">
            {initialStats.sent}
          </div>
        </div>

        <div className="border border-[#222222] bg-[#121212] p-4 rounded-md">
          <div className="flex items-center justify-between text-xs text-[#9AA1AA]">
            <span>Scheduled</span>
            <Clock className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-2">
            {initialStats.scheduled}
          </div>
        </div>

        <div className="border border-[#222222] bg-[#121212] p-4 rounded-md">
          <div className="flex items-center justify-between text-xs text-[#9AA1AA]">
            <span>Drafts / Inactive</span>
            <FileText className="h-3.5 w-3.5 text-neutral-400" />
          </div>
          <div className="text-xl font-bold font-mono text-[#EDEDED] mt-2">
            {initialStats.draft + initialStats.cancelled}
          </div>
        </div>

        <div className="border border-[#222222] bg-[#121212] p-4 rounded-md">
          <div className="flex items-center justify-between text-xs text-[#9AA1AA]">
            <span>Delivered Inboxes</span>
            <Users className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-bold font-mono text-sky-400 mt-2">
            {initialStats.totalDelivered}
          </div>
        </div>

        <div className="border border-[#222222] bg-[#121212] p-4 rounded-md">
          <div className="flex items-center justify-between text-xs text-[#9AA1AA]">
            <span>Read Acknowledgements</span>
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-[#EDEDED] mt-2">
            {initialStats.totalRead}
            <span className="text-xs text-[#9AA1AA] font-normal ml-1">
              (
              {initialStats.totalDelivered > 0
                ? Math.round(
                    (initialStats.totalRead / initialStats.totalDelivered) * 100
                  )
                : 0}
              %)
            </span>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div className="border border-[#222222] bg-[#121212] p-4 rounded-md space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9AA1AA]" />
            <Input
              type="text"
              placeholder="Search by title, message body, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#0A0A0A] border-[#222222] text-[#EDEDED] text-xs h-9 focus-visible:ring-1 focus-visible:ring-[#FF6B00]"
            />
          </div>

          {/* Action button */}
          <Link href="/admin/notifications/new">
            <Button className="bg-[#FF6B00] hover:bg-[#E05D00] text-black text-xs font-semibold h-9 px-4 shrink-0">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create Notification
            </Button>
          </Link>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2 border-t border-[#1C1C1C]">
          {/* Type Filter */}
          <div>
            <label className="text-[10px] uppercase font-mono tracking-wider text-[#9AA1AA] block mb-1">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] focus:border-[#FF6B00] outline-none"
            >
              <option value="all">All Types</option>
              <option value="Placement">Placement</option>
              <option value="Drive">Drive</option>
              <option value="Deadline">Deadline</option>
              <option value="Interview">Interview</option>
              <option value="Announcement">Announcement</option>
              <option value="System">System</option>
              <option value="General">General</option>
            </select>
          </div>

          {/* Target Role Filter */}
          <div>
            <label className="text-[10px] uppercase font-mono tracking-wider text-[#9AA1AA] block mb-1">
              Target Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] focus:border-[#FF6B00] outline-none"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="faculty">Faculty</option>
              <option value="placement_officer">Placement Officers</option>
              <option value="administrator">Superadmins</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[10px] uppercase font-mono tracking-wider text-[#9AA1AA] block mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] focus:border-[#FF6B00] outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="text-[10px] uppercase font-mono tracking-wider text-[#9AA1AA] block mb-1">
              Date From
            </label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full h-8 px-2 rounded bg-[#0A0A0A] border-[#222222] text-xs text-[#EDEDED]"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="text-[10px] uppercase font-mono tracking-wider text-[#9AA1AA] block mb-1">
              Date To
            </label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full h-8 px-2 rounded bg-[#0A0A0A] border-[#222222] text-xs text-[#EDEDED]"
            />
          </div>
        </div>

        {/* Clear Filters bar if active */}
        {(search ||
          typeFilter !== 'all' ||
          roleFilter !== 'all' ||
          statusFilter !== 'all' ||
          dateFrom ||
          dateTo) && (
          <div className="flex items-center justify-between text-xs text-[#9AA1AA] pt-1">
            <span>
              Showing {filteredNotifications.length} of {initialNotifications.length}{' '}
              notifications
            </span>
            <button
              onClick={() => {
                setSearch('');
                setTypeFilter('all');
                setRoleFilter('all');
                setStatusFilter('all');
                setDateFrom('');
                setDateTo('');
              }}
              className="text-[#FF6B00] hover:underline"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* NOTIFICATIONS LIST / TABLE */}
      <div className="border border-[#222222] bg-[#0A0A0A] rounded-md divide-y divide-[#1A1A1A] overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Bell className="h-8 w-8 text-[#9AA1AA] mx-auto opacity-40" />
            <div className="text-sm font-medium text-[#EDEDED]">
              No notifications found
            </div>
            <p className="text-xs text-[#9AA1AA] max-w-sm mx-auto">
              No administrative notifications matched your active filter criteria.
              Create a new notification or clear search filters.
            </p>
            <div className="pt-2">
              <Link href="/admin/notifications/new">
                <Button className="bg-[#FF6B00] hover:bg-[#E05D00] text-black text-xs font-semibold h-8 px-3">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Create Notification
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const TypeIcon = TYPE_ICONS[notification.type] || Bell;
            const typeColorClass =
              TYPE_COLORS[notification.type] ||
              'text-[#FF6B00] border-[#FF6B00]/30 bg-[#FF6B00]/10';

            return (
              <div
                key={notification.id}
                className="p-4 sm:p-5 hover:bg-[#121212]/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Content Column */}
                <div className="space-y-2 min-w-0 flex-1">
                  {/* Badges strip */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Type badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${typeColorClass}`}
                    >
                      <TypeIcon className="h-3 w-3" />
                      {notification.type}
                    </span>

                    {/* Status badge */}
                    {notification.status === 'sent' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-900/60">
                        <CheckCircle2 className="h-3 w-3" />
                        Sent
                      </span>
                    )}
                    {notification.status === 'scheduled' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-amber-400 bg-amber-950/40 border border-amber-900/60">
                        <Clock className="h-3 w-3" />
                        Scheduled
                      </span>
                    )}
                    {notification.status === 'draft' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-neutral-400 bg-neutral-900 border border-neutral-800">
                        <FileText className="h-3 w-3" />
                        Draft
                      </span>
                    )}
                    {notification.status === 'cancelled' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-rose-400 bg-rose-950/40 border border-rose-900/60">
                        <Ban className="h-3 w-3" />
                        Cancelled
                      </span>
                    )}

                    {/* Schedule or Sent date */}
                    {notification.status === 'sent' && notification.sent_at && (
                      <span className="text-xs text-[#9AA1AA] font-mono">
                        Sent on {formatTimestamp(notification.sent_at)}
                      </span>
                    )}
                    {notification.status === 'scheduled' && notification.scheduled_at && (
                      <span className="text-xs text-amber-400 font-mono">
                        Scheduled for {formatTimestamp(notification.scheduled_at)}
                      </span>
                    )}
                    {notification.status === 'draft' && (
                      <span className="text-xs text-[#9AA1AA] font-mono">
                        Created {formatTimestamp(notification.created_at)}
                      </span>
                    )}
                  </div>

                  {/* Title & snippet */}
                  <h3 className="text-sm font-semibold text-[#EDEDED] leading-snug">
                    <Link
                      href={`/admin/notifications/${notification.id}`}
                      className="hover:text-[#FF6B00] transition-colors"
                    >
                      {notification.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-[#9AA1AA] line-clamp-2 leading-relaxed">
                    {notification.message}
                  </p>

                  {/* Targeting Meta chips */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#9AA1AA]">
                    <span className="inline-flex items-center gap-1 font-mono text-neutral-300">
                      <Users className="h-3 w-3 text-[#FF6B00]" />
                      Audience:
                    </span>

                    {/* Roles targeted */}
                    {(!notification.target_roles ||
                      notification.target_roles.length === 0 ||
                      notification.target_roles.includes('all')) ? (
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        All Users
                      </Badge>
                    ) : (
                      notification.target_roles.map((r) => (
                        <Badge
                          key={r}
                          variant="secondary"
                          className="text-[10px] font-mono capitalize"
                        >
                          {r.replace('_', ' ')}
                        </Badge>
                      ))
                    )}

                    {/* Department */}
                    {notification.target_department && (
                      <span className="inline-flex items-center gap-1 text-neutral-300">
                        • <Building2 className="h-3 w-3 text-[#9AA1AA]" />
                        {notification.target_department}
                      </span>
                    )}

                    {/* Year */}
                    {notification.target_year && (
                      <span className="inline-flex items-center gap-1 text-neutral-300">
                        • <GraduationCap className="h-3 w-3 text-[#9AA1AA]" />
                        Year {notification.target_year}
                      </span>
                    )}

                    {/* Section */}
                    {notification.target_section && (
                      <span className="inline-flex items-center gap-1 text-neutral-300">
                        • {notification.target_section.section_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Analytics & Actions Column */}
                <div className="flex md:flex-col items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#1A1A1A]">
                  {/* Delivery & Read stats */}
                  <div className="text-right">
                    {notification.status === 'sent' ? (
                      <div>
                        <div className="text-xs font-mono font-medium text-[#EDEDED]">
                          {notification.recipient_count || 0} delivered
                        </div>
                        <div className="text-[11px] text-[#9AA1AA] font-mono">
                          {notification.read_count || 0} read (
                          {notification.recipient_count && notification.recipient_count > 0
                            ? Math.round(
                                ((notification.read_count || 0) /
                                  notification.recipient_count) *
                                  100
                              )
                            : 0}
                          %)
                        </div>
                      </div>
                    ) : notification.status === 'scheduled' ? (
                      <div className="text-[11px] text-amber-400 font-mono">
                        Pending scheduled trigger
                      </div>
                    ) : (
                      <div className="text-[11px] text-[#9AA1AA] font-mono">
                        Unsent draft
                      </div>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* View Details */}
                    <Link href={`/admin/notifications/${notification.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs border-[#222222] bg-[#121212] hover:bg-[#1A1A1A] text-[#EDEDED]"
                        title="View details & delivery logs"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Details
                      </Button>
                    </Link>

                    {/* Edit button: Allowed only for scheduled or draft notifications */}
                    {notification.status !== 'sent' && (
                      <Link href={`/admin/notifications/${notification.id}/edit`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs border-[#222222] bg-[#121212] hover:bg-[#1A1A1A] text-[#EDEDED]"
                          title="Edit notification"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    )}

                    {/* Send Now button: Allowed for draft or scheduled notifications */}
                    {notification.status !== 'sent' && (
                      <Button
                        size="sm"
                        onClick={() => setConfirmSendId(notification)}
                        className="h-7 px-2.5 text-xs bg-[#FF6B00] hover:bg-[#E05D00] text-black font-semibold"
                        title="Dispatch now"
                      >
                        <Send className="h-3.5 w-3.5 mr-1" />
                        Send Now
                      </Button>
                    )}

                    {/* Cancel Schedule button */}
                    {notification.status === 'scheduled' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmCancelId(notification)}
                        className="h-7 px-2 text-xs border-amber-900/60 bg-amber-950/20 hover:bg-amber-900/40 text-amber-400"
                        title="Cancel scheduled dispatch"
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    {/* Delete button: Allowed for draft or cancelled notifications */}
                    {(notification.status === 'draft' ||
                      notification.status === 'cancelled') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmDeleteId(notification)}
                        className="h-7 px-2 text-xs border-rose-900/60 bg-rose-950/20 hover:bg-rose-900/40 text-rose-400"
                        title="Delete notification"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: CONFIRM SEND NOTIFICATION NOW */}
      {confirmSendId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="border border-[#222222] bg-[#121212] max-w-md w-full rounded-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00] shrink-0 mt-0.5">
                <Send className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[#EDEDED]">
                  Dispatch Notification Immediately?
                </h3>
                <p className="text-xs text-[#9AA1AA] leading-relaxed">
                  You are about to broadcast{' '}
                  <span className="text-[#EDEDED] font-medium font-mono">
                    "{confirmSendId.title}"
                  </span>{' '}
                  to its targeted audience.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#0A0A0A] border border-[#222222] rounded text-xs space-y-1.5 text-[#9AA1AA]">
              <div className="flex justify-between">
                <span>Notification Type:</span>
                <span className="text-[#EDEDED] font-mono">{confirmSendId.type}</span>
              </div>
              <div className="flex justify-between">
                <span>Target Roles:</span>
                <span className="text-[#EDEDED] font-mono">
                  {confirmSendId.target_roles?.join(', ') || 'All Roles'}
                </span>
              </div>
              {confirmSendId.target_department && (
                <div className="flex justify-between">
                  <span>Department:</span>
                  <span className="text-[#EDEDED]">
                    {confirmSendId.target_department}
                  </span>
                </div>
              )}
              <div className="text-[11px] text-amber-400 pt-1 border-t border-[#1C1C1C]">
                ⚠️ Note: Once sent, historical records are locked and cannot be edited.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmSendId(null)}
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
                  <>
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Confirm & Send Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM CANCEL SCHEDULED */}
      {confirmCancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="border border-[#222222] bg-[#121212] max-w-md w-full rounded-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-amber-950/30 border border-amber-900/60 text-amber-400 shrink-0 mt-0.5">
                <Ban className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[#EDEDED]">
                  Cancel Scheduled Broadcast?
                </h3>
                <p className="text-xs text-[#9AA1AA] leading-relaxed">
                  This will cancel the scheduled trigger for{' '}
                  <span className="text-[#EDEDED] font-medium font-mono">
                    "{confirmCancelId.title}"
                  </span>
                  . It will not be sent to recipients.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmCancelId(null)}
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

      {/* MODAL: CONFIRM DELETE NOTIFICATION */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="border border-[#222222] bg-[#121212] max-w-md w-full rounded-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-rose-950/30 border border-rose-900/60 text-rose-400 shrink-0 mt-0.5">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[#EDEDED]">
                  Permanently Delete Notification?
                </h3>
                <p className="text-xs text-[#9AA1AA] leading-relaxed">
                  Are you sure you want to delete{' '}
                  <span className="text-[#EDEDED] font-medium font-mono">
                    "{confirmDeleteId.title}"
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDeleteId(null)}
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
