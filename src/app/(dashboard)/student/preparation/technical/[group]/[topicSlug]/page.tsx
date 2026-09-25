import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth/user';
import { TopicMaterialsList } from '@/components/preparation/topic-materials-list';
import {
  TECHNICAL_CONCEPTS_TOPICS,
  TECHNICAL_LANGUAGES_TOPICS,
  TECHNICAL_MAIN_TOPICS,
  TopicDefinition,
  findTopicBySlug,
  matchesTopic,
} from '@/lib/preparation/topics';
import { getPreparationMaterials } from '@/lib/preparation/queries';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    group: string;
    topicSlug: string;
  }>;
}

export default async function TechnicalTopicGuidesPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') {
    redirect('/login?unauthorized=true');
  }

  const { group, topicSlug } = await params;

  let groupTitle = '';
  let topics: TopicDefinition[] = [];

  switch (group) {
    case 'concepts':
      groupTitle = 'Concepts';
      topics = TECHNICAL_CONCEPTS_TOPICS;
      break;
    case 'languages':
      groupTitle = 'Languages';
      topics = TECHNICAL_LANGUAGES_TOPICS;
      break;
    case 'main-topics':
      groupTitle = 'Main Topics';
      topics = TECHNICAL_MAIN_TOPICS;
      break;
    default:
      notFound();
  }

  const topic = findTopicBySlug(topics, topicSlug);

  if (!topic) {
    notFound();
  }

  const allMaterials = await getPreparationMaterials({ category: 'Technical' }, user.id);
  const topicMaterials = allMaterials.filter((m) =>
    matchesTopic(topic, m.sub_category, m.title)
  );

  return (
    <PageContainer
      title={`${topic.title} — Preparation Guides`}
      breadcrumbs={[
        { label: 'Preparation', href: '/student/preparation' },
        { label: 'Technical' },
        { label: groupTitle, href: `/student/preparation/technical/${group}` },
        { label: topic.title },
      ]}
      actions={
        <Link href={`/student/preparation/technical/${group}`}>
          <Button
            variant="outline"
            size="sm"
            className="text-sm gap-1 border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Back to {groupTitle}</span>
          </Button>
        </Link>
      }
    >
      <div className="max-w-3xl">
        <TopicMaterialsList
          materials={topicMaterials}
          emptyMessage={`No preparation guides available for ${topic.title}.`}
        />
      </div>
    </PageContainer>
  );
}
