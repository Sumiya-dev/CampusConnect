'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  title: string;
  description: string;
  href?: string;
  isExpandable?: boolean;
}

const sections: Section[] = [
  {
    id: 'technical',
    title: 'Technical',
    description:
      'Data structures, programming, OOP, databases, operating systems, computer networks, and system design.',
    isExpandable: true,
  },
  {
    id: 'aptitude',
    title: 'Aptitude & Reasoning',
    description:
      'Quantitative aptitude, logical reasoning, verbal ability, and data interpretation.',
    href: '/student/preparation/aptitude',
  },
  {
    id: 'hr',
    title: 'HR & Behavioral',
    description:
      'HR questions, behavioral preparation, communication, and situational interviews.',
    href: '/student/preparation/hr',
  },
  {
    id: 'company-specific',
    title: 'Company-Specific',
    description:
      'Company-specific interview preparation, roles, assessments, and recruitment patterns.',
    href: '/student/preparation/company-specific',
  },
];

const technicalSubdivisions = [
  { id: 'concepts', title: 'Concepts', href: '/student/preparation/technical/concepts' },
  { id: 'languages', title: 'Languages', href: '/student/preparation/technical/languages' },
  { id: 'main-topics', title: 'Main Topics', href: '/student/preparation/technical/main-topics' },
];

export function PreparationSectionsList() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  return (
    <div className="border-t border-b border-[#222222] divide-y divide-[#222222]">
      {sections.map((sec) => {
        const isTechnical = sec.id === 'technical';
        const isExpanded = expanded === sec.id;

        const content = (
          <>
            <div className="space-y-1.5 min-w-0 flex-1">
              <h2 className="text-base font-medium text-[#EDEDED] group-hover:text-[#FF6B00] transition-colors">
                {sec.title}
              </h2>
              <p className="text-sm text-[#9AA1AA] leading-relaxed">
                {sec.description}
              </p>
            </div>
            <div className="shrink-0 flex items-center justify-center w-6 h-6">
              {isTechnical ? (
                isExpanded ? (
                  <ArrowRight className="h-4 w-4 text-[#FF6B00] rotate-90 transition-transform duration-200" />
                ) : (
                  <ArrowRight className="h-4 w-4 text-[#9AA1AA] group-hover:text-[#FF6B00] group-hover:translate-x-1 transition-all duration-200" />
                )
              ) : (
                <ArrowRight className="h-4 w-4 text-[#9AA1AA] group-hover:text-[#FF6B00] group-hover:translate-x-1 transition-all duration-200" />
              )}
            </div>
          </>
        );

        return (
          <div key={sec.id} className="flex flex-col">
            {isTechnical ? (
              <button
                onClick={() => toggleSection(sec.id)}
                className="group py-6 px-3 -mx-3 flex items-center justify-between gap-6 hover:bg-[#121212]/50 transition-colors text-left"
              >
                {content}
              </button>
            ) : (
              <Link
                href={sec.href!}
                className="group py-6 px-3 -mx-3 flex items-center justify-between gap-6 hover:bg-[#121212]/50 transition-colors"
              >
                {content}
              </Link>
            )}

            {/* Expandable Content for Technical */}
            {isTechnical && isExpanded && (
              <div className="pl-6 border-l-2 border-[#222222] ml-1 mb-4 flex flex-col gap-1">
                {technicalSubdivisions.map((sub) => (
                  <Link
                    key={sub.id}
                    href={sub.href}
                    className="group py-3 px-3 flex items-center gap-4 hover:bg-[#121212]/50 transition-colors rounded-sm"
                  >
                    <span className="text-sm font-medium text-[#EDEDED] group-hover:text-[#FF6B00] transition-colors">
                      {sub.title}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
