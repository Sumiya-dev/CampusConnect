'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  AnalyticsFilterOptions,
  PlacementAnalyticsReportData,
} from '@/lib/types/reports.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Building,
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  GraduationCap,
  Layers,
  Search,
  UserCheck,
  TrendingUp,
  FileSpreadsheet,
  RotateCcw,
  Award,
  ChevronRight,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  data: PlacementAnalyticsReportData;
  activeFilters: AnalyticsFilterOptions;
}

export function AnalyticsDashboard({
  data,
  activeFilters,
}: AnalyticsDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<
    'departments' | 'companies' | 'years' | 'drives' | 'students'
  >('departments');

  // Search filter for student report
  const [studentSearch, setStudentSearch] = useState('');

  const { overview, departmentStats, companyStats, yearStats, driveStats, studentRows, metadata } =
    data;

  // Filter change handler
  const handleFilterChange = (key: keyof AnalyticsFilterOptions, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleResetFilters = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters =
    Boolean(activeFilters.department && activeFilters.department !== 'all') ||
    Boolean(activeFilters.program_id && activeFilters.program_id !== 'all') ||
    Boolean(activeFilters.year && activeFilters.year !== 'all') ||
    Boolean(activeFilters.company_id && activeFilters.company_id !== 'all') ||
    Boolean(activeFilters.drive_id && activeFilters.drive_id !== 'all') ||
    Boolean(activeFilters.placement_status && activeFilters.placement_status !== 'all');

  // CSV Exporter
  const exportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const escapeCsv = (str: string | number) => {
      const s = String(str ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.map(escapeCsv).join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join(
        '\n'
      );

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered student roster for search
  const filteredStudents = studentRows.filter((s) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase().trim();
    return (
      s.studentRollNumber.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. OVERVIEW KPIS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <div className="border border-[#222222] bg-[#121212] p-3.5 rounded-md">
          <div className="text-[11px] text-[#9AA1AA] flex items-center justify-between">
            <span>Students</span>
            <Users className="h-3 w-3 text-[#FF6B00]" />
          </div>
          <div className="text-lg font-bold font-mono text-[#EDEDED] mt-1.5">
            {overview.totalStudents}
          </div>
        </div>

        <div className="border border-[#222222] bg-[#121212] p-3.5 rounded-md">
          <div className="text-[11px] text-[#9AA1AA] flex items-center justify-between">
            <span>Placed</span>
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1.5">
            {overview.placedStudents}
          </div>
        </div>

        <div className="border border-[#222222] bg-[#121212] p-3.5 rounded-md">
          <div className="text-[11px] text-[#9AA1AA] flex items-center justify-between">
            <span>Unplaced</span>
            <Clock className="h-3 w-3 text-amber-400" />
          </div>
          <div className="text-lg font-bold font-mono text-amber-400 mt-1.5">
            {overview.unplacedStudents}
          </div>
        </div>

        <div className="border border-[#222222] bg-[#121212] p-3.5 rounded-md">
          <div className="text-[11px] text-[#9AA1AA] flex items-center justify-between">
            <span>Placement %</span>
            <TrendingUp className="h-3 w-3 text-[#FF6B00]" />
          </div>
          <div className="text-lg font-bold font-mono text-[#FF6B00] mt-1.5">
            {overview.placementPercentage}%
          </div>
        </div>

        <div className="border border-[#222222] bg-[#121212] p-3.5 rounded-md">
          <div className="text-[11px] text-[#9AA1AA] flex items-center justify-between">
            <span>Companies</span>
            <Building className="h-3 w-3 text-neutral-400" />
          </div>
          <div className="text-lg font-bold font-mono text-[#EDEDED] mt-1.5">
            {overview.totalCompanies}
          </div>
        </div>

        <div className="border border-[#222222] bg-[#121212] p-3.5 rounded-md">
          <div className="text-[11px] text-[#9AA1AA] flex items-center justify-between">
            <span>Drives</span>
            <Briefcase className="h-3 w-3 text-neutral-400" />
          </div>
          <div className="text-lg font-bold font-mono text-[#EDEDED] mt-1.5">
            {overview.totalDrives}
          </div>
        </div>

        <div className="border border-[#222222] bg-[#121212] p-3.5 rounded-md">
          <div className="text-[11px] text-[#9AA1AA] flex items-center justify-between">
            <span>Applications</span>
            <Layers className="h-3 w-3 text-sky-400" />
          </div>
          <div className="text-lg font-bold font-mono text-sky-400 mt-1.5">
            {overview.totalApplications}
          </div>
        </div>

        <div className="border border-[#222222] bg-[#121212] p-3.5 rounded-md">
          <div className="text-[11px] text-[#9AA1AA] flex items-center justify-between">
            <span>Selections</span>
            <Award className="h-3 w-3 text-purple-400" />
          </div>
          <div className="text-lg font-bold font-mono text-purple-400 mt-1.5">
            {overview.totalSelections}
          </div>
        </div>
      </div>

      {/* 2. PLACEMENT STATUS DISTRIBUTION BAR */}
      <div className="border border-[#222222] bg-[#121212] p-4 rounded-md space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#EDEDED] uppercase tracking-wider font-mono">
            Candidate Cohort Status Distribution
          </span>
          <span className="text-[#9AA1AA] font-mono text-[11px]">
            {overview.totalStudents} total student records in active filter pool
          </span>
        </div>

        {/* Visual progress bar */}
        <div className="h-2.5 w-full bg-[#1A1A1A] rounded-full overflow-hidden flex">
          {overview.totalStudents > 0 ? (
            <>
              <div
                style={{ width: `${(overview.placedStudents / overview.totalStudents) * 100}%` }}
                className="bg-emerald-500 h-full"
                title={`Placed: ${overview.placedStudents}`}
              />
              <div
                style={{ width: `${(overview.inProcessStudents / overview.totalStudents) * 100}%` }}
                className="bg-[#FF6B00] h-full"
                title={`In Process: ${overview.inProcessStudents}`}
              />
              <div
                style={{ width: `${(overview.unplacedStudents / overview.totalStudents) * 100}%` }}
                className="bg-amber-500 h-full"
                title={`Unplaced: ${overview.unplacedStudents}`}
              />
              <div
                style={{ width: `${(overview.optedOutStudents / overview.totalStudents) * 100}%` }}
                className="bg-neutral-600 h-full"
                title={`Opted Out: ${overview.optedOutStudents}`}
              />
            </>
          ) : (
            <div className="w-full bg-[#222222] h-full" />
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] font-mono text-[#9AA1AA]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            Placed: {overview.placedStudents} (
            {overview.totalStudents > 0
              ? Math.round((overview.placedStudents / overview.totalStudents) * 100)
              : 0}
            %)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#FF6B00] inline-block" />
            In Process: {overview.inProcessStudents} (
            {overview.totalStudents > 0
              ? Math.round((overview.inProcessStudents / overview.totalStudents) * 100)
              : 0}
            %)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
            Unplaced: {overview.unplacedStudents} (
            {overview.totalStudents > 0
              ? Math.round((overview.unplacedStudents / overview.totalStudents) * 100)
              : 0}
            %)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-neutral-600 inline-block" />
            Opted Out: {overview.optedOutStudents} (
            {overview.totalStudents > 0
              ? Math.round((overview.optedOutStudents / overview.totalStudents) * 100)
              : 0}
            %)
          </span>
        </div>
      </div>

      {/* 3. MULTI-DIMENSIONAL FILTERS BAR */}
      <div className="border border-[#222222] bg-[#121212] p-4 rounded-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-[#FF6B00]" />
            <span className="text-xs font-semibold text-[#EDEDED] uppercase tracking-wider font-mono">
              Analytics Filter Dimensions
            </span>
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              disabled={isPending}
              className="h-7 px-2 text-xs border-[#222222] bg-[#0A0A0A] hover:bg-[#1A1A1A] text-[#9AA1AA] hover:text-[#EDEDED]"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset All Filters
            </Button>
          )}
        </div>

        {/* 6 Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          {/* Department */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-[#9AA1AA] block">
              Department
            </label>
            <select
              value={activeFilters.department || 'all'}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              disabled={isPending}
              className="w-full h-8 px-2 rounded bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] focus:border-[#FF6B00] outline-none"
            >
              <option value="all">All Departments</option>
              {metadata.departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Program / Branch */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-[#9AA1AA] block">
              Program / Branch
            </label>
            <select
              value={activeFilters.program_id || 'all'}
              onChange={(e) => handleFilterChange('program_id', e.target.value)}
              disabled={isPending}
              className="w-full h-8 px-2 rounded bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] focus:border-[#FF6B00] outline-none"
            >
              <option value="all">All Programs</option>
              {metadata.programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          {/* Academic Year */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-[#9AA1AA] block">
              Academic Year
            </label>
            <select
              value={activeFilters.year || 'all'}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              disabled={isPending}
              className="w-full h-8 px-2 rounded bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] focus:border-[#FF6B00] outline-none"
            >
              <option value="all">All Years</option>
              {metadata.academicYears.map((y) => (
                <option key={y.id} value={y.year_number}>
                  {y.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* Company */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-[#9AA1AA] block">
              Recruiter / Company
            </label>
            <select
              value={activeFilters.company_id || 'all'}
              onChange={(e) => handleFilterChange('company_id', e.target.value)}
              disabled={isPending}
              className="w-full h-8 px-2 rounded bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] focus:border-[#FF6B00] outline-none"
            >
              <option value="all">All Recruiters</option>
              {metadata.companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          </div>

          {/* Placement Drive */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-[#9AA1AA] block">
              Placement Drive
            </label>
            <select
              value={activeFilters.drive_id || 'all'}
              onChange={(e) => handleFilterChange('drive_id', e.target.value)}
              disabled={isPending}
              className="w-full h-8 px-2 rounded bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] focus:border-[#FF6B00] outline-none"
            >
              <option value="all">All Drives</option>
              {metadata.drives.map((dr) => (
                <option key={dr.id} value={dr.id}>
                  {dr.company_name} - {dr.job_role}
                </option>
              ))}
            </select>
          </div>

          {/* Placement Status */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-[#9AA1AA] block">
              Placement Status
            </label>
            <select
              value={activeFilters.placement_status || 'all'}
              onChange={(e) => handleFilterChange('placement_status', e.target.value)}
              disabled={isPending}
              className="w-full h-8 px-2 rounded bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] focus:border-[#FF6B00] outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="placed">Placed</option>
              <option value="in_process">In Process</option>
              <option value="unplaced">Unplaced</option>
              <option value="opted_out">Opted Out</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. REPORTS TABS AND NAVIGATION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#222222] pb-3">
          {/* Tab buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-colors border ${
                activeTab === 'departments'
                  ? 'bg-[#FF6B00] text-black border-[#FF6B00] font-semibold'
                  : 'bg-[#0A0A0A] text-[#9AA1AA] border-[#222222] hover:bg-[#161616]'
              }`}
            >
              Department Report
            </button>

            <button
              onClick={() => setActiveTab('companies')}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-colors border ${
                activeTab === 'companies'
                  ? 'bg-[#FF6B00] text-black border-[#FF6B00] font-semibold'
                  : 'bg-[#0A0A0A] text-[#9AA1AA] border-[#222222] hover:bg-[#161616]'
              }`}
            >
              Company Report
            </button>

            <button
              onClick={() => setActiveTab('years')}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-colors border ${
                activeTab === 'years'
                  ? 'bg-[#FF6B00] text-black border-[#FF6B00] font-semibold'
                  : 'bg-[#0A0A0A] text-[#9AA1AA] border-[#222222] hover:bg-[#161616]'
              }`}
            >
              Academic Year Report
            </button>

            <button
              onClick={() => setActiveTab('drives')}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-colors border ${
                activeTab === 'drives'
                  ? 'bg-[#FF6B00] text-black border-[#FF6B00] font-semibold'
                  : 'bg-[#0A0A0A] text-[#9AA1AA] border-[#222222] hover:bg-[#161616]'
              }`}
            >
              Drive Performance
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-colors border ${
                activeTab === 'students'
                  ? 'bg-[#FF6B00] text-black border-[#FF6B00] font-semibold'
                  : 'bg-[#0A0A0A] text-[#9AA1AA] border-[#222222] hover:bg-[#161616]'
              }`}
            >
              Student Placement Roster ({studentRows.length})
            </button>
          </div>

          {/* CSV Export for Active Tab */}
          <div>
            {activeTab === 'departments' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportCSV(
                    'Department_Placement_Report',
                    [
                      'Department',
                      'Total Students',
                      'Placed Students',
                      'Unplaced Students',
                      'In Process',
                      'Placement %',
                      'Applications',
                      'Selections',
                    ],
                    departmentStats.map((d) => [
                      d.department,
                      d.totalStudents,
                      d.placedStudents,
                      d.unplacedStudents,
                      d.inProcessStudents,
                      `${d.placementPercentage}%`,
                      d.totalApplications,
                      d.totalSelections,
                    ])
                  )
                }
                className="h-8 text-xs border-[#222222] bg-[#121212] hover:bg-[#1A1A1A] text-[#EDEDED]"
              >
                <Download className="h-3.5 w-3.5 mr-1.5 text-[#9AA1AA]" />
                Export CSV
              </Button>
            )}

            {activeTab === 'companies' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportCSV(
                    'Company_Placement_Report',
                    [
                      'Company Name',
                      'Industry',
                      'Total Drives',
                      'Applications',
                      'Shortlisted',
                      'Selections',
                    ],
                    companyStats.map((c) => [
                      c.companyName,
                      c.industry,
                      c.drivesCount,
                      c.applicationsCount,
                      c.shortlistedCount,
                      c.selectionsCount,
                    ])
                  )
                }
                className="h-8 text-xs border-[#222222] bg-[#121212] hover:bg-[#1A1A1A] text-[#EDEDED]"
              >
                <Download className="h-3.5 w-3.5 mr-1.5 text-[#9AA1AA]" />
                Export CSV
              </Button>
            )}

            {activeTab === 'years' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportCSV(
                    'Academic_Year_Report',
                    [
                      'Academic Year',
                      'Total Students',
                      'Placed Students',
                      'Unplaced Students',
                      'Placement %',
                      'Applications',
                      'Selections',
                    ],
                    yearStats.map((y) => [
                      y.yearLabel,
                      y.totalStudents,
                      y.placedStudents,
                      y.unplacedStudents,
                      `${y.placementPercentage}%`,
                      y.totalApplications,
                      y.totalSelections,
                    ])
                  )
                }
                className="h-8 text-xs border-[#222222] bg-[#121212] hover:bg-[#1A1A1A] text-[#EDEDED]"
              >
                <Download className="h-3.5 w-3.5 mr-1.5 text-[#9AA1AA]" />
                Export CSV
              </Button>
            )}

            {activeTab === 'drives' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportCSV(
                    'Drive_Performance_Report',
                    [
                      'Recruiter',
                      'Job Role',
                      'Tier',
                      'Status',
                      'Applications',
                      'Shortlisted',
                      'Interview Round',
                      'Selections',
                      'Conversion %',
                    ],
                    driveStats.map((d) => [
                      d.companyName,
                      d.jobRole,
                      d.tier,
                      d.status,
                      d.applicationsCount,
                      d.shortlistedCount,
                      d.interviewCount,
                      d.selectionsCount,
                      `${d.conversionRate}%`,
                    ])
                  )
                }
                className="h-8 text-xs border-[#222222] bg-[#121212] hover:bg-[#1A1A1A] text-[#EDEDED]"
              >
                <Download className="h-3.5 w-3.5 mr-1.5 text-[#9AA1AA]" />
                Export CSV
              </Button>
            )}

            {activeTab === 'students' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportCSV(
                    'Student_Placement_Status_Report',
                    [
                      'Registration / Roll No',
                      'Candidate Name',
                      'Department',
                      'Year',
                      'CGPA',
                      'Placement Status',
                      'Applications Count',
                      'Placed Recruiter',
                      'Placed Role',
                    ],
                    filteredStudents.map((s) => [
                      s.studentRollNumber,
                      s.name,
                      s.department,
                      s.year,
                      s.cgpa,
                      s.placementStatus,
                      s.applicationsCount,
                      s.placedCompany || '—',
                      s.placedRole || '—',
                    ])
                  )
                }
                className="h-8 text-xs border-[#222222] bg-[#121212] hover:bg-[#1A1A1A] text-[#EDEDED]"
              >
                <Download className="h-3.5 w-3.5 mr-1.5 text-[#9AA1AA]" />
                Export CSV
              </Button>
            )}
          </div>
        </div>

        {/* TAB 1: DEPARTMENT PLACEMENT REPORT */}
        {activeTab === 'departments' && (
          <div className="border border-[#222222] bg-[#0A0A0A] rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121212] text-[#9AA1AA] uppercase tracking-wider border-b border-[#222222]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Academic Department</th>
                    <th className="py-3 px-4 font-semibold text-right">Students</th>
                    <th className="py-3 px-4 font-semibold text-right">Placed</th>
                    <th className="py-3 px-4 font-semibold text-right">In Process</th>
                    <th className="py-3 px-4 font-semibold text-right">Unplaced</th>
                    <th className="py-3 px-4 font-semibold text-right">Placement Rate</th>
                    <th className="py-3 px-4 font-semibold text-right">Applications</th>
                    <th className="py-3 px-4 font-semibold text-right">Selections</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A] text-[#EDEDED]">
                  {departmentStats.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#9AA1AA]">
                        No departmental records matching current filter scope.
                      </td>
                    </tr>
                  ) : (
                    departmentStats.map((d) => (
                      <tr key={d.department} className="hover:bg-[#121212] transition-colors">
                        <td className="py-3 px-4 font-medium text-[#EDEDED]">{d.department}</td>
                        <td className="py-3 px-4 text-right font-mono text-[#9AA1AA]">
                          {d.totalStudents}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400 font-semibold">
                          {d.placedStudents}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#FF6B00]">
                          {d.inProcessStudents}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-amber-400">
                          {d.unplacedStudents}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-mono font-semibold text-emerald-400">
                            {d.placementPercentage}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-sky-400">
                          {d.totalApplications}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-purple-400 font-semibold">
                          {d.totalSelections}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: COMPANY PLACEMENT REPORT */}
        {activeTab === 'companies' && (
          <div className="border border-[#222222] bg-[#0A0A0A] rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121212] text-[#9AA1AA] uppercase tracking-wider border-b border-[#222222]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Recruiting Enterprise</th>
                    <th className="py-3 px-4 font-semibold">Industry Sector</th>
                    <th className="py-3 px-4 font-semibold text-right">Active Drives</th>
                    <th className="py-3 px-4 font-semibold text-right">Total Applications</th>
                    <th className="py-3 px-4 font-semibold text-right">Shortlisted</th>
                    <th className="py-3 px-4 font-semibold text-right">Final Selections</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A] text-[#EDEDED]">
                  {companyStats.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#9AA1AA]">
                        No company recruitment data matching current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    companyStats.map((c) => (
                      <tr key={c.companyId} className="hover:bg-[#121212] transition-colors">
                        <td className="py-3 px-4 font-medium text-[#EDEDED]">{c.companyName}</td>
                        <td className="py-3 px-4 text-[#9AA1AA]">{c.industry}</td>
                        <td className="py-3 px-4 text-right font-mono text-[#9AA1AA]">
                          {c.drivesCount}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-sky-400">
                          {c.applicationsCount}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#FF6B00]">
                          {c.shortlistedCount}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400 font-semibold">
                          {c.selectionsCount}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ACADEMIC YEAR REPORT */}
        {activeTab === 'years' && (
          <div className="border border-[#222222] bg-[#0A0A0A] rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121212] text-[#9AA1AA] uppercase tracking-wider border-b border-[#222222]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Academic Year</th>
                    <th className="py-3 px-4 font-semibold text-right">Registered Pool</th>
                    <th className="py-3 px-4 font-semibold text-right">Placed</th>
                    <th className="py-3 px-4 font-semibold text-right">Unplaced</th>
                    <th className="py-3 px-4 font-semibold text-right">Placement Rate</th>
                    <th className="py-3 px-4 font-semibold text-right">Applications</th>
                    <th className="py-3 px-4 font-semibold text-right">Selections</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A] text-[#EDEDED]">
                  {yearStats.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#9AA1AA]">
                        No cohort records found.
                      </td>
                    </tr>
                  ) : (
                    yearStats.map((y) => (
                      <tr key={y.year} className="hover:bg-[#121212] transition-colors">
                        <td className="py-3 px-4 font-medium text-[#EDEDED]">{y.yearLabel}</td>
                        <td className="py-3 px-4 text-right font-mono text-[#9AA1AA]">
                          {y.totalStudents}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400 font-semibold">
                          {y.placedStudents}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-amber-400">
                          {y.unplacedStudents}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-mono font-semibold text-emerald-400">
                            {y.placementPercentage}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-sky-400">
                          {y.totalApplications}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-purple-400 font-semibold">
                          {y.totalSelections}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: DRIVE PERFORMANCE REPORT */}
        {activeTab === 'drives' && (
          <div className="border border-[#222222] bg-[#0A0A0A] rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121212] text-[#9AA1AA] uppercase tracking-wider border-b border-[#222222]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Recruiter & Role</th>
                    <th className="py-3 px-4 font-semibold">Tier</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Applications</th>
                    <th className="py-3 px-4 font-semibold text-right">Shortlisted</th>
                    <th className="py-3 px-4 font-semibold text-right">Interviewed</th>
                    <th className="py-3 px-4 font-semibold text-right">Selections</th>
                    <th className="py-3 px-4 font-semibold text-right">Conversion %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A] text-[#EDEDED]">
                  {driveStats.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#9AA1AA]">
                        No drives match current filter.
                      </td>
                    </tr>
                  ) : (
                    driveStats.map((d) => (
                      <tr key={d.driveId} className="hover:bg-[#121212] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#EDEDED]">{d.companyName}</div>
                          <div className="text-[11px] text-[#9AA1AA]">{d.jobRole}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="text-[10px] font-mono">
                            {d.tier}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 capitalize">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {d.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-sky-400">
                          {d.applicationsCount}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#FF6B00]">
                          {d.shortlistedCount}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-purple-400">
                          {d.interviewCount}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400 font-semibold">
                          {d.selectionsCount}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#EDEDED] font-semibold">
                          {d.conversionRate}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: STUDENT PLACEMENT STATUS ROSTER */}
        {activeTab === 'students' && (
          <div className="space-y-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#9AA1AA]" />
              <input
                type="text"
                placeholder="Search roster by roll number, name, or department..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-8 pr-3 h-8 rounded bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div className="border border-[#222222] bg-[#0A0A0A] rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121212] text-[#9AA1AA] uppercase tracking-wider border-b border-[#222222]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Roll Number</th>
                      <th className="py-3 px-4 font-semibold">Candidate Name</th>
                      <th className="py-3 px-4 font-semibold">Department</th>
                      <th className="py-3 px-4 font-semibold text-center">Year</th>
                      <th className="py-3 px-4 font-semibold text-center">CGPA</th>
                      <th className="py-3 px-4 font-semibold">Placement Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Applications</th>
                      <th className="py-3 px-4 font-semibold">Offer / Placement Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A] text-[#EDEDED]">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[#9AA1AA]">
                          No candidate records found matching search and filter parameters.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => (
                        <tr key={s.studentDbId} className="hover:bg-[#121212] transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-[#FF6B00]">
                            {s.studentRollNumber}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#EDEDED]">{s.name}</div>
                            <div className="text-[11px] text-[#9AA1AA] font-mono">{s.email}</div>
                          </td>
                          <td className="py-3 px-4 text-[#9AA1AA]">{s.department}</td>
                          <td className="py-3 px-4 text-center font-mono">{s.year}</td>
                          <td className="py-3 px-4 text-center font-mono font-medium text-[#EDEDED]">
                            {s.cgpa.toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            {s.placementStatus === 'placed' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 font-mono">
                                Placed
                              </span>
                            )}
                            {s.placementStatus === 'in_process' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-[#FF6B00] bg-[#FF6B00]/10 border border-[#FF6B00]/30 font-mono">
                                In Process
                              </span>
                            )}
                            {s.placementStatus === 'unplaced' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-amber-400 bg-amber-950/40 border border-amber-900/60 font-mono">
                                Unplaced
                              </span>
                            )}
                            {s.placementStatus === 'opted_out' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-neutral-400 bg-neutral-900 border border-neutral-800 font-mono">
                                Opted Out
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-sky-400">
                            {s.applicationsCount}
                          </td>
                          <td className="py-3 px-4">
                            {s.placedCompany ? (
                              <div>
                                <span className="font-semibold text-emerald-400">
                                  {s.placedCompany}
                                </span>
                                {s.placedRole && (
                                  <span className="text-[11px] text-[#9AA1AA] block">
                                    {s.placedRole}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[#9AA1AA] text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
