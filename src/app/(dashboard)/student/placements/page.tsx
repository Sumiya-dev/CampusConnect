import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { StudentPlacementsView } from '@/components/placements/student-placements-view';
import { getPlacementDrives, getStudentApplications, getStudentShortlists } from '@/lib/placements/queries';
import { getCurrentUser, getFullUserProfile } from '@/lib/auth/user';
import { StudentProfileData } from '@/lib/types/profile.types';

export const dynamic = 'force-dynamic';

export default async function StudentPlacementsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') {
    redirect('/login?unauthorized=true');
  }

  const [drives, applications, shortlists, fullProfile] = await Promise.all([
    getPlacementDrives(),
    getStudentApplications(user.id),
    getStudentShortlists(user.id),
    getFullUserProfile(),
  ]);

  const student = fullProfile?.role === 'student' ? (fullProfile as StudentProfileData) : null;
  const studentProfile = {
    cgpa: student ? Number(student.cgpa) : 8.75,
    department: student?.department || user.department,
    year: student ? Number(student.year) : 3,
    skills: student?.skills || ['Data Structures & Algorithms', 'TypeScript'],
  };

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
      <StudentPlacementsView
        initialDrives={drives}
        applicationsCount={applications.length}
        shortlistsCount={shortlists.length}
        studentProfile={studentProfile}
      />
    </PageContainer>
  );
}
