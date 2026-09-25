'use client';

import { useActionState } from 'react';
import { FacultyProfileData } from '@/lib/types/profile.types';
import { updateFacultyProfileAction } from '@/lib/profile/actions';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { ProfileField, ProfileSectionHeader } from './profile-field';
import { Save } from 'lucide-react';

interface FacultyProfileFormProps {
  initialData: FacultyProfileData;
}

export function FacultyProfileForm({ initialData }: FacultyProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateFacultyProfileAction, {
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

      {/* 1. Personal & Contact Information */}
      <section className="space-y-4">
        <ProfileSectionHeader title="Personal Information" />

        <div className="space-y-4">
          <ProfileField
            id="name"
            name="name"
            label="Faculty Full Name"
            defaultValue={initialData.name}
            required
          />

          <ProfileField
            label="Institutional Email"
            value={initialData.email}
            readOnly
          />

          <ProfileField
            id="contactNumber"
            name="contactNumber"
            label="Contact Phone"
            defaultValue={initialData.contactNumber || ''}
            placeholder="+91 98111 22334"
          />

          <ProfileField
            id="cabinLocation"
            name="cabinLocation"
            label="Cabin / Office Location"
            defaultValue={initialData.cabinLocation || ''}
            placeholder="Academic Block 3, Room 304"
          />
        </div>
      </section>

      {/* 2. Departmental & Institutional Assignment */}
      <section className="space-y-4">
        <ProfileSectionHeader title="Departmental Appointment & Scope" />

        <div className="space-y-4">
          <ProfileField
            label="Department"
            value={initialData.department}
            readOnly
          />

          <ProfileField
            id="designation"
            name="designation"
            label="Academic Designation"
            defaultValue={initialData.designation}
            required
          />

          <ProfileField
            label="Employee ID"
            value={initialData.employeeId}
            readOnly
          />

          <ProfileField
            label="Advisory Row-Level Security Scope"
            value={`Authorized for ${initialData.department} student cohorts`}
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
