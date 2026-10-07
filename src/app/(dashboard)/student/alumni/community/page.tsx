import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { getAlumniCommunityPosts } from '@/lib/alumni/queries';
import { PageContainer } from '@/components/layout/page-container';
import { AlumniCommunityView } from '@/components/alumni/alumni-community-view';
import { EmptyState } from '@/components/ui/empty-state';
import { ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'Alumni Community | CampusConnect',
  description: 'Exclusive discussion space for university students and alumni to exchange career guidance and interview tips.',
};

export default async function AlumniCommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/auth/login');
  }

  // RBAC: Only Students and Alumni can access the Alumni Community
  if (currentUser.role !== 'student' && currentUser.role !== 'alumni') {
    return (
      <PageContainer
        title="Alumni Community"
        description="Exclusive discussion space for students and alumni."
        badgeText="Access Restricted"
        breadcrumbs={[
          { label: 'Dashboard', href: `/${currentUser.role}` },
          { label: 'Alumni Community' },
        ]}
      >
        <EmptyState
          icon={ShieldAlert}
          badgeText="RBAC Restricted"
          title="Access Restricted"
          description="The Alumni Community is an exclusive peer-to-peer channel reserved strictly for verified students and alumni members."
          actionLabel="Go to Dashboard"
          actionHref={`/${currentUser.role}`}
        />
      </PageContainer>
    );
  }

  const resolvedParams = await searchParams;
  const categoryParam = typeof resolvedParams.category === 'string' ? resolvedParams.category : undefined;

  const { posts } = await getAlumniCommunityPosts({
    category: categoryParam as any,
    currentUserId: currentUser.id,
    currentUserRole: currentUser.role,
  });

  return (
    <PageContainer
      title="Alumni Community"
      description="Peer-to-peer career questions, interview insights, and workplace advice with university alumni."
      badgeText="Student & Alumni Circle"
      breadcrumbs={[
        { label: 'Dashboard', href: `/${currentUser.role}` },
        { label: 'Alumni', href: '/student/alumni' },
        { label: 'Alumni Community' },
      ]}
    >
      <AlumniCommunityView
        initialPosts={posts}
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
