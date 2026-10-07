'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SuperadminProfileDetails } from '@/lib/types/superadmin-profile.types';
import {
  updateSuperadminSafeProfileAction,
  updateSuperadminPasswordAction,
} from '@/lib/superadmin/profile-actions';
import { AvatarUpload } from '@/components/profile/avatar-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Lock,
  User,
  Mail,
  Phone,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Save,
  Calendar,
  Building,
  Key,
  Clock,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

interface SuperadminProfileViewProps {
  profile: SuperadminProfileDetails;
}

export function SuperadminProfileView({ profile }: SuperadminProfileViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Editable local state
  const [name, setName] = useState(profile.name);
  const [contactNumber, setContactNumber] = useState(profile.contactNumber || '');

  // Password local state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordConfirmModal, setShowPasswordConfirmModal] = useState(false);

  // Feedback banner state
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: null, message: '' });
    }, 5000);
  };

  // Form submit for safe profile fields
  const handleSaveProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateSuperadminSafeProfileAction(formData);
      if (res.success) {
        showFeedback('success', res.message || 'Profile updated successfully.');
        router.refresh();
      } else {
        showFeedback('error', res.error || 'Failed to update profile.');
      }
    });
  };

  // Password submission
  const handleConfirmPasswordChange = () => {
    if (!newPassword || newPassword.length < 8) {
      showFeedback('error', 'New password must be at least 8 characters long.');
      setShowPasswordConfirmModal(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      showFeedback('error', 'Passwords do not match.');
      setShowPasswordConfirmModal(false);
      return;
    }

    const formData = new FormData();
    formData.append('newPassword', newPassword);
    formData.append('confirmPassword', confirmPassword);

    setShowPasswordConfirmModal(false);
    startTransition(async () => {
      const res = await updateSuperadminPasswordAction(formData);
      if (res.success) {
        showFeedback('success', res.message || 'Password changed successfully.');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordSection(false);
        router.refresh();
      } else {
        showFeedback('error', res.error || 'Failed to change password.');
      }
    });
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Feedback Banner */}
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
            type="button"
            onClick={() => setFeedback({ type: null, message: '' })}
            className="text-xs hover:underline opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Section 1: Avatar & Identity Header Card */}
        <div className="p-5 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-5">
          <div className="flex items-center justify-between border-b border-[#222222] pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#FF6B00]" />
              <h2 className="text-base font-semibold text-[#EDEDED]">
                Superadmin Identity & Credentials
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs">
                Root Superadmin
              </Badge>
              <Badge variant="success" className="text-xs capitalize">
                {profile.accountStatus}
              </Badge>
            </div>
          </div>

          {/* Avatar Upload Component */}
          <div>
            <label className="block text-xs font-semibold uppercase text-[#9AA1AA] mb-2">
              Profile Photo
            </label>
            <AvatarUpload initialAvatarUrl={profile.avatarUrl} name={profile.name} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Name (Editable) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-[#9AA1AA] flex items-center justify-between">
                <span>Full Name</span>
                <span className="text-[11px] text-[#FF6B00] font-normal">Editable</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-[#9AA1AA]" />
                <Input
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Administrator Name"
                  className="pl-9 bg-[#121212] border-[#222222] text-[#EDEDED] focus:border-[#FF6B00]"
                />
              </div>
            </div>

            {/* Phone (Editable) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-[#9AA1AA] flex items-center justify-between">
                <span>Emergency Contact Phone</span>
                <span className="text-[11px] text-[#FF6B00] font-normal">Editable</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-[#9AA1AA]" />
                <Input
                  name="contactNumber"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+91 98444 55667"
                  className="pl-9 bg-[#121212] border-[#222222] text-[#EDEDED] focus:border-[#FF6B00]"
                />
              </div>
            </div>

            {/* Email (Read-Only) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-[#9AA1AA] flex items-center justify-between">
                <span>Primary Email Address</span>
                <span className="text-[11px] text-[#9AA1AA] flex items-center gap-1 font-normal">
                  <Lock className="h-3 w-3" /> Protected
                </span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#9AA1AA]" />
                <Input
                  value={profile.email}
                  disabled
                  readOnly
                  className="pl-9 bg-[#161616] border-[#222222] text-[#9AA1AA] cursor-not-allowed select-none"
                />
              </div>
              <span className="text-[11px] text-[#9AA1AA]">
                Institutional email changes must go through the identity provider directory.
              </span>
            </div>

            {/* Admin Code (Read-Only) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-[#9AA1AA] flex items-center justify-between">
                <span>Admin Identifier Code</span>
                <span className="text-[11px] text-[#9AA1AA] flex items-center gap-1 font-normal">
                  <Lock className="h-3 w-3" /> System Assigned
                </span>
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-[#9AA1AA]" />
                <Input
                  value={profile.adminCode}
                  disabled
                  readOnly
                  className="pl-9 bg-[#161616] border-[#222222] text-[#9AA1AA] font-mono cursor-not-allowed select-none"
                />
              </div>
              <span className="text-[11px] text-[#9AA1AA]">
                Unique credential tag associated with your administrative record.
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Administrative Scope & Timestamps (Read-Only Governance Info) */}
        <div className="p-5 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#222222] pb-3">
            <Building className="h-4 w-4 text-[#FF6B00]" />
            <h2 className="text-base font-semibold text-[#EDEDED]">
              Governance Scope & Audit Metadata
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded bg-[#121212] border border-[#222222] space-y-1">
              <span className="text-[#9AA1AA] uppercase font-semibold">Assigned Role</span>
              <div className="text-sm font-medium text-[#EDEDED]">{profile.role}</div>
              <span className="text-emerald-400">Root Governance</span>
            </div>

            <div className="p-3 rounded bg-[#121212] border border-[#222222] space-y-1">
              <span className="text-[#9AA1AA] uppercase font-semibold">Clearance Level</span>
              <div className="text-sm font-medium text-[#EDEDED]">{profile.accessLevel}</div>
              <span className="text-[#9AA1AA]">Full System RBAC</span>
            </div>

            <div className="p-3 rounded bg-[#121212] border border-[#222222] space-y-1">
              <span className="text-[#9AA1AA] uppercase font-semibold">Account Created</span>
              <div className="text-sm font-medium text-[#EDEDED]">{formatDate(profile.createdAt)}</div>
              <span className="text-[#9AA1AA]">Initial Registration</span>
            </div>

            <div className="p-3 rounded bg-[#121212] border border-[#222222] space-y-1">
              <span className="text-[#9AA1AA] uppercase font-semibold">Last Profile Update</span>
              <div className="text-sm font-medium text-[#EDEDED]">{formatDate(profile.updatedAt)}</div>
              <span className="text-[#9AA1AA]">Synchronized</span>
            </div>
          </div>
        </div>

        {/* Section 3: Save Button */}
        <div className="flex items-center justify-end">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-[#FF6B00] hover:bg-[#E56000] text-black font-semibold text-xs px-5 h-9"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            Save Profile Changes
          </Button>
        </div>
      </form>

      {/* Section 4: Password & Authentication Controls */}
      <div className="p-5 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-4">
        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[#FF6B00]" />
            <div>
              <h2 className="text-base font-semibold text-[#EDEDED]">
                Security & Authentication Credentials
              </h2>
              <p className="text-xs text-[#9AA1AA]">
                Update your login password securely through Supabase Auth.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="border-[#222222] bg-[#121212] hover:bg-[#1A1A1A] text-xs text-[#EDEDED]"
          >
            {showPasswordSection ? 'Cancel' : 'Change Password'}
          </Button>
        </div>

        {showPasswordSection && (
          <div className="space-y-4 pt-2 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-[#9AA1AA]">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="pr-9 bg-[#121212] border-[#222222] text-[#EDEDED]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-[#9AA1AA] hover:text-[#EDEDED]"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-[#9AA1AA]">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="pr-9 bg-[#121212] border-[#222222] text-[#EDEDED]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-[#9AA1AA] hover:text-[#EDEDED]"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#9AA1AA]">
                Passwords must contain at least 8 characters.
              </span>
              <Button
                type="button"
                onClick={() => {
                  if (!newPassword || newPassword.length < 8) {
                    showFeedback('error', 'New password must be at least 8 characters long.');
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    showFeedback('error', 'Password confirmation does not match.');
                    return;
                  }
                  setShowPasswordConfirmModal(true);
                }}
                disabled={isPending || !newPassword || !confirmPassword}
                className="bg-[#181818] hover:bg-[#222222] text-[#EDEDED] border border-[#333333] text-xs px-4"
              >
                Update Password
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Password Change */}
      {showPasswordConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-lg border border-[#222222] bg-[#121212] p-6 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-amber-500/20 text-amber-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#EDEDED]">
                  Confirm Password Update
                </h3>
                <p className="text-xs text-[#9AA1AA] leading-relaxed">
                  Are you sure you want to change your Superadmin password? Your current active session will remain active, but you must use the new password on future logins.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordConfirmModal(false)}
                className="border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmPasswordChange}
                disabled={isPending}
                className="bg-[#FF6B00] hover:bg-[#E56000] text-black font-semibold text-xs"
              >
                Confirm Update
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
