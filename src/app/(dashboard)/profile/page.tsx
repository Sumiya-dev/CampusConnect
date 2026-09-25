import { redirect } from 'next/navigation';
import { getFullUserProfile } from '@/lib/auth/user';
import { ROLE_LABELS } from '@/lib/types/auth.types';
import { StudentProfileForm } from '@/components/profile/student-profile-form';
import { FacultyProfileForm } from '@/components/profile/faculty-profile-form';
import { PlacementProfileForm } from '@/components/profile/placement-profile-form';
import { AdminProfileForm } from '@/components/profile/admin-profile-form';

export default async function ProfilePage() {
  const profile = await getFullUserProfile();

  if (!profile) {
    redirect('/login');
  }

  return (
    <div className="space-y-10 max-w-3xl">
      {/* Page Header */}
      <div className="border-b border-[#252A31] pb-4">
        <h1 className="text-xl font-bold tracking-tight text-[#F1F3F5]">
          Profile & Account Settings
        </h1>
        <p className="text-sm text-[#9AA1AA] mt-1">
          {ROLE_LABELS[profile.role]} • Verified Institutional Record
        </p>
      </div>

      {/* Role-Specific Profile Editor */}
      {profile.role === 'student' && <StudentProfileForm initialData={profile} />}
      {profile.role === 'faculty' && <FacultyProfileForm initialData={profile} />}
      {profile.role === 'placement_officer' && <PlacementProfileForm initialData={profile} />}
      {profile.role === 'administrator' && <AdminProfileForm initialData={profile} />}
    </div>
  );
}
