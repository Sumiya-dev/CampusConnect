import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { getCurrentUser } from '@/lib/auth/user';
import { APTITUDE_TOPICS } from '@/lib/preparation/topics';
import { ArrowRight } from 'lucide-react';



export default async function AptitudeSectionPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') {
    redirect('/login?unauthorized=true');
  }

  return (
    <PageContainer
      title="Aptitude & Reasoning"
      description="Select a topic to view available preparation materials."
      breadcrumbs={[
        { label: 'Preparation', href: '/student/preparation' },
        { label: 'Aptitude & Reasoning' },
      ]}
    >
      <div className="max-w-3xl">
        <div className="border-t border-b border-border divide-y divide-border">
          {APTITUDE_TOPICS.map((topic) => (
            <Link
              key={topic.id}
              href={`/student/preparation/aptitude/${topic.slug}`}
              className="group py-4 px-3 -mx-3 flex items-center justify-between gap-4 hover:bg-elevated/50 transition-colors"
            >
              <span className="text-base font-medium text-foreground group-hover:text-accent transition-colors">
                {topic.title}
              </span>

              <div className="shrink-0">
                <ArrowRight className="h-4 w-4 text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
