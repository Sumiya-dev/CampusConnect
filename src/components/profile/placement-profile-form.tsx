'use client';

import { useActionState } from 'react';
import { PlacementProfileData } from '@/lib/types/profile.types';
import { updatePlacementProfileAction } from '@/lib/profile/actions';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { ProfileField, ProfileSectionHeader } from './profile-field';
import { Save } from 'lucide-react';

interface PlacementProfileFormProps {
  initialData: PlacementProfileData;
}

export function PlacementProfileForm({ initialData }: PlacementProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updatePlacementProfileAction, {
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

      {/* 1. Officer Identity & Contact */}
      <section className="space-y-4">
        <ProfileSectionHeader title="Officer Identity & Contact Information" />

        <div className="space-y-4">
          <ProfileField
            id="name"
            name="name"
            label="Officer Full Name"
            defaultValue={initialData.name}
            required
          />

          <ProfileField
            label="Official Email"
            value={initialData.email}
            readOnly
          />

          <ProfileField
            id="contactNumber"
            name="contactNumber"
            label="Directorate Phone"
            defaultValue={initialData.contactNumber || ''}
            placeholder="+91 98333 44556"
          />

          <ProfileField
            id="officeLocation"
            name="officeLocation"
            label="Placement Cell Location"
            defaultValue={initialData.officeLocation || ''}
            placeholder="Placement Cell, Administrative Block, Ground Floor"
          />
        </div>
      </section>

      {/* 2. Directorate Scope & Assignment */}
      <section className="space-y-4">
        <ProfileSectionHeader title="Directorate Standing & Authority" />

        <div className="space-y-4">
          <ProfileField
            label="Directorate"
            value={initialData.department}
            readOnly
          />

          <ProfileField
            id="designation"
            name="designation"
            label="Directorate Role"
            defaultValue={initialData.designation}
            required
          />

          <ProfileField
            label="Staff ID"
            value={initialData.employeeId}
            readOnly
          />

          <ProfileField
            label="Institutional Authorization Scope"
            value="Supervisory clearance across all academic departments and recruiter drives"
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
