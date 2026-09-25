import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { getCurrentUser } from '@/lib/auth/user';
import { APTITUDE_TOPICS } from '@/lib/preparation/topics';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

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
        <div className="border-t border-b border-[#222222] divide-y divide-[#222222]">
          {APTITUDE_TOPICS.map((topic) => (
            <Link
              key={topic.id}
              href={`/student/preparation/aptitude/${topic.slug}`}
              className="group py-4 px-3 -mx-3 flex items-center justify-between gap-4 hover:bg-[#121212]/50 transition-colors"
            >
              <span className="text-base font-medium text-[#EDEDED] group-hover:text-[#FF6B00] transition-colors">
                {topic.title}
              </span>

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
