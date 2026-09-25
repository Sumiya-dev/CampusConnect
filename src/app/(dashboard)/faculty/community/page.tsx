import { PageContainer } from '@/components/layout/page-container';
import { EmptyState } from '@/components/ui/empty-state';
import { MessageSquare, Users, Shield } from 'lucide-react';

export default function FacultyCommunityPage() {
  return (
    <PageContainer
      title="Academic & Faculty Forum"
      description="Collaborate with department colleagues, exchange curriculum recommendations, and discuss institutional advisory policies."
      breadcrumbs={[
        { label: 'Faculty', href: '/faculty' },
        { label: 'Community' },
      ]}
      badgeText="Faculty Discourse"
    >
      <div className="space-y-6">
        <EmptyState
          icon={MessageSquare}
          title="Faculty Academic Exchange in Staging"
          description="The department community portal connects faculty advisors across disciplines to coordinate industry preparedness benchmarks and placement clearance workflows. Direct thread discussions will activate in the next release."
          actionLabel="View Department Notices"
          actionHref="/faculty/announcements"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-1.5">
            <div className="flex items-center gap-2 font-medium text-[#EDEDED]">
              <Users className="h-4 w-4 text-[#FF6B00]" />
              <span>Inter-Departmental Advisory Board</span>
            </div>
            <p className="text-[#9AA1AA] leading-relaxed">
              Bi-weekly sync notes between Computer Science, Information Technology, and Electronics departments regarding shared industry hiring eligibility.
            </p>
          </div>

          <div className="p-4 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-1.5">
            <div className="flex items-center gap-2 font-medium text-[#EDEDED]">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>Placement Board Liaison</span>
            </div>
            <p className="text-[#9AA1AA] leading-relaxed">
              Official communication channel between faculty department representatives and the Central Directorate of Training & Placement.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
