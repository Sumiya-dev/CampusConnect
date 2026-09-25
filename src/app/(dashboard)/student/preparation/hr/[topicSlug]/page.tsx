import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth/user';
import { TopicMaterialsList } from '@/components/preparation/topic-materials-list';
import { HR_TOPICS, findTopicBySlug, matchesTopic } from '@/lib/preparation/topics';
import { getPreparationMaterials } from '@/lib/preparation/queries';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    topicSlug: string;
  }>;
}

export default async function HRTopicMaterialsPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') {
    redirect('/login?unauthorized=true');
  }

  const { topicSlug } = await params;
  const topic = findTopicBySlug(HR_TOPICS, topicSlug);

  if (!topic) {
    notFound();
  }

  const allMaterials = await getPreparationMaterials({ category: 'HR' }, user.id);
  const topicMaterials = allMaterials.filter((m) =>
    matchesTopic(topic, m.sub_category, m.title)
  );

  return (
    <PageContainer
      title={topic.title}
      breadcrumbs={[
        { label: 'Preparation', href: '/student/preparation' },
        { label: 'HR & Behavioral', href: '/student/preparation/hr' },
        { label: topic.title },
      ]}
      actions={
        <Link href="/student/preparation/hr">
          <Button
            variant="outline"
            size="sm"
            className="text-sm gap-1 border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>All HR Topics</span>
          </Button>
        </Link>
      }
    >
      <div className="max-w-3xl">
        <TopicMaterialsList
          materials={topicMaterials}
          emptyMessage={`No preparation materials published yet for ${topic.title}.`}
        />
      </div>
    </PageContainer>
  );
}
