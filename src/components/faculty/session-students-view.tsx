'use client';

import { useState, useMemo } from 'react';
import { SessionRegisteredStudent } from '@/lib/types/faculty.types';
import { ChevronDown } from 'lucide-react';

interface SessionStudentsViewProps {
  students: SessionRegisteredStudent[];
  availableGroups: { id: string; name: string }[];
}

export function SessionStudentsView({
  students,
  availableGroups,
}: SessionStudentsViewProps) {
  const [selectedTrainingId, setSelectedTrainingId] = useState<string>('ALL');

  const filteredStudents = useMemo(() => {
    if (selectedTrainingId === 'ALL') {
      return students;
    }
    return students.filter((s) =>
      s.training_groups.some(
        (g) => g.id === selectedTrainingId || g.name.toLowerCase() === selectedTrainingId.toLowerCase()
      )
    );
  }, [students, selectedTrainingId]);

  return (
    <div className="space-y-6">
      {/* Training Filter (Operates strictly on students registered for this session) */}
      {availableGroups.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>Training:</span>
          <div className="relative inline-block">
            <select
              value={selectedTrainingId}
              onChange={(e) => setSelectedTrainingId(e.target.value)}
              className="appearance-none bg-surface text-foreground border border-border rounded px-3 py-1.5 pr-8 text-xs focus:outline-none focus:border-accent transition-colors cursor-pointer"
            >
              <option value="ALL">All</option>
              {availableGroups.map((group) => (
                <option key={group.id} value={group.name} className="bg-surface text-foreground">
                  {group.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
          </div>
        </div>
      )}

      {/* Registered Students List */}
      <div>
        {/* Table / List Header */}
        <div className="grid grid-cols-2 py-2.5 border-b border-border text-xs font-medium text-muted">
          <span>Student Name</span>
          <span className="text-right">Student ID</span>
        </div>

        {/* Student Rows */}
        {filteredStudents.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted">
            No registered students match the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-[#161616]">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="grid grid-cols-2 py-3 text-sm transition-colors hover:bg-surface"
              >
                <span className="text-foreground font-normal">
                  {student.name}
                </span>
                <span className="text-right font-mono text-xs text-muted">
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
