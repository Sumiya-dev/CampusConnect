import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { getCurrentUser } from '@/lib/auth/user';
import { getCommunityPosts } from '@/lib/community/queries';
import { CommunityView } from '@/components/community/community-view';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@/lib/types/database.types';



function CommunitySkeleton() {
  return (
    <div className="flex h-[40vh] w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  );
}

async function CommunityContent({ userId, userRole, userName }: { userId: string, userRole: UserRole, userName: string }) {
  const { posts, error } = await getCommunityPosts({
    currentUserId: userId,
    currentUserRole: userRole,
  });

  return (
    <>
      {error && (
        <div className="p-3 mb-4 rounded-md border border-red-500/20 bg-red-500/10 text-xs text-red-400">
          {error}
        </div>
      )}
      <CommunityView
        initialPosts={posts}
        currentUser={{
          id: userId,
          role: userRole,
          name: userName,
        }}
        baseHref="/student/community"
      />
    </>
  );
}

export default async function StudentCommunityPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?unauthorized=true');
  }

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
      <Suspense fallback={<CommunitySkeleton />}>
        <CommunityContent userId={user.id} userRole={user.role} userName={user.name} />
      </Suspense>
    </PageContainer>
  );
}
