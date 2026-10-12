import { Suspense } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { getPublishedHelpArticles } from '@/lib/help/queries';
import { PublicHelpCenter } from '@/components/help/public-help-center';
import { Loader2 } from 'lucide-react';



export const metadata = {
  title: 'Placement Help & Support | CampusConnect AI',
  description:
    'Frequently asked questions, institutional policies, and placement cell contact channels.',
};

function HelpSkeleton() {
  return (
    <div className="flex h-[40vh] w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  );
}

async function HelpContent() {
  const articles = await getPublishedHelpArticles();
  return <PublicHelpCenter initialArticles={articles} />;
}

export default async function StudentHelpPage() {
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
      <Suspense fallback={<HelpSkeleton />}>
        <HelpContent />
      </Suspense>
    </PageContainer>
  );
}
