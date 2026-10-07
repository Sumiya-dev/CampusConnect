'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AdminNotification,
  CreateNotificationInput,
  NotificationType,
  TargetStructureOptions,
  UpdateNotificationInput,
} from '@/lib/types/notification.types';
import {
  createNotificationAction,
  updateScheduledNotificationAction,
} from '@/lib/notifications/admin-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Users,
  Building2,
  GraduationCap,
  Briefcase,
  Megaphone,
  Radio,
  Layers,
  Loader2,
  Lock,
} from 'lucide-react';

interface NotificationFormProps {
  initialData?: AdminNotification | null;
  structureOptions: TargetStructureOptions;
  isEditing?: boolean;
}

const NOTIFICATION_TYPES: {
  value: NotificationType;
  label: string;
  icon: any;
  desc: string;
}[] = [
  {
    value: 'Placement',
    label: 'Placement',
    icon: Briefcase,
    desc: 'Campus recruitment notices, offers, and placement policies',
  },
  {
    value: 'Drive',
    label: 'Drive',
    icon: Radio,
    desc: 'Company recruitment drive registrations and schedule updates',
  },
  {
    value: 'Deadline',
    label: 'Deadline',
    icon: Clock,
    desc: 'Application cutoffs, resume submission, and test deadlines',
  },
  {
    value: 'Interview',
    label: 'Interview',
    icon: Calendar,
    desc: 'Shortlist announcements, interview slots, and venue details',
  },
  {
    value: 'Announcement',
    label: 'Announcement',
    icon: Megaphone,
    desc: 'Institutional bulletins, holidays, and campus circulars',
  },
  {
    value: 'System',
    label: 'System',
    icon: Layers,
    desc: 'Portal maintenance, security alerts, and system notices',
  },
  {
    value: 'General',
    label: 'General',
    icon: Bell,
    desc: 'General communications and informational advisories',
  },
];

const ROLES_LIST = [
  { id: 'student', label: 'Students' },
  { id: 'faculty', label: 'Faculty' },
  { id: 'placement_officer', label: 'Placement Officers' },
  { id: 'administrator', label: 'Superadmins' },
];

