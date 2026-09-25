import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HelpCircle, CheckCircle2, Clock, Mail, MessageSquare } from 'lucide-react';

const mockTickets = [
  {
    id: 'TICK-104',
    user: 'Rohan Deshmukh (Student)',
    subject: 'CGPA endorsement mismatch with university grade card',
    date: 'Today, 01:15 PM',
    status: 'In Progress',
    priority: 'High',
  },
  {
    id: 'TICK-098',
    user: 'Dr. Suresh Rao (Faculty)',
    subject: 'Request departmental access expansion for M.Tech cohort',
    date: 'Yesterday',
    status: 'Awaiting Response',
    priority: 'Normal',
  },
  {
    id: 'TICK-089',
    user: 'TPO Coordination Desk',
    subject: 'Batch CSV import verification for 2026 lateral entry students',
    date: 'Sep 15, 2026',
    status: 'Resolved',
    priority: 'Low',
  },
];

export default function AdminHelpPage() {
  return (
    <PageContainer
      title="Platform Support & Help Desk Governance"
      description="Resolve technical queries, grade dispute escalations, and system access issues raised by students, faculty, and corporate partners."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Help Center' },
      ]}
      badgeText="Help Desk Admin"
    >
      <div className="space-y-6">
        <div className="border border-[#222222] rounded-md bg-[#0A0A0A] overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#222222] bg-[#121212] text-[#9AA1AA] uppercase tracking-wider text-sm">
              <tr>
                <th className="py-3 px-4 font-semibold">Ticket & Requester</th>
                <th className="py-3 px-4 font-semibold">Issue Subject</th>
                <th className="py-3 px-4 font-semibold">Logged Date</th>
                <th className="py-3 px-4 font-semibold">Priority</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222] text-[#EDEDED]">
              {mockTickets.map((t) => (
                <tr key={t.id} className="hover:bg-[#121212] transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium text-[#EDEDED] font-mono">{t.id}</div>
                    <div className="text-sm text-[#9AA1AA]">{t.user}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-[#EDEDED] max-w-[280px]">
                    {t.subject}
                  </td>
                  <td className="py-3 px-4 text-[#9AA1AA]">{t.date}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-sm font-semibold ${
                        t.priority === 'High'
                          ? 'text-amber-400'
                          : t.priority === 'Normal'
                          ? 'text-[#EDEDED]'
                          : 'text-[#9AA1AA]'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={t.status === 'Resolved' ? 'success' : t.status === 'In Progress' ? 'warning' : 'secondary'}
                      className="text-sm"
                    >
                      {t.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="outline" size="sm" className="text-sm h-7 px-2 font-normal">
                      Resolve
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
