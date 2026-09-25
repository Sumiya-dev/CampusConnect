import { PageContainer } from '@/components/layout/page-container';
import { EmptyState } from '@/components/ui/empty-state';
import { ShieldCheck, MessageSquare, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminModerationPage() {
  return (
    <PageContainer
      title="Community & Forum Moderation"
      description="Review flagged community threads, enforce university communication conduct, and manage banned keywords."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Community Moderation' },
      ]}
      badgeText="Safety & Moderation"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-1">
            <span className="text-sm uppercase font-semibold text-[#9AA1AA]">Flagged Items In Queue</span>
            <div className="text-xl font-semibold text-[#EDEDED]">0 Reports</div>
            <span className="text-emerald-400">Queue is clean</span>
          </div>

          <div className="p-4 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-1">
            <span className="text-sm uppercase font-semibold text-[#9AA1AA]">Automated Spam Filter</span>
            <div className="text-xl font-semibold text-[#EDEDED]">Active</div>
            <span className="text-[#9AA1AA]">Keyword & Regex Guard</span>
          </div>

          <div className="p-4 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-1">
            <span className="text-sm uppercase font-semibold text-[#9AA1AA]">Suspended Accounts</span>
            <div className="text-xl font-semibold text-[#EDEDED]">0 Users</div>
            <span className="text-[#9AA1AA]">Standard conduct status</span>
          </div>
        </div>

        <EmptyState
          icon={ShieldCheck}
          title="No Moderation Flags Pending Review"
          description="Student and faculty discussion spaces are operating within institutional behavioral guidelines. Any reported items or rule violations will surface here."
          actionLabel="View User Directory"
          actionHref="/admin/users"
        />
      </div>
    </PageContainer>
  );
}
