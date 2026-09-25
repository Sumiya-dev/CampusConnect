'use client';

import { useActionState } from 'react';
import { AdminProfileData } from '@/lib/types/profile.types';
import { updateAdminProfileAction } from '@/lib/profile/actions';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { ProfileField, ProfileSectionHeader } from './profile-field';
import { Save } from 'lucide-react';

interface AdminProfileFormProps {
  initialData: AdminProfileData;
}

export function AdminProfileForm({ initialData }: AdminProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateAdminProfileAction, {
    success: undefined,
    message: undefined,
    error: undefined,
  });

  return (
    <form action={formAction} className="space-y-8">
      {state?.error && (
        <Alert variant="destructive" title="Update Error">
          {state.error}
        </Alert>
      )}
      {state?.success && state?.message && (
        <Alert variant="success" title="Profile Saved">
          {state.message}
        </Alert>
      )}

      {/* 1. Admin Identity & Contact */}
      <section className="space-y-4">
        <ProfileSectionHeader title="Administrator Identity & Contact" />

        <div className="space-y-4">
          <ProfileField
            id="name"
            name="name"
            label="Administrator Full Name"
            defaultValue={initialData.name}
            required
          />

          <ProfileField
            label="Administrative Email"
            value={initialData.email}
            readOnly
          />

          <ProfileField
            id="contactNumber"
            name="contactNumber"
            label="Emergency Contact Phone"
            defaultValue={initialData.contactNumber || ''}
            placeholder="+91 98444 55667"
          />

          <ProfileField
            label="Admin Security Code"
            value={initialData.adminCode}
            readOnly
          />
        </div>
      </section>

      {/* 2. Governance Clearance */}
      <section className="space-y-4">
        <ProfileSectionHeader title="Governance Clearance & Permissions" />

        <div className="space-y-4">
          <ProfileField
            label="Access Scope"
            value={initialData.accessLevel}
            readOnly
          />

          <ProfileField
            label="Departmental Scope"
            value={initialData.department}
            readOnly
          />

          <ProfileField
            label="Root Governance Authorization"
            value="Unrestricted Row-Level Security authorization across all institutional schemas"
            readOnly
          />
        </div>
      </section>

      {/* 3. Account Information */}
      <section className="space-y-4">
        <ProfileSectionHeader title="Account Information" />

        <div className="space-y-4">
          <ProfileField
            label="Account Status"
            value={initialData.accountStatus.toUpperCase()}
            readOnly
          />
        </div>
      </section>

      {/* Actions */}
      <div className="pt-6 border-t border-[#252A31] flex items-center justify-end">
        <Button
          type="submit"
          className="text-sm font-medium gap-2 px-6 h-10"
          isLoading={isPending}
        >
          <Save className="h-3.5 w-3.5" />
          <span>Save Changes</span>
        </Button>
      </div>
    </form>
  );
}
