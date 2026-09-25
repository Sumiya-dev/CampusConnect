'use client';

import { useState, useMemo } from 'react';
import { SectionStudentItem } from '@/lib/types/faculty.types';
import { ChevronDown } from 'lucide-react';

interface SectionStudentsViewProps {
  students: SectionStudentItem[];
  availableGroups: { id: string; name: string }[];
}

export function SectionStudentsView({
  students,
  availableGroups,
}: SectionStudentsViewProps) {
  const [selectedTrainingId, setSelectedTrainingId] = useState<string>('ALL');

  const filteredStudents = useMemo(() => {
    if (selectedTrainingId === 'ALL') {
      return students;
    }
    return students.filter((s) =>
      s.training_groups.some((g) => g.id === selectedTrainingId)
    );
  }, [students, selectedTrainingId]);

  return (
    <div className="space-y-6">
      {/* Training Filter */}
      <div className="flex items-center gap-2 text-sm text-[#9AA1AA]">
        <span>Training:</span>
        <div className="relative inline-block">
          <select
            value={selectedTrainingId}
            onChange={(e) => setSelectedTrainingId(e.target.value)}
            className="appearance-none bg-[#0A0A0A] text-[#EDEDED] border border-[#222222] rounded px-3 py-1.5 pr-8 text-xs focus:outline-none focus:border-[#FF6B00] transition-colors cursor-pointer"
          >
            <option value="ALL">All Training</option>
            {availableGroups.map((group) => (
              <option key={group.id} value={group.id} className="bg-[#0A0A0A] text-[#EDEDED]">
                {group.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9AA1AA] pointer-events-none" />
        </div>
      </div>

      {/* Student List */}
      <div>
        {/* Table / List Header */}
        <div className="grid grid-cols-2 py-2.5 border-b border-[#222222] text-xs font-medium text-[#9AA1AA]">
          <span>Student Name</span>
          <span className="text-right">Student ID</span>
        </div>

        {/* Student Rows */}
        {filteredStudents.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#9AA1AA]">
            No students found in this section matching the selected training filter.
          </div>
        ) : (
          <div className="divide-y divide-[#161616]">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="grid grid-cols-2 py-3 text-sm transition-colors hover:bg-[#0A0A0A]"
              >
                <span className="text-[#EDEDED] font-normal">
                  {student.name}
                </span>
                <span className="text-right font-mono text-xs text-[#9AA1AA]">
                  {student.student_id}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
