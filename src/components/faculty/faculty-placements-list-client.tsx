'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FacultyPlacementDriveSummary,
  AllocatedSectionFilterOption,
} from '@/lib/types/faculty-placements.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Briefcase,
  Building,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Search,
  CheckCircle2,
  Users,
  Award,
  Layers,
  GraduationCap,
  Filter,
} from 'lucide-react';

interface FacultyPlacementsListClientProps {
  initialDrives: FacultyPlacementDriveSummary[];
  allocatedDepartments: string[];
  allocatedYears: number[];
  allocatedSections: AllocatedSectionFilterOption[];
  facultyDepartment: string;
  totalAuthorizedStudents: number;
  totalPlacedAuthorizedStudents: number;
}

export function FacultyPlacementsListClient({
  initialDrives,
  allocatedDepartments,
  allocatedYears,
  allocatedSections,
  facultyDepartment,
  totalAuthorizedStudents,
  totalPlacedAuthorizedStudents,
}: FacultyPlacementsListClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  const filteredDrives = initialDrives.filter((drive) => {
    // Search filter
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      drive.company_name.toLowerCase().includes(q) ||
      drive.job_role.toLowerCase().includes(q) ||
      drive.package_details.toLowerCase().includes(q) ||
      (drive.location && drive.location.toLowerCase().includes(q)) ||
      drive.required_skills.some((s) => s.toLowerCase().includes(q));

    // Department filter
    const matchesDept =
      departmentFilter === 'all' ||
      drive.eligible_departments.length === 0 ||
      drive.eligible_departments.some((d) =>
        d.toLowerCase().includes(departmentFilter.toLowerCase())
      );

    // Year filter
    const matchesYear =
      yearFilter === 'all' ||
      drive.eligible_years.length === 0 ||
      drive.eligible_years.includes(parseInt(yearFilter, 10));

    // Status filter
    const matchesStatus =
      statusFilter === 'all' || drive.status === statusFilter;

    // Tier filter
    const matchesTier =
      tierFilter === 'all' || drive.tier === tierFilter;

    return (
      matchesSearch &&
      matchesDept &&
      matchesYear &&
      matchesStatus &&
      matchesTier
    );
  });

  const totalActiveDrives = initialDrives.filter(
    (d) => d.status === 'open' || d.status === 'in_progress'
  ).length;

  const totalApplicationsCount = initialDrives.reduce(
    (sum, d) => sum + d.authorized_applied_count,
    0
  );

  const formatDeadline = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const isPast = d.getTime() < Date.now();
      const formatted = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return { formatted, isPast };
    } catch {
      return { formatted: dateStr, isPast: false };
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Counters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0A0A0A] border border-[#222222] p-4 rounded-md">
          <span className="text-xs uppercase font-medium text-[#9AA1AA] block">
            Placement Drives
          </span>
          <div className="text-2xl font-semibold text-[#EDEDED] mt-1">
            {initialDrives.length}
          </div>
          <span className="text-xs text-[#9AA1AA] mt-0.5 block">
            {totalActiveDrives} Active Cycles
          </span>
        </div>

        <div className="bg-[#0A0A0A] border border-[#222222] p-4 rounded-md">
          <span className="text-xs uppercase font-medium text-[#9AA1AA] block">
            Monitored Students
          </span>
          <div className="text-2xl font-semibold text-[#EDEDED] mt-1">
            {totalAuthorizedStudents}
          </div>
          <span className="text-xs text-[#9AA1AA] mt-0.5 block">
            Allocated Department Cohort
          </span>
        </div>

        <div className="bg-[#0A0A0A] border border-[#222222] p-4 rounded-md">
          <span className="text-xs uppercase font-medium text-[#9AA1AA] block">
            Cohort Applications
          </span>
          <div className="text-2xl font-semibold text-sky-400 mt-1">
            {totalApplicationsCount}
          </div>
          <span className="text-xs text-[#9AA1AA] mt-0.5 block">
            Submitted Registrations
          </span>
        </div>

        <div className="bg-[#0A0A0A] border border-[#222222] p-4 rounded-md">
          <span className="text-xs uppercase font-medium text-[#9AA1AA] block">
            Students Placed
          </span>
          <div className="text-2xl font-semibold text-emerald-400 mt-1">
            {totalPlacedAuthorizedStudents}
          </div>
          <span className="text-xs text-[#9AA1AA] mt-0.5 block">
            Offers Secured
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9AA1AA]" />
            <Input
              type="text"
              placeholder="Search by company, role, package, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#0A0A0A] border-[#222222] text-[#EDEDED] text-sm h-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="h-9 px-3 rounded-md bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="all">All Departments</option>
              {allocatedDepartments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Year Filter */}
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="h-9 px-3 rounded-md bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="all">All Years</option>
              {allocatedYears.map((yr) => (
                <option key={yr} value={yr.toString()}>
                  Year {yr}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-md bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Tier Filter */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="h-9 px-3 rounded-md bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="all">All Tiers</option>
              <option value="Tier 1 (Super Dream)">Super Dream</option>
              <option value="Tier 1 (Dream)">Dream</option>
              <option value="Core Recruiter">Core Recruiter</option>
              <option value="Mass Recruiter">Mass Recruiter</option>
            </select>
          </div>
        </div>
      </div>

      {/* Drives List */}
      {filteredDrives.length === 0 ? (
        <div className="border border-[#222222] bg-[#0A0A0A] rounded-md p-10 text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-[#161616] border border-[#262626] text-[#9AA1AA]">
            <Briefcase className="h-6 w-6 text-[#FF6B00]" />
          </div>
          <h3 className="text-base font-medium text-[#EDEDED]">
            No placement drives found
          </h3>
          <p className="text-xs text-[#9AA1AA] max-w-md mx-auto">
            {searchQuery || departmentFilter !== 'all' || statusFilter !== 'all'
              ? 'Try resetting the filters or modifying your search terms.'
              : 'Placement drives scheduled by the placement directorate will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDrives.map((drive) => {
            const { formatted: deadlineText, isPast: deadlinePassed } = formatDeadline(
              drive.registration_deadline
            );

            return (
              <div
                key={drive.id}
                className="border border-[#222222] bg-[#0A0A0A] rounded-md p-5 space-y-4 hover:border-[#333333] transition-colors"
              >
                {/* Header row: Company, Role, Tier, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1A1A1A] pb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded border border-[#222222] bg-[#121212] text-[#EDEDED] flex items-center gap-1">
                        <Building className="h-3 w-3 text-[#FF6B00]" />
                        {drive.company_name}
                      </span>

                      <span className="text-xs px-2 py-0.5 rounded border border-[#262626] bg-[#161616] text-[#CCCCCC]">
                        {drive.tier}
                      </span>

                      {drive.status === 'open' && (
                        <Badge variant="success" className="text-xs">
                          Active Drive
                        </Badge>
                      )}
                      {drive.status === 'in_progress' && (
                        <span className="text-xs px-2 py-0.5 rounded border border-blue-500/20 bg-blue-500/10 text-sky-400 font-medium">
                          In Progress
                        </span>
                      )}
                      {drive.status === 'completed' && (
                        <span className="text-xs px-2 py-0.5 rounded border border-purple-500/20 bg-purple-500/10 text-purple-300 font-medium">
                          Completed
                        </span>
                      )}
                      {drive.status === 'cancelled' && (
                        <Badge variant="destructive" className="text-xs">
                          Cancelled
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-[#EDEDED] tracking-tight">
                      {drive.job_role}
                    </h3>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-base font-semibold text-[#FF6B00]">
                      {drive.package_details}
                    </div>
                    {drive.location && (
                      <div className="text-xs text-[#9AA1AA] flex items-center sm:justify-end gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <span>{drive.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Eligibility & Criteria Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#9AA1AA]">
                  <div className="space-y-1">
                    <span className="text-[11px] uppercase tracking-wider text-[#777777] block font-medium">
                      Eligibility Cutoff
                    </span>
                    <span className="text-[#EDEDED] font-medium block">
                      Min CGPA: {drive.min_cgpa.toFixed(2)} • Backlogs: Max {drive.max_backlogs}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] uppercase tracking-wider text-[#777777] block font-medium">
                      Eligible Cohorts
                    </span>
                    <span className="text-[#EDEDED] font-medium block truncate">
                      {drive.eligible_years.map((y) => `Yr ${y}`).join(', ')} •{' '}
                      {drive.eligible_departments.length > 2
                        ? `${drive.eligible_departments.slice(0, 2).join(', ')} +${drive.eligible_departments.length - 2}`
                        : drive.eligible_departments.join(', ')}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] uppercase tracking-wider text-[#777777] block font-medium">
                      Registration Window
                    </span>
                    <span
                      className={`font-medium block ${
                        deadlinePassed ? 'text-amber-400' : 'text-[#EDEDED]'
                      }`}
                    >
                      {deadlineText} {deadlinePassed ? '(Closed)' : ''}
                    </span>
                  </div>
                </div>

                {/* Schedule & Venue Details (if set) */}
                {(drive.drive_date || drive.venue) && (
                  <div className="p-2.5 rounded bg-[#121212] border border-[#1A1A1A] flex flex-wrap items-center gap-4 text-xs text-[#9AA1AA]">
                    {drive.drive_date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#FF6B00]" />
                        <span>
                          Drive Date:{' '}
                          <strong className="text-[#EDEDED] font-medium">
                            {new Date(drive.drive_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </strong>
                        </span>
                      </div>
                    )}
                    {drive.drive_time && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#FF6B00]" />
                        <span>
                          Time:{' '}
                          <strong className="text-[#EDEDED] font-medium">
                            {drive.drive_time}
                          </strong>
                        </span>
                      </div>
                    )}
                    {drive.venue && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#FF6B00]" />
                        <span>
                          Venue:{' '}
                          <strong className="text-[#EDEDED] font-medium">
                            {drive.venue}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer: Authorized Cohort Metrics + View Details Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#1A1A1A]">
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="text-[#9AA1AA]">Cohort Monitor:</span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#161616] border border-[#222222] text-[#EDEDED]">
                      <Users className="h-3 w-3 text-[#9AA1AA]" />
                      <strong>{drive.authorized_eligible_count}</strong> Eligible
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#161616] border border-[#222222] text-sky-400">
                      <strong>{drive.authorized_applied_count}</strong> Applied
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#161616] border border-[#222222] text-amber-400">
                      <strong>{drive.authorized_shortlisted_count}</strong> Shortlisted
                    </span>

                    {drive.authorized_selected_count > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                        <Award className="h-3 w-3" />
                        <strong>{drive.authorized_selected_count}</strong> Placed
                      </span>
                    )}
                  </div>

                  <Link href={`/faculty/placements/${drive.id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 gap-1.5 border-[#222222] text-[#EDEDED] hover:border-[#FF6B00] hover:text-[#FF6B00] w-full sm:w-auto"
                    >
                      <span>View Details & Pipeline</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
