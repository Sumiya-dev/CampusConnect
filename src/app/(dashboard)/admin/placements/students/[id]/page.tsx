import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { PageContainer } from '@/components/layout/page-container';
import { getStudentPlacementDetail } from '@/lib/placements/student-queries';
import { AdminStudentPlacementDetailView } from '@/components/placements/admin-student-placement-detail';

interface AdminStudentPlacementDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Candidate Placement Dossier | Superadmin | CampusConnect AI',
  description: 'Detailed student recruitment pipeline, application stages, eligibility, and historical records.',
};

export default async function AdminStudentPlacementDetailPage({
  params,
}: AdminStudentPlacementDetailPageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    redirect('/login?error=unauthorized');
  }

  const { id } = await params;
  const student = await getStudentPlacementDetail(id);

  if (!student) {
    notFound();
  }

  return (
    <PageContainer
      title={`Candidate Placement Dossier: ${student.name}`}
      description={`Placement tracking, recruitment pipeline, and activity timeline for ${student.name} (${student.studentId}).`}
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Placements', href: '/admin/placements' },
        { label: 'Students', href: '/admin/placements/students' },
        { label: student.name },
      ]}
      badgeText="Superadmin Access"
    >
      <AdminStudentPlacementDetailView student={student} />
    </PageContainer>
  );
}
