'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  StudentPlacementRosterItem,
  StudentPlacementStats,
  StudentPlacementFilterOptions,
} from '@/lib/types/student-placement.types';
import { PlacementStatus } from '@/lib/types/database.types';
import { updateStudentPlacementStatusAction } from '@/lib/placements/student-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserCheck,
  AlertCircle,
  Eye,
  Loader2,
  Layers,
  Sparkles,
  Building,
} from 'lucide-react';

interface AdminStudentPlacementRosterProps {
  initialStudents: StudentPlacementRosterItem[];
  stats: StudentPlacementStats;
  filterOptions: StudentPlacementFilterOptions;
}

export function AdminStudentPlacementRoster({
  initialStudents,
  stats,
  filterOptions,
}: AdminStudentPlacementRosterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [academicYear, setAcademicYear] = useState<number | 'all'>('all');
  const [placementStatus, setPlacementStatus] = useState('all');
  const [companyId, setCompanyId] = useState('all');

  // Quick Status Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentPlacementRosterItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<PlacementStatus>('in_process');
  const [statusNotes, setStatusNotes] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Filter evaluation
  const filteredStudents = initialStudents.filter((student) => {
    if (search.trim()) {
      const term = search.toLowerCase().trim();
      const matchName = student.name.toLowerCase().includes(term);
      const matchId = student.studentId.toLowerCase().includes(term);
      const matchDept = student.department.toLowerCase().includes(term);
      const matchCompany = student.placedCompany?.toLowerCase().includes(term) ?? false;
      if (!matchName && !matchId && !matchDept && !matchCompany) return false;
    }

    if (department !== 'all' && student.department !== department) return false;
    if (academicYear !== 'all' && student.year !== academicYear) return false;
    if (placementStatus !== 'all' && student.placementStatus !== placementStatus) return false;

    if (companyId !== 'all') {
      const compName = filterOptions.companies.find((c) => c.id === companyId)?.name.toLowerCase();
      if (!compName || !student.placedCompany?.toLowerCase().includes(compName)) {
        return false;
      }
    }

    return true;
  });

  const openStatusModal = (student: StudentPlacementRosterItem) => {
    setSelectedStudent(student);
    setTargetStatus(student.placementStatus);
    setStatusNotes('');
    setModalError(null);
    setModalSuccess(null);
    setStatusModalOpen(true);
  };

  const handleUpdateStatus = () => {
    if (!selectedStudent) return;
    setModalError(null);
    setModalSuccess(null);

    startTransition(async () => {
      const res = await updateStudentPlacementStatusAction(
        selectedStudent.id,
        targetStatus,
        statusNotes
      );
      if (res.success) {
        setModalSuccess(res.message || 'Status updated successfully.');
        setTimeout(() => {
          setStatusModalOpen(false);
          router.refresh();
        }, 800);
      } else {
        setModalError(res.error || 'Failed to update placement status.');
      }
    });
  };

  const getStatusBadge = (status: PlacementStatus) => {
    switch (status) {
      case 'placed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Placed
          </span>
        );
      case 'in_process':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            In Process
          </span>
        );
      case 'opted_out':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-[#1F242C] text-[#9AA1AA] border border-[#2A313C]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#9AA1AA]" />
            Opted Out
          </span>
        );
      case 'unplaced':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-[#1A1A1A] text-[#EDEDED] border border-[#222222]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#9AA1AA]" />
            Unplaced
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#222222] pb-3">
        <Link href="/admin/placements">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#121212]"
          >
            <Briefcase className="h-3.5 w-3.5 mr-1.5" />
            Placement Drives
          </Button>
        </Link>
        <Link href="/admin/placements/students">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 bg-[#121212] border-[#222222] text-[#FF6B00] font-medium hover:bg-[#1A1A1A]"
          >
            <Users className="h-3.5 w-3.5 mr-1.5 text-[#FF6B00]" />
            Student Placement Roster
          </Button>
        </Link>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-md border border-[#222222] bg-[#0A0A0A]">
          <div className="text-xs text-[#9AA1AA]">Total Candidates</div>
          <div className="text-lg font-semibold text-[#EDEDED] mt-1">{stats.totalStudents}</div>
          <div className="text-[11px] text-[#9AA1AA] mt-0.5">Enrolled batch</div>
        </div>

        <div className="p-3.5 rounded-md border border-[#222222] bg-[#0A0A0A]">
          <div className="text-xs text-[#9AA1AA]">Placed Candidates</div>
          <div className="text-lg font-semibold text-emerald-400 mt-1">{stats.placedStudents}</div>
          <div className="text-[11px] text-[#9AA1AA] mt-0.5">Rate: {stats.placementRate}%</div>
        </div>

        <div className="p-3.5 rounded-md border border-[#222222] bg-[#0A0A0A]">
          <div className="text-xs text-[#9AA1AA]">In Pipeline</div>
          <div className="text-lg font-semibold text-amber-400 mt-1">{stats.inProcessStudents}</div>
          <div className="text-[11px] text-[#9AA1AA] mt-0.5">Shortlisted / Interview</div>
        </div>

        <div className="p-3.5 rounded-md border border-[#222222] bg-[#0A0A0A]">
          <div className="text-xs text-[#9AA1AA]">Unplaced</div>
          <div className="text-lg font-semibold text-[#EDEDED] mt-1">{stats.unplacedStudents}</div>
          <div className="text-[11px] text-[#9AA1AA] mt-0.5">Seeking placement</div>
        </div>

        <div className="p-3.5 rounded-md border border-[#222222] bg-[#0A0A0A]">
          <div className="text-xs text-[#9AA1AA]">Total Applications</div>
          <div className="text-lg font-semibold text-[#EDEDED] mt-1">{stats.totalApplications}</div>
          <div className="text-[11px] text-[#9AA1AA] mt-0.5">Submitted submissions</div>
        </div>

        <div className="p-3.5 rounded-md border border-[#222222] bg-[#0A0A0A]">
          <div className="text-xs text-[#9AA1AA]">Total Offers</div>
          <div className="text-lg font-semibold text-[#FF6B00] mt-1">{stats.totalOffers}</div>
          <div className="text-[11px] text-[#9AA1AA] mt-0.5">Selected & Placed</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9AA1AA]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate by name, university roll number, department, or company..."
              className="pl-9 text-xs h-9 bg-[#121212] border-[#222222] text-[#EDEDED] placeholder:text-[#9AA1AA]/60"
            />
          </div>

          {(search || department !== 'all' || academicYear !== 'all' || placementStatus !== 'all' || companyId !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setDepartment('all');
                setAcademicYear('all');
                setPlacementStatus('all');
                setCompanyId('all');
              }}
              className="text-xs h-9 text-[#9AA1AA] hover:text-[#EDEDED]"
            >
              Reset Filters
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Department Filter */}
          <div>
            <label className="text-[11px] text-[#9AA1AA] block mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full text-xs h-8 rounded border border-[#222222] bg-[#121212] text-[#EDEDED] px-2 focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="all">All Departments</option>
              {filterOptions.departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Year Filter */}
          <div>
            <label className="text-[11px] text-[#9AA1AA] block mb-1">Academic Year</label>
            <select
              value={academicYear}
              onChange={(e) =>
                setAcademicYear(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="w-full text-xs h-8 rounded border border-[#222222] bg-[#121212] text-[#EDEDED] px-2 focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="all">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year (Graduating)</option>
            </select>
          </div>

          {/* Placement Status Filter */}
          <div>
            <label className="text-[11px] text-[#9AA1AA] block mb-1">Placement Status</label>
            <select
              value={placementStatus}
              onChange={(e) => setPlacementStatus(e.target.value)}
              className="w-full text-xs h-8 rounded border border-[#222222] bg-[#121212] text-[#EDEDED] px-2 focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="all">All Statuses</option>
              <option value="placed">Placed</option>
              <option value="in_process">In Process</option>
              <option value="unplaced">Unplaced</option>
              <option value="opted_out">Opted Out</option>
            </select>
          </div>

          {/* Recruiter / Company Filter */}
          <div>
            <label className="text-[11px] text-[#9AA1AA] block mb-1">Company Offer</label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full text-xs h-8 rounded border border-[#222222] bg-[#121212] text-[#EDEDED] px-2 focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="all">All Companies</option>
              {filterOptions.companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Candidate Table */}
      <div className="rounded-md border border-[#222222] bg-[#0A0A0A] overflow-hidden">
        <div className="p-4 border-b border-[#222222] flex items-center justify-between">
          <div className="text-xs font-medium text-[#9AA1AA]">
            Showing <span className="text-[#EDEDED] font-mono">{filteredStudents.length}</span> students
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="h-8 w-8 text-[#9AA1AA] mx-auto opacity-40" />
            <div className="text-sm font-medium text-[#EDEDED]">No Student Candidates Found</div>
            <p className="text-xs text-[#9AA1AA] max-w-sm mx-auto">
              No students match the current search or filters. Try adjusting your query parameters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#222222] bg-[#121212] text-[#9AA1AA] uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Candidate</th>
                  <th className="py-3 px-4 font-semibold">Department & Year</th>
                  <th className="py-3 px-4 font-semibold">CGPA</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Applications Pipeline</th>
                  <th className="py-3 px-4 font-semibold">Offer / Placement</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222] text-[#EDEDED]">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-[#121212]/50 transition-colors">
                    {/* Student Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-[#1A1A1A] border border-[#222222] flex items-center justify-center text-xs font-semibold text-[#FF6B00]">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-[#EDEDED] hover:text-[#FF6B00] transition-colors">
                            <Link href={`/admin/placements/students/${student.id}`}>
                              {student.name}
                            </Link>
                          </div>
                          <div className="text-[11px] text-[#9AA1AA] font-mono">
                            {student.studentId}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4">
                      <div className="text-[#EDEDED] font-medium">{student.department}</div>
                      <div className="text-[11px] text-[#9AA1AA]">
                        Year {student.year}
                        {student.sectionName ? ` • Section ${student.sectionName}` : ''}
                      </div>
                    </td>

                    {/* CGPA */}
                    <td className="py-3 px-4 font-mono font-medium">
                      <span
                        className={
                          student.cgpa >= 8.5
                            ? 'text-emerald-400'
                            : student.cgpa >= 7.0
                            ? 'text-[#EDEDED]'
                            : 'text-amber-400'
                        }
                      >
                        {student.cgpa.toFixed(2)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">{getStatusBadge(student.placementStatus)}</td>

                    {/* Applications Pipeline Breakdown */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          title="Total Drives Applied"
                          className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-[#121212] border border-[#222222] text-[#EDEDED]"
                        >
                          <Briefcase className="h-2.5 w-2.5 text-[#9AA1AA]" />
                          {student.totalApplications} applied
                        </span>

                        {student.shortlistedCount > 0 && (
                          <span
                            title="Shortlisted Drives"
                            className="inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          >
                            {student.shortlistedCount} SL
                          </span>
                        )}

                        {student.interviewCount > 0 && (
                          <span
                            title="Interview Stages"
                            className="inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          >
                            {student.interviewCount} INT
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Placed Info */}
                    <td className="py-3 px-4">
                      {student.placedCompany ? (
                        <div>
                          <div className="font-medium text-emerald-400 flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {student.placedCompany}
                          </div>
                          {student.placedPackage && (
                            <div className="text-[11px] font-mono text-[#FF6B00]">
                              {student.placedPackage}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#9AA1AA] text-xs">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openStatusModal(student)}
                          className="h-7 text-xs px-2 text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#121212]"
                          title="Quick update placement status"
                        >
                          Status
                        </Button>
                        <Link href={`/admin/placements/students/${student.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2.5 border-[#222222] text-[#EDEDED] hover:border-[#FF6B00] hover:text-[#FF6B00]"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Dossier
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Placement Status Modal */}
      {statusModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-md border border-[#222222] bg-[#0A0A0A] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="text-sm font-semibold text-[#EDEDED] flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-[#FF6B00]" />
                Update Placement Status
              </div>
              <button
                onClick={() => setStatusModalOpen(false)}
                className="text-xs text-[#9AA1AA] hover:text-[#EDEDED]"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded bg-[#121212] border border-[#222222] text-xs space-y-1">
              <div className="font-medium text-[#EDEDED]">{selectedStudent.name}</div>
              <div className="text-[#9AA1AA] font-mono">
                {selectedStudent.studentId} • {selectedStudent.department} (Year {selectedStudent.year})
              </div>
              <div className="text-[#9AA1AA]">
                Current status:{' '}
                <span className="font-semibold text-[#EDEDED] uppercase">
                  {selectedStudent.placementStatus}
                </span>
              </div>
            </div>

            {modalError && (
              <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {modalSuccess && (
              <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#9AA1AA] block mb-1.5">New Placement Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as PlacementStatus)}
                  className="w-full text-xs h-9 rounded border border-[#222222] bg-[#121212] text-[#EDEDED] px-3 focus:outline-none focus:border-[#FF6B00]"
                >
                  <option value="unplaced">Unplaced (Actively Seeking)</option>
                  <option value="in_process">In Process (Interviewing / Shortlisted)</option>
                  <option value="placed">Placed (Offer Accepted)</option>
                  <option value="opted_out">Opted Out (Higher Studies / Family)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#9AA1AA] block mb-1.5">
                  Administrative Reason / Audit Note (Optional)
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Reason for manual status update..."
                  rows={2}
                  className="w-full text-xs rounded border border-[#222222] bg-[#121212] text-[#EDEDED] p-2.5 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusModalOpen(false)}
                disabled={isPending}
                className="text-xs h-8 text-[#9AA1AA] hover:text-[#EDEDED]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUpdateStatus}
                disabled={isPending}
                className="text-xs h-8 bg-[#FF6B00] text-black font-medium hover:bg-[#E05E00]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Confirm Update'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
