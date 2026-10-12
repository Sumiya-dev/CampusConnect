import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { getCurrentUser } from '@/lib/auth/user';
import { getStudentResume } from '@/lib/resume/queries';
import nextDynamic from 'next/dynamic';

const ResumeManager = nextDynamic(() => import('@/components/resume/resume-manager').then(mod => mod.ResumeManager), { 
  loading: () => <div className="h-40 w-full animate-pulse bg-elevated rounded-md" /> 
});
import { Loader2 } from 'lucide-react';



function ResumeSkeleton() {
  return (
    <div className="flex h-[40vh] w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  );
}

async function ResumeContent() {
  const resume = await getStudentResume();
  return <ResumeManager initialResume={resume} />;
}

export default async function StudentResumePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') {
    redirect('/login?unauthorized=true');
  }

  return (
    <PageContainer
      title="Resume"
      description="Manage your current resume for placement applications."
      breadcrumbs={[{ label: 'Resume' }]}
    >
      <div className="max-w-4xl mt-6">
        <Suspense fallback={<ResumeSkeleton />}>
          <ResumeContent />
        </Suspense>
      </div>
    </PageContainer>
  );
}
