import Link from 'next/link';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { HelpCircle, Mail, Phone, MapPin, FileQuestion } from 'lucide-react';

export default function StudentHelpPage() {
  const faqs = [
    {
      q: 'How are minimum CGPA thresholds enforced for campus drives?',
      a: 'The placement system validates your verified CGPA recorded under your profile against the recruiters minimum criteria. If your CGPA satisfies the threshold, registration is enabled automatically.',
    },
    {
      q: 'What is the university one-job policy regarding Super Dream and Dream tiers?',
      a: 'A candidate securing an offer in the Tier-1 (Super Dream) bracket is automatically withdrawn from all subsequent drives to ensure equitable access across the graduating cohort.',
    },
    {
      q: 'How can I update my academic year or semester if it is incorrectly displayed?',
      a: 'Navigate to your Profile page and select your current academic year. After saving, notify your faculty advisor to certify your updated enrollment status.',
    },
    {
      q: 'Who should I contact if I encounter scheduling conflicts between two assessment rounds?',
      a: 'Contact the Central Placement Cell coordinator or visit the Placement Directorate ground floor office at least 24 hours prior to the scheduled drive date.',
    },
  ];

  return (
    <PageContainer
      title="Placement Help & Support"
      description="Frequently asked questions, institutional policies, and placement cell contact channels."
      badgeText="Help Center"
      breadcrumbs={[
        { label: 'Student Home', href: '/student' },
        { label: 'Help Center' },
      ]}
    >
      <div className="space-y-8 max-w-4xl">
        {/* Contact Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#222222] border border-[#222222] rounded-md overflow-hidden text-sm">
          <div className="bg-[#0A0A0A] p-4 space-y-1">
            <span className="text-[#9AA1AA] flex items-center gap-1.5 text-sm uppercase font-semibold">
              <Mail className="h-3.5 w-3.5 text-[#FF6B00]" />
              <span>Directorate Email</span>
            </span>
            <div className="font-medium text-[#EDEDED]">placements@university.edu</div>
          </div>

          <div className="bg-[#0A0A0A] p-4 space-y-1">
            <span className="text-[#9AA1AA] flex items-center gap-1.5 text-sm uppercase font-semibold">
              <Phone className="h-3.5 w-3.5 text-[#FF6B00]" />
              <span>Helpline Desk</span>
            </span>
            <div className="font-medium text-[#EDEDED]">+91 98333 44556 (Ext 402)</div>
          </div>

          <div className="bg-[#0A0A0A] p-4 space-y-1">
            <span className="text-[#9AA1AA] flex items-center gap-1.5 text-sm uppercase font-semibold">
              <MapPin className="h-3.5 w-3.5 text-[#FF6B00]" />
              <span>Office Location</span>
            </span>
            <div className="font-medium text-[#EDEDED]">Admin Block, Room G-04</div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-4">
          <div className="border-b border-[#222222] pb-2 flex items-center gap-2">
            <FileQuestion className="h-4 w-4 text-[#FF6B00]" />
            <h2 className="text-base font-semibold text-[#EDEDED] tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="border border-[#222222] rounded-md bg-[#0A0A0A] divide-y divide-[#222222]">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-4 space-y-1.5 text-sm">
                <h3 className="font-semibold text-[#EDEDED] leading-snug">{faq.q}</h3>
                <p className="text-[#9AA1AA] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
