import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, TrendingUp, Award, Building, Users } from 'lucide-react';

const branchMetrics = [
  { branch: 'Computer Science & Engineering', eligible: 240, placed: 218, rate: '90.8%', avgCtc: '₹14.2 LPA', highestCtc: '₹51.0 LPA' },
  { branch: 'Information Technology', eligible: 180, placed: 156, rate: '86.7%', avgCtc: '₹11.8 LPA', highestCtc: '₹44.0 LPA' },
  { branch: 'Electronics & Communication', eligible: 210, placed: 168, rate: '80.0%', avgCtc: '₹9.4 LPA', highestCtc: '₹28.0 LPA' },
  { branch: 'Electrical & Electronics', eligible: 160, placed: 114, rate: '71.2%', avgCtc: '₹7.6 LPA', highestCtc: '₹18.0 LPA' },
  { branch: 'Mechanical Engineering', eligible: 190, placed: 132, rate: '69.5%', avgCtc: '₹6.8 LPA', highestCtc: '₹14.5 LPA' },
  { branch: 'Civil Engineering', eligible: 140, placed: 84, rate: '60.0%', avgCtc: '₹5.9 LPA', highestCtc: '₹10.0 LPA' },
];

export default function PlacementAnalyticsPage() {
  return (
    <PageContainer
      title="Placement Intelligence & Analytics"
      description="Institutional placement analytics, departmental conversion benchmarks, and compensation trends for the 2026 graduating batch."
      breadcrumbs={[
        { label: 'Placement', href: '/placement' },
        { label: 'Analytics' },
      ]}
      badgeText="Batch of 2026"
      actions={
        <Button variant="outline" size="sm" className="text-sm gap-1.5 font-normal">
          <Download className="h-3.5 w-3.5 text-[#9AA1AA]" />
          <span>Export Institutional Report (PDF)</span>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Core summary strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#252A31] border border-[#252A31] rounded-md overflow-hidden text-sm">
          <div className="bg-[#0A0A0A] p-4">
            <span className="text-sm uppercase font-semibold text-[#9AA1AA]">Overall Placement Rate</span>
            <div className="text-xl font-semibold text-[#EDEDED] mt-1">78.4%</div>
            <span className="text-sm text-emerald-400 font-medium">872 of 1,120 Eligible Placed</span>
          </div>

          <div className="bg-[#0A0A0A] p-4">
            <span className="text-sm uppercase font-semibold text-[#9AA1AA]">Highest Compensation</span>
            <div className="text-xl font-semibold text-[#EDEDED] mt-1">₹51.0 LPA</div>
            <span className="text-sm text-[#EDEDED]">Microsoft IDC (SDE-1)</span>
          </div>

          <div className="bg-[#0A0A0A] p-4">
            <span className="text-sm uppercase font-semibold text-[#9AA1AA]">Average Package</span>
            <div className="text-xl font-semibold text-[#EDEDED] mt-1">₹9.85 LPA</div>
            <span className="text-sm text-emerald-400">+12% increase vs 2025</span>
          </div>

          <div className="bg-[#0A0A0A] p-4">
            <span className="text-sm uppercase font-semibold text-[#9AA1AA]">Participating Recruiters</span>
            <div className="text-xl font-semibold text-[#EDEDED] mt-1">84 Companies</div>
            <span className="text-sm text-[#9AA1AA]">42 Tier-1 Dream Employers</span>
          </div>
        </div>

        {/* Department Conversion Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#222222] pb-2">
            <h2 className="text-base font-semibold text-[#EDEDED] tracking-tight">
              Departmental Conversion & Compensation Benchmark
            </h2>
            <span className="text-sm text-[#9AA1AA]">6 Departments Tracked</span>
          </div>

          <div className="border border-[#222222] rounded-md bg-[#0A0A0A] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#222222] bg-[#121212] text-[#9AA1AA] uppercase tracking-wider text-sm">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Academic Department</th>
                    <th className="py-3 px-4 font-semibold">Eligible Pool</th>
                    <th className="py-3 px-4 font-semibold">Placed Offers</th>
                    <th className="py-3 px-4 font-semibold">Placement %</th>
                    <th className="py-3 px-4 font-semibold">Average CTC</th>
                    <th className="py-3 px-4 font-semibold text-right">Highest CTC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222] text-[#EDEDED]">
                  {branchMetrics.map((b) => (
                    <tr key={b.branch} className="hover:bg-[#121212] transition-colors">
                      <td className="py-3 px-4 font-medium">{b.branch}</td>
                      <td className="py-3 px-4 text-[#9AA1AA] font-mono">{b.eligible}</td>
                      <td className="py-3 px-4 text-[#9AA1AA] font-mono">{b.placed}</td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-400 font-semibold">{b.rate}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#EDEDED]">{b.avgCtc}</td>
                      <td className="py-3 px-4 font-mono font-medium text-right text-[#EDEDED]">{b.highestCtc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
