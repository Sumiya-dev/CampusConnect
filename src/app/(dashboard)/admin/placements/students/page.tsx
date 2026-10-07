import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { PageContainer } from '@/components/layout/page-container';
import {
  getStudentsPlacementRoster,
  getPlacementRosterStats,
  getStudentPlacementFilterOptions,
} from '@/lib/placements/student-queries';
import { AdminStudentPlacementRoster } from '@/components/placements/admin-student-placement-roster';

export const metadata = {
  title: 'Student Placement Management | Superadmin | CampusConnect AI',
  description: 'University-wide student placement pipeline, candidate tracking, and status administration.',
};

export default async function AdminStudentPlacementsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    redirect('/login?error=unauthorized');
  }

  const [students, stats, filterOptions] = await Promise.all([
    getStudentsPlacementRoster(),
    getPlacementRosterStats(),
    getStudentPlacementFilterOptions(),
  ]);

  return (
    <PageContainer
      title="Student Placement Management"
      description="University-wide candidate placement directory, recruitment pipeline tracking, and offer governance."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Placements', href: '/admin/placements' },
        { label: 'Students' },
      ]}
      badgeText="Superadmin Access"
    >
      <AdminStudentPlacementRoster
        initialStudents={students}
        stats={stats}
        filterOptions={filterOptions}
      />
    </PageContainer>
  );
}
