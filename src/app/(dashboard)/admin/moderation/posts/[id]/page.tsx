import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { PageContainer } from '@/components/layout/page-container';
import { getPostWithModerationDetails } from '@/lib/community/moderation-queries';
import { CommunityPostModerationView } from '@/components/admin/community-post-moderation-view';

interface AdminPostModerationPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Post Moderation Review | Superadmin | CampusConnect AI',
  description: 'Detailed post moderation dossier, comments review, and reports review.',
};

export default async function AdminPostModerationPage({
  params,
}: AdminPostModerationPageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    redirect('/login?error=unauthorized');
  }

  const { id } = await params;
  const { post, comments, reports } = await getPostWithModerationDetails(id);

  if (!post) {
    notFound();
  }

  return (
    <PageContainer
      title={`Moderation Review: ${post.title}`}
      description="Inspect complete post content, author details, replies thread, and filed user reports."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Community Moderation', href: '/admin/moderation' },
        { label: 'Post Review' },
      ]}
      badgeText="Superadmin Access"
    >
      <CommunityPostModerationView
        post={post}
        comments={comments}
        reports={reports}
      />
    </PageContainer>
  );
}
