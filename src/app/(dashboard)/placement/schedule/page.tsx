import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Plus, Building, UserCheck } from 'lucide-react';

const mockSchedule = [
  {
    date: 'Wednesday, Oct 28, 2026',
    time: '09:00 AM – 06:00 PM',
    company: 'Microsoft India Development Center',
    event: 'Final Technical & System Design Interviews',
    venue: 'Computer Science Complex, Labs 3 & 4 (Virtual Recruiter Booths)',
    candidates: 45,
    status: 'Confirmed',
  },
  {
    date: 'Thursday, Oct 29, 2026',
    time: '10:00 AM – 11:30 AM',
    company: 'Amazon Development Centre',
    event: 'Pre-Placement Talk (PPT) & Leadership Principles Q&A',
    venue: 'Central University Auditorium (Main Hall)',
    candidates: 280,
    status: 'Confirmed',
  },
  {
    date: 'Monday, Nov 02, 2026',
    time: '02:00 PM – 04:30 PM',
    company: 'Infosys Limited (Specialist Programmer)',
    event: 'National Proctored Coding Assessment Round',
    venue: 'Computing Laboratories 1, 2, 5 & 6',
    candidates: 350,
    status: 'Scheduled',
  },
  {
    date: 'Wednesday, Nov 12, 2026',
    time: '09:30 AM – 01:00 PM',
    company: 'Deloitte USI',
    event: 'Online Aptitude & Versant Business English Test',
    venue: 'Main Library Digital Learning Center',
    candidates: 520,
    status: 'Scheduled',
  },
];

export default function PlacementSchedulePage() {
  return (
    <PageContainer
      title="Placement Calendar & Drive Schedule"
      description="Centrally managed timeline for pre-placement talks, proctored coding assessments, and recruiter interview suites."
      breadcrumbs={[
        { label: 'Placement', href: '/placement' },
        { label: 'Schedule' },
      ]}
      badgeText="Season Calendar 2026"
      actions={
        <Button size="sm" className="text-sm gap-1.5 font-medium">
          <Plus className="h-3.5 w-3.5" />
          <span>Book Slot / Event</span>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="space-y-4">
          {mockSchedule.map((slot, idx) => (
            <div
              key={idx}
              className="p-4 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222222] pb-2.5">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#FF6B00]" />
                  <span className="text-sm font-semibold text-[#EDEDED]">{slot.date}</span>
                  <span className="text-sm text-[#9AA1AA]">({slot.time})</span>
                </div>
                <Badge variant={slot.status === 'Confirmed' ? 'success' : 'secondary'} className="text-sm w-fit">
                  {slot.status}
                </Badge>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="font-semibold text-base text-[#EDEDED]">{slot.company}</div>
                <div className="text-[#9AA1AA] font-medium">{slot.event}</div>
                <div className="flex flex-wrap items-center gap-4 text-[#9AA1AA] pt-1 text-sm">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-[#9AA1AA]" />
                    <span>{slot.venue}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <UserCheck className="h-3 w-3 text-[#9AA1AA]" />
                    <span>{slot.candidates} candidates attending</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
