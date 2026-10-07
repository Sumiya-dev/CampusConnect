import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { PageContainer } from '@/components/layout/page-container';
import { getHelpArticleById } from '@/lib/help/queries';
import { HelpArticleDetail } from '@/components/admin/help-article-detail';

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
      ? `${article.title} | Help Center | CampusConnect AI`
      : 'Help Article | CampusConnect AI',
  };
}

export default async function AdminHelpDetailPage({ params }: PageProps) {
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
      title={article.title}
      description={`Category: ${article.category} • Status: ${article.status.toUpperCase()}`}
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Help Center', href: '/admin/help' },
        { label: article.title },
      ]}
      badgeText={article.status.toUpperCase()}
    >
      <HelpArticleDetail article={article} />
    </PageContainer>
  );
}
