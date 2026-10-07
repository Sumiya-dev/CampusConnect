import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { getAlumniProfileById } from '@/lib/alumni/queries';
import { PageContainer } from '@/components/layout/page-container';
import { AlumniProfileView } from '@/components/alumni/alumni-profile-view';
import { EmptyState } from '@/components/ui/empty-state';
import { GraduationCap } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ alumniId: string }>;
}) {
  const { alumniId } = await params;
  const { profile } = await getAlumniProfileById(alumniId);
  return {
    title: profile ? `${profile.user?.name || 'Alumni'} | CampusConnect` : 'Alumni Profile | CampusConnect',
    description: profile?.bio || 'Alumni profile on CampusConnect university network.',
  };
}

export default async function AlumniProfilePage({
  params,
}: {
  params: Promise<{ alumniId: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/auth/login');
  }

  const { alumniId } = await params;
  const { profile, experiences } = await getAlumniProfileById(alumniId, currentUser.id);

  if (!profile) {
    return (
      <PageContainer
        title="Alumni Profile"
        description="View career journey and request guidance."
        badgeText="Alumni Details"
        breadcrumbs={[
          { label: 'Dashboard', href: `/${currentUser.role}` },
          { label: 'Alumni', href: '/student/alumni' },
          { label: 'Profile Not Found' },
        ]}
      >
        <EmptyState
          icon={GraduationCap}
          badgeText="Alumni Network"
          title="Alumni Profile Not Found"
          description="The requested alumni profile is unavailable or may have been restricted."
          actionLabel="Return to Directory"
          actionHref="/student/alumni"
        />
      </PageContainer>
    );
  }

  const name = profile.user?.name || 'Alumni';

  return (
    <PageContainer
      title={name}
      description={`Career profile and placement experiences for ${name}.`}
      badgeText="Alumni Profile"
      breadcrumbs={[
        { label: 'Dashboard', href: `/${currentUser.role}` },
        { label: 'Alumni Directory', href: '/student/alumni' },
        { label: name },
      ]}
    >
      <AlumniProfileView
        profile={profile}
        experiences={experiences}
        isStudent={currentUser.role === 'student'}
        baseHref="/student/alumni"
      />
    </PageContainer>
  );
}
