'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { DriveWithCompany } from '@/lib/types/drive.types';
import { evaluateEligibility, StudentEligibilityProfile } from '@/lib/placements/eligibility';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Briefcase,
  Building,
  Calendar,
  Clock,
  ArrowRight,
  Search,
  CheckCircle2,
  AlertCircle,
  MapPin,
  SlidersHorizontal,
} from 'lucide-react';

interface StudentPlacementsViewProps {
  initialDrives: DriveWithCompany[];
  applicationsCount: number;
  shortlistsCount: number;
  studentProfile?: StudentEligibilityProfile;
}

export function StudentPlacementsView({
  initialDrives,
  applicationsCount,
  shortlistsCount,
  studentProfile,
}: StudentPlacementsViewProps) {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [eligibilityFilter, setEligibilityFilter] = useState<'all' | 'eligible'>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'cgpa_asc' | 'cgpa_desc'>('deadline');

  const filteredDrives = useMemo(() => {
    return initialDrives
      .filter((drive) => {
        // Tier filter
        if (tierFilter !== 'all' && drive.tier !== tierFilter) {
          return false;
        }

        // Eligibility filter
        if (eligibilityFilter === 'eligible' && studentProfile) {
          const evalRes = evaluateEligibility(studentProfile, drive);
          if (!evalRes.isEligible) {
            return false;
          }
        }

        // Search match
        if (search.trim()) {
          const query = search.toLowerCase().trim();
          const matchesRole = drive.job_role.toLowerCase().includes(query);
          const matchesCompany =
            drive.company?.company_name?.toLowerCase().includes(query) ?? false;
          const matchesLocation = drive.location?.toLowerCase().includes(query) ?? false;
          const matchesPackage = drive.package_details.toLowerCase().includes(query);

          if (!matchesRole && !matchesCompany && !matchesLocation && !matchesPackage) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'cgpa_asc') {
          return a.min_cgpa - b.min_cgpa;
        }
        if (sortBy === 'cgpa_desc') {
          return b.min_cgpa - a.min_cgpa;
        }
        // Default: upcoming deadline first
        return (
          new Date(a.registration_deadline).getTime() -
          new Date(b.registration_deadline).getTime()
        );
      });
  }, [initialDrives, search, tierFilter, eligibilityFilter, sortBy, studentProfile]);

  const hasActiveFilters = search.trim() !== '' || tierFilter !== 'all' || eligibilityFilter !== 'all';

  const resetFilters = () => {
    setSearch('');
    setTierFilter('all');
    setEligibilityFilter('all');
    setSortBy('deadline');
  };

  const formatDeadline = (dateStr: string) => {
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

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#222222] pb-2 text-sm">
        <Link
          href="/student/placements"
          className="px-3 py-1.5 rounded-md font-medium bg-[#121212] text-[#FF6B00] border border-[#FF6B00]/30"
        >
          Opportunities ({initialDrives.length})
        </Link>
        <Link
          href="/student/placements/applications"
          className="px-3 py-1.5 rounded-md font-medium text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#121212] transition-colors"
        >
          My Applications ({applicationsCount})
        </Link>
        <Link
          href="/student/placements/shortlists"
          className="px-3 py-1.5 rounded-md font-medium text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#121212] transition-colors"
        >
          My Shortlists ({shortlistsCount})
        </Link>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9AA1AA]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search drives by company, job role, package, or location..."
            className="pl-9 text-sm h-10 bg-[#0A0A0A] border-[#222222] text-[#EDEDED] placeholder:text-[#9AA1AA] focus:border-[#FF6B00]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Eligibility Filter */}
          {studentProfile && (
            <select
              value={eligibilityFilter}
              onChange={(e) => setEligibilityFilter(e.target.value as any)}
              className="text-sm h-10 px-3 rounded-md bg-[#0A0A0A] border border-[#222222] text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="all">All Qualification</option>
              <option value="eligible">Eligible for Me</option>
            </select>
          )}

          {/* Tier Filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="text-sm h-10 px-3 rounded-md bg-[#0A0A0A] border border-[#222222] text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">All Tiers</option>
            <option value="Tier 1 (Super Dream)">Super Dream</option>
            <option value="Tier 1 (Dream)">Dream</option>
            <option value="Core Recruiter">Core Recruiter</option>
            <option value="Mass IT">Mass IT</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm h-10 px-3 rounded-md bg-[#0A0A0A] border border-[#222222] text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="deadline">Upcoming Deadline</option>
            <option value="cgpa_asc">Min CGPA: Low to High</option>
            <option value="cgpa_desc">Min CGPA: High to Low</option>
          </select>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-sm h-10 border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Drives Opportunities List */}
      {filteredDrives.length === 0 ? (
        <div className="border border-[#222222] rounded-md bg-[#0A0A0A] py-16 px-4 text-center space-y-3">
          <Briefcase className="h-9 w-8 text-[#9AA1AA] mx-auto opacity-50" />
          <div className="text-base font-medium text-[#EDEDED]">
            {hasActiveFilters
              ? 'No placement drives match your criteria'
              : 'No active placement drives available'}
          </div>
          <p className="text-sm text-[#9AA1AA] max-w-sm mx-auto">
            {hasActiveFilters
              ? 'Try adjusting your search terms or tier filters to view other recruitment opportunities.'
              : 'New campus recruitment drives and corporate partner opportunities will appear here once announced by the Placement Directorate.'}
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-sm border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED] mt-2"
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="border border-[#222222] rounded-md bg-[#0A0A0A] divide-y divide-[#222222] overflow-hidden">
          {filteredDrives.map((drive) => {
            const isClosed = drive.status === 'completed' || drive.status === 'cancelled';
            const deadlinePassed = new Date(drive.registration_deadline).getTime() < Date.now();
            const eligibility = studentProfile ? evaluateEligibility(studentProfile, drive) : null;

            return (
              <div
                key={drive.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#121212]/50 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium px-2 py-0.5 rounded border border-[#222222] bg-[#121212] text-[#EDEDED]">
                      {drive.tier}
                    </span>

                    {isClosed || deadlinePassed ? (
                      <span className="text-sm font-medium px-2 py-0.5 rounded border border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444]">
                        Registrations Closed
                      </span>
                    ) : (
                      <span className="text-sm font-medium px-2 py-0.5 rounded border border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]">
                        Open for Application
                      </span>
                    )}

                    {eligibility && (
                      eligibility.isEligible ? (
                        <span className="text-sm font-medium px-2 py-0.5 rounded border border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E] flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Eligible</span>
                        </span>
                      ) : (
                        <span
                          className="text-sm font-medium px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 flex items-center gap-1"
                          title={eligibility.reasons[0] || 'Criteria not met'}
                        >
                          <AlertCircle className="h-3 w-3" />
                          <span>Not Eligible</span>
                        </span>
                      )
                    )}

                    <span className="text-sm text-[#9AA1AA]">
                      • Min CGPA: {Number(drive.min_cgpa).toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-[#EDEDED] tracking-tight">
                      {drive.company?.company_name || 'Corporate Recruiter'}
                    </h3>
                    <p className="text-sm text-[#9AA1AA] mt-0.5">
                      {drive.job_role} • {drive.location || 'Pan-India'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#9AA1AA]">
                    <span className="text-[#FF6B00] font-semibold">{drive.package_details}</span>
                    <span className="text-[#222222]">|</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-[#9AA1AA]" />
                      <span>Deadline: {formatDeadline(drive.registration_deadline)}</span>
                    </span>
                    {drive.vacancies && (
                      <>
                        <span className="text-[#222222]">|</span>
                        <span>{drive.vacancies}</span>
                      </>
                    )}
                  </div>

                  {/* Criteria Summary strip */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-sm text-[#9AA1AA]">
                    <span>
                      Branches:{' '}
                      <span className="text-[#EDEDED]">
                        {drive.eligible_departments && drive.eligible_departments.length > 0
                          ? drive.eligible_departments.join(', ')
                          : 'All Engineering Disciplines'}
                      </span>
                    </span>
                    {drive.eligible_years && drive.eligible_years.length > 0 && (
                      <>
                        <span className="text-[#222222]">•</span>
                        <span>
                          Cohort:{' '}
                          <span className="text-[#EDEDED]">
                            Year {drive.eligible_years.join(' & ')}
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="sm:shrink-0 pt-2 sm:pt-0">
                  <Link href={`/student/placements/${drive.id}`}>
                    <Button size="sm" className="text-sm gap-1.5 w-full sm:w-auto font-medium">
                      <span>Check Details & Apply</span>
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
