'use client';

import { useState, useMemo } from 'react';
import { EnrolledStudent, TrainingGroupSectionBreakdown } from '@/lib/types/faculty.types';
import { Search, Filter } from 'lucide-react';

interface TrainingGroupRosterViewProps {
  students: EnrolledStudent[];
  sectionBreakdown: TrainingGroupSectionBreakdown[];
}

export function TrainingGroupRosterView({
  students,
  sectionBreakdown,
}: TrainingGroupRosterViewProps) {
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // Section filter
      if (selectedSection !== 'ALL') {
        if (student.section_name !== selectedSection) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = student.name.toLowerCase().includes(query);
        const matchesId = (student.student_id || '').toLowerCase().includes(query);
        const matchesEmail = (student.email || '').toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesEmail) return false;
      }

      return true;
    });
  }, [students, selectedSection, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Controls: Section Filter Chips & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-4 rounded-md border border-border">
        {/* Filter by Section */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs uppercase font-mono tracking-wider text-muted flex items-center gap-1.5 shrink-0">
            <Filter className="h-3.5 w-3.5 text-accent" />
            Section Filter:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedSection('ALL')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                selectedSection === 'ALL'
                  ? 'bg-accent text-black font-medium'
                  : 'bg-[#161616] text-muted hover:text-foreground border border-[#262626]'
              }`}
            >
              All Sections ({students.length})
            </button>
            {sectionBreakdown.map((sec) => (
              <button
                key={sec.section_id || sec.section_name}
                onClick={() => setSelectedSection(sec.section_name)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  selectedSection === sec.section_name
                    ? 'bg-accent text-black font-medium'
                    : 'bg-[#161616] text-muted hover:text-foreground border border-[#262626]'
                }`}
              >
                {sec.section_name} ({sec.count})
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
          <input
            type="text"
            placeholder="Search student or roll #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-background border border-[#262626] rounded text-xs text-foreground placeholder-muted/60 focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* Roster Header */}
      <div className="flex items-center justify-between text-xs text-muted px-1">
        <span>
          Showing <span className="text-foreground font-medium">{filteredStudents.length}</span> of {students.length} students
        </span>
        {selectedSection !== 'ALL' && (
          <span className="text-accent">
            Filtered by: {selectedSection}
          </span>
        )}
      </div>

      {/* Students List Table */}
      {filteredStudents.length === 0 ? (
        <div className="p-8 border border-border rounded-md bg-surface text-center text-sm text-muted">
          No students match the selected filter or search criteria.
        </div>
      ) : (
        <div className="border border-border rounded-md bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-background/60 text-muted uppercase tracking-wider font-mono">
                  <th className="py-3 px-4 font-medium">Roll No</th>
                  <th className="py-3 px-4 font-medium">Student Name</th>
                  <th className="py-3 px-4 font-medium">Department</th>
                  <th className="py-3 px-4 font-medium">Year</th>
                  <th className="py-3 px-4 font-medium">Assigned Section</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D1D1D]">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-elevated transition-colors text-foreground"
                  >
                    <td className="py-3 px-4 font-mono text-muted">
                      {student.student_id || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{student.name}</div>
                      <div className="text-[11px] text-muted">{student.email}</div>
                    </td>
                    <td className="py-3 px-4 text-muted">
                      {student.department}
                    </td>
                    <td className="py-3 px-4 text-muted">
                      Year {student.year}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#161616] border border-[#262626] text-accent">
                        {student.section_name}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
