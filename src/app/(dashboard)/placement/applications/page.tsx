import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Layers, Download, CheckCircle, Clock } from 'lucide-react';

const mockApplications = [
  {
    id: 'APP-0941',
    candidate: 'Aarav Sharma',
    roll: 'STU-2022-CSE-001',
    drive: 'Microsoft India Development Center',
    role: 'SDE-1',
    appliedOn: 'Oct 14, 2026',
    stage: 'Shortlisted for Technical Interview',
    stageVariant: 'success' as const,
  },
  {
    id: 'APP-0883',
    candidate: 'Pooja Nair',
    roll: 'STU-2022-CSE-014',
    drive: 'Tata Consultancy Services',
    role: 'Digital Software Engineer',
    appliedOn: 'Oct 12, 2026',
    stage: 'OA Assessment Cleared',
    stageVariant: 'default' as const,
  },
  {
    id: 'APP-0792',
    candidate: 'Rohan Deshmukh',
    roll: 'STU-2022-CSE-042',
    drive: 'Infosys Limited',
    role: 'Specialist Programmer',
    appliedOn: 'Oct 11, 2026',
    stage: 'Under Verification',
    stageVariant: 'warning' as const,
  },
  {
    id: 'APP-0761',
    candidate: 'Karthik Rao',
    roll: 'STU-2022-ECE-033',
    drive: 'Deloitte USI',
    role: 'Analyst - Technology Advisory',
    appliedOn: 'Oct 09, 2026',
    stage: 'Online Assessment Scheduled',
    stageVariant: 'secondary' as const,
  },
];

export default function PlacementApplicationsPage() {
  return (
    <PageContainer
      title="Application Pipeline"
      description="Inspect submitted student applications, verify criteria fulfillment, and track progression across recruitment stages."
      breadcrumbs={[
        { label: 'Placement', href: '/placement' },
        { label: 'Applications' },
      ]}
      badgeText="1,567 Total Submissions"
      actions={
        <Button variant="outline" size="sm" className="text-sm gap-1.5 font-normal">
          <Download className="h-3.5 w-3.5 text-muted" />
          <span>Export Pipeline Report</span>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
            <Input
              placeholder="Search by student name, roll number, or drive name..."
              className="pl-9 text-sm h-10 bg-surface border-border text-foreground placeholder:text-muted"
            />
          </div>
          <Button variant="outline" size="sm" className="text-sm h-10 font-normal">
            <span>Filter: Active Rounds</span>
          </Button>
        </div>

        {/* Applications Table */}
        <div className="border border-border rounded-md bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-elevated text-muted uppercase tracking-wider text-sm">
                <tr>
                  <th className="py-3 px-4 font-semibold">Application ID & Student</th>
                  <th className="py-3 px-4 font-semibold">Drive & Job Role</th>
                  <th className="py-3 px-4 font-semibold">Submitted Date</th>
                  <th className="py-3 px-4 font-semibold">Recruitment Phase</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {mockApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-elevated/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{app.candidate}</div>
                      <div className="text-sm text-muted font-mono">{app.id} • {app.roll}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{app.drive}</div>
                      <div className="text-sm text-muted">{app.role}</div>
                    </td>
                    <td className="py-3 px-4 text-muted">{app.appliedOn}</td>
                    <td className="py-3 px-4">
                      <Badge variant={app.stageVariant} className="text-sm">
                        {app.stage}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="outline" size="sm" className="text-sm h-7 px-2 font-normal">
                        Inspect
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
