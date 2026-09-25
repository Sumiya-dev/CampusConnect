import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth/user';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UnauthorizedBanner } from '@/components/auth/unauthorized-banner';
import { Briefcase, Building, Users, Calendar, ShieldCheck, Plus } from 'lucide-react';

export default async function PlacementDashboardPage() {
  const user = await getCurrentUser();

  const activeDrives = [
    {
      company: 'Microsoft India Development Center',
      tier: 'Tier 1 (Dream)',
      branches: 'CSE, IT, ECE',
      positions: '12 Offers',
      schedule: 'Oct 28, 2026',
      status: 'Shortlisting Active',
      statusVariant: 'success' as const,
    },
    {
      company: 'Amazon Development Centre',
      tier: 'Tier 1 (Super Dream)',
      branches: 'CSE, IT',
      positions: '8 Offers',
      schedule: 'Nov 04, 2026',
      status: 'PPT Scheduled',
      statusVariant: 'secondary' as const,
    },
    {
      company: 'Deloitte USI',
      tier: 'Core Recruiter',
      branches: 'All Engineering',
      positions: '45 Offers',
      schedule: 'Nov 12, 2026',
      status: 'Online Assessment',
      statusVariant: 'warning' as const,
    },
    {
      company: 'Larsen & Toubro Infotech',
      tier: 'Core Recruiter',
      branches: 'All Engineering',
      positions: '60 Offers',
      schedule: 'Nov 20, 2026',
      status: 'Registration Open',
      statusVariant: 'secondary' as const,
    },
  ];

  return (
    <div className="space-y-8">
      <Suspense fallback={null}>
        <UnauthorizedBanner />
      </Suspense>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252A31] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-[#F1F3F5] tracking-tight">
              Central Placement Operations Console
            </h1>
            <Badge variant="warning" className="text-sm">
              Placement Officer
            </Badge>
          </div>
          <p className="text-sm text-[#9AA1AA] mt-1">
            Directorate of University Career Development • Logged in as {user?.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span>University-Wide Scope</span>
          </Badge>
        </div>
      </div>

      {/* Institutional Placement Metrics Strip */}
      <section className="space-y-3">
        <div className="text-sm font-medium uppercase tracking-wider text-[#9AA1AA]">
          Institutional Placement Season 2025–2026
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#222222] border border-[#222222] rounded-md overflow-hidden">
          <div className="bg-[#0A0A0A] p-4">
            <span className="text-sm text-[#9AA1AA]">Eligible Pool</span>
            <div className="text-base font-semibold text-[#EDEDED] mt-1">1,240 Candidates</div>
            <span className="text-sm text-[#9AA1AA]">Across 8 Departments</span>
          </div>

          <div className="bg-[#0A0A0A] p-4">
            <span className="text-sm text-[#9AA1AA]">Recruiter Partners</span>
            <div className="text-base font-semibold text-[#EDEDED] mt-1">84 Companies</div>
            <span className="text-sm text-[#9AA1AA]">Signed MoUs for 2026</span>
          </div>

          <div className="bg-[#0A0A0A] p-4">
            <span className="text-sm text-[#9AA1AA]">Placement Ratio</span>
            <div className="text-base font-semibold text-[#EDEDED] mt-1">78.4%</div>
            <span className="text-sm text-emerald-400 font-medium">+5.2% vs previous term</span>
          </div>

          <div className="bg-[#0A0A0A] p-4">
            <span className="text-sm text-[#9AA1AA]">Offers Extended</span>
            <div className="text-base font-semibold text-[#EDEDED] mt-1">972 Offers</div>
            <span className="text-sm text-[#EDEDED]">312 Tier-1 Offers</span>
          </div>
        </div>
      </section>

      {/* Recruitment Season Calendar & Drives Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#222222] pb-2">
          <div>
            <h2 className="text-base font-semibold text-[#EDEDED]">
              Recruitment Season Drive Schedule
            </h2>
            <p className="text-sm text-[#9AA1AA]">
              Centrally scheduled recruitment drives and corporate engagements.
            </p>
          </div>
          <span className="text-sm text-[#9AA1AA]">Phase 1 Placeholder</span>
        </div>

        <div className="border border-[#222222] rounded-md overflow-hidden bg-[#0A0A0A]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#121212] text-[#9AA1AA] border-b border-[#222222]">
                <tr>
                  <th className="px-4 py-2.5 font-medium uppercase text-sm tracking-wider">Corporate Recruiter</th>
                  <th className="px-4 py-2.5 font-medium uppercase text-sm tracking-wider">Drive Category</th>
                  <th className="px-4 py-2.5 font-medium uppercase text-sm tracking-wider">Eligible Cohorts</th>
                  <th className="px-4 py-2.5 font-medium uppercase text-sm tracking-wider">Schedule Date</th>
                  <th className="px-4 py-2.5 font-medium uppercase text-sm tracking-wider text-right">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {activeDrives.map((d) => (
                  <tr key={d.company} className="hover:bg-[#121212] transition-colors">
                    <td className="px-4 py-3 font-medium text-[#EDEDED]">{d.company}</td>
                    <td className="px-4 py-3 text-[#9AA1AA]">{d.tier}</td>
                    <td className="px-4 py-3 text-[#9AA1AA]">{d.branches}</td>
                    <td className="px-4 py-3 text-[#9AA1AA]">{d.schedule}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant={d.statusVariant} className="text-sm">
                        {d.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Institutional Placement Policy Note */}
      <section className="border border-[#222222] rounded-md p-4 bg-[#0A0A0A] text-sm text-[#9AA1AA] space-y-1">
        <div className="text-[#EDEDED] font-medium text-sm">
          University Placement Policy Enforcement
        </div>
        <p className="leading-relaxed">
          Students accepting an offer in Tier-1 category are withdrawn from general recruitment pools per institutional one-job policy, opening subsequent opportunities for remaining candidates.
        </p>
      </section>
    </div>
  );
}
