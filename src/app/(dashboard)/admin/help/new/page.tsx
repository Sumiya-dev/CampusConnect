import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { PageContainer } from '@/components/layout/page-container';
import { HelpArticleForm } from '@/components/admin/help-article-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Create Help Article | Superadmin | CampusConnect AI',
  description: 'Author a new knowledge base or FAQ article for the university portal.',
};

export default async function AdminNewHelpArticlePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    redirect('/login?error=unauthorized');
  }

  return (
    <PageContainer
      title="Create Help Article"
      description="Publish official guidance, FAQ answers, or policy specifications."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Help Center', href: '/admin/help' },
        { label: 'New Article' },
      ]}
      badgeText="Author Article"
    >
      <HelpArticleForm isEditing={false} />
    </PageContainer>
  );
}
