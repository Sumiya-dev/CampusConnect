import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { getCurrentUser } from '@/lib/auth/user';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  TECHNICAL_CONCEPTS_TOPICS,
  TECHNICAL_LANGUAGES_TOPICS,
  TECHNICAL_MAIN_TOPICS,
  TopicDefinition,
} from '@/lib/preparation/topics';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    group: string;
  }>;
}

export default async function TechnicalGroupPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') {
    redirect('/login?unauthorized=true');
  }

  const { group } = await params;

  let title = '';
  let topics: TopicDefinition[] = [];

  switch (group) {
    case 'concepts':
      title = 'Concepts';
      topics = TECHNICAL_CONCEPTS_TOPICS;
      break;
    case 'languages':
      title = 'Languages';
      topics = TECHNICAL_LANGUAGES_TOPICS;
      break;
    case 'main-topics':
      title = 'Main Topics';
      topics = TECHNICAL_MAIN_TOPICS;
      break;
    default:
      notFound();
  }

  return (
    <PageContainer
      title={title}
      breadcrumbs={[
        { label: 'Preparation', href: '/student/preparation' },
        { label: 'Technical' },
        { label: title },
      ]}
      actions={
        <Link href="/student/preparation">
          <Button
            variant="outline"
            size="sm"
            className="text-sm gap-1 border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Back to Preparation</span>
          </Button>
        </Link>
      }
    >
      <div className="max-w-3xl space-y-4">
        <p className="text-base font-medium text-[#EDEDED]">
          Select a topic to view its guides.
        </p>

        <div className="border-t border-b border-[#222222] divide-y divide-[#222222]">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/student/preparation/technical/${group}/${topic.slug}`}
              className="group py-6 px-3 -mx-3 flex items-center justify-between gap-6 hover:bg-[#121212]/50 transition-colors"
            >
              <div className="space-y-1.5 min-w-0">
                <h2 className="text-base font-medium text-[#EDEDED] group-hover:text-[#FF6B00] transition-colors">
                  {topic.title}
                </h2>
                <p className="text-sm text-[#9AA1AA] leading-relaxed">
                  {topic.description}
                </p>
              </div>

              <div className="shrink-0">
                <ArrowRight className="h-4 w-4 text-[#9AA1AA] group-hover:text-[#FF6B00] group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
