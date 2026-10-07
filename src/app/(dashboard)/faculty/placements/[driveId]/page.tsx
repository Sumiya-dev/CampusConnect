import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { UnauthorizedBanner } from '@/components/auth/unauthorized-banner';
import { getFacultyDriveDetailsWithCandidates } from '@/lib/faculty/placement-queries';
import { FacultyDriveDetailClient } from '@/components/faculty/faculty-drive-detail-client';

export const dynamic = 'force-dynamic';

interface FacultyDriveDetailPageProps {
  params: Promise<{
    driveId: string;
  }>;
}

export default async function FacultyDriveDetailPage({
  params,
}: FacultyDriveDetailPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'faculty' && user.role !== 'administrator') {
    redirect('/login?unauthorized=true');
  }

  const { driveId } = await params;
  if (!driveId) {
    notFound();
  }

  const data = await getFacultyDriveDetailsWithCandidates(driveId, user.id);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <Suspense fallback={null}>
        <UnauthorizedBanner />
      </Suspense>

      <FacultyDriveDetailClient
        drive={data.drive}
        candidates={data.candidates}
        allocatedSections={data.allocated_sections}
        facultyDepartment={data.faculty_department}
      />
    </div>
  );
}
