'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FacultyPlacementDriveSummary,
  FacultyDriveCandidate,
  AllocatedSectionFilterOption,
  CandidateApplicationStatus,
} from '@/lib/types/faculty-placements.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Building,
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Users,
  Award,
  FileText,
  AlertCircle,
  Search,
  GraduationCap,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface FacultyDriveDetailClientProps {
  drive: FacultyPlacementDriveSummary;
  candidates: FacultyDriveCandidate[];
  allocatedSections: AllocatedSectionFilterOption[];
  facultyDepartment: string;
}

export function FacultyDriveDetailClient({
  drive,
  candidates,
  allocatedSections,
  facultyDepartment,
}: FacultyDriveDetailClientProps) {
  const [candidateSearch, setCandidateSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [statusTab, setStatusTab] = useState<
    'all' | 'applied' | 'interview' | 'selected' | 'eligible' | 'ineligible'
  >('all');

  // Filter candidates
  const filteredCandidates = candidates.filter((c) => {
    // Search filter
    const q = candidateSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.student_id.toLowerCase().includes(q) ||
      c.section_name.toLowerCase().includes(q);

    // Section filter
    const matchesSection =
      sectionFilter === 'all' || c.section_id === sectionFilter;

    // Status Tab filter
    let matchesStatus = true;
    if (statusTab === 'applied') {
      matchesStatus = c.application_status !== 'not_applied';
    } else if (statusTab === 'interview') {
      matchesStatus =
        c.application_status === 'interview' ||
        c.application_status === 'shortlisted';
    } else if (statusTab === 'selected') {
      matchesStatus =
        c.application_status === 'selected' ||
        c.application_status === 'placed';
    } else if (statusTab === 'eligible') {
      matchesStatus = c.is_eligible && c.application_status === 'not_applied';
    } else if (statusTab === 'ineligible') {
      matchesStatus = !c.is_eligible;
    }

    return matchesSearch && matchesSection && matchesStatus;
  });

  const appliedCount = candidates.filter(
    (c) => c.application_status !== 'not_applied'
  ).length;

  const interviewCount = candidates.filter(
    (c) =>
      c.application_status === 'interview' ||
      c.application_status === 'shortlisted'
  ).length;

  const selectedCount = candidates.filter(
    (c) =>
      c.application_status === 'selected' || c.application_status === 'placed'
  ).length;

  const eligibleNotAppliedCount = candidates.filter(
    (c) => c.is_eligible && c.application_status === 'not_applied'
  ).length;

  const ineligibleCount = candidates.filter((c) => !c.is_eligible).length;

  const formatDeadline = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const isPast = d.getTime() < Date.now();
      const formatted = d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      return { formatted, isPast };
    } catch {
      return { formatted: dateStr, isPast: false };
    }
  };

  const { formatted: deadlineText, isPast: deadlinePassed } = formatDeadline(
    drive.registration_deadline
  );

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Subtle Breadcrumb */}
      <div>
        <Link
          href="/faculty/placements"
          className="inline-flex items-center gap-1.5 text-xs text-[#9AA1AA] hover:text-[#EDEDED] transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Back to Placement Drives</span>
        </Link>
      </div>

      {/* Main Drive Header */}
      <div className="border border-[#222222] bg-[#0A0A0A] rounded-md p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#1A1A1A] pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded border border-[#222222] bg-[#121212] text-[#EDEDED] flex items-center gap-1">
                <Building className="h-3.5 w-3.5 text-[#FF6B00]" />
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
            </div>

            <h1 className="text-2xl font-semibold text-[#EDEDED] tracking-tight">
              {drive.job_role}
            </h1>

            {drive.company_website && (
              <a
                href={drive.company_website.startsWith('http') ? drive.company_website : `https://${drive.company_website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#FF6B00] hover:underline"
              >
                <span>Company Portal</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <div className="text-left md:text-right shrink-0">
            <div className="text-xl font-semibold text-[#FF6B00]">
              {drive.package_details}
            </div>
            {drive.location && (
              <div className="text-xs text-[#9AA1AA] flex items-center md:justify-end gap-1 mt-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{drive.location}</span>
              </div>
            )}
            {drive.vacancies && (
              <div className="text-xs text-[#777777] mt-0.5">
                Vacancies: {drive.vacancies}
              </div>
            )}
          </div>
        </div>

        {/* Drive Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-[#777777] uppercase font-medium tracking-wider text-[11px] block">
              CGPA Cutoff
            </span>
            <span className="text-[#EDEDED] font-semibold text-sm">
              ≥ {drive.min_cgpa.toFixed(2)}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[#777777] uppercase font-medium tracking-wider text-[11px] block">
              Backlogs Allowed
            </span>
            <span className="text-[#EDEDED] font-semibold text-sm">
              Max {drive.max_backlogs}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[#777777] uppercase font-medium tracking-wider text-[11px] block">
              Eligible Batches
            </span>
            <span className="text-[#EDEDED] font-semibold text-sm">
              {drive.eligible_years.map((y) => `Year ${y}`).join(', ')}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[#777777] uppercase font-medium tracking-wider text-[11px] block">
              Deadline
            </span>
            <span
              className={`font-semibold text-sm ${
                deadlinePassed ? 'text-amber-400' : 'text-[#EDEDED]'
              }`}
            >
              {deadlineText}
            </span>
          </div>
        </div>

        {/* Schedule & Venue Strip */}
        {(drive.drive_date || drive.venue) && (
          <div className="p-3.5 rounded bg-[#121212] border border-[#1A1A1A] flex flex-wrap items-center gap-5 text-xs text-[#9AA1AA]">
            {drive.drive_date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#FF6B00]" />
                <span>
                  Date:{' '}
                  <strong className="text-[#EDEDED] font-medium">
                    {new Date(drive.drive_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </strong>
                </span>
              </div>
            )}
            {drive.drive_time && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#FF6B00]" />
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
                <MapPin className="h-4 w-4 text-[#FF6B00]" />
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

        {/* Description & Roles */}
        {drive.description && (
          <div className="space-y-1.5 pt-1 text-xs">
            <h4 className="font-semibold text-[#EDEDED] uppercase tracking-wider text-[11px]">
              Role Profile & Responsibilities
            </h4>
            <p className="text-[#9AA1AA] leading-relaxed">
              {drive.description}
            </p>
          </div>
        )}

        {/* Recruitment Stages */}
        {drive.recruitment_stages.length > 0 && (
          <div className="space-y-2 pt-1 text-xs">
            <h4 className="font-semibold text-[#EDEDED] uppercase tracking-wider text-[11px]">
              Recruitment Evaluation Stages ({drive.recruitment_stages.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {drive.recruitment_stages.map((stage, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded bg-[#121212] border border-[#1A1A1A] flex items-center gap-2 text-xs text-[#EDEDED]"
                >
                  <span className="font-mono text-[11px] text-[#FF6B00] px-1.5 py-0.5 rounded bg-[#1A1A1A] shrink-0">
                    0{idx + 1}
                  </span>
                  <span className="truncate">{stage}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Required Documents / Instructions */}
        {(drive.instructions.length > 0 || drive.required_documents.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs text-[#9AA1AA]">
            {drive.instructions.length > 0 && (
              <div className="space-y-1">
                <span className="font-semibold text-[#EDEDED] uppercase tracking-wider text-[11px] block">
                  Mandatory Directives
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {drive.instructions.map((inst, i) => (
                    <li key={i}>{inst}</li>
                  ))}
                </ul>
              </div>
            )}

            {drive.required_documents.length > 0 && (
              <div className="space-y-1">
                <span className="font-semibold text-[#EDEDED] uppercase tracking-wider text-[11px] block">
                  Required Verification Documents
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {drive.required_documents.map((doc, i) => (
                    <li key={i}>{doc}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* AUTHORIZED CANDIDATES PIPELINE & MONITOR */}
      {/* ========================================================================= */}
      <div className="space-y-5">
        <div className="border-b border-[#222222] pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#FF6B00]" />
              <h2 className="text-lg font-semibold text-[#EDEDED] tracking-tight">
                Authorized Cohort Pipeline & Progress
              </h2>
            </div>
            <p className="text-xs text-[#9AA1AA] mt-0.5">
              Read-only advisory monitor for students in Department of {facultyDepartment}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#777777]">
              Total Authorized: <strong className="text-[#EDEDED]">{candidates.length}</strong>
            </span>
          </div>
        </div>

        {/* Filter Pills / Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[#1A1A1A] pb-2 text-xs">
          <button
            onClick={() => setStatusTab('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusTab === 'all'
                ? 'bg-[#1E1E1E] text-[#EDEDED] border border-[#333333]'
                : 'text-[#9AA1AA] hover:text-[#EDEDED]'
            }`}
          >
            All Candidates ({candidates.length})
          </button>

          <button
            onClick={() => setStatusTab('applied')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusTab === 'applied'
                ? 'bg-[#1E1E1E] text-sky-400 border border-sky-500/30'
                : 'text-[#9AA1AA] hover:text-[#EDEDED]'
            }`}
          >
            Applied ({appliedCount})
          </button>

          <button
            onClick={() => setStatusTab('interview')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusTab === 'interview'
                ? 'bg-[#1E1E1E] text-amber-400 border border-amber-500/30'
                : 'text-[#9AA1AA] hover:text-[#EDEDED]'
            }`}
          >
            Shortlisted / Interview ({interviewCount})
          </button>

          <button
            onClick={() => setStatusTab('selected')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusTab === 'selected'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-[#9AA1AA] hover:text-[#EDEDED]'
            }`}
          >
            Selected / Placed ({selectedCount})
          </button>

          <button
            onClick={() => setStatusTab('eligible')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusTab === 'eligible'
                ? 'bg-[#1E1E1E] text-[#EDEDED] border border-[#333333]'
                : 'text-[#9AA1AA] hover:text-[#EDEDED]'
            }`}
          >
            Eligible (Not Applied) ({eligibleNotAppliedCount})
          </button>

          <button
            onClick={() => setStatusTab('ineligible')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusTab === 'ineligible'
                ? 'bg-[#1E1E1E] text-red-400 border border-red-500/30'
                : 'text-[#9AA1AA] hover:text-[#EDEDED]'
            }`}
          >
            Ineligible ({ineligibleCount})
          </button>
        </div>

        {/* Search and Section Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9AA1AA]" />
            <Input
              type="text"
              placeholder="Search candidate by name or roll no..."
              value={candidateSearch}
              onChange={(e) => setCandidateSearch(e.target.value)}
              className="pl-9 bg-[#0A0A0A] border-[#222222] text-[#EDEDED] text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="h-9 px-3 rounded-md bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="all">All Academic Sections</option>
              {allocatedSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Candidate Table / Rows */}
        {filteredCandidates.length === 0 ? (
          <div className="border border-[#222222] bg-[#0A0A0A] rounded-md p-8 text-center space-y-2">
            <Users className="h-6 w-6 text-[#9AA1AA] mx-auto opacity-50" />
            <h4 className="text-sm font-medium text-[#EDEDED]">
              No candidates found in this view
            </h4>
            <p className="text-xs text-[#9AA1AA]">
              {candidateSearch || sectionFilter !== 'all' || statusTab !== 'all'
                ? 'Adjust your search query or reset the filter tabs.'
                : 'No students currently mapped to your authorized cohort.'}
            </p>
          </div>
        ) : (
          <div className="border border-[#222222] bg-[#0A0A0A] rounded-md divide-y divide-[#1A1A1A] overflow-hidden">
            {filteredCandidates.map((c) => {
              const cgpaPass = c.cgpa >= drive.min_cgpa;

              return (
                <div
                  key={c.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#121212]/50 transition-colors text-xs"
                >
                  {/* Left: Roll No, Name, Section, CGPA */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[#FF6B00] font-medium">
                        {c.student_id}
                      </span>
                      <span className="text-[#777777]">•</span>
                      <span className="text-xs font-semibold text-[#EDEDED]">
                        {c.name}
                      </span>
                      <span className="text-[#777777]">•</span>
                      <span className="px-1.5 py-0.2 rounded bg-[#161616] border border-[#222222] text-[#9AA1AA]">
                        {c.section_name}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[#9AA1AA]">
                      <span>
                        CGPA:{' '}
                        <strong
                          className={cgpaPass ? 'text-emerald-400' : 'text-red-400'}
                        >
                          {c.cgpa.toFixed(2)}
                        </strong>{' '}
                        (Cutoff: {drive.min_cgpa.toFixed(2)})
                      </span>

                      <span>•</span>
                      <span>Overall: {c.overall_placement_status === 'placed' ? 'Placed' : 'In Process'}</span>

                      {/* Eligibility Reason if not eligible */}
                      {!c.is_eligible && c.eligibility_reasons.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-red-400">
                            {c.eligibility_reasons[0]}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Interview details / venue if in interview stage */}
                    {(c.interview_date || c.interview_venue || c.notes) && (
                      <div className="text-[11px] text-[#CCCCCC] bg-[#141414] p-2 rounded border border-[#222222] mt-1 space-y-0.5">
                        {c.interview_date && (
                          <div>
                            Interview:{' '}
                            <strong className="text-[#EDEDED]">
                              {new Date(c.interview_date).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </strong>
                          </div>
                        )}
                        {c.interview_venue && (
                          <div>
                            Venue: <strong className="text-[#EDEDED]">{c.interview_venue}</strong>
                          </div>
                        )}
                        {c.notes && (
                          <div className="text-[#9AA1AA] italic">Note: {c.notes}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Application Status Badge */}
                  <div className="shrink-0 self-start sm:self-center">
                    {c.application_status === 'selected' && (
                      <Badge variant="success" className="gap-1 text-xs py-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Selected
                      </Badge>
                    )}
                    {c.application_status === 'placed' && (
                      <Badge variant="success" className="gap-1 text-xs py-1">
                        <Award className="h-3 w-3" />
                        Placed
                      </Badge>
                    )}
                    {c.application_status === 'interview' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-purple-500/25 bg-purple-500/10 text-purple-300 font-medium">
                        <Clock className="h-3 w-3" />
                        In Interview
                      </span>
                    )}
                    {c.application_status === 'shortlisted' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-blue-500/25 bg-blue-500/10 text-sky-400 font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        Shortlisted
                      </span>
                    )}
                    {c.application_status === 'applied' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#333333] bg-[#161616] text-[#CCCCCC]">
                        Applied
                      </span>
                    )}
                    {c.application_status === 'rejected' && (
                      <Badge variant="destructive" className="gap-1 text-xs py-1">
                        <XCircle className="h-3 w-3" />
                        Not Selected
                      </Badge>
                    )}
                    {c.application_status === 'not_applied' && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                          c.is_eligible
                            ? 'border border-[#222222] bg-[#121212] text-[#9AA1AA]'
                            : 'border border-red-500/20 bg-red-500/10 text-red-400'
                        }`}
                      >
                        {c.is_eligible ? 'Eligible • Not Applied' : 'Ineligible'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