export function NotificationForm({
  initialData,
  structureOptions,
  isEditing = false,
}: NotificationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isSentLocked = isEditing && initialData?.status === 'sent';

  // Form states
  const [title, setTitle] = useState(initialData?.title || '');
  const [message, setMessage] = useState(initialData?.message || '');
  const [type, setType] = useState<NotificationType>(
    initialData?.type || 'General'
  );

  // Target roles
  const [targetAllRoles, setTargetAllRoles] = useState(
    !initialData?.target_roles ||
      initialData.target_roles.length === 0 ||
      initialData.target_roles.includes('all')
  );
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    initialData?.target_roles?.filter((r) => r !== 'all') || []
  );

  // Cascading Academic Targets
  const [targetDepartment, setTargetDepartment] = useState<string>(
    initialData?.target_department || 'all'
  );
  const [targetYear, setTargetYear] = useState<string>(
    initialData?.target_year ? String(initialData.target_year) : 'all'
  );
  const [targetSectionId, setTargetSectionId] = useState<string>(
    initialData?.target_section_id || 'all'
  );

  // Dispatch mode
  const [dispatchMode, setDispatchMode] = useState<'immediate' | 'schedule' | 'draft'>(
    isEditing
      ? initialData?.scheduled_at
        ? 'schedule'
        : 'draft'
      : 'immediate'
  );

  const [scheduledAt, setScheduledAt] = useState<string>(
    initialData?.scheduled_at
      ? new Date(initialData.scheduled_at).toISOString().slice(0, 16)
      : ''
  );

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Filter sections based on selected department and year
  const availableSections = useMemo(() => {
    return structureOptions.sections.filter((sec) => {
      if (
        targetDepartment !== 'all' &&
        sec.program?.department_id &&
        sec.program.department_id !==
          structureOptions.departments.find((d) => d.name === targetDepartment)?.id
      ) {
        return false;
      }

      if (targetYear !== 'all' && sec.year !== parseInt(targetYear, 10)) {
        return false;
      }

      return true;
    });
  }, [
    structureOptions.sections,
    structureOptions.departments,
    targetDepartment,
    targetYear,
  ]);

  const toggleRole = (roleId: string) => {
    if (targetAllRoles) {
      setTargetAllRoles(false);
      setSelectedRoles([roleId]);
      return;
    }

    if (selectedRoles.includes(roleId)) {
      const next = selectedRoles.filter((r) => r !== roleId);
      if (next.length === 0) {
        setTargetAllRoles(true);
      } else {
        setSelectedRoles(next);
      }
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  const handleSelectAllRoles = () => {
    setTargetAllRoles(true);
    setSelectedRoles([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!title.trim()) {
      setFormError('Please enter a notification title.');
      return;
    }
    if (!message.trim()) {
      setFormError('Please enter the notification message body.');
      return;
    }

    if (dispatchMode === 'schedule' && !scheduledAt) {
      setFormError('Please select a date and time for scheduled dispatch.');
      return;
    }

    const targetRolesArray = targetAllRoles ? ['all'] : selectedRoles;

    startTransition(async () => {
      if (isEditing && initialData) {
        const updatePayload: UpdateNotificationInput = {
          title: title.trim(),
          message: message.trim(),
          type,
          target_roles: targetRolesArray,
          target_department: targetDepartment === 'all' ? null : targetDepartment,
          target_year: targetYear === 'all' ? null : parseInt(targetYear, 10),
          target_section_id: targetSectionId === 'all' ? null : targetSectionId,
          scheduled_at: dispatchMode === 'schedule' ? scheduledAt : null,
        };

        const res = await updateScheduledNotificationAction(
          initialData.id,
          updatePayload
        );
        if (!res.success) {
          setFormError(res.error || 'Failed to update notification.');
        } else {
          setFormSuccess('Notification updated successfully.');
          router.push(`/admin/notifications/${initialData.id}`);
          router.refresh();
        }
      } else {
        const createPayload: CreateNotificationInput = {
          title: title.trim(),
          message: message.trim(),
          type,
          target_roles: targetRolesArray,
          target_department: targetDepartment === 'all' ? null : targetDepartment,
          target_year: targetYear === 'all' ? null : parseInt(targetYear, 10),
          target_section_id: targetSectionId === 'all' ? null : targetSectionId,
          scheduled_at: dispatchMode === 'schedule' ? scheduledAt : null,
          send_now: dispatchMode === 'immediate',
        };

        const res = await createNotificationAction(createPayload);
        if (!res.success) {
          setFormError(res.error || 'Failed to create notification.');
        } else {
          setFormSuccess(res.message || 'Notification created successfully.');
          if (res.notificationId) {
            router.push(`/admin/notifications/${res.notificationId}`);
          } else {
            router.push('/admin/notifications');
          }
          router.refresh();
        }
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
        <div className="space-y-1">
          <Link
            href="/admin/notifications"
            className="inline-flex items-center gap-1 text-xs text-[#9AA1AA] hover:text-[#EDEDED] transition-colors mb-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Notifications
          </Link>
          <h1 className="text-xl font-semibold text-[#EDEDED] tracking-tight">
            {isEditing ? 'Edit Notification' : 'Compose Administrative Broadcast'}
          </h1>
          <p className="text-xs text-[#9AA1AA]">
            {isEditing
              ? 'Update the title, content, or scheduled time of this draft notification.'
              : 'Broadcast official directives, placement alerts, deadlines, and circulars.'}
          </p>
        </div>
      </div>

      {/* Lock banner if sent */}
      {isSentLocked && (
        <div className="flex items-start gap-3 p-4 bg-amber-950/20 border border-amber-900/60 rounded-md text-amber-400 text-xs">
          <Lock className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-amber-300">
              Historical Record Lock
            </div>
            <p className="text-neutral-300 leading-relaxed">
              This notification was already dispatched on{' '}
              <span className="font-mono text-amber-400">
                {initialData?.sent_at
                  ? new Date(initialData.sent_at).toLocaleString()
                  : 'N/A'}
              </span>
              . To maintain audit compliance and historical accuracy, sent
              notifications cannot be altered.
            </p>
            <div className="pt-2">
              <Link href={`/admin/notifications/${initialData?.id}`}>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-[#222222] bg-[#121212] text-[#EDEDED]"
                >
                  View Details & Delivery Logs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {formError && (
        <div className="flex items-center gap-2 p-3 bg-rose-950/30 border border-rose-900/60 rounded-md text-rose-400 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Success message */}
      {formSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-950/30 border border-emerald-900/60 rounded-md text-emerald-400 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. NOTIFICATION TYPE SELECTOR */}
        <div className="border border-[#222222] bg-[#121212] p-4 sm:p-5 rounded-md space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#EDEDED] uppercase tracking-wider font-mono">
              1. Notification Type
            </label>
            <span className="text-[11px] text-[#9AA1AA]">
              Categorizes alerts across user interfaces
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {NOTIFICATION_TYPES.map((t) => {
              const Icon = t.icon;
              const isSelected = type === t.value;
              return (
                <button
                  type="button"
                  key={t.value}
                  disabled={isSentLocked}
                  onClick={() => setType(t.value)}
                  className={`flex flex-col items-start p-3 rounded-md border text-left transition-all ${
                    isSelected
                      ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-[#EDEDED]'
                      : 'border-[#222222] bg-[#0A0A0A] hover:bg-[#161616] text-[#9AA1AA]'
                  } ${isSentLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon
                      className={`h-3.5 w-3.5 ${
                        isSelected ? 'text-[#FF6B00]' : 'text-[#9AA1AA]'
                      }`}
                    />
                    <span
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-[#EDEDED]' : 'text-neutral-300'
                      }`}
                    >
                      {t.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#9AA1AA] line-clamp-2">
                    {t.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. MESSAGE CONTENT */}
        <div className="border border-[#222222] bg-[#121212] p-4 sm:p-5 rounded-md space-y-4">
          <label className="text-xs font-semibold text-[#EDEDED] uppercase tracking-wider font-mono block">
            2. Notification Content
          </label>

          <div className="space-y-1.5">
            <label className="text-xs text-[#EDEDED] font-medium flex justify-between">
              <span>Title</span>
              <span className="text-[10px] text-[#9AA1AA]">
                Clear and descriptive subject
              </span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Mandatory Pre-Placement Talk: Amazon AWS Campus Drive"
              value={title}
              disabled={isSentLocked}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#0A0A0A] border-[#222222] text-[#EDEDED] text-xs h-9 focus-visible:ring-1 focus-visible:ring-[#FF6B00]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#EDEDED] font-medium flex justify-between">
              <span>Message Body</span>
              <span className="text-[10px] text-[#9AA1AA]">
                Full circular text, guidelines, or instructions
              </span>
            </label>
            <textarea
              rows={5}
              placeholder="Enter full notification message, reporting instructions, eligibility notes, or required documents..."
              value={message}
              disabled={isSentLocked}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-md bg-[#0A0A0A] border border-[#222222] p-3 text-xs text-[#EDEDED] placeholder-[#555] focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none transition-colors"
              required
            />
          </div>
        </div>

        {/* 3. AUDIENCE TARGETING */}
        <div className="border border-[#222222] bg-[#121212] p-4 sm:p-5 rounded-md space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#EDEDED] uppercase tracking-wider font-mono">
              3. Target Audience & Cohort Isolation
            </label>
            <span className="text-[11px] text-[#9AA1AA]">
              Strict RLS boundary: Non-recipients cannot view this broadcast
            </span>
          </div>

          {/* Role selector chips */}
          <div className="space-y-2">
            <label className="text-xs text-[#EDEDED] font-medium block">
              Target Role(s)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isSentLocked}
                onClick={handleSelectAllRoles}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-colors border ${
                  targetAllRoles
                    ? 'bg-[#FF6B00] text-black border-[#FF6B00] font-semibold'
                    : 'bg-[#0A0A0A] text-[#9AA1AA] border-[#222222] hover:bg-[#161616]'
                } ${isSentLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                All Users (Campus Broadcast)
              </button>

              {ROLES_LIST.map((r) => {
                const isSelected = !targetAllRoles && selectedRoles.includes(r.id);
                return (
                  <button
                    type="button"
                    key={r.id}
                    disabled={isSentLocked}
                    onClick={() => toggleRole(r.id)}
                    className={`px-3 py-1.5 rounded text-xs font-mono transition-colors border ${
                      isSelected
                        ? 'bg-[#FF6B00] text-black border-[#FF6B00] font-semibold'
                        : 'bg-[#0A0A0A] text-[#9AA1AA] border-[#222222] hover:bg-[#161616]'
                    } ${isSentLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cascading Department, Year, Section Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#1C1C1C]">
            {/* Department */}
            <div className="space-y-1.5">
              <label className="text-xs text-[#EDEDED] font-medium flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-[#FF6B00]" />
                Department
              </label>
              <select
                value={targetDepartment}
                disabled={isSentLocked}
                onChange={(e) => {
                  setTargetDepartment(e.target.value);
                  setTargetSectionId('all');
                }}
                className="w-full h-9 px-3 rounded-md bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] focus:border-[#FF6B00] outline-none"
              >
                <option value="all">All Departments</option>
                {structureOptions.departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Year */}
            <div className="space-y-1.5">
              <label className="text-xs text-[#EDEDED] font-medium flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-[#FF6B00]" />
                Academic Year
              </label>
              <select
                value={targetYear}
                disabled={isSentLocked}
                onChange={(e) => {
                  setTargetYear(e.target.value);
                  setTargetSectionId('all');
                }}
                className="w-full h-9 px-3 rounded-md bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] focus:border-[#FF6B00] outline-none"
              >
                <option value="all">All Academic Years</option>
                {structureOptions.academicYears.map((y) => (
                  <option key={y.id} value={y.year_number}>
                    {y.display_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Specific Academic Section */}
            <div className="space-y-1.5">
              <label className="text-xs text-[#EDEDED] font-medium flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-[#FF6B00]" />
                Specific Section
              </label>
              <select
                value={targetSectionId}
                disabled={isSentLocked}
                onChange={(e) => setTargetSectionId(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] focus:border-[#FF6B00] outline-none"
              >
                <option value="all">All Sections</option>
                {availableSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.program?.code ? `${sec.program.code} - ` : ''}
                    Year {sec.year} - {sec.section_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 4. DISPATCH MODE & SCHEDULING (Disabled when editing already-sent) */}
        {!isSentLocked && (
          <div className="border border-[#222222] bg-[#121212] p-4 sm:p-5 rounded-md space-y-4">
            <label className="text-xs font-semibold text-[#EDEDED] uppercase tracking-wider font-mono block">
              4. Dispatch Mode & Scheduling
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Send Immediately */}
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setDispatchMode('immediate')}
                  className={`flex items-start gap-3 p-3.5 rounded-md border text-left transition-all ${
                    dispatchMode === 'immediate'
                      ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-[#EDEDED]'
                      : 'border-[#222222] bg-[#0A0A0A] hover:bg-[#161616] text-[#9AA1AA]'
                  }`}
                >
                  <Send
                    className={`h-4 w-4 mt-0.5 shrink-0 ${
                      dispatchMode === 'immediate'
                        ? 'text-[#FF6B00]'
                        : 'text-[#9AA1AA]'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-semibold text-[#EDEDED]">
                      Send Immediately
                    </div>
                    <p className="text-[10px] text-[#9AA1AA] mt-0.5">
                      Broadcast and deliver into user inboxes right now.
                    </p>
                  </div>
                </button>
              )}

              {/* Schedule */}
              <button
                type="button"
                onClick={() => setDispatchMode('schedule')}
                className={`flex items-start gap-3 p-3.5 rounded-md border text-left transition-all ${
                  dispatchMode === 'schedule'
                    ? 'border-amber-500 bg-amber-950/20 text-[#EDEDED]'
                    : 'border-[#222222] bg-[#0A0A0A] hover:bg-[#161616] text-[#9AA1AA]'
                }`}
              >
                <Clock
                  className={`h-4 w-4 mt-0.5 shrink-0 ${
                    dispatchMode === 'schedule'
                      ? 'text-amber-400'
                      : 'text-[#9AA1AA]'
                  }`}
                />
                <div>
                  <div className="text-xs font-semibold text-[#EDEDED]">
                    Schedule for Later
                  </div>
                  <p className="text-[10px] text-[#9AA1AA] mt-0.5">
                    Set a future timestamp for automated delivery.
                  </p>
                </div>
              </button>

              {/* Save as Draft */}
              <button
                type="button"
                onClick={() => setDispatchMode('draft')}
                className={`flex items-start gap-3 p-3.5 rounded-md border text-left transition-all ${
                  dispatchMode === 'draft'
                    ? 'border-neutral-500 bg-neutral-900 text-[#EDEDED]'
                    : 'border-[#222222] bg-[#0A0A0A] hover:bg-[#161616] text-[#9AA1AA]'
                }`}
              >
                <FileText
                  className={`h-4 w-4 mt-0.5 shrink-0 ${
                    dispatchMode === 'draft'
                      ? 'text-neutral-300'
                      : 'text-[#9AA1AA]'
                  }`}
                />
                <div>
                  <div className="text-xs font-semibold text-[#EDEDED]">
                    Save as Draft
                  </div>
                  <p className="text-[10px] text-[#9AA1AA] mt-0.5">
                    Keep in drafts without scheduling or sending.
                  </p>
                </div>
              </button>
            </div>

            {/* Datetime input if scheduled */}
            {dispatchMode === 'schedule' && (
              <div className="p-3 bg-[#0A0A0A] border border-amber-900/50 rounded-md space-y-2">
                <label className="text-xs text-amber-400 font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Select Schedule Date & Time
                </label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="bg-[#121212] border-[#222222] text-[#EDEDED] text-xs h-9 focus-visible:ring-1 focus-visible:ring-amber-500 max-w-sm"
                  required={dispatchMode === 'schedule'}
                />
                <p className="text-[11px] text-[#9AA1AA]">
                  The system will register this notification under Scheduled status
                  until the target timestamp.
                </p>
              </div>
            )}
          </div>
        )}

        {/* SUBMIT BUTTONS */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <Link href="/admin/notifications">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              className="border-[#222222] bg-[#121212] hover:bg-[#1A1A1A] text-[#EDEDED] text-xs h-9 px-4"
            >
              Cancel
            </Button>
          </Link>

          {!isSentLocked && (
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[#FF6B00] hover:bg-[#E05D00] text-black font-semibold text-xs h-9 px-5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : dispatchMode === 'immediate' ? (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Publish & Send Now
                </>
              ) : dispatchMode === 'schedule' ? (
                <>
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  Schedule Notification
                </>
              ) : (
                <>
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  Save Draft
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
