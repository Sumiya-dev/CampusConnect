import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Briefcase, Plus, Search, Calendar, Users, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

const mockDrives = [
  {
    id: 'tcs-digital-2026',
    company: 'Tata Consultancy Services',
    role: 'Digital Software Engineer',
    ctc: '₹7.5 – ₹9.0 LPA',
    deadline: 'Oct 25, 2026',
    registered: 412,
    shortlisted: 180,
    status: 'Applications Open',
    statusVariant: 'default' as const,
  },
  {
    id: 'microsoft-idc-2026',
    company: 'Microsoft India Development Center',
    role: 'Software Development Engineer - 1',
    ctc: '₹44.0 – ₹51.0 LPA',
    deadline: 'Oct 28, 2026',
    registered: 285,
    shortlisted: 45,
    status: 'Shortlisting Active',
    statusVariant: 'warning' as const,
  },
  {
    id: 'infosys-specialist-2026',
    company: 'Infosys Limited',
    role: 'Specialist Programmer (Power Programmer)',
    ctc: '₹9.5 LPA',
    deadline: 'Nov 02, 2026',
    registered: 350,
    shortlisted: 0,
    status: 'Applications Open',
    statusVariant: 'default' as const,
  },
  {
    id: 'deloitte-usi-2026',
    company: 'Deloitte USI',
    role: 'Analyst - Technology Advisory',
    ctc: '₹8.1 LPA',
    deadline: 'Nov 12, 2026',
    registered: 520,
    shortlisted: 110,
    status: 'Online Assessment',
    statusVariant: 'secondary' as const,
  },
];

export default function PlacementDrivesPage() {
  return (
    <PageContainer
      title="Campus Placement Drives"
      description="Create, schedule, and oversee corporate recruitment campaigns across all academic disciplines."
      breadcrumbs={[
        { label: 'Placement', href: '/placement' },
        { label: 'Placement Drives' },
      ]}
      badgeText="Active Drives: 4"
      actions={
        <Button size="sm" className="text-sm gap-1.5 font-medium">
          <Plus className="h-3.5 w-3.5" />
          <span>Create Recruitment Drive</span>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9AA1AA]" />
            <Input
              placeholder="Search drives by company name or role..."
              className="pl-9 text-sm h-10 bg-[#111418] border-[#252A31] text-[#F1F3F5] placeholder:text-[#9AA1AA]"
            />
          </div>
          <Button variant="outline" size="sm" className="text-sm h-10 font-normal">
            <span>Filter: 2026 Cohort</span>
          </Button>
        </div>

        {/* Drives List */}
        <div className="border border-[#252A31] rounded-md bg-[#111418] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#252A31] bg-[#171B20] text-[#9AA1AA] uppercase tracking-wider text-sm">
                <tr>
                  <th className="py-3 px-4 font-semibold">Recruiting Company & Role</th>
                  <th className="py-3 px-4 font-semibold">Compensation (CTC)</th>
                  <th className="py-3 px-4 font-semibold">Deadline</th>
                  <th className="py-3 px-4 font-semibold">Applicants</th>
                  <th className="py-3 px-4 font-semibold">Current Phase</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252A31] text-[#F1F3F5]">
                {mockDrives.map((d) => (
                  <tr key={d.id} className="hover:bg-[#171B20]/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#F1F3F5]">{d.company}</div>
                      <div className="text-sm text-[#9AA1AA]">{d.role}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-[#F1F3F5]">
                      {d.ctc}
                    </td>
                    <td className="py-3 px-4 text-[#9AA1AA]">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{d.deadline}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3 text-[#9AA1AA]" />
                        <span className="font-medium text-[#F1F3F5]">{d.registered}</span>
                        <span className="text-sm text-[#9AA1AA]">({d.shortlisted} shortlisted)</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={d.statusVariant} className="text-sm">
                        {d.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/student/placements/${d.id}`} target="_blank">
                          <Button variant="ghost" size="sm" className="text-sm h-7 px-2 font-normal text-[#9AA1AA] hover:text-[#F1F3F5]">
                            <span>Preview</span>
                            <ArrowUpRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="text-sm h-7 px-2 font-normal">
                          Manage Drive
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
