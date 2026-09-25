import { PageContainer } from '@/components/layout/page-container';
import { EmptyState } from '@/components/ui/empty-state';
import { MessageSquare } from 'lucide-react';

export default function StudentCommunityPage() {
  return (
    <PageContainer
      title="University Community"
      description="Peer discussion boards, departmental study groups, and interview preparation circles."
      badgeText="Peer Network"
      breadcrumbs={[
        { label: 'Student Home', href: '/student' },
        { label: 'Community' },
      ]}
    >
      <EmptyState
        icon={MessageSquare}
        badgeText="Community Module"
        title="Department Discussion Forum"
        description="The interactive student-faculty discussion channels and interview experience repositories will open prior to mock test sessions."
        actionLabel="Explore Placements"
        actionHref="/student/placements"
      />
    </PageContainer>
  );
}
