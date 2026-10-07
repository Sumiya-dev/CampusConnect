import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { PageContainer } from '@/components/layout/page-container';
import { getHelpArticleById } from '@/lib/help/queries';
import { HelpArticleForm } from '@/components/admin/help-article-form';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const article = await getHelpArticleById(id);
  return {
    title: article
      ? `Edit: ${article.title} | Help Center | CampusConnect AI`
      : 'Edit Help Article | CampusConnect AI',
  };
}

export default async function AdminEditHelpArticlePage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    redirect('/login?error=unauthorized');
  }

  const { id } = await params;
  const article = await getHelpArticleById(id);

  if (!article) {
    notFound();
  }

  return (
    <PageContainer
      title="Edit Help Article"
      description={`Editing article: ${article.title}`}
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Help Center', href: '/admin/help' },
        { label: article.title, href: `/admin/help/${article.id}` },
        { label: 'Edit' },
      ]}
      badgeText={article.status.toUpperCase()}
    >
      <HelpArticleForm
        initialData={article}
        isEditing={true}
      />
    </PageContainer>
  );
}
