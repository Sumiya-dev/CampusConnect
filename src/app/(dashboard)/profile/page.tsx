import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getFullUserProfile } from '@/lib/auth/user';
import { ROLE_LABELS } from '@/lib/types/auth.types';
import { StudentProfileForm } from '@/components/profile/student-profile-form';
import { FacultyProfileForm } from '@/components/profile/faculty-profile-form';
import { PlacementProfileForm } from '@/components/profile/placement-profile-form';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@/lib/types/database.types';

function ProfileSkeleton() {
  return (
    <div className="flex h-[40vh] w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  );
}

async function ProfileContent({ role }: { role: UserRole }) {
  const profile = await getFullUserProfile();
  if (!profile) return null;

  return (
    <>
      {role === 'student' && <StudentProfileForm initialData={profile as any} />}
      {role === 'faculty' && <FacultyProfileForm initialData={profile as any} />}
      {role === 'placement_officer' && <PlacementProfileForm initialData={profile as any} />}
    </>
  );
}

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role === 'administrator') {
    redirect('/superadmin/profile');
  }

  return (
    <div className="space-y-10 max-w-3xl">
      {/* Page Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Profile & Account Settings
        </h1>
        <p className="text-sm text-muted mt-1">
          {ROLE_LABELS[user.role]} • Verified Institutional Record
        </p>
      </div>

      {/* Role-Specific Profile Editor */}
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent role={user.role} />
      </Suspense>
    </div>
  );
}
