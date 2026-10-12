import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { StudentPlacementsView } from '@/components/placements/student-placements-view';
import { getPlacementDrives, getStudentApplications, getStudentShortlists } from '@/lib/placements/queries';
import { getCurrentUser, getFullUserProfile } from '@/lib/auth/user';
import { StudentProfileData } from '@/lib/types/profile.types';
import { Loader2 } from 'lucide-react';



function PlacementsSkeleton() {
  return (
    <div className="flex h-[40vh] w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  );
}

async function PlacementsContent({ userId, department }: { userId: string, department: string }) {
  const [drives, applications, shortlists, fullProfile] = await Promise.all([
    getPlacementDrives(),
    getStudentApplications(userId),
    getStudentShortlists(userId),
    getFullUserProfile(),
  ]);

  const student = fullProfile?.role === 'student' ? (fullProfile as StudentProfileData) : null;
  const studentProfile = {
    cgpa: student ? Number(student.cgpa) : 8.75,
    department: student?.department || department,
    year: student ? Number(student.year) : 3,
    skills: student?.skills || ['Data Structures & Algorithms', 'TypeScript'],
  };

  return (
    <StudentPlacementsView
      initialDrives={drives}
      applicationsCount={applications.length}
      shortlistsCount={shortlists.length}
      studentProfile={studentProfile}
    />
  );
}

export default async function StudentPlacementsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') {
    redirect('/login?unauthorized=true');
  }

  return (
    <PageContainer
      title="Placement Opportunities"
      description="Active campus recruitment drives verified by the Central Placement Directorate. Select any drive to review criteria, verify your eligibility, and apply."
      badgeText="Central Placement Office"
      breadcrumbs={[
        { label: 'Student Home', href: '/student' },
        { label: 'Placements' },
      ]}
    >
      <Suspense fallback={<PlacementsSkeleton />}>
        <PlacementsContent userId={user.id} department={user.department} />
      </Suspense>
    </PageContainer>
  );
}
