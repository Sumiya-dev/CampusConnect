import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { getCurrentUser } from '@/lib/auth/user';
import { getStudentResume } from '@/lib/resume/queries';
import { ResumeManager } from '@/components/resume/resume-manager';

export const dynamic = 'force-dynamic';

export default async function StudentResumePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') {
    redirect('/login?unauthorized=true');
  }

  const resume = await getStudentResume();

  return (
    <PageContainer
      title="Resume"
      description="Manage your current resume for placement applications."
      breadcrumbs={[{ label: 'Resume' }]}
    >
      <div className="max-w-4xl mt-6">
        <ResumeManager initialResume={resume} />
      </div>
    </PageContainer>
  );
}
