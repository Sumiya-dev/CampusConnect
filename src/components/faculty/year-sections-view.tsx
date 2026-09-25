'use client';

import { useState } from 'react';
import { FacultySectionSummary, SectionStudentsData } from '@/lib/types/faculty.types';
import { SectionStudentsView } from './section-students-view';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface YearSectionsViewProps {
  sections: FacultySectionSummary[];
  sectionsData: Record<string, SectionStudentsData>;
  initialSectionId?: string;
}

export function YearSectionsView({
  sections,
  sectionsData,
  initialSectionId,
}: YearSectionsViewProps) {
  // All sections collapsed by default; students visible only after clicking on a section
  const [openSectionId, setOpenSectionId] = useState<string | null>(
    initialSectionId || null
  );

  const toggleSection = (sectionId: string) => {
    setOpenSectionId((current) => (current === sectionId ? null : sectionId));
  };

  if (sections.length === 0) {
    return (
      <div className="py-6 text-sm text-[#9AA1AA]">
        No sections found for this academic year.
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#1D1D1D] border-t border-b border-[#1D1D1D]">
      {sections.map((sec) => {
        const isOpen = openSectionId === sec.id;
        const currentSectionData = sectionsData[sec.id];

        return (
          <div key={sec.id} className="transition-colors">
            {/* Section Header Row (Clickable) */}
            <button
              type="button"
              onClick={() => toggleSection(sec.id)}
              className="w-full flex items-center justify-between py-4 text-left group transition-colors focus:outline-none"
            >
              <span
                className={`text-base font-normal transition-colors ${
                  isOpen
                    ? 'text-[#FF6B00] font-medium'
                    : 'text-[#EDEDED] group-hover:text-[#FF6B00]'
                }`}
              >
                {sec.section_code}
              </span>

              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-[#FF6B00] transition-transform" />
              ) : (
                <ArrowRight className="h-4 w-4 text-[#9AA1AA] group-hover:text-[#FF6B00] group-hover:translate-x-0.5 transition-all" />
              )}
            </button>

            {/* Inline Expanded Section Roster (No separate page needed) */}
            {isOpen && (
              <div className="pt-2 pb-6 px-1 space-y-4 animate-in fade-in-50 duration-200">
                <div className="text-sm font-medium text-[#9AA1AA]">
                  Students
                </div>

                {currentSectionData ? (
                  <SectionStudentsView
                    students={currentSectionData.students}
                    availableGroups={currentSectionData.available_training_groups}
                  />
                ) : (
                  <div className="py-4 text-xs text-[#9AA1AA]">
                    No student records found for this section.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
