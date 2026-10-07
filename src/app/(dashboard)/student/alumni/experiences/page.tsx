import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { getAlumniExperiences } from '@/lib/alumni/queries';
import { PageContainer } from '@/components/layout/page-container';
import { AlumniExperiencesView } from '@/components/alumni/alumni-experiences-view';

export const metadata = {
  title: 'Alumni Experiences | CampusConnect',
  description: 'Firsthand placement journeys, technical interview breakdowns, and preparation advice from verified university graduates.',
};

export default async function AlumniExperiencesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/auth/login');
  }

  const resolvedParams = await searchParams;
  const typeParam = typeof resolvedParams.type === 'string' ? resolvedParams.type : undefined;
  const companyParam = typeof resolvedParams.company === 'string' ? resolvedParams.company : undefined;
  const queryParam = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined;

  const { experiences } = await getAlumniExperiences({
    type: typeParam,
    company: companyParam,
    query: queryParam,
    currentUserId: currentUser.id,
  });

  return (
    <PageContainer
      title="Alumni Experiences"
      description="Placement rounds breakdown, interview questions, and preparation strategies shared by graduates."
      badgeText="Career Knowledge"
      breadcrumbs={[
        { label: 'Dashboard', href: `/${currentUser.role}` },
        { label: 'Alumni', href: '/student/alumni' },
        { label: 'Experiences' },
      ]}
    >
      <AlumniExperiencesView
        initialExperiences={experiences}
        currentUser={{
          id: currentUser.id,
          role: currentUser.role,
          name: currentUser.name,
        }}
        baseHref="/student/alumni"
      />
    </PageContainer>
  );
}
