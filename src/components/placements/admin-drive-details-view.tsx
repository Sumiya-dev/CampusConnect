'use client';

import { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApplicationDetailWithStudent, DriveDetailWithStats } from '@/lib/types/drive.types';
import { ApplicationStatus, DriveStatus } from '@/lib/types/database.types';
import {
  toggleDrivePublishedAction,
  rescheduleDriveAction,
  updateDriveStatusAction,
  deletePlacementDriveAction,
  updateApplicationStatusAction,
} from '@/lib/placements/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Briefcase,
  Building,
  ArrowLeft,
  Edit,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
  Archive,
  RefreshCw,
  Search,
  ChevronRight,
  GraduationCap,
  FileText,
  ListChecks,
  Award,
} from 'lucide-react';

interface AdminDriveDetailsViewProps {
  drive: DriveDetailWithStats;
  applications: ApplicationDetailWithStudent[];
  eligibleStudentsPool: { student: any; isEligible: boolean; reasons: string[]; passedChecks: string[] }[];
  basePath: '/admin/placements' | '/placement/drives';
  roleTitle: string;
}

export function AdminDriveDetailsView({
  drive,
  applications,
  eligibleStudentsPool,
  basePath,
  roleTitle,
}: AdminDriveDetailsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<'details' | 'applicants' | 'eligible_pool'>('details');
  const [appStatusFilter, setAppStatusFilter] = useState<'all' | ApplicationStatus>('all');
  const [appSearch, setAppSearch] = useState('');

  // Modals state
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Reschedule form state
  const toDatetimeLocal = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    } catch {
      return '';
    }
  };

  const [newDeadline, setNewDeadline] = useState(toDatetimeLocal(drive.registration_deadline));
  const [newDriveDate, setNewDriveDate] = useState(toDatetimeLocal(drive.drive_date));
  const [newDriveTime, setNewDriveTime] = useState(drive.drive_time || '');
  const [newVenue, setNewVenue] = useState(drive.venue || '');

  // Messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const isPublished = drive.is_published !== false;
  const isCancelled = drive.status === 'cancelled';
  const isArchived = drive.status === 'archived';

  // Toggle publish
  const handleTogglePublished = () => {
    setErrorMessage(null);
    setActionSuccessMessage(null);
    startTransition(async () => {
      const res = await toggleDrivePublishedAction(drive.id, !isPublished);
      if (res.success) {
        setActionSuccessMessage(res.message || 'Visibility updated.');
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Failed to update visibility.');
      }
    });
  };

  // Reschedule submit
  const handleReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setActionSuccessMessage(null);
    startTransition(async () => {
      const res = await rescheduleDriveAction(
        drive.id,
        newDeadline,
        newDriveDate || null,
        newDriveTime || null,
        newVenue || null
      );
      if (res.success) {
        setRescheduleModalOpen(false);
        setActionSuccessMessage(res.message || 'Schedule updated.');
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Failed to reschedule.');
      }
    });
  };

  // Status changes (Cancel / Archive)
  const handleStatusChange = (targetStatus: DriveStatus) => {
    setErrorMessage(null);
    setActionSuccessMessage(null);
    startTransition(async () => {
      const res = await updateDriveStatusAction(drive.id, targetStatus);
      if (res.success) {
        setCancelModalOpen(false);
        setArchiveModalOpen(false);
        setActionSuccessMessage(res.message || 'Status updated.');
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Failed to update status.');
      }
    });
  };

  // Safe delete
  const handleDelete = (forceCancel: boolean = false) => {
    setErrorMessage(null);
    setActionSuccessMessage(null);
    startTransition(async () => {
      const res = await deletePlacementDriveAction(drive.id, forceCancel);
      if (res.success) {
        setDeleteModalOpen(false);
        if (res.actionTaken === 'deleted') {
          router.push(basePath);
          router.refresh();
        } else {
          setActionSuccessMessage(res.reason || 'Drive safely cancelled.');
          router.refresh();
        }
      } else {
        setErrorMessage(res.reason || res.error || 'Deletion failed.');
      }
    });
  };

  // Application stage update
  const handleApplicationStageChange = (appId: string, newStage: ApplicationStatus) => {
    setErrorMessage(null);
    setActionSuccessMessage(null);
    startTransition(async () => {
      const res = await updateApplicationStatusAction(appId, newStage);
      if (res.success) {
        setActionSuccessMessage(`Applicant status updated to ${newStage}.`);
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Failed to update applicant stage.');
      }
    });
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'TBA';
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

  // Filtered applicants
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (appStatusFilter !== 'all' && app.status !== appStatusFilter) {
        return false;
      }
      if (appSearch.trim()) {
        const query = appSearch.toLowerCase().trim();
        const studentName = app.student?.profile?.name?.toLowerCase() || '';
        const studentRoll = app.student?.student_id?.toLowerCase() || '';
        const dept = app.student?.department?.toLowerCase() || '';
        if (!studentName.includes(query) && !studentRoll.includes(query) && !dept.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [applications, appStatusFilter, appSearch]);

  const eligibleCount = eligibleStudentsPool.filter((p) => p.isEligible).length;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href={basePath}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Placement Drives Directory</span>
        </Link>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Edit */}
          <Link href={`${basePath}/${drive.id}/edit`}>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1.5 border-border text-foreground hover:border-accent hover:text-accent"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Edit Drive</span>
            </Button>
          </Link>

          {/* Reschedule */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRescheduleModalOpen(true)}
            className="text-xs h-8 gap-1.5 border-border text-foreground hover:border-accent hover:text-accent"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Reschedule</span>
          </Button>

          {/* Publish / Unpublish Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleTogglePublished}
            disabled={isPending}
            className={`text-xs h-8 gap-1.5 border-border ${
              isPublished
                ? 'text-green-500 hover:bg-green-500/10'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {isPublished ? (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span>Published</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span>Unpublished</span>
              </>
            )}
          </Button>

          {/* Status Actions: Cancel / Archive */}
          {!isCancelled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(true)}
              className="text-xs h-8 gap-1.5 border-border text-muted hover:text-red-500 hover:border-red-500/30"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Cancel Drive</span>
            </Button>
          )}

          {!isArchived && drive.status === 'completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setArchiveModalOpen(true)}
              className="text-xs h-8 gap-1.5 border-border text-muted hover:text-foreground"
            >
              <Archive className="h-3.5 w-3.5" />
              <span>Archive</span>
            </Button>
          )}

          {/* Delete (Safe guardrail) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
            className="text-xs h-8 gap-1.5 border-border text-red-500 hover:bg-red-500/10 hover:border-red-500/30"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-3.5 rounded-md border border-red-500/30 bg-red-500/10 text-xs text-red-500 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {actionSuccessMessage && (
        <div className="p-3.5 rounded-md border border-green-500/30 bg-green-500/10 text-xs text-green-500 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Hero Drive Information Card */}
      <div className="rounded-md border border-border bg-surface p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-background text-accent shrink-0 font-bold text-lg">
              {drive.company?.company_name ? drive.company.company_name.substring(0, 1).toUpperCase() : 'P'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-foreground">{drive.job_role}</h1>
                <span className="font-mono text-sm font-semibold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded">
                  {drive.package_details}
                </span>
                <span className="text-xs font-medium text-muted bg-elevated border border-border px-2 py-0.5 rounded">
                  {drive.tier}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted">
                <div className="flex items-center gap-1 text-foreground">
                  <Building className="h-3.5 w-3.5 text-accent" />
                  <Link
                    href={`/admin/companies/${drive.company_id}`}
                    className="hover:underline text-foreground"
                  >
                    {drive.company?.company_name || 'Recruiting Partner'}
                  </Link>
                </div>
                {drive.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-muted/60" />
                    <span>{drive.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted/60" />
                  <span>Cutoff: {formatDate(drive.registration_deadline)}</span>
                </div>
                {drive.drive_date && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted/60" />
                    <span>Drive Date: {formatDate(drive.drive_date)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-2">
              {drive.status === 'open' && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-500 bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 rounded">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Applications Open
                </span>
              )}
              {drive.status === 'in_progress' && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-accent bg-accent/10 border border-accent/20 px-2.5 py-0.5 rounded">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  In Progress
                </span>
              )}
              {drive.status === 'completed' && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-muted bg-elevated border border-border px-2.5 py-0.5 rounded">
                  <CheckCircle2 className="h-3 w-3 text-muted" />
                  Completed
                </span>
              )}
              {drive.status === 'cancelled' && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded">
                  <XCircle className="h-3 w-3 text-red-500" />
                  Cancelled
                </span>
              )}
              {drive.status === 'archived' && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-muted bg-elevated border border-border px-2.5 py-0.5 rounded">
                  <Archive className="h-3 w-3 text-muted" />
                  Archived
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted">
              {isPublished ? (
                <span className="text-green-500 flex items-center gap-1">
                  <Eye className="h-3 w-3" /> Live on Student Portal
                </span>
              ) : (
                <span className="text-muted flex items-center gap-1">
                  <EyeOff className="h-3 w-3" /> Draft / Hidden from Students
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Funnel Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-2 border-t border-border">
          <div className="p-2.5 rounded bg-elevated border border-border">
            <div className="text-[10px] uppercase font-semibold text-muted">Total Applied</div>
            <div className="text-base font-semibold text-foreground mt-0.5">{drive.applicationsCount}</div>
          </div>
          <div className="p-2.5 rounded bg-elevated border border-border">
            <div className="text-[10px] uppercase font-semibold text-muted">Shortlisted</div>
            <div className="text-base font-semibold text-accent mt-0.5">
              {drive.applicationsBreakdown?.shortlisted || 0}
            </div>
          </div>
          <div className="p-2.5 rounded bg-elevated border border-border">
            <div className="text-[10px] uppercase font-semibold text-muted">Interviews</div>
            <div className="text-base font-semibold text-foreground mt-0.5">
              {drive.applicationsBreakdown?.interview || 0}
            </div>
          </div>
          <div className="p-2.5 rounded bg-elevated border border-border">
            <div className="text-[10px] uppercase font-semibold text-muted">Selected</div>
            <div className="text-base font-semibold text-green-500 mt-0.5">
              {drive.applicationsBreakdown?.selected || 0}
            </div>
          </div>
          <div className="p-2.5 rounded bg-elevated border border-border">
            <div className="text-[10px] uppercase font-semibold text-muted">Placed Confirmed</div>
            <div className="text-base font-semibold text-green-500 mt-0.5">
              {drive.applicationsBreakdown?.placed || 0}
            </div>
          </div>
          <div className="p-2.5 rounded bg-elevated border border-border">
            <div className="text-[10px] uppercase font-semibold text-muted">Eligible Pool</div>
            <div className="text-base font-semibold text-foreground mt-0.5">{eligibleCount}</div>
          </div>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'details'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Drive Specifications & Criteria</span>
        </button>

        <button
          onClick={() => setActiveTab('applicants')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'applicants'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Student Applicants ({applications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('eligible_pool')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'eligible_pool'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <GraduationCap className="h-3.5 w-3.5" />
          <span>Eligible Student Pool ({eligibleCount})</span>
        </button>
      </div>

      {/* TAB 1: DRIVE SPECIFICATIONS & CRITERIA */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          {/* Eligibility Matrix */}
          <div className="rounded-md border border-border bg-surface p-5 space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Eligibility Criteria & Cohort Filters
              </div>
              <div className="border-b border-border my-2" />
              <p className="text-xs text-muted">
                Academic requirements enforced when students apply through the student portal.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs pt-1">
              <div>
                <div className="text-muted">Minimum CGPA Cutoff</div>
                <div className="font-semibold text-sm text-foreground mt-0.5">
                  {Number(drive.min_cgpa).toFixed(2)} / 10.00
                </div>
              </div>

              <div>
                <div className="text-muted">Backlog Restriction</div>
                <div className="font-semibold text-sm text-foreground mt-0.5">
                  Max {drive.max_backlogs} Active Backlog(s)
                </div>
              </div>

              <div>
                <div className="text-muted">Graduation Year</div>
                <div className="font-semibold text-sm text-foreground mt-0.5">
                  {drive.graduation_year ? `Class of ${drive.graduation_year}` : 'Open to All Batches'}
                </div>
              </div>

              <div>
                <div className="text-muted">Eligible Academic Cohorts</div>
                <div className="font-medium text-foreground mt-0.5">
                  {drive.eligible_years && drive.eligible_years.length > 0
                    ? `Year ${drive.eligible_years.join(', ')}`
                    : 'All Cohorts'}
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="text-muted">Eligible Departments</div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {drive.eligible_departments && drive.eligible_departments.length > 0 ? (
                    drive.eligible_departments.map((dept) => (
                      <span
                        key={dept}
                        className="px-2 py-0.5 rounded bg-elevated border border-border text-foreground text-[11px]"
                      >
                        {dept}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted">All Disciplines</span>
                  )}
                </div>
              </div>
            </div>

            {/* Required Skills */}
            {drive.required_skills && drive.required_skills.length > 0 && (
              <div className="pt-3 border-t border-border">
                <div className="text-xs font-medium text-muted mb-1.5">
                  Required Competencies & Skills
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {drive.required_skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded bg-elevated border border-border text-accent text-[11px]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Logistics & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Drive Logistics */}
            <div className="rounded-md border border-border bg-surface p-5 space-y-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Venue & Schedule Details
                </div>
                <div className="border-b border-border my-2" />
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-muted">Registration Deadline</div>
                  <div className="font-medium text-foreground mt-0.5 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-accent" />
                    <span>{formatDate(drive.registration_deadline)}</span>
                  </div>
                </div>

                <div>
                  <div className="text-muted">Assessment / Interview Date</div>
                  <div className="font-medium text-foreground mt-0.5 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted/60" />
                    <span>{formatDate(drive.drive_date)} {drive.drive_time ? `(${drive.drive_time})` : ''}</span>
                  </div>
                </div>

                <div>
                  <div className="text-muted">Venue / Assessment Link</div>
                  <div className="font-medium text-foreground mt-0.5 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted/60" />
                    <span>{drive.venue || 'To Be Announced'}</span>
                  </div>
                </div>

                <div>
                  <div className="text-muted">Vacancies & Bond Terms</div>
                  <div className="font-medium text-foreground mt-0.5">
                    {drive.vacancies || 'Open pool'} • Service agreement: {drive.bond_period || 'None'}
                  </div>
                </div>
              </div>
            </div>

            {/* Stages & Instructions */}
            <div className="rounded-md border border-border bg-surface p-5 space-y-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Recruitment Stages & Instructions
                </div>
                <div className="border-b border-border my-2" />
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-muted mb-1">Recruitment Stages</div>
                  <div className="space-y-1">
                    {drive.recruitment_stages && drive.recruitment_stages.length > 0 ? (
                      drive.recruitment_stages.map((stage, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-foreground">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-elevated border border-border text-[10px] text-accent">
                            {idx + 1}
                          </span>
                          <span>{stage}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-muted">Stages to be confirmed</span>
                    )}
                  </div>
                </div>

                {drive.instructions && drive.instructions.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <div className="text-muted mb-1">Candidate Instructions</div>
                    <ul className="list-disc list-inside space-y-0.5 text-foreground text-[11px]">
                      {drive.instructions.map((inst, i) => (
                        <li key={i}>{inst}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENT APPLICANTS */}
      {activeTab === 'applicants' && (
        <div className="space-y-4">
          {/* Sub-Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
              <Input
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                placeholder="Search applicants by student name, roll number, or department..."
                className="pl-9 text-xs h-9 bg-surface border-border text-foreground placeholder:text-muted focus:border-accent"
              />
            </div>

            <div className="flex rounded-md border border-border bg-surface p-0.5">
              {(['all', 'applied', 'shortlisted', 'interview', 'selected', 'placed', 'rejected'] as const).map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => setAppStatusFilter(st)}
                    className={`px-2.5 py-1 text-xs rounded transition-colors font-medium capitalize ${
                      appStatusFilter === st
                        ? 'bg-elevated text-accent'
                        : 'text-muted hover:text-foreground'
                    }`}
                  >
                    {st === 'applied' ? 'Registered' : st}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Applicants Table */}
          <div className="border border-border rounded-md bg-surface overflow-hidden">
            {filteredApplications.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <Users className="h-8 w-8 text-muted mx-auto opacity-50" />
                <div className="text-sm font-medium text-foreground">No applicants found</div>
                <p className="text-xs text-muted">
                  {applications.length === 0
                    ? 'No candidates have submitted applications for this recruitment campaign yet.'
                    : 'No applicants match the current filter or search query.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-elevated text-muted uppercase tracking-wider text-xs">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Candidate</th>
                      <th className="py-3 px-4 font-semibold">Roll / ID</th>
                      <th className="py-3 px-4 font-semibold">Department & Year</th>
                      <th className="py-3 px-4 font-semibold">CGPA</th>
                      <th className="py-3 px-4 font-semibold">Applied On</th>
                      <th className="py-3 px-4 font-semibold">Current Stage</th>
                      <th className="py-3 px-4 font-semibold text-right">Advance Stage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-foreground">
                    {filteredApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-elevated/50 transition-colors">
                        <td className="py-3 px-4">
                          <Link
                            href={`/admin/placements/students/${app.student_id}`}
                            className="font-medium text-xs text-foreground hover:text-accent transition-colors"
                          >
                            {app.student?.profile?.name || 'Student Candidate'}
                          </Link>
                          <div className="text-[11px] text-muted">{app.student?.profile?.email}</div>
                        </td>

                        <td className="py-3 px-4 font-mono text-xs text-muted">
                          {app.student?.student_id || 'ID-N/A'}
                        </td>

                        <td className="py-3 px-4 text-xs text-muted">
                          <div className="truncate max-w-[150px]">{app.student?.department}</div>
                          <div className="text-[11px] text-muted/80">Year {app.student?.year}</div>
                        </td>

                        <td className="py-3 px-4 font-mono text-xs text-foreground">
                          {Number(app.student?.cgpa || 0).toFixed(2)}
                        </td>

                        <td className="py-3 px-4 text-xs text-muted">
                          {formatDate(app.applied_at)}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded capitalize ${
                              app.status === 'placed' || app.status === 'selected'
                                ? 'bg-green-500/10 border border-green-500/20 text-green-500'
                                : app.status === 'rejected'
                                ? 'bg-red-500/10 border border-red-500/20 text-red-500'
                                : app.status === 'interview' || app.status === 'shortlisted'
                                ? 'bg-accent/10 border border-accent/20 text-accent'
                                : 'bg-elevated border border-border text-muted'
                            }`}
                          >
                            {app.status === 'applied' ? 'Registered' : app.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <select
                            value={app.status}
                            disabled={isPending}
                            onChange={(e) =>
                              handleApplicationStageChange(app.id, e.target.value as ApplicationStatus)
                            }
                            className="text-[11px] bg-elevated border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:border-accent"
                          >
                            <option value="applied">Registered</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="interview">Interview</option>
                            <option value="selected">Selected</option>
                            <option value="placed">Placed</option>
                            <option value="rejected">Rejected</option>
                            <option value="withdrawn">Withdrawn</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ELIGIBLE STUDENT POOL */}
      {activeTab === 'eligible_pool' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-md border border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-foreground">
                Institutional Student Eligibility Evaluation
              </div>
              <p className="text-xs text-muted mt-0.5">
                Evaluates registered students across disciplines against CGPA ({Number(drive.min_cgpa).toFixed(2)}), active backlogs, and cohort standing.
              </p>
            </div>
            <div className="text-xs font-medium text-green-500 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded shrink-0">
              {eligibleCount} / {eligibleStudentsPool.length} Students Qualified
            </div>
          </div>

          <div className="border border-border rounded-md bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-elevated text-muted uppercase tracking-wider text-xs">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Student Name</th>
                    <th className="py-3 px-4 font-semibold">Roll / ID</th>
                    <th className="py-3 px-4 font-semibold">Department & Year</th>
                    <th className="py-3 px-4 font-semibold">CGPA</th>
                    <th className="py-3 px-4 font-semibold">Eligibility Status</th>
                    <th className="py-3 px-4 font-semibold">Evaluation Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {eligibleStudentsPool.map((p, idx) => (
                    <tr key={idx} className="hover:bg-elevated/50 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/placements/students/${p.student?.id}`}
                          className="font-medium text-xs text-foreground hover:text-accent transition-colors"
                        >
                          {p.student?.profile?.name || 'Student Candidate'}
                        </Link>
                        <div className="text-[11px] text-muted">{p.student?.profile?.email}</div>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs text-muted">
                        {p.student?.student_id || 'ID-N/A'}
                      </td>

                      <td className="py-3 px-4 text-xs text-muted">
                        <div>{p.student?.department}</div>
                        <div className="text-[11px] text-muted/80">Year {p.student?.year}</div>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs text-foreground">
                        {Number(p.student?.cgpa || 0).toFixed(2)}
                      </td>

                      <td className="py-3 px-4">
                        {p.isEligible ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-500 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded">
                            <CheckCircle2 className="h-3 w-3" /> Eligible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                            <XCircle className="h-3 w-3" /> Not Eligible
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-xs text-muted max-w-[280px]">
                        {p.isEligible ? (
                          <span className="text-green-500/90 text-[11px]">
                            {p.passedChecks?.[0] || 'Meets all institutional drive criteria.'}
                          </span>
                        ) : (
                          <span className="text-red-500/90 text-[11px]">
                            {p.reasons?.[0] || 'Did not meet criteria cutoff.'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESCHEDULE DRIVE */}
      {rescheduleModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleReschedule}
            className="bg-surface border border-border rounded-md max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded border border-accent/30 bg-accent/10 text-accent shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                  Postpone / Reschedule &quot;{drive.job_role}&quot;
                </h3>
                <p className="text-xs text-muted">
                  Update application cutoff deadlines, recruitment event date, time slots, and test venue.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted">
                  New Registration Deadline <span className="text-accent">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  required
                  className="bg-elevated border-border text-foreground text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted">New Drive Date</label>
                <Input
                  type="datetime-local"
                  value={newDriveDate}
                  onChange={(e) => setNewDriveDate(e.target.value)}
                  className="bg-elevated border-border text-foreground text-xs h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted">Time / Slot</label>
                  <Input
                    value={newDriveTime}
                    onChange={(e) => setNewDriveTime(e.target.value)}
                    placeholder="e.g. 10:00 AM"
                    className="bg-elevated border-border text-foreground text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted">Venue / Platform</label>
                  <Input
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    placeholder="Auditorium / Teams"
                    className="bg-elevated border-border text-foreground text-xs h-9"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setRescheduleModalOpen(false)}
                className="text-xs border-border text-muted hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="text-xs font-medium"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                Confirm Reschedule
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CANCEL DRIVE */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-md max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded border border-red-500/30 bg-red-500/10 text-red-500 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                  Cancel Drive &quot;{drive.job_role}&quot;?
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  Cancelling will stop new student applications immediately and mark the drive as cancelled. All {drive.applicationsCount} existing student applications will remain preserved for institutional audit.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setCancelModalOpen(false)}
                className="text-xs border-border text-muted hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => handleStatusChange('cancelled')}
                className="text-xs bg-red-500 text-white hover:bg-[#DC2626] font-medium"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ARCHIVE DRIVE */}
      {archiveModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-md max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded border border-border bg-elevated text-foreground shrink-0">
                <Archive className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                  Archive Completed Drive?
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  Archiving moves this concluded drive into cold storage. Historical records and placement statistics remain accessible to Administrators.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setArchiveModalOpen(false)}
                className="text-xs border-border text-muted hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => handleStatusChange('archived')}
                className="text-xs font-medium"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                Archive Drive
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SAFE DELETION */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-md max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded border border-red-500/30 bg-red-500/10 text-red-500 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                  Delete &quot;{drive.job_role}&quot;?
                </h3>
                {drive.applicationsCount > 0 ? (
                  <div className="text-xs text-muted leading-relaxed space-y-2 mt-1">
                    <p className="text-red-500 font-medium">
                      Integrity Guardrail: This drive has {drive.applicationsCount} registered student application(s).
                    </p>
                    <p>
                      Permanent deletion is blocked to prevent breaking relational database tables and losing student evaluation records. Instead, you can <strong>safely cancel</strong> this drive.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted leading-relaxed mt-1">
                    This drive currently has <strong>0 applicant records</strong>. Are you sure you want to permanently remove it from the institutional database?
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setDeleteModalOpen(false)}
                className="text-xs border-border text-muted hover:text-foreground"
              >
                Cancel
              </Button>

              {drive.applicationsCount > 0 ? (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDelete(true)}
                  className="text-xs bg-accent text-black hover:bg-accent/90 font-medium"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                  Safely Cancel Drive Instead
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDelete(false)}
                  className="text-xs bg-red-500 text-white hover:bg-[#DC2626] font-medium"
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
