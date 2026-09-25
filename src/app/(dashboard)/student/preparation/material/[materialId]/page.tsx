import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth/user';
import { getPreparationMaterialById } from '@/lib/preparation/queries';
import { ArrowLeft } from 'lucide-react';
import { MaterialStudyView } from '@/components/preparation/material-study-view';
import {
  TECHNICAL_CONCEPTS_TOPICS,
  TECHNICAL_LANGUAGES_TOPICS,
  TECHNICAL_MAIN_TOPICS,
  APTITUDE_TOPICS,
  HR_TOPICS,
  matchesTopic,
} from '@/lib/preparation/topics';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    materialId: string;
  }>;
}

export default async function DedicatedMaterialPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') {
    redirect('/login?unauthorized=true');
  }

  const { materialId } = await params;
  const material = await getPreparationMaterialById(materialId, user.id);

  if (!material) {
    notFound();
  }

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return (
          <span className="text-sm font-medium px-2 py-0.5 rounded border border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]">
            Beginner
          </span>
        );
      case 'Advanced':
        return (
          <span className="text-sm font-medium px-2 py-0.5 rounded border border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444]">
            Advanced
          </span>
        );
      default:
        return (
          <span className="text-sm font-medium px-2 py-0.5 rounded border border-[#FF6B00]/30 bg-[#FF6B00]/10 text-[#FF6B00]">
            Intermediate
          </span>
        );
    }
  };

  // Determine contextual back URL and breadcrumb trail
  let backUrl = '/student/preparation';
  let backLabel = 'Back to Preparation';
  const breadcrumbs: { label: string; href?: string }[] = [
    { label: 'Preparation', href: '/student/preparation' },
  ];

  if (material.company_id && material.company) {
    breadcrumbs.push({
      label: 'Company-Specific',
      href: '/student/preparation/company-specific',
    });
    breadcrumbs.push({
      label: material.company.company_name,
      href: `/student/preparation/company-specific/${material.company_id}`,
    });
    backUrl = `/student/preparation/company-specific/${material.company_id}`;
    backLabel = `All ${material.company.company_name} Guides`;
  } else if (material.category === 'Technical') {
    breadcrumbs.push({
      label: 'Technical',
      href: '/student/preparation/technical',
    });
    
    // Find which group the topic belongs to
    let group = '';
    let topic = TECHNICAL_CONCEPTS_TOPICS.find((t) => matchesTopic(t, material.sub_category, material.title));
    if (topic) group = 'concepts';
    
    if (!topic) {
      topic = TECHNICAL_LANGUAGES_TOPICS.find((t) => matchesTopic(t, material.sub_category, material.title));
      if (topic) group = 'languages';
    }
    
    if (!topic) {
      topic = TECHNICAL_MAIN_TOPICS.find((t) => matchesTopic(t, material.sub_category, material.title));
      if (topic) group = 'main-topics';
    }

    if (topic && group) {
      breadcrumbs.push({
        label: group.charAt(0).toUpperCase() + group.slice(1).replace('-', ' '),
        href: `/student/preparation/technical/${group}`,
      });
      breadcrumbs.push({
        label: topic.title,
        href: `/student/preparation/technical/${group}/${topic.slug}`,
      });
      backUrl = `/student/preparation/technical/${group}/${topic.slug}`;
      backLabel = `All ${topic.title} Guides`;
    } else {
      backUrl = '/student/preparation';
      backLabel = 'All Technical Topics';
    }
  } else if (material.category === 'Aptitude') {
    breadcrumbs.push({
      label: 'Aptitude & Reasoning',
      href: '/student/preparation/aptitude',
    });
    const topic = APTITUDE_TOPICS.find((t) =>
      matchesTopic(t, material.sub_category, material.title)
    );
    if (topic) {
      breadcrumbs.push({
        label: topic.title,
        href: `/student/preparation/aptitude/${topic.slug}`,
      });
      backUrl = `/student/preparation/aptitude/${topic.slug}`;
      backLabel = `All ${topic.title} Materials`;
    } else {
      backUrl = '/student/preparation/aptitude';
      backLabel = 'All Aptitude Topics';
    }
  } else if (material.category === 'HR') {
    breadcrumbs.push({
      label: 'HR & Behavioral',
      href: '/student/preparation/hr',
    });
    const topic = HR_TOPICS.find((t) =>
      matchesTopic(t, material.sub_category, material.title)
    );
    if (topic) {
      breadcrumbs.push({
        label: topic.title,
        href: `/student/preparation/hr/${topic.slug}`,
      });
      backUrl = `/student/preparation/hr/${topic.slug}`;
      backLabel = `All ${topic.title} Materials`;
    } else {
      backUrl = '/student/preparation/hr';
      backLabel = 'All HR Topics';
    }
  }

  // Current material is final unlinked breadcrumb
  breadcrumbs.push({ label: material.title });

  return (
    <PageContainer
      title={material.title}
      badgeText={material.difficulty}
      breadcrumbs={breadcrumbs}
      actions={
        <Link href={backUrl}>
          <Button
            variant="outline"
            size="sm"
            className="text-sm gap-1 border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>{backLabel}</span>
          </Button>
        </Link>
      }
    >
      <div className="space-y-6 max-w-3xl">
        <MaterialStudyView material={material} />
      </div>
    </PageContainer>
  );
}
