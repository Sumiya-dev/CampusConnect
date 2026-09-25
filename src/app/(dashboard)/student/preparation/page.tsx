import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { getCurrentUser } from '@/lib/auth/user';
import { ArrowRight } from 'lucide-react';

import { PreparationSectionsList } from '@/components/preparation/preparation-sections-list';

export const dynamic = 'force-dynamic';

export default async function StudentPreparationLandingPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') {
    redirect('/login?unauthorized=true');
  }

  return (
    <PageContainer
      title="Preparation"
      description="What do you want to prepare for?"
      breadcrumbs={[{ label: 'Preparation' }]}
    >
      <div className="max-w-3xl space-y-4">
        <p className="text-base font-medium text-[#EDEDED]">
          What do you want to prepare for?
        </p>

        <PreparationSectionsList />
      </div>
    </PageContainer>
  );
}
