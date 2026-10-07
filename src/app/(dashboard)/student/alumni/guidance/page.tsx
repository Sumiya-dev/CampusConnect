import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { getGuidanceRequests } from '@/lib/alumni/queries';
import { PageContainer } from '@/components/layout/page-container';
import { GuidanceRequestsView } from '@/components/alumni/guidance-requests-view';

export const metadata = {
  title: 'Guidance Requests | CampusConnect',
  description: 'Manage and track structured guidance and mentorship requests between students and university alumni.',
};

export default async function GuidanceRequestsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/auth/login');
  }

  const { requests } = await getGuidanceRequests(currentUser.id, currentUser.role);

  return (
    <PageContainer
      title="Guidance Requests"
      description="Track and manage structured mentorship inquiries and guidance communication."
      badgeText="Mentorship"
      breadcrumbs={[
        { label: 'Dashboard', href: `/${currentUser.role}` },
        { label: 'Alumni', href: '/student/alumni' },
        { label: 'Guidance' },
      ]}
    >
      <GuidanceRequestsView
        initialRequests={requests}
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
