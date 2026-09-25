import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Download, Users, CheckCircle2, XCircle } from 'lucide-react';

const mockCandidates = [
  {
    id: 'STU-2022-CSE-001',
    name: 'Aarav Sharma',
    dept: 'Computer Science & Eng',
    cgpa: '9.12',
    tier1Offer: 'Microsoft IDC (₹48 LPA)',
    status: 'Placed (Tier 1)',
    statusVariant: 'success' as const,
  },
  {
    id: 'STU-2022-CSE-014',
    name: 'Pooja Nair',
    dept: 'Computer Science & Eng',
    cgpa: '8.85',
    tier1Offer: 'None',
    status: 'Shortlisted (2 Drives)',
    statusVariant: 'default' as const,
  },
  {
    id: 'STU-2022-ECE-033',
    name: 'Karthik Rao',
    dept: 'Electronics & Comm',
    cgpa: '8.45',
    tier1Offer: 'None',
    status: 'Eligible',
    statusVariant: 'secondary' as const,
  },
  {
    id: 'STU-2022-IT-055',
    name: 'Ananya Roy',
    dept: 'Information Technology',
    cgpa: '7.80',
    tier1Offer: 'TCS Digital (₹7.5 LPA)',
    status: 'Placed (Core)',
    statusVariant: 'success' as const,
  },
  {
    id: 'STU-2022-ME-019',
    name: 'Siddharth Joshi',
    dept: 'Mechanical Engineering',
    cgpa: '7.30',
    tier1Offer: 'None',
    status: 'Eligible',
    statusVariant: 'secondary' as const,
  },
];

export default function PlacementStudentsPage() {
  return (
    <PageContainer
      title="University Placement Roster"
      description="Search, filter, and export the university-wide student candidate directory for placement drive eligibility verification."
      breadcrumbs={[
        { label: 'Placement', href: '/placement' },
        { label: 'Students' },
      ]}
      badgeText="1,240 Registered Candidates"
      actions={
        <Button variant="outline" size="sm" className="text-sm gap-1.5 font-normal">
          <Download className="h-3.5 w-3.5 text-[#9AA1AA]" />
          <span>Export Candidate Master CSV</span>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9AA1AA]" />
            <Input
              placeholder="Search by student name, roll number, department, or skill..."
              className="pl-9 text-sm h-10 bg-[#111418] border-[#252A31] text-[#F1F3F5] placeholder:text-[#9AA1AA]"
            />
          </div>
          <Button variant="outline" size="sm" className="text-sm h-10 font-normal">
            <Filter className="h-3.5 w-3.5 text-[#9AA1AA] mr-1.5" />
            <span>Filter: Min CGPA 8.0</span>
          </Button>
          <Button variant="outline" size="sm" className="text-sm h-10 font-normal">
            <span>All Departments</span>
          </Button>
        </div>

        {/* Candidate Table */}
        <div className="border border-[#252A31] rounded-md bg-[#111418] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#252A31] bg-[#171B20] text-[#9AA1AA] uppercase tracking-wider text-sm">
                <tr>
                  <th className="py-3 px-4 font-semibold">Student & ID</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">CGPA</th>
                  <th className="py-3 px-4 font-semibold">Offers Held</th>
                  <th className="py-3 px-4 font-semibold">Recruitment Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252A31] text-[#F1F3F5]">
                {mockCandidates.map((c) => (
                  <tr key={c.id} className="hover:bg-[#171B20]/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#F1F3F5]">{c.name}</div>
                      <div className="text-sm text-[#9AA1AA] font-mono">{c.id}</div>
                    </td>
                    <td className="py-3 px-4 text-[#9AA1AA]">{c.dept}</td>
                    <td className="py-3 px-4 font-mono font-medium text-[#F1F3F5]">{c.cgpa}</td>
                    <td className="py-3 px-4 text-[#9AA1AA]">{c.tier1Offer}</td>
                    <td className="py-3 px-4">
                      <Badge variant={c.statusVariant} className="text-sm">
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="outline" size="sm" className="text-sm h-7 px-2 font-normal">
                        View Dossier
                      </Button>
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
