import { notFound, redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { getCurrentUser } from '@/lib/auth/user';
import { getCommunityPostById } from '@/lib/community/queries';
import { PostDetailView } from '@/components/community/post-detail-view';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ postId: string }>;
}

export default async function StudentCommunityPostDetailPage({ params }: PageProps) {
  const { postId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?unauthorized=true');
  }

  const { post, comments, error } = await getCommunityPostById(postId, user.id, user.role);

  if (!post || error) {
    notFound();
  }

  // Security layer: Students-only post is strictly forbidden for non-students
  if (post.visibility === 'STUDENTS_ONLY' && user.role !== 'student') {
    notFound();
  }

  return (
    <PageContainer
      title={post.title}
      description={`Discussion in ${post.category} · Initiated by ${post.author?.name || 'Community Member'}`}
      badgeText={post.visibility === 'STUDENTS_ONLY' ? 'Students Only 🔒' : 'Public Discussion'}
      breadcrumbs={[
        { label: 'Student Home', href: '/student' },
        { label: 'Community', href: '/student/community' },
        { label: post.category },
      ]}
    >
      <PostDetailView
        post={post}
        initialComments={comments}
        currentUserId={user.id}
        baseHref="/student/community"
      />
    </PageContainer>
  );
}
