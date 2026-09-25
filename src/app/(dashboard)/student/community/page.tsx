import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { getCurrentUser } from '@/lib/auth/user';
import { getCommunityPosts } from '@/lib/community/queries';
import { CommunityView } from '@/components/community/community-view';

export const dynamic = 'force-dynamic';

export default async function StudentCommunityPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?unauthorized=true');
  }

  // Students see both Public and Students Only discussions (strictly filtered by RLS at DB level)
  const { posts, error } = await getCommunityPosts({
    currentUserId: user.id,
    currentUserRole: user.role,
  });

  return (
    <PageContainer
      title="University Community"
      description="Collaborate across campus, discuss preparation strategies, and participate in peer circles."
      badgeText="Discussion Forum"
      breadcrumbs={[
        { label: 'Student Home', href: '/student' },
        { label: 'Community' },
      ]}
    >
      {error && (
        <div className="p-3 mb-4 rounded-md border border-red-500/20 bg-red-500/10 text-xs text-red-400">
          {error}
        </div>
      )}

      <CommunityView
        initialPosts={posts}
        currentUser={{
          id: user.id,
          role: user.role,
          name: user.name,
        }}
        baseHref="/student/community"
      />
    </PageContainer>
  );
}
