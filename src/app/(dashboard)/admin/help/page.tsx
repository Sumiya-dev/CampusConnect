import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { PageContainer } from '@/components/layout/page-container';
import {
  getAdminHelpArticles,
  getAdminHelpStats,
} from '@/lib/help/queries';
import { HelpDashboard } from '@/components/admin/help-dashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Help Center Management | Superadmin | CampusConnect AI',
  description:
    'Manage university help articles, placement guidelines, policies, and FAQs.',
};

export default async function AdminHelpPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    redirect('/login?error=unauthorized');
  }

  const [articles, stats] = await Promise.all([
    getAdminHelpArticles(),
    getAdminHelpStats(),
  ]);

  return (
    <PageContainer
      title="Help Center Knowledge Base"
      description="Manage official FAQs, platform walkthroughs, interview guides, and placement policies for students and faculty."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Help Center' },
      ]}
      badgeText="Knowledge Governance"
    >
      <HelpDashboard
        initialArticles={articles}
        stats={stats}
      />
    </PageContainer>
  );
}
