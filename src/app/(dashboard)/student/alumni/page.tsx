import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { getAlumniProfiles } from '@/lib/alumni/queries';
import { PageContainer } from '@/components/layout/page-container';
import { AlumniDirectoryView } from '@/components/alumni/alumni-directory-view';

export const metadata = {
  title: 'Alumni Directory | CampusConnect',
  description: 'Discover and connect with university graduates across technology and corporate companies.',
};

export default async function AlumniDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/auth/login');
  }

  const resolvedParams = await searchParams;
  const query = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined;
  const dept = typeof resolvedParams.dept === 'string' ? resolvedParams.dept : undefined;
  const year = typeof resolvedParams.year === 'string' ? resolvedParams.year : undefined;
  const company = typeof resolvedParams.company === 'string' ? resolvedParams.company : undefined;
  const role = typeof resolvedParams.role === 'string' ? resolvedParams.role : undefined;

  const { profiles } = await getAlumniProfiles(
    {
      query,
      department: dept,
      graduation_year: year,
      company,
      job_role: role,
    },
    currentUser.id
  );

  return (
    <PageContainer
      title="Alumni Network"
      description="Discover university alumni, explore verified career journeys, and seek professional guidance."
      badgeText="Alumni Directory"
      breadcrumbs={[
        { label: 'Dashboard', href: `/${currentUser.role}` },
        { label: 'Alumni Network' },
      ]}
    >
      <AlumniDirectoryView
        initialProfiles={profiles}
        isStudent={currentUser.role === 'student'}
        baseHref="/student/alumni"
      />
    </PageContainer>
  );
}
