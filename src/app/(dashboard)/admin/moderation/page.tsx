import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { PageContainer } from '@/components/layout/page-container';
import {
  getModerationDashboardStats,
  getModerationPosts,
  getModerationComments,
  getModerationReports,
} from '@/lib/community/moderation-queries';
import { CommunityModerationDashboard } from '@/components/admin/community-moderation-dashboard';

export const metadata = {
  title: 'Community Moderation | Superadmin | CampusConnect AI',
  description: 'Manage community posts, review reported content, hide inappropriate threads, and enforce guidelines.',
};

export default async function AdminModerationPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    redirect('/login?error=unauthorized');
  }

  const [stats, posts, comments, reports] = await Promise.all([
    getModerationDashboardStats(),
    getModerationPosts(),
    getModerationComments(),
    getModerationReports(),
  ]);

  return (
    <PageContainer
      title="Community & Forum Moderation"
      description="Review flagged community threads, inspect reported comments, hide inappropriate content, and enforce university conduct."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Community Moderation' },
      ]}
      badgeText="Superadmin Safety"
    >
      <CommunityModerationDashboard
        stats={stats}
        initialPosts={posts}
        initialComments={comments}
        initialReports={reports}
      />
    </PageContainer>
  );
}
