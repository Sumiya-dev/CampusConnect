import { notFound, redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { getCurrentUser } from '@/lib/auth/user';
import { getCommunityPostById } from '@/lib/community/queries';
import { PostDetailView } from '@/components/community/post-detail-view';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ postId: string }>;
}

export default async function FacultyCommunityPostDetailPage({ params }: PageProps) {
  const { postId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?unauthorized=true');
  }

  const { post, comments, error } = await getCommunityPostById(postId, user.id, user.role);

  if (!post || error) {
    notFound();
  }

  // Security check: Faculty can NEVER view a Students Only post
  if (post.visibility === 'STUDENTS_ONLY') {
    notFound();
  }

  return (
    <PageContainer
      title={post.title}
      description={`Discussion in ${post.category} · Initiated by ${post.author?.name || 'Community Member'}`}
      badgeText="Public Discussion"
      breadcrumbs={[
        { label: 'Faculty Home', href: '/faculty' },
        { label: 'Community', href: '/faculty/community' },
        { label: post.category },
      ]}
    >
      <PostDetailView
        post={post}
        initialComments={comments}
        currentUserId={user.id}
        baseHref="/faculty/community"
      />
    </PageContainer>
  );
}
