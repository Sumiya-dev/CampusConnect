import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { getCurrentUser } from '@/lib/auth/user';
import { getCommunityPosts } from '@/lib/community/queries';
import { CommunityView } from '@/components/community/community-view';

export const dynamic = 'force-dynamic';

export default async function FacultyCommunityPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?unauthorized=true');
  }

  // Postgres RLS enforces that faculty NEVER receive student-only rows
  const { posts, error } = await getCommunityPosts({
    currentUserId: user.id,
    currentUserRole: user.role,
  });

  return (
    <PageContainer
      title="Academic & Faculty Forum"
      description="Collaborate across departments, discuss curriculum benchmarks, and share institutional announcements."
      badgeText="Public Forum"
      breadcrumbs={[
        { label: 'Faculty Home', href: '/faculty' },
        { label: 'Community' },
      ]}
    >
      {error && (
        <div className="p-3 mb-4 rounded-md border border-red-500/20 bg-red-500/10 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* For faculty, CommunityView hides Students Only tab and only permits PUBLIC posts */}
      <CommunityView
        initialPosts={posts}
        currentUser={{
          id: user.id,
          role: user.role,
          name: user.name,
        }}
        baseHref="/faculty/community"
      />
    </PageContainer>
  );
}
