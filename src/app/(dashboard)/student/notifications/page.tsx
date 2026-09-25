import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Bell, Pin, CheckCircle2, Clock } from 'lucide-react';

export default function StudentNotificationsPage() {
  const notifications = [
    {
      title: 'Mandatory Pre-Placement Orientation & Resume Certification',
      source: 'Placement Directorate',
      time: '2 hours ago',
      category: 'Urgent Circular',
      content: 'All candidates eligible for Tier-1 and Core recruitment drives must verify their academic credentials before Friday.',
      read: false,
    },
    {
      title: 'Department Endorsement & CGPA Audit Period',
      source: 'Dr. Priya Raman (Faculty Advisor)',
      time: 'Yesterday at 4:30 PM',
      category: 'Academic Review',
      content: 'Faculty reviews for Semester 6 departmental transcripts are underway. Verify official grade records.',
      read: true,
    },
    {
      title: 'Microsoft India IDC Campus Drive: Registration Window Open',
      source: 'Corporate Relations Cell',
      time: '2 days ago',
      category: 'Recruitment Notice',
      content: 'Registration portal opened for Microsoft SDE-1 position (₹44.50 LPA CTC). Minimum CGPA 8.00.',
      read: true,
    },
    {
      title: 'Tata Consultancy Services Online Assessment Schedule',
      source: 'Central Placement Directorate',
      time: '3 days ago',
      category: 'Assessment',
      content: 'National Qualifier Test scheduled for Oct 24 in Computer Center Labs 1–4.',
      read: true,
    },
  ];

  return (
    <PageContainer
      title="Notifications & Directorate Bulletins"
      description="Official circulars, drive updates, and academic notifications dispatched by university authorities."
      badgeText="Official Broadcasts"
      breadcrumbs={[
        { label: 'Student Home', href: '/student' },
        { label: 'Notifications' },
      ]}
    >
      <div className="border border-[#222222] rounded-md bg-[#0A0A0A] divide-y divide-[#222222]">
        {notifications.map((n, idx) => (
          <div key={idx} className="p-4 sm:p-5 flex items-start gap-3.5 hover:bg-[#121212] transition-colors">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-[#222222] bg-[#121212] text-[#FF6B00] shrink-0 mt-0.5">
              <Bell className="h-3.5 w-3.5" />
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  {n.category}
                </Badge>
                <span className="text-sm text-[#9AA1AA]">• {n.source}</span>
                <span className="text-[#222222]">•</span>
                <span className="text-sm text-[#9AA1AA]">{n.time}</span>
              </div>

              <h3 className="text-base font-semibold text-[#EDEDED] leading-snug">{n.title}</h3>
              <p className="text-sm text-[#9AA1AA] leading-relaxed">{n.content}</p>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
