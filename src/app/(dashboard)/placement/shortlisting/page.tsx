import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ListFilter, Upload, CheckCircle2, ArrowRight, Building, FileSpreadsheet } from 'lucide-react';

const mockShortlists = [
  {
    company: 'Microsoft India Development Center',
    drive: 'SDE-1 Campus Drive 2026',
    round: 'Final Technical & System Design Round',
    count: 45,
    status: 'Published to Students',
    publishedOn: 'Yesterday, 06:30 PM',
  },
  {
    company: 'Tata Consultancy Services',
    drive: 'Digital Software Engineer',
    round: 'Technical Interview Round 1',
    count: 180,
    status: 'Pending Verification',
    publishedOn: 'Awaiting TPO Approval',
  },
  {
    company: 'Deloitte USI',
    drive: 'Analyst - Technology Advisory',
    round: 'Online Assessment Qualified',
    count: 110,
    status: 'Published to Students',
    publishedOn: 'Oct 11, 2026',
  },
];

export default function PlacementShortlistingPage() {
  return (
    <PageContainer
      title="Shortlisting & Round Clearance"
      description="Process recruiter-provided shortlist dossiers, verify criteria adherence, and publish round advancement circulars."
      breadcrumbs={[
        { label: 'Placement', href: '/placement' },
        { label: 'Shortlisting' },
      ]}
      badgeText="3 Active Shortlists"
      actions={
        <Button size="sm" className="text-sm gap-1.5 font-medium">
          <Upload className="h-3.5 w-3.5" />
          <span>Upload Recruiter Shortlist CSV</span>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-1">
            <span className="text-sm uppercase font-semibold text-[#9AA1AA]">Total Candidates Shortlisted</span>
            <div className="text-xl font-semibold text-[#EDEDED]">335 Candidates</div>
            <span className="text-[#9AA1AA]">Across 3 recruitment tracks</span>
          </div>

          <div className="p-4 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-1">
            <span className="text-sm uppercase font-semibold text-[#9AA1AA]">Interviews Scheduled This Week</span>
            <div className="text-xl font-semibold text-[#EDEDED]">155 Slots</div>
            <span className="text-emerald-400">Labs 2, 4 & Zoom Suites</span>
          </div>

          <div className="p-4 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-1">
            <span className="text-sm uppercase font-semibold text-[#9AA1AA]">Pending TPO Approvals</span>
            <div className="text-xl font-semibold text-[#EDEDED]">1 Shortlist</div>
            <span className="text-amber-400">TCS Digital OA Results</span>
          </div>
        </div>

        {/* Shortlists List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#222222] pb-2">
            <h2 className="text-base font-semibold text-[#EDEDED] tracking-tight">
              Recruiter Round Shortlists
            </h2>
          </div>

          <div className="space-y-3">
            {mockShortlists.map((sl, idx) => (
              <div
                key={idx}
                className="p-4 rounded-md border border-[#222222] bg-[#0A0A0A] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#EDEDED]">{sl.company}</span>
                    <Badge
                      variant={sl.status.includes('Published') ? 'success' : 'warning'}
                      className="text-sm"
                    >
                      {sl.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-[#9AA1AA]">
                    {sl.drive} • <span className="text-[#F1F3F5]">{sl.round}</span>
                  </div>
                  <div className="text-sm text-[#9AA1AA]">
                    {sl.publishedOn} • <strong>{sl.count}</strong> candidates selected
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" className="text-sm gap-1.5 font-normal">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-[#9AA1AA]" />
                    <span>Download Roster</span>
                  </Button>
                  <Button size="sm" className="text-sm gap-1.5 font-medium">
                    <span>Manage Rollout</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
