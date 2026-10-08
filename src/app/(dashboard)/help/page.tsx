import { PageContainer } from '@/components/layout/page-container';
import { getPublishedHelpArticles } from '@/lib/help/queries';
import { PublicHelpCenter } from '@/components/help/public-help-center';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Placement Help & Support | CampusConnect AI',
  description:
    'Frequently asked questions, institutional policies, and placement cell contact channels.',
};

export default async function StudentHelpPage() {
  const articles = await getPublishedHelpArticles();

  return (
    <PageContainer
      title="Placement Help & Support"
      description="Frequently asked questions, institutional policies, and placement cell contact channels."
      badgeText="Help Center"
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Help Center' },
      ]}
    >
      <PublicHelpCenter initialArticles={articles} />
    </PageContainer>
  );
}
