import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, ShieldCheck, Settings, CheckCircle2 } from 'lucide-react';

export default function AdminPlacementsPage() {
  return (
    <PageContainer
      title="Placement Governance & Policy Controls"
      description="Configure institutional placement policy rules, one-job thresholds, and cross-department eligibility guardrails."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Placements' },
      ]}
      badgeText="Policy Engine"
    >
      <div className="space-y-6">
        <div className="p-5 rounded-md border border-[#252A31] bg-[#111418] space-y-4">
          <div className="flex items-center justify-between border-b border-[#252A31] pb-3">
            <div>
              <h2 className="text-base font-semibold text-[#F1F3F5]">Institutional One-Job Enforcement</h2>
              <p className="text-sm text-[#9AA1AA]">
                Restricts candidates from applying to lower-tier companies after receiving a confirmed offer.
              </p>
            </div>
            <Badge variant="success" className="text-sm">
              Active & Enforced
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded bg-[#171B20] border border-[#252A31] space-y-1">
              <span className="text-sm uppercase font-semibold text-[#9AA1AA]">Tier 1 Dream Cutoff</span>
              <div className="text-base font-semibold text-[#F1F3F5]">₹10.0 LPA</div>
              <span className="text-sm text-[#9AA1AA]">Permits 1 upgrade to Super-Dream</span>
            </div>

            <div className="p-3 rounded bg-[#171B20] border border-[#252A31] space-y-1">
              <span className="text-sm uppercase font-semibold text-[#9AA1AA]">Super-Dream Cutoff</span>
              <div className="text-base font-semibold text-[#F1F3F5]">₹20.0 LPA</div>
              <span className="text-sm text-emerald-400">Strict Lockout Enforced</span>
            </div>

            <div className="p-3 rounded bg-[#171B20] border border-[#252A31] space-y-1">
              <span className="text-sm uppercase font-semibold text-[#9AA1AA]">Minimum Attendance Requirement</span>
              <div className="text-base font-semibold text-[#F1F3F5]">75.0%</div>
              <span className="text-sm text-[#9AA1AA]">Faculty certified required</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-md border border-[#252A31] bg-[#111418] flex items-center justify-between text-sm">
          <div>
            <div className="font-semibold text-[#F1F3F5]">Academic Year 2025–2026 Season State</div>
            <div className="text-[#9AA1AA]">Current stage: Full Campus Recruitment Active</div>
          </div>
          <Button variant="outline" size="sm" className="text-sm font-normal">
            Configure Rules
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
