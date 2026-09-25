import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Bell, Megaphone, Calendar, Send, Filter, CheckCircle2 } from 'lucide-react';

const mockFacultyAnnouncements = [
  {
    id: 'ann-fac-01',
    title: 'Semester 6 CGPA Endorsement Deadline',
    target: 'All B.Tech CSE Candidates',
    date: 'Today, 02:00 PM',
    status: 'Published',
    content: 'All 6th semester candidates must upload their signed grade cards before Friday 5:00 PM for placement verification clearance.',
  },
  {
    id: 'ann-fac-02',
    title: 'Lab Assessment Reschedule for Microsoft Drive Participants',
    target: 'Registered Drive Candidates',
    date: 'Yesterday, 11:30 AM',
    status: 'Published',
    content: 'Distributed Systems lab batch B scheduled for Thursday is moved to Friday 3:00 PM to accommodate the recruiter pre-placement talk.',
  },
  {
    id: 'ann-fac-03',
    title: 'Technical Elective Course Registration Open',
    target: 'All Department Students',
    date: 'Sep 12, 2026',
    status: 'Archived',
    content: 'Registration portal for Cloud Native Architectures and Advanced NLP electives is now accepting applications.',
  },
];

export default function FacultyAnnouncementsPage() {
  return (
    <PageContainer
      title="Department Announcements"
      description="Publish official academic directives, lab schedules, and advisory notices directly to your department candidates."
      breadcrumbs={[
        { label: 'Faculty', href: '/faculty' },
        { label: 'Announcements' },
      ]}
      badgeText="Academic Broadcasts"
      actions={
        <Button size="sm" className="text-sm gap-1.5 font-medium">
          <Plus className="h-3.5 w-3.5" />
          <span>New Circular</span>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Notice creation quick composer */}
        <div className="p-4 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#EDEDED] flex items-center gap-1.5">
              <Megaphone className="h-3.5 w-3.5 text-[#FF6B00]" />
              Quick Broadcast Circular
            </span>
            <span className="text-sm text-[#9AA1AA]">Target: Department of CSE</span>
          </div>
          <Input
            placeholder="Notice Title (e.g. Mandatory Pre-Placement Briefing)..."
            className="text-sm bg-[#121212] border-[#222222] text-[#EDEDED] placeholder:text-[#9AA1AA]"
          />
          <textarea
            rows={3}
            placeholder="Type your official announcement content here..."
            className="w-full rounded-md border border-[#222222] bg-[#121212] px-3 py-2 text-sm text-[#EDEDED] placeholder:text-[#9AA1AA] focus:outline-none focus:border-[#FF6B00] resize-none"
          />
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-[#9AA1AA]">
              Notice will be dispatched to students via app notification and dashboard bulletin.
            </span>
            <Button size="sm" className="text-sm gap-1.5 font-medium">
              <Send className="h-3 w-3" />
              <span>Publish Notice</span>
            </Button>
          </div>
        </div>

        {/* Existing announcements list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#222222] pb-2">
            <h2 className="text-base font-semibold text-[#EDEDED] tracking-tight">
              Published Circulars History
            </h2>
            <span className="text-sm text-[#9AA1AA]">3 Notices Total</span>
          </div>

          <div className="space-y-3">
            {mockFacultyAnnouncements.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#EDEDED]">{item.title}</span>
                    <Badge variant={item.status === 'Published' ? 'success' : 'secondary'} className="text-sm">
                      {item.status}
                    </Badge>
                  </div>
                  <span className="text-sm text-[#9AA1AA]">{item.date}</span>
                </div>
                <p className="text-sm text-[#9AA1AA] leading-relaxed">{item.content}</p>
                <div className="flex items-center justify-between pt-2 border-t border-[#222222] text-sm text-[#9AA1AA]">
                  <span>Audience: <strong className="text-[#EDEDED] font-normal">{item.target}</strong></span>
                  <Button variant="ghost" size="sm" className="text-sm h-6 px-2 text-[#EDEDED] hover:text-[#EDEDED]">
                    Edit Notice
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
