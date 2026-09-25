'use client';

import { useState, useMemo } from 'react';
import { EnrolledStudent } from '@/lib/types/faculty.types';
import { Search, Filter } from 'lucide-react';

interface ClassRosterViewProps {
  students: EnrolledStudent[];
  availableGroups: { id: string; name: string; count?: number }[];
}

export function ClassRosterView({ students, availableGroups }: ClassRosterViewProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // Group filter
      if (selectedGroupId !== 'ALL') {
        const hasGroup = student.training_groups.some((g) => g.id === selectedGroupId);
        if (!hasGroup) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = student.name.toLowerCase().includes(query);
        const matchesId = (student.student_id || '').toLowerCase().includes(query);
        const matchesEmail = (student.email || '').toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesEmail) return false;
      }

      return true;
    });
  }, [students, selectedGroupId, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Controls: Training Group Selector & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0A0A0A] p-4 rounded-md border border-[#222222]">
        {/* Filter by Training Group */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs uppercase font-mono tracking-wider text-[#9AA1AA] flex items-center gap-1.5 shrink-0">
            <Filter className="h-3.5 w-3.5 text-[#FF6B00]" />
            Training Group:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedGroupId('ALL')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                selectedGroupId === 'ALL'
                  ? 'bg-[#FF6B00] text-black font-medium'
                  : 'bg-[#161616] text-[#9AA1AA] hover:text-[#EDEDED] border border-[#262626]'
              }`}
            >
              All Students ({students.length})
            </button>
            {availableGroups.map((group) => {
              const countInThisGroup = students.filter((s) =>
                s.training_groups.some((g) => g.id === group.id)
              ).length;

              return (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    selectedGroupId === group.id
                      ? 'bg-[#FF6B00] text-black font-medium'
                      : 'bg-[#161616] text-[#9AA1AA] hover:text-[#EDEDED] border border-[#262626]'
                  }`}
                >
                  {group.name} ({countInThisGroup})
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9AA1AA]" />
          <input
            type="text"
            placeholder="Search student or roll #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#000000] border border-[#262626] rounded text-xs text-[#EDEDED] placeholder-[#9AA1AA]/60 focus:outline-none focus:border-[#FF6B00] transition-colors"
          />
        </div>
      </div>

      {/* Roster Header */}
      <div className="flex items-center justify-between text-xs text-[#9AA1AA] px-1">
        <span>
          Showing <span className="text-[#EDEDED] font-medium">{filteredStudents.length}</span> of {students.length} students
        </span>
        {selectedGroupId !== 'ALL' && (
          <span className="text-[#FF6B00]">
            Filtered by:{' '}
            {availableGroups.find((g) => g.id === selectedGroupId)?.name}
          </span>
        )}
      </div>

      {/* Students List Table */}
      {filteredStudents.length === 0 ? (
        <div className="p-8 border border-[#222222] rounded-md bg-[#0A0A0A] text-center text-sm text-[#9AA1AA]">
          No students match the selected filter or search criteria.
        </div>
      ) : (
        <div className="border border-[#222222] rounded-md bg-[#0A0A0A] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#222222] bg-[#000000]/60 text-[#9AA1AA] uppercase tracking-wider font-mono">
                  <th className="py-3 px-4 font-medium">Roll No</th>
                  <th className="py-3 px-4 font-medium">Student Name</th>
                  <th className="py-3 px-4 font-medium">Department & Year</th>
                  <th className="py-3 px-4 font-medium">Section</th>
                  <th className="py-3 px-4 font-medium">Enrolled Training Groups</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D1D1D]">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-[#121212] transition-colors text-[#EDEDED]"
                  >
                    <td className="py-3 px-4 font-mono text-[#9AA1AA]">
                      {student.student_id || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#EDEDED]">{student.name}</div>
                      <div className="text-[11px] text-[#9AA1AA]">{student.email}</div>
                    </td>
                    <td className="py-3 px-4 text-[#9AA1AA]">
                      {student.department} • Year {student.year}
                    </td>
                    <td className="py-3 px-4 text-[#EDEDED] font-medium">
                      {student.section_name}
                    </td>
                    <td className="py-3 px-4">
                      {student.training_groups.length === 0 ? (
                        <span className="text-[#9AA1AA]/60 text-[11px]">Not enrolled</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {student.training_groups.map((g) => (
                            <span
                              key={g.id}
                              className="px-2 py-0.5 rounded text-[11px] bg-[#161616] border border-[#2E2E2E] text-[#D4D4D4]"
                            >
                              {g.name}
                            </span>
                          ))}
                        </div>
                      )}
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
