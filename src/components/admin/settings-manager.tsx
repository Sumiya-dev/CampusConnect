'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  GeneralSettings,
  NotificationSettings,
  PlacementSettings,
  SettingCategory,
  SystemControlSettings,
  SystemSettingsBundle,
} from '@/lib/types/settings.types';
import {
  updateGeneralSettingsAction,
  updatePlacementSettingsAction,
  updateNotificationSettingsAction,
  updateSystemControlsAction,
  restoreDefaultSettingsAction,
} from '@/lib/settings/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Shield,
  Briefcase,
  Bell,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Globe,
  Mail,
  Phone,
  Building,
  Calendar,
  Lock,
  Layers,
  FileText,
  UserCheck,
  Check,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';

interface SettingsManagerProps {
  initialBundle: SystemSettingsBundle;
  academicYears: Array<{
    id: string;
    year_number: number;
    display_name: string;
    current_academic_calendar: string;
    status: string;
  }>;
}

export function SettingsManager({
  initialBundle,
  academicYears,
}: SettingsManagerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingCategory>('general');
  const [isPending, startTransition] = useTransition();

  // Local state for each section
  const [general, setGeneral] = useState<GeneralSettings>(initialBundle.general);
  const [placement, setPlacement] = useState<PlacementSettings>(initialBundle.placement);
  const [notifications, setNotifications] = useState<NotificationSettings>(initialBundle.notifications);
  const [systemControls, setSystemControls] = useState<SystemControlSettings>(initialBundle.system_controls);

  // Status message
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Confirmation Modals
  const [confirmResetCategory, setConfirmResetCategory] = useState<SettingCategory | 'all' | null>(null);
  const [confirmMaintenanceToggle, setConfirmMaintenanceToggle] = useState<boolean | null>(null);

  // Helper to show feedback
  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: null, message: '' });
    }, 5000);
  };

  // Save General Settings
  const handleSaveGeneral = () => {
    startTransition(async () => {
      const res = await updateGeneralSettingsAction(general);
      if (res.success) {
        showFeedback('success', res.message || 'General settings saved.');
        router.refresh();
      } else {
        showFeedback('error', res.error || 'Failed to update general settings.');
      }
    });
  };

  // Save Placement Settings
  const handleSavePlacement = () => {
    startTransition(async () => {
      const res = await updatePlacementSettingsAction(placement);
      if (res.success) {
        showFeedback('success', res.message || 'Placement configuration saved.');
        router.refresh();
      } else {
        showFeedback('error', res.error || 'Failed to update placement configuration.');
      }
    });
  };

  // Save Notification Settings
  const handleSaveNotifications = () => {
    startTransition(async () => {
      const res = await updateNotificationSettingsAction(notifications);
      if (res.success) {
        showFeedback('success', res.message || 'Notification preferences saved.');
        router.refresh();
      } else {
        showFeedback('error', res.error || 'Failed to update notification preferences.');
      }
    });
  };

  // Save System Controls
  const handleSaveSystemControls = () => {
    startTransition(async () => {
      const res = await updateSystemControlsAction(systemControls);
      if (res.success) {
        showFeedback('success', res.message || 'System controls updated.');
        router.refresh();
      } else {
        showFeedback('error', res.error || 'Failed to update system controls.');
      }
    });
  };

  // Restore Defaults
  const handleRestoreDefaults = (category: SettingCategory | 'all') => {
    startTransition(async () => {
      const res = await restoreDefaultSettingsAction(category);
      if (res.success) {
        showFeedback('success', res.message || 'Default settings restored.');
        setConfirmResetCategory(null);
        router.refresh();
      } else {
        showFeedback('error', res.error || 'Failed to restore default settings.');
      }
    });
  };

  // Unique academic calendars for selection
  const uniqueCalendars = Array.from(
    new Set(academicYears.map((ay) => ay.current_academic_calendar).filter(Boolean))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Feedback */}
      {feedback.type && (
        <div
          className={`p-4 rounded-md border flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: null, message: '' })}
            className="text-xs hover:underline opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#222222] pb-3">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'general'
              ? 'bg-[#181818] text-[#EDEDED] border border-[#333333]'
              : 'text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#121212]'
          }`}
        >
          <Globe className="h-4 w-4 text-[#FF6B00]" />
          <span>General</span>
        </button>

        <button
          onClick={() => setActiveTab('placement')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'placement'
              ? 'bg-[#181818] text-[#EDEDED] border border-[#333333]'
              : 'text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#121212]'
          }`}
        >
          <Briefcase className="h-4 w-4 text-[#FF6B00]" />
          <span>Placement Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'notifications'
              ? 'bg-[#181818] text-[#EDEDED] border border-[#333333]'
              : 'text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#121212]'
          }`}
        >
          <Bell className="h-4 w-4 text-[#FF6B00]" />
          <span>Notifications</span>
        </button>

        <button
          onClick={() => setActiveTab('system_controls')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'system_controls'
              ? 'bg-[#181818] text-[#EDEDED] border border-[#333333]'
              : 'text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#121212]'
          }`}
        >
          <Sliders className="h-4 w-4 text-[#FF6B00]" />
          <span>System Controls</span>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfirmResetCategory(activeTab)}
            disabled={isPending}
            className="border-[#222222] bg-[#121212] hover:bg-[#1A1A1A] text-xs text-[#9AA1AA] hover:text-[#EDEDED]"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1 text-[#9AA1AA]" />
            Restore Section Defaults
          </Button>
        </div>
      </div>

      {/* TAB 1: GENERAL SETTINGS */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="p-5 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-5">
            <div className="border-b border-[#222222] pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#EDEDED]">Institution & University Profile</h2>
                <p className="text-xs text-[#9AA1AA]">Official branding and operational contact information across portal surfaces.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#9AA1AA]">Status:</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                    general.platform_status === 'operational'
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                      : general.platform_status === 'maintenance'
                      ? 'bg-amber-950/40 text-amber-400 border-amber-800/60'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}
                >
                  {general.platform_status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-[#9AA1AA]">University / Institution Name</label>
                <Input
                  value={general.university_name}
                  onChange={(e) => setGeneral({ ...general, university_name: e.target.value })}
                  placeholder="e.g. CampusConnect Institute of Technology"
                  className="bg-[#121212] border-[#222222] text-[#EDEDED]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-[#9AA1AA]">Institution Code</label>
                <Input
                  value={general.university_code}
                  onChange={(e) => setGeneral({ ...general, university_code: e.target.value })}
                  placeholder="e.g. CCIT-001"
                  className="bg-[#121212] border-[#222222] text-[#EDEDED]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-[#9AA1AA]">Support Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#9AA1AA]" />
                  <Input
                    type="email"
                    value={general.support_email}
                    onChange={(e) => setGeneral({ ...general, support_email: e.target.value })}
                    placeholder="support@campusconnect.edu"
                    className="pl-9 bg-[#121212] border-[#222222] text-[#EDEDED]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-[#9AA1AA]">Support Helpline / Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-[#9AA1AA]" />
                  <Input
                    value={general.support_phone}
                    onChange={(e) => setGeneral({ ...general, support_phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="pl-9 bg-[#121212] border-[#222222] text-[#EDEDED]"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold uppercase text-[#9AA1AA]">Career & Placement Cell Office</label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-[#9AA1AA]" />
                  <Input
                    value={general.placement_cell_office}
                    onChange={(e) => setGeneral({ ...general, placement_cell_office: e.target.value })}
                    placeholder="Admin Block, Floor 2, Placement Cell"
                    className="pl-9 bg-[#121212] border-[#222222] text-[#EDEDED]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-[#9AA1AA]">Default Academic Calendar Session</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-[#9AA1AA]" />
                  <select
                    value={general.default_academic_calendar}
                    onChange={(e) => setGeneral({ ...general, default_academic_calendar: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-md bg-[#121212] border border-[#222222] text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
                  >
                    {uniqueCalendars.map((cal) => (
                      <option key={cal} value={cal}>
                        {cal} (Active Academic Session)
                      </option>
                    ))}
                    {!uniqueCalendars.includes(general.default_academic_calendar) && (
                      <option value={general.default_academic_calendar}>
                        {general.default_academic_calendar}
                      </option>
                    )}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-[#9AA1AA]">Platform Operational Mode</label>
                <select
                  value={general.platform_status}
                  onChange={(e) =>
                    setGeneral({
                      ...general,
                      platform_status: e.target.value as 'operational' | 'maintenance' | 'read_only',
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-md bg-[#121212] border border-[#222222] text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
                >
                  <option value="operational">Operational (All features fully active)</option>
                  <option value="maintenance">Maintenance (Admins only, maintenance banner for students)</option>
                  <option value="read_only">Read-Only (Submissions locked, browsing active)</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold uppercase text-[#9AA1AA]">Public Notice / Maintenance Message</label>
                <textarea
                  value={general.maintenance_message}
                  onChange={(e) => setGeneral({ ...general, maintenance_message: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-md bg-[#121212] border border-[#222222] text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
                  placeholder="CampusConnect is undergoing scheduled maintenance..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#222222]">
              <span className="text-xs text-[#9AA1AA]">
                {initialBundle.metadata?.general?.updated_at && (
                  <>Last updated: {new Date(initialBundle.metadata.general.updated_at).toLocaleString()}</>
                )}
              </span>
              <Button
                type="button"
                onClick={handleSaveGeneral}
                disabled={isPending}
                className="bg-[#FF6B00] hover:bg-[#E56000] text-black font-semibold text-xs px-4"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save General Settings
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PLACEMENT SETTINGS */}
      {activeTab === 'placement' && (
        <div className="space-y-6">
          <div className="p-5 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-5">
            <div className="border-b border-[#222222] pb-3">
              <h2 className="text-base font-semibold text-[#EDEDED]">Placement & Recruitment Rules</h2>
              <p className="text-xs text-[#9AA1AA]">Enforce eligibility baselines, application limits, and drive automation rules.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Rule Toggles */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF6B00]">Application Governance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded bg-[#121212] border border-[#222222] flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-[#EDEDED]">Allow Multiple Offers</div>
                      <div className="text-xs text-[#9AA1AA]">Students can receive more than one company offer</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPlacement({ ...placement, allow_multiple_offers: !placement.allow_multiple_offers })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        placement.allow_multiple_offers ? 'bg-[#FF6B00]' : 'bg-[#222222]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          placement.allow_multiple_offers ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-3.5 rounded bg-[#121212] border border-[#222222] flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-[#EDEDED]">Auto-lock On Deadline</div>
                      <div className="text-xs text-[#9AA1AA]">Automatically close student registrations at deadline</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPlacement({ ...placement, auto_lock_on_deadline: !placement.auto_lock_on_deadline })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        placement.auto_lock_on_deadline ? 'bg-[#FF6B00]' : 'bg-[#222222]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          placement.auto_lock_on_deadline ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-3.5 rounded bg-[#121212] border border-[#222222] flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-[#EDEDED]">Allow Application Withdrawal</div>
                      <div className="text-xs text-[#9AA1AA]">Students can withdraw applied status before review</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPlacement({ ...placement, allow_student_withdraw: !placement.allow_student_withdraw })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        placement.allow_student_withdraw ? 'bg-[#FF6B00]' : 'bg-[#222222]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          placement.allow_student_withdraw ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-3.5 rounded bg-[#121212] border border-[#222222] flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-[#EDEDED]">Mandatory Resume Attached</div>
                      <div className="text-xs text-[#9AA1AA]">Verify active uploaded resume before allowing submission</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPlacement({ ...placement, require_resume_attached: !placement.require_resume_attached })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        placement.require_resume_attached ? 'bg-[#FF6B00]' : 'bg-[#222222]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          placement.require_resume_attached ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Threshold Fields */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-[#9AA1AA]">Max Active Applications Per Student</label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={placement.max_active_applications}
                  onChange={(e) => setPlacement({ ...placement, max_active_applications: parseInt(e.target.value) || 1 })}
                  className="bg-[#121212] border-[#222222] text-[#EDEDED]"
                />
                <span className="text-[11px] text-[#9AA1AA]">Caps simultaneous active drive applications to prevent clutter.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-[#9AA1AA]">Institutional Default Min CGPA</label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={10}
                  value={placement.default_min_cgpa}
                  onChange={(e) => setPlacement({ ...placement, default_min_cgpa: parseFloat(e.target.value) || 0 })}
                  className="bg-[#121212] border-[#222222] text-[#EDEDED]"
                />
                <span className="text-[11px] text-[#9AA1AA]">Baseline CGPA threshold suggested when creating new placement drives.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-[#9AA1AA]">Default Max Allowed Active Backlogs</label>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={placement.default_max_backlogs}
                  onChange={(e) => setPlacement({ ...placement, default_max_backlogs: parseInt(e.target.value) || 0 })}
                  className="bg-[#121212] border-[#222222] text-[#EDEDED]"
                />
                <span className="text-[11px] text-[#9AA1AA]">Default standing backlog tolerance across drive postings.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-[#9AA1AA]">Default Company Recruiter Tier</label>
                <Input
                  value={placement.default_tier}
                  onChange={(e) => setPlacement({ ...placement, default_tier: e.target.value })}
                  placeholder="e.g. Core Recruiter"
                  className="bg-[#121212] border-[#222222] text-[#EDEDED]"
                />
                <span className="text-[11px] text-[#9AA1AA]">Suggested tier classification for newly imported recruiters.</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#222222]">
              <span className="text-xs text-[#9AA1AA]">
                {initialBundle.metadata?.placement?.updated_at && (
                  <>Last updated: {new Date(initialBundle.metadata.placement.updated_at).toLocaleString()}</>
                )}
              </span>
              <Button
                type="button"
                onClick={handleSavePlacement}
                disabled={isPending}
                className="bg-[#FF6B00] hover:bg-[#E56000] text-black font-semibold text-xs px-4"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save Placement Rules
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: NOTIFICATIONS SETTINGS */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="p-5 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-5">
            <div className="border-b border-[#222222] pb-3">
              <h2 className="text-base font-semibold text-[#EDEDED]">Platform Notification Preferences</h2>
              <p className="text-xs text-[#9AA1AA]">Configure enabled communication types and delivery channels across roles.</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF6B00]">Notification Channel Types</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded bg-[#121212] border border-[#222222] flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#EDEDED]">Placement Drive Announcements</div>
                    <div className="text-xs text-[#9AA1AA]">Broadcast newly published recruitment drives</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifications({ ...notifications, enable_placement_alerts: !notifications.enable_placement_alerts })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      notifications.enable_placement_alerts ? 'bg-[#FF6B00]' : 'bg-[#222222]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifications.enable_placement_alerts ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3.5 rounded bg-[#121212] border border-[#222222] flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#EDEDED]">Drive Schedule Updates</div>
                    <div className="text-xs text-[#9AA1AA]">Changes to drive date, timings, or venue</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifications({ ...notifications, enable_drive_updates: !notifications.enable_drive_updates })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      notifications.enable_drive_updates ? 'bg-[#FF6B00]' : 'bg-[#222222]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifications.enable_drive_updates ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3.5 rounded bg-[#121212] border border-[#222222] flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#EDEDED]">Interview Shortlists & Calls</div>
                    <div className="text-xs text-[#9AA1AA]">Student shortlist notices and interview slots</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifications({ ...notifications, enable_interview_calls: !notifications.enable_interview_calls })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      notifications.enable_interview_calls ? 'bg-[#FF6B00]' : 'bg-[#222222]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifications.enable_interview_calls ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3.5 rounded bg-[#121212] border border-[#222222] flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#EDEDED]">Deadline & Expiry Reminders</div>
                    <div className="text-xs text-[#9AA1AA]">24-hour and 6-hour registration closing reminders</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifications({ ...notifications, enable_deadline_reminders: !notifications.enable_deadline_reminders })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      notifications.enable_deadline_reminders ? 'bg-[#FF6B00]' : 'bg-[#222222]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifications.enable_deadline_reminders ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3.5 rounded bg-[#121212] border border-[#222222] flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#EDEDED]">General Campus Broadcasts</div>
                    <div className="text-xs text-[#9AA1AA]">Institutional and departmental general messages</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifications({ ...notifications, enable_general_announcements: !notifications.enable_general_announcements })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      notifications.enable_general_announcements ? 'bg-[#FF6B00]' : 'bg-[#222222]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifications.enable_general_announcements ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3.5 rounded bg-[#121212] border border-[#222222] flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#EDEDED]">System Security & Maintenance</div>
                    <div className="text-xs text-[#9AA1AA]">Critical security and platform status updates</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifications({ ...notifications, enable_system_alerts: !notifications.enable_system_alerts })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      notifications.enable_system_alerts ? 'bg-[#FF6B00]' : 'bg-[#222222]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifications.enable_system_alerts ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Delivery Channels */}
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF6B00] pt-3">Delivery Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded bg-[#121212] border border-[#222222] flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#EDEDED]">In-App Notification Center</div>
                    <div className="text-xs text-[#9AA1AA]">Deliver to notification inbox on student/faculty dashboards</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifications({ ...notifications, default_delivery_in_app: !notifications.default_delivery_in_app })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      notifications.default_delivery_in_app ? 'bg-[#FF6B00]' : 'bg-[#222222]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifications.default_delivery_in_app ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3.5 rounded bg-[#121212] border border-[#222222] flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#EDEDED]">Outbound Email Dispatch</div>
                    <div className="text-xs text-[#9AA1AA]">Send email copies to registered user email addresses</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifications({ ...notifications, default_email_dispatch: !notifications.default_email_dispatch })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      notifications.default_email_dispatch ? 'bg-[#FF6B00]' : 'bg-[#222222]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifications.default_email_dispatch ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-[#9AA1AA]">Email Digest Cadence</label>
                  <select
                    value={notifications.digest_frequency}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        digest_frequency: e.target.value as 'immediate' | 'daily' | 'weekly',
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-md bg-[#121212] border border-[#222222] text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
                  >
                    <option value="immediate">Immediate Dispatch (As notifications are generated)</option>
                    <option value="daily">Daily Digest Batch (Consolidated 6 PM summary)</option>
                    <option value="weekly">Weekly Summary Digest</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#222222]">
              <span className="text-xs text-[#9AA1AA]">
                {initialBundle.metadata?.notifications?.updated_at && (
                  <>Last updated: {new Date(initialBundle.metadata.notifications.updated_at).toLocaleString()}</>
                )}
              </span>
              <Button
                type="button"
                onClick={handleSaveNotifications}
                disabled={isPending}
                className="bg-[#FF6B00] hover:bg-[#E56000] text-black font-semibold text-xs px-4"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save Notification Preferences
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM CONTROLS & FEATURE FLAGS */}
      {activeTab === 'system_controls' && (
        <div className="space-y-6">
          <div className="p-5 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-5">
            <div className="border-b border-[#222222] pb-3">
              <h2 className="text-base font-semibold text-[#EDEDED]">Platform Feature Controls & Safety Gates</h2>
              <p className="text-xs text-[#9AA1AA]">Toggle specific student/faculty modules or trigger site-wide maintenance safeguards.</p>
            </div>

            {/* Maintenance Mode Emergency Alert Card */}
            <div
              className={`p-4 rounded-md border transition-all ${
                systemControls.maintenance_mode
                  ? 'bg-amber-950/30 border-amber-800/80'
                  : 'bg-[#121212] border-[#222222]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${systemControls.maintenance_mode ? 'bg-amber-500/20 text-amber-400' : 'bg-[#1A1A1A] text-[#9AA1AA]'}`}>
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#EDEDED]">
                      Site-Wide Maintenance Mode
                    </div>
                    <div className="text-xs text-[#9AA1AA]">
                      Restricts regular student & faculty access while keeping full Superadmin administrative bypass active.
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant={systemControls.maintenance_mode ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => setConfirmMaintenanceToggle(!systemControls.maintenance_mode)}
                  className={`text-xs ${
                    systemControls.maintenance_mode
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'border-[#333333] hover:bg-[#1A1A1A] text-[#EDEDED]'
                  }`}
                >
                  {systemControls.maintenance_mode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
                </Button>
              </div>
            </div>

            {/* Feature Flags Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF6B00]">Modular Feature Flags</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded bg-[#121212] border border-[#222222] flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#EDEDED]">Community Hub Module</div>
                    <div className="text-xs text-[#9AA1AA]">Campus-wide discussion board, posts & replies</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSystemControls({ ...systemControls, enable_community_hub: !systemControls.enable_community_hub })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      systemControls.enable_community_hub ? 'bg-[#FF6B00]' : 'bg-[#222222]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        systemControls.enable_community_hub ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3.5 rounded bg-[#121212] border border-[#222222] flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#EDEDED]">Peer & Alumni Guidance</div>
                    <div className="text-xs text-[#9AA1AA]">Direct mentorship & guidance requests between students & alumni</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSystemControls({ ...systemControls, enable_peer_guidance: !systemControls.enable_peer_guidance })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      systemControls.enable_peer_guidance ? 'bg-[#FF6B00]' : 'bg-[#222222]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        systemControls.enable_peer_guidance ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3.5 rounded bg-[#121212] border border-[#222222] flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#EDEDED]">AI Resume Builder & Uploads</div>
                    <div className="text-xs text-[#9AA1AA]">Allow students to construct & store resume drafts</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSystemControls({ ...systemControls, enable_resume_builder: !systemControls.enable_resume_builder })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      systemControls.enable_resume_builder ? 'bg-[#FF6B00]' : 'bg-[#222222]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        systemControls.enable_resume_builder ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3.5 rounded bg-[#121212] border border-[#222222] flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#EDEDED]">Mock Assessments & Interview Prep</div>
                    <div className="text-xs text-[#9AA1AA]">Technical question repository and mock assessment tests</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSystemControls({ ...systemControls, enable_mock_tests: !systemControls.enable_mock_tests })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      systemControls.enable_mock_tests ? 'bg-[#FF6B00]' : 'bg-[#222222]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        systemControls.enable_mock_tests ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3.5 rounded bg-[#121212] border border-[#222222] flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#EDEDED]">Company Self-Registration</div>
                    <div className="text-xs text-[#9AA1AA]">Allow corporate recruiters to submit registration requests</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSystemControls({ ...systemControls, enable_company_registration: !systemControls.enable_company_registration })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      systemControls.enable_company_registration ? 'bg-[#FF6B00]' : 'bg-[#222222]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        systemControls.enable_company_registration ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3.5 rounded bg-[#121212] border border-[#222222] flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#EDEDED]">Student Profile Self-Edit</div>
                    <div className="text-xs text-[#9AA1AA]">Permit students to update profile particulars and skills</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSystemControls({ ...systemControls, allow_profile_edit: !systemControls.allow_profile_edit })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      systemControls.allow_profile_edit ? 'bg-[#FF6B00]' : 'bg-[#222222]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        systemControls.allow_profile_edit ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#222222]">
              <span className="text-xs text-[#9AA1AA]">
                {initialBundle.metadata?.system_controls?.updated_at && (
                  <>Last updated: {new Date(initialBundle.metadata.system_controls.updated_at).toLocaleString()}</>
                )}
              </span>
              <Button
                type="button"
                onClick={handleSaveSystemControls}
                disabled={isPending}
                className="bg-[#FF6B00] hover:bg-[#E56000] text-black font-semibold text-xs px-4"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save System Controls
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Security & Isolation Summary Card (Always Visible at bottom) */}
      <div className="p-5 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-3">
        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-[#EDEDED]">Enterprise Security & RBAC Enforcement</h3>
          </div>
          <Badge variant="success" className="text-xs">
            RLS Active & Isolated
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#9AA1AA]">
          <div className="p-3 rounded bg-[#121212] border border-[#222222] space-y-1">
            <span className="font-semibold text-[#EDEDED]">Zero Secret Storage</span>
            <p>Passwords, JWT signing keys, and service-role credentials are never stored or manageable via settings UI.</p>
          </div>
          <div className="p-3 rounded bg-[#121212] border border-[#222222] space-y-1">
            <span className="font-semibold text-[#EDEDED]">Server-Side Authorization</span>
            <p>Every mutation passes through strict <code className="text-[#FF6B00]">requireSuperAdmin()</code> and Supabase row policies.</p>
          </div>
          <div className="p-3 rounded bg-[#121212] border border-[#222222] space-y-1">
            <span className="font-semibold text-[#EDEDED]">Immutable Audit Trail</span>
            <p>All updates are recorded in <code className="text-[#FF6B00]">admin_audit_logs</code> with administrator identity and diffs.</p>
          </div>
        </div>
      </div>

      {/* MODAL: Maintenance Mode Toggle Confirmation */}
      {confirmMaintenanceToggle !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-lg border border-[#222222] bg-[#121212] p-6 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-amber-500/20 text-amber-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#EDEDED]">
                  {confirmMaintenanceToggle ? 'Enable Maintenance Mode?' : 'Disable Maintenance Mode?'}
                </h3>
                <p className="text-xs text-[#9AA1AA] leading-relaxed">
                  {confirmMaintenanceToggle
                    ? 'Enabling maintenance mode will notify students and faculty with a maintenance screen. Only Superadmins will be able to access the dashboard.'
                    : 'Disabling maintenance mode will immediately restore full normal access to students, faculty, and recruiters.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmMaintenanceToggle(null)}
                className="border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setSystemControls({ ...systemControls, maintenance_mode: confirmMaintenanceToggle });
                  setConfirmMaintenanceToggle(null);
                  startTransition(async () => {
                    const res = await updateSystemControlsAction({
                      ...systemControls,
                      maintenance_mode: confirmMaintenanceToggle,
                    });
                    if (res.success) {
                      showFeedback('success', res.message || 'Maintenance mode updated.');
                      router.refresh();
                    } else {
                      showFeedback('error', res.error || 'Failed to update maintenance mode.');
                    }
                  });
                }}
                className={
                  confirmMaintenanceToggle
                    ? 'bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs'
                    : 'bg-[#FF6B00] hover:bg-[#E56000] text-black font-semibold text-xs'
                }
              >
                Confirm {confirmMaintenanceToggle ? 'Enable' : 'Disable'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Restore Defaults Confirmation */}
      {confirmResetCategory !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-lg border border-[#222222] bg-[#121212] p-6 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-rose-500/20 text-rose-400 shrink-0">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#EDEDED]">
                  Restore Safe Defaults?
                </h3>
                <p className="text-xs text-[#9AA1AA] leading-relaxed">
                  Are you sure you want to reset <span className="font-semibold text-[#EDEDED]">{confirmResetCategory.toUpperCase()}</span> settings back to standard system factory defaults? Current configuration in this section will be overwritten.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmResetCategory(null)}
                className="border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleRestoreDefaults(confirmResetCategory)}
                disabled={isPending}
                className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs"
              >
                Yes, Restore Defaults
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
