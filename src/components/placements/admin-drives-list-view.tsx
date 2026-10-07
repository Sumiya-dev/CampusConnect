'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DriveWithCompany } from '@/lib/types/drive.types';
import { DriveStatus } from '@/lib/types/database.types';
import { deletePlacementDriveAction, toggleDrivePublishedAction } from '@/lib/placements/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Briefcase,
  Search,
  Plus,
  Calendar,
  Users,
  Building,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  Layers,
  Archive,
} from 'lucide-react';

interface AdminDrivesListViewProps {
  initialDrives: DriveWithCompany[];
  metadata: {
    departments: string[];
    programs: string[];
    years: number[];
    companies: { id: string; company_name: string; industry: string | null; location: string | null }[];
  };
  basePath: '/admin/placements' | '/placement/drives';
  roleTitle: string;
}

export function AdminDrivesListView({
  initialDrives,
  metadata,
  basePath,
  roleTitle,
}: AdminDrivesListViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DriveStatus>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [dateCategory, setDateCategory] = useState<'all' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'archived'>('all');

  const [driveToDelete, setDriveToDelete] = useState<DriveWithCompany | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const filteredDrives = useMemo(() => {
    return initialDrives.filter((drive) => {
      // Status filter
      if (statusFilter !== 'all' && drive.status !== statusFilter) {
        return false;
      }

      // Company filter
      if (companyFilter !== 'all' && drive.company_id !== companyFilter) {
        return false;
      }

      // Department filter
      if (departmentFilter !== 'all') {
        const inDept = drive.eligible_departments?.some(
          (d) => d.toLowerCase() === departmentFilter.toLowerCase()
        );
        if (!inDept) return false;
      }

      // Academic year filter
      if (yearFilter !== 'all') {
        const yNum = Number(yearFilter);
        const inYear = drive.eligible_years?.includes(yNum);
        if (!inYear) return false;
      }

      // Date category filter
      if (dateCategory !== 'all') {
        const now = Date.now();
        const deadlineTime = new Date(drive.registration_deadline).getTime();
        if (dateCategory === 'upcoming') {
          if (drive.status !== 'open' || deadlineTime < now) return false;
        } else if (dateCategory === 'ongoing') {
          if (drive.status !== 'in_progress' && !(drive.status === 'open' && deadlineTime <= now)) return false;
        } else if (dateCategory === 'completed') {
          if (drive.status !== 'completed') return false;
        } else if (dateCategory === 'cancelled') {
          if (drive.status !== 'cancelled') return false;
        } else if (dateCategory === 'archived') {
          if (drive.status !== 'archived') return false;
        }
      }

      // Search match
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matchesRole = drive.job_role.toLowerCase().includes(query);
        const matchesCompany = drive.company?.company_name.toLowerCase().includes(query) ?? false;
        const matchesLocation = drive.location?.toLowerCase().includes(query) ?? false;
        const matchesPackage = drive.package_details.toLowerCase().includes(query);
        const matchesDept = drive.eligible_departments?.some((d) => d.toLowerCase().includes(query)) ?? false;

        if (!matchesRole && !matchesCompany && !matchesLocation && !matchesPackage && !matchesDept) {
          return false;
        }
      }

      return true;
    });
  }, [initialDrives, search, statusFilter, companyFilter, departmentFilter, yearFilter, dateCategory]);

  const stats = useMemo(() => {
    const total = initialDrives.length;
    const active = initialDrives.filter((d) => d.status === 'open' || d.status === 'in_progress').length;
    const completed = initialDrives.filter((d) => d.status === 'completed').length;
    const totalApplications = initialDrives.reduce((acc, d) => acc + (d.applications_count || 0), 0);
    return { total, active, completed, totalApplications };
  }, [initialDrives]);

  const hasActiveFilters =
    search.trim() !== '' ||
    statusFilter !== 'all' ||
    companyFilter !== 'all' ||
    departmentFilter !== 'all' ||
    yearFilter !== 'all' ||
    dateCategory !== 'all';

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setCompanyFilter('all');
    setDepartmentFilter('all');
    setYearFilter('all');
    setDateCategory('all');
  };

  const handleDelete = (forceCancel: boolean = false) => {
    if (!driveToDelete) return;
    setModalError(null);
    setActionSuccess(null);
    startTransition(async () => {
      const res = await deletePlacementDriveAction(driveToDelete.id, forceCancel);
      if (res.success) {
        setDriveToDelete(null);
        setActionSuccess(res.reason || 'Placement drive status updated successfully.');
        router.refresh();
      } else {
        setModalError(res.reason || res.error || 'Failed to complete requested operation.');
      }
    });
  };

  const handleTogglePublished = (driveId: string, currentPublished: boolean) => {
    setActionSuccess(null);
    startTransition(async () => {
      const res = await toggleDrivePublishedAction(driveId, !currentPublished);
      if (res.success) {
        setActionSuccess(res.message || 'Visibility updated.');
        router.refresh();
      }
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const renderStatusBadge = (status: DriveStatus) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2 py-0.5 rounded">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
            Applications Open
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#FF6B00] bg-[#FF6B00]/10 border border-[#FF6B00]/20 px-2 py-0.5 rounded">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B00]" />
            In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#9AA1AA] bg-[#121212] border border-[#222222] px-2 py-0.5 rounded">
            <CheckCircle2 className="h-3 w-3 text-[#9AA1AA]" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 px-2 py-0.5 rounded">
            <XCircle className="h-3 w-3 text-[#EF4444]" />
            Cancelled
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#9AA1AA] bg-[#121212] border border-[#222222] px-2 py-0.5 rounded">
            <Archive className="h-3 w-3 text-[#9AA1AA]" />
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#222222] pb-3">
        <Link href="/admin/placements">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 bg-[#121212] border-[#222222] text-[#FF6B00] font-medium hover:bg-[#1A1A1A]"
          >
            <Briefcase className="h-3.5 w-3.5 mr-1.5 text-[#FF6B00]" />
            Placement Drives
          </Button>
        </Link>
        <Link href="/admin/placements/students">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#121212]"
          >
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Student Placement Roster
          </Button>
        </Link>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-md border border-[#222222] bg-[#0A0A0A] p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-[#9AA1AA]">
              Total Drives
            </div>
            <div className="text-xl font-semibold text-[#EDEDED] mt-1">{stats.total}</div>
          </div>
          <Briefcase className="h-5 w-5 text-[#9AA1AA]" />
        </div>

        <div className="rounded-md border border-[#222222] bg-[#0A0A0A] p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-[#9AA1AA]">
              Active Hiring Drives
            </div>
            <div className="text-xl font-semibold text-[#EDEDED] mt-1">{stats.active}</div>
          </div>
          <CheckCircle2 className="h-5 w-5 text-[#22C55E]" />
        </div>

        <div className="rounded-md border border-[#222222] bg-[#0A0A0A] p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-[#9AA1AA]">
              Concluded Drives
            </div>
            <div className="text-xl font-semibold text-[#EDEDED] mt-1">{stats.completed}</div>
          </div>
          <Archive className="h-5 w-5 text-[#9AA1AA]" />
        </div>

        <div className="rounded-md border border-[#222222] bg-[#0A0A0A] p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-[#9AA1AA]">
              Total Student Applicants
            </div>
            <div className="text-xl font-semibold text-[#FF6B00] mt-1">{stats.totalApplications}</div>
          </div>
          <Users className="h-5 w-5 text-[#FF6B00]" />
        </div>
      </div>

      {/* Action Notification */}
      {actionSuccess && (
        <div className="p-3.5 rounded-md border border-[#22C55E]/30 bg-[#22C55E]/10 text-xs text-[#22C55E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-[#9AA1AA] hover:text-[#EDEDED]">
            &times;
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9AA1AA]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search drives by company name, job role, discipline, or location..."
              className="pl-9 text-xs h-10 bg-[#0A0A0A] border-[#222222] text-[#EDEDED] placeholder:text-[#9AA1AA] focus:border-[#FF6B00]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Tabs */}
            <div className="flex rounded-md border border-[#222222] bg-[#0A0A0A] p-0.5">
              {(['all', 'open', 'in_progress', 'completed', 'cancelled', 'archived'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors font-medium capitalize ${
                    statusFilter === st
                      ? 'bg-[#121212] text-[#FF6B00]'
                      : 'text-[#9AA1AA] hover:text-[#EDEDED]'
                  }`}
                >
                  {st === 'in_progress' ? 'Ongoing' : st}
                </button>
              ))}
            </div>

            {/* Create Drive Action */}
            <Link href={`${basePath}/new`}>
              <Button size="sm" className="text-xs h-10 gap-1.5 font-medium">
                <Plus className="h-3.5 w-3.5" />
                <span>Create Drive</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Second Row: Specific Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Company Filter Dropdown */}
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="text-xs h-9 px-3 rounded-md bg-[#0A0A0A] border border-[#222222] text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">All Companies</option>
            {metadata.companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </select>

          {/* Department Filter Dropdown */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs h-9 px-3 rounded-md bg-[#0A0A0A] border border-[#222222] text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">All Departments</option>
            {metadata.departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Academic Cohort Year Filter */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="text-xs h-9 px-3 rounded-md bg-[#0A0A0A] border border-[#222222] text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">All Academic Years</option>
            {metadata.years.map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>

          {/* Date Timeline Category Filter */}
          <select
            value={dateCategory}
            onChange={(e) => setDateCategory(e.target.value as any)}
            className="text-xs h-9 px-3 rounded-md bg-[#0A0A0A] border border-[#222222] text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">All Schedules</option>
            <option value="upcoming">Upcoming (Deadline Open)</option>
            <option value="ongoing">Ongoing (Hiring Active)</option>
            <option value="completed">Completed Drives</option>
            <option value="cancelled">Cancelled</option>
            <option value="archived">Archived</option>
          </select>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-xs h-9 border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Drives Table */}
      <div className="border border-[#222222] rounded-md bg-[#0A0A0A] overflow-hidden">
        {filteredDrives.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <Briefcase className="h-9 w-9 text-[#9AA1AA] mx-auto opacity-50" />
            <div className="text-sm font-medium text-[#EDEDED]">No placement drives match your criteria</div>
            <p className="text-xs text-[#9AA1AA] max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Try adjusting your search query or reset filter options.'
                : 'No recruitment campaigns have been scheduled yet.'}
            </p>
            {hasActiveFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="text-xs border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED] mt-2"
              >
                Clear all filters
              </Button>
            ) : (
              <Link href={`${basePath}/new`}>
                <Button size="sm" className="text-xs gap-1.5 font-medium mt-2">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create First Drive</span>
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#222222] bg-[#121212] text-[#9AA1AA] uppercase tracking-wider text-xs">
                <tr>
                  <th className="py-3 px-4 font-semibold">Recruiting Company & Role</th>
                  <th className="py-3 px-4 font-semibold">Compensation</th>
                  <th className="py-3 px-4 font-semibold">Eligible Cohort</th>
                  <th className="py-3 px-4 font-semibold">Cutoff & Dates</th>
                  <th className="py-3 px-4 font-semibold">Applicants</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222] text-[#EDEDED]">
                {filteredDrives.map((d) => {
                  const isPublished = d.is_published !== false;
                  const deadlinePassed = new Date(d.registration_deadline).getTime() < Date.now();

                  return (
                    <tr key={d.id} className="hover:bg-[#121212]/50 transition-colors group">
                      {/* Company & Role */}
                      <td className="py-3 px-4">
                        <div className="min-w-0">
                          <Link
                            href={`${basePath}/${d.id}`}
                            className="font-medium text-[#EDEDED] hover:text-[#FF6B00] transition-colors truncate block"
                          >
                            {d.job_role}
                          </Link>
                          <div className="text-xs text-[#9AA1AA] flex items-center gap-1.5 mt-0.5">
                            <Building className="h-3 w-3 text-[#9AA1AA]/60" />
                            <span>{d.company?.company_name || 'Partner Recruiter'}</span>
                            {d.tier && (
                              <>
                                <span>•</span>
                                <span className="text-[#EDEDED]">{d.tier}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Package details */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-medium text-xs text-[#FF6B00]">
                          {d.package_details}
                        </span>
                        {d.location && (
                          <div className="text-xs text-[#9AA1AA] mt-0.5 truncate max-w-[150px]">
                            {d.location}
                          </div>
                        )}
                      </td>

                      {/* Eligible Cohort */}
                      <td className="py-3 px-4 text-xs text-[#9AA1AA]">
                        <div>Min CGPA: <strong className="text-[#EDEDED]">{Number(d.min_cgpa).toFixed(2)}</strong></div>
                        <div className="text-[#9AA1AA]/80 mt-0.5">
                          {d.eligible_years && d.eligible_years.length > 0
                            ? `Year ${d.eligible_years.join(', ')}`
                            : 'All Cohorts'}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3 px-4 text-xs">
                        <div className="flex items-center gap-1 text-[#9AA1AA]">
                          <Calendar className="h-3 w-3 text-[#9AA1AA]/60" />
                          <span>Deadline: {formatDate(d.registration_deadline)}</span>
                        </div>
                        {d.drive_date && (
                          <div className="flex items-center gap-1 text-[#9AA1AA]/80 mt-0.5">
                            <Clock className="h-3 w-3 text-[#9AA1AA]/60" />
                            <span>Drive: {formatDate(d.drive_date)}</span>
                          </div>
                        )}
                      </td>

                      {/* Applicants */}
                      <td className="py-3 px-4">
                        <Link
                          href={`${basePath}/${d.id}?tab=applicants`}
                          className="inline-flex items-center gap-1 text-xs font-mono font-medium text-[#EDEDED] bg-[#121212] border border-[#222222] px-2 py-0.5 rounded hover:border-[#FF6B00] transition-colors"
                        >
                          <Users className="h-3 w-3 text-[#FF6B00]" />
                          <span>{d.applications_count || 0} applied</span>
                        </Link>
                      </td>

                      {/* Status & Visibility */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {renderStatusBadge(d.status)}
                          <div>
                            {isPublished ? (
                              <span className="text-[10px] text-[#22C55E] flex items-center gap-1">
                                <Eye className="h-2.5 w-2.5" /> Published
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#9AA1AA] flex items-center gap-1">
                                <EyeOff className="h-2.5 w-2.5" /> Draft / Hidden
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`${basePath}/${d.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2.5 border-[#222222] text-[#EDEDED] hover:border-[#FF6B00] hover:text-[#FF6B00]"
                            >
                              Details
                            </Button>
                          </Link>
                          <Link href={`${basePath}/${d.id}/edit`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2.5 border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]"
                            >
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setModalError(null);
                              setDriveToDelete(d);
                            }}
                            className="h-7 text-xs px-2 border-[#222222] text-[#9AA1AA] hover:text-[#EF4444] hover:border-[#EF4444]/30"
                            title="Manage Decommission / Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Safe Deletion / Cancellation Modal */}
      {driveToDelete && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0A0A] border border-[#222222] rounded-md max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded border border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444] shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#EDEDED]">
                  Decommission Drive &quot;{driveToDelete.job_role}&quot;?
                </h3>
                {modalError && (
                  <p className="text-xs text-[#EF4444] bg-[#EF4444]/10 p-2 rounded border border-[#EF4444]/30">
                    {modalError}
                  </p>
                )}
                {(driveToDelete.applications_count && driveToDelete.applications_count > 0) ? (
                  <div className="text-xs text-[#9AA1AA] leading-relaxed space-y-2 mt-1">
                    <p className="text-[#EF4444] font-medium">
                      Integrity Guardrail: This drive has {driveToDelete.applications_count} registered student application(s).
                    </p>
                    <p>
                      Permanent deletion is blocked to prevent relational database conflicts and loss of student career records. You can <strong>safely cancel</strong> this placement drive instead, which closes registrations while preserving applicant data.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-[#9AA1AA] leading-relaxed mt-1">
                    This drive currently has <strong>0 applicant records</strong>. Are you sure you want to permanently delete it from the system? This action cannot be undone.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#222222] flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setDriveToDelete(null)}
                className="text-xs border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]"
              >
                Cancel
              </Button>

              {(driveToDelete.applications_count && driveToDelete.applications_count > 0) ? (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDelete(true)}
                  className="text-xs bg-[#FF6B00] text-black hover:bg-[#FF6B00]/90 font-medium"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                  Safely Cancel Drive Instead
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDelete(false)}
                  className="text-xs bg-[#EF4444] text-white hover:bg-[#DC2626] font-medium"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                  Permanently Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
