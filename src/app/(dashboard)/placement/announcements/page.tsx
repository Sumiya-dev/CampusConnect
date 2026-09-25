import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Bell, Send, Megaphone, Trash2, CheckCircle2 } from 'lucide-react';

const mockPlacementNotices = [
  {
    id: 'tpo-ann-01',
    title: 'Microsoft India: Shortlist for Final Technical Round Released',
    audience: 'Eligible 4th Year B.Tech CSE / IT / ECE',
    publishedOn: 'Today, 10:15 AM',
    status: 'Active Bulletin',
    content: 'The 45 candidates shortlisted for the virtual technical interviews must report to the Placement Cell conference room at 08:30 AM tomorrow with two copies of their updated resume.',
  },
  {
    id: 'tpo-ann-02',
    title: 'One-Job Policy Reminder for Tier-1 Selected Candidates',
    audience: 'All Registered Candidates 2026',
    publishedOn: 'Oct 14, 2026',
    status: 'Institutional Policy',
    content: 'Per University Career Directorate regulations, students securing an offer above ₹12 LPA are deemed placed and cannot participate in parallel core drives unless applying for Super-Dream category (₹25+ LPA).',
  },
  {
    id: 'tpo-ann-03',
    title: 'Infosys Specialist Programmer Mock Practice Portal Open',
    audience: 'All Registered 2026 Candidates',
    publishedOn: 'Oct 10, 2026',
    status: 'Archived',
    content: 'Practice mock platform is accessible until October 28 with sample coding questions matching the Infosys HackWithInfy benchmark.',
  },
];

export default function PlacementAnnouncementsPage() {
  return (
    <PageContainer
      title="Placement Directorate Announcements"
      description="Publish official recruitment notices, drive updates, and institutional placement policy circulars."
      breadcrumbs={[
        { label: 'Placement', href: '/placement' },
        { label: 'Announcements' },
      ]}
      badgeText="Central TPO Bulletin"
      actions={
        <Button size="sm" className="text-sm gap-1.5 font-medium">
          <Plus className="h-3.5 w-3.5" />
          <span>New TPO Bulletin</span>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Notice Composer */}
        <div className="p-4 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#EDEDED] flex items-center gap-1.5">
              <Megaphone className="h-3.5 w-3.5 text-[#FF6B00]" />
              Dispatch Campus Bulletin
            </span>
            <span className="text-sm text-[#9AA1AA]">Audience: University-Wide</span>
          </div>
          <Input
            placeholder="Bulletin Headline (e.g. Schedule Change: Amazon PPT moved to 10:00 AM)..."
            className="text-sm bg-[#121212] border-[#222222] text-[#EDEDED] placeholder:text-[#9AA1AA]"
          />
          <textarea
            rows={3}
            placeholder="Detailed instructions, eligibility qualifications, or reporting requirements..."
            className="w-full rounded-md border border-[#222222] bg-[#121212] px-3 py-2 text-sm text-[#EDEDED] placeholder:text-[#9AA1AA] focus:outline-none focus:border-[#FF6B00] resize-none"
          />
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-[#9AA1AA]">
              Bulletin will be immediately visible on all student Home news feeds.
            </span>
            <Button size="sm" className="text-sm gap-1.5 font-medium">
              <Send className="h-3 w-3" />
              <span>Broadcast Bulletin</span>
            </Button>
          </div>
        </div>

        {/* Existing Notices */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#222222] pb-2">
            <h2 className="text-base font-semibold text-[#EDEDED] tracking-tight">
              Active Circulars & Bulletins
            </h2>
            <span className="text-sm text-[#9AA1AA]">3 Broadcasts Published</span>
          </div>

          <div className="space-y-3">
            {mockPlacementNotices.map((n) => (
              <div
                key={n.id}
                className="p-4 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#EDEDED]">{n.title}</span>
                    <Badge variant={n.status.includes('Active') ? 'success' : 'secondary'} className="text-sm">
                      {n.status}
                    </Badge>
                  </div>
                  <span className="text-sm text-[#9AA1AA]">{n.publishedOn}</span>
                </div>
                <p className="text-sm text-[#9AA1AA] leading-relaxed">{n.content}</p>
                <div className="flex items-center justify-between pt-2 border-t border-[#222222] text-sm text-[#9AA1AA]">
                  <span>Targeted to: <strong className="text-[#EDEDED] font-normal">{n.audience}</strong></span>
                  <Button variant="ghost" size="sm" className="text-sm h-6 px-2 text-[#EDEDED] hover:text-[#EDEDED]">
                    Update Circular
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
