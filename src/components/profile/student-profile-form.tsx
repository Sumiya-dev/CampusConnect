'use client';

import { useActionState } from 'react';
import { StudentProfileData } from '@/lib/types/profile.types';
import { updateStudentProfileAction } from '@/lib/profile/actions';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { ProfileField, ProfileSectionHeader } from './profile-field';
import { ComboboxSkillsInput } from './combobox-skills-input';
import { AvatarUpload } from './avatar-upload';
import { ResumeUpload } from './resume-upload';
import { PRESET_TECHNICAL_SKILLS, PRESET_NON_TECHNICAL_SKILLS } from '@/lib/constants/skills-data';
import { Save } from 'lucide-react';

interface StudentProfileFormProps {
  initialData: StudentProfileData;
}

export function StudentProfileForm({ initialData }: StudentProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateStudentProfileAction, {
    success: undefined,
    message: undefined,
    error: undefined,
  });

  const placementStatusLabels: Record<string, string> = {
    unplaced: 'Seeking Placement',
    placed: 'Placed / Offer Accepted',
    in_process: 'In Evaluation Process',
    opted_out: 'Opted Out of Campus Drives',
  };

  return (
    <form action={formAction} className="space-y-8">
      {/* Feedback Alerts */}
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

      {/* 1. Profile Picture */}
      <section className="space-y-4">
        <ProfileSectionHeader
          title="Profile Picture"
          description="Official candidate portrait for recruiter identification and university records."
        />
        <AvatarUpload
          name={initialData.name}
          initialAvatarUrl={initialData.avatarUrl}
        />
      </section>

      {/* 2. Personal Information */}
      <section className="space-y-4">
        <ProfileSectionHeader title="Personal Information" />

        <div className="space-y-4">
          <ProfileField
            id="name"
            name="name"
            label="Full Name"
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
            placeholder="+91 98765 43210"
          />

          <ProfileField
            label="Student ID"
            value={initialData.studentId}
            readOnly
          />
        </div>
      </section>

      {/* 3. Academic Information */}
      <section className="space-y-4">
        <ProfileSectionHeader title="Academic Information" />

        <div className="space-y-4">
          <ProfileField
            label="Department"
            value={initialData.department}
            readOnly
          />

          <ProfileField label="Academic Year">
            <Select
              id="year"
              name="year"
              defaultValue={initialData.year}
              className="text-sm h-10 bg-[#111418] border-[#252A31] text-[#F1F3F5] rounded-md px-3 py-2"
            >
              <option value="1" className="bg-[#111418] text-[#F1F3F5]">Year 1 (Freshman)</option>
              <option value="2" className="bg-[#111418] text-[#F1F3F5]">Year 2 (Sophomore)</option>
              <option value="3" className="bg-[#111418] text-[#F1F3F5]">Year 3 (Pre-Final)</option>
              <option value="4" className="bg-[#111418] text-[#F1F3F5]">Year 4 (Final Year)</option>
              <option value="5" className="bg-[#111418] text-[#F1F3F5]">Year 5 (Integrated Dual)</option>
            </Select>
          </ProfileField>

          <ProfileField
            id="cgpa"
            name="cgpa"
            label="Cumulative CGPA (0.00 – 10.00)"
            type="number"
            step="0.01"
            min="0.00"
            max="10.00"
            defaultValue={initialData.cgpa.toFixed(2)}
            required
          />
        </div>
      </section>

      {/* 4. Technical Skills */}
      <section className="space-y-4">
        <ProfileSectionHeader
          title="Technical Skills"
          description="Select technical skills from the dropdown list or type in custom competencies."
        />

        <ComboboxSkillsInput
          name="technicalSkills"
          placeholder="Select technical skill from list or type custom..."
          presetOptions={PRESET_TECHNICAL_SKILLS}
          initialSkills={
            initialData.technicalSkills && initialData.technicalSkills.length > 0
              ? initialData.technicalSkills
              : initialData.skills
          }
        />
      </section>

      {/* 5. Non-Technical Skills */}
      <section className="space-y-4">
        <ProfileSectionHeader
          title="Non-Technical Skills"
          description="Select professional, soft, and leadership skills from the dropdown list or type in custom."
        />

        <ComboboxSkillsInput
          name="nonTechnicalSkills"
          placeholder="Select non-technical skill from list or type custom..."
          presetOptions={PRESET_NON_TECHNICAL_SKILLS}
          initialSkills={initialData.nonTechnicalSkills || []}
        />
      </section>

      {/* 6. Resume Document */}
      <section className="space-y-4">
        <ProfileSectionHeader
          title="Resume Document"
          description="Official CV document attached to company placement applications and the Resume Module."
        />

        <ResumeUpload
          initialResumeName={initialData.resumeName}
          initialResumeUrl={initialData.resumeUrl}
          initialUploadedAt={initialData.resumeUploadedAt}
        />
      </section>

      {/* 7. LinkedIn Profile */}
      <section className="space-y-4">
        <ProfileSectionHeader title="LinkedIn Profile" />

        <ProfileField
          id="linkedinUrl"
          name="linkedinUrl"
          label="LinkedIn Profile URL"
          type="url"
          defaultValue={initialData.linkedinUrl || ''}
          placeholder="https://www.linkedin.com/in/yourprofile"
        />
      </section>

      {/* 8. GitHub Profile */}
      <section className="space-y-4">
        <ProfileSectionHeader title="GitHub Profile" />

        <ProfileField
          id="githubUrl"
          name="githubUrl"
          label="GitHub Profile URL"
          type="url"
          defaultValue={initialData.githubUrl || ''}
          placeholder="https://github.com/yourusername"
        />
      </section>

      {/* 9. Placement Information */}
      <section className="space-y-4">
        <ProfileSectionHeader title="Placement Information" />

        <div className="space-y-4">
          <ProfileField
            label="Official Placement Status"
            value={placementStatusLabels[initialData.placementStatus] || initialData.placementStatus}
            readOnly
          />

          <ProfileField
            label="Placement Directorate Policy"
            value="Certified by Central Placement Directorate. Skills, CGPA, resume, and contact information can be updated anytime before company drive shortlisting begins."
            readOnly
          />
        </div>
      </section>

      {/* 10. Account Information */}
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
