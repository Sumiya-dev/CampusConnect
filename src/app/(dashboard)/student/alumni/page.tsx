import { PageContainer } from '@/components/layout/page-container';
import { EmptyState } from '@/components/ui/empty-state';
import { GraduationCap } from 'lucide-react';

export default function StudentAlumniPage() {
  return (
    <PageContainer
      title="Alumni Mentorship Network"
      description="Connect with university graduates placed at premier technology and corporate institutions globally."
      badgeText="Mentorship Directory"
      breadcrumbs={[
        { label: 'Student Home', href: '/student' },
        { label: 'Alumni' },
      ]}
    >
      <EmptyState
        icon={GraduationCap}
        badgeText="Alumni Relations"
        title="Alumni Directory & Mock Interviews"
        description="The alumni mentorship booking and mock interview schedule will be initiated once the corporate placement drives calendar is finalized."
        actionLabel="Back to Home"
        actionHref="/student"
      />
    </PageContainer>
  );
}
