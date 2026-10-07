import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { getAlumniCommunityPostById } from '@/lib/alumni/queries';
import { PageContainer } from '@/components/layout/page-container';
import { AlumniPostDetailView } from '@/components/alumni/alumni-post-detail-view';
import { EmptyState } from '@/components/ui/empty-state';
import { MessageSquare, ShieldAlert } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const { post } = await getAlumniCommunityPostById(postId);
  return {
    title: post ? `${post.title} | Alumni Community` : 'Discussion | Alumni Community',
    description: post?.content?.slice(0, 160) || 'Alumni discussion details',
  };
}

export default async function AlumniCommunityPostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/auth/login');
  }

  // RBAC: Only Students and Alumni
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

  const { postId } = await params;
  const { post, comments } = await getAlumniCommunityPostById(
    postId,
    currentUser.id,
    currentUser.role
  );

  if (!post) {
    return (
      <PageContainer
        title="Discussion Post"
        description="Community thread details."
        badgeText="Discussion Details"
        breadcrumbs={[
          { label: 'Dashboard', href: `/${currentUser.role}` },
          { label: 'Alumni', href: '/student/alumni' },
          { label: 'Community', href: '/student/alumni/community' },
          { label: 'Not Found' },
        ]}
      >
        <EmptyState
          icon={MessageSquare}
          badgeText="Discussion"
          title="Discussion Not Found"
          description="This discussion post may have been deleted or is inaccessible."
          actionLabel="Back to Alumni Community"
          actionHref="/student/alumni/community"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Alumni Discussion"
      description="Community dialogue between university students and alumni."
      badgeText={post.category}
      breadcrumbs={[
        { label: 'Dashboard', href: `/${currentUser.role}` },
        { label: 'Alumni', href: '/student/alumni' },
        { label: 'Community', href: '/student/alumni/community' },
        { label: post.title.slice(0, 32) + (post.title.length > 32 ? '...' : '') },
      ]}
    >
      <AlumniPostDetailView
        post={post}
        initialComments={comments}
        currentUser={{
          id: currentUser.id,
          role: currentUser.role,
          name: currentUser.name,
        }}
        baseHref="/student/alumni/community"
      />
    </PageContainer>
  );
}
