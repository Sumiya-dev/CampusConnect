'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  StudentPlacementDetail,
  StudentApplicationItem,
  EligibleDriveOpportunity,
} from '@/lib/types/student-placement.types';
import { ApplicationStatus, PlacementStatus } from '@/lib/types/database.types';
import {
  updateStudentPlacementStatusAction,
  updateStudentApplicationStatusAction,
  adminRegisterStudentForDriveAction,
} from '@/lib/placements/student-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Building,
  Briefcase,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  FileText,
  History,
  Sparkles,
  AlertCircle,
  Loader2,
  ExternalLink,
  UserCheck,
  User,
  GraduationCap,
  Layers,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface AdminStudentPlacementDetailProps {
  student: StudentPlacementDetail;
}

export function AdminStudentPlacementDetailView({ student }: AdminStudentPlacementDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Active Tab: 'applications' | 'history' | 'eligible' | 'academic'
  const [activeTab, setActiveTab] = useState<'applications' | 'history' | 'eligible' | 'academic'>(
    'applications'
  );

  // Status Change Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStudentStatus, setTargetStudentStatus] = useState<PlacementStatus>(
    student.placementStatus
  );
  const [studentStatusNotes, setStudentStatusNotes] = useState('');

  // Application Stage Modal
  const [appModalOpen, setAppModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<StudentApplicationItem | null>(null);
  const [targetAppStatus, setTargetAppStatus] = useState<ApplicationStatus>('shortlisted');
  const [appNotes, setAppNotes] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewVenue, setInterviewVenue] = useState('');

  // Register Student Modal
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState<EligibleDriveOpportunity | null>(null);
  const [registerNotes, setRegisterNotes] = useState('');

  // Notifications
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // 1. Handle Student Placement Status Update
  const handleUpdateStudentStatus = () => {
    clearMessages();
    startTransition(async () => {
      const res = await updateStudentPlacementStatusAction(
        student.id,
        targetStudentStatus,
        studentStatusNotes
      );
      if (res.success) {
        setSuccessMessage(res.message || 'Student placement status updated.');
        setStatusModalOpen(false);
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Failed to update status.');
      }
    });
  };

  // 2. Handle Application Stage Transition
  const openAppModal = (app: StudentApplicationItem) => {
    setSelectedApp(app);
    setTargetAppStatus(app.status);
    setAppNotes(app.notes || '');
    setInterviewDate(app.interviewDate ? app.interviewDate.substring(0, 16) : '');
    setInterviewVenue(app.interviewVenue || '');
    clearMessages();
    setAppModalOpen(true);
  };

  const handleUpdateAppStatus = () => {
    if (!selectedApp) return;
    clearMessages();

    startTransition(async () => {
      const res = await updateStudentApplicationStatusAction(
        selectedApp.id,
        targetAppStatus,
        appNotes,
        targetAppStatus === 'interview' && interviewDate ? new Date(interviewDate).toISOString() : undefined,
        targetAppStatus === 'interview' && interviewVenue ? interviewVenue : undefined
      );

      if (res.success) {
        setSuccessMessage(res.message || 'Application stage advanced successfully.');
        setAppModalOpen(false);
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Failed to update application stage.');
      }
    });
  };

  // 3. Handle Admin Drive Registration
  const openRegisterModal = (drive: EligibleDriveOpportunity) => {
    setSelectedDrive(drive);
    setRegisterNotes('');
    clearMessages();
    setRegisterModalOpen(true);
  };

  const handleRegisterStudent = () => {
    if (!selectedDrive) return;
    clearMessages();

    startTransition(async () => {
      const res = await adminRegisterStudentForDriveAction(
        student.id,
        selectedDrive.driveId,
        registerNotes
      );
      if (res.success) {
        setSuccessMessage(res.message || 'Student registered successfully.');
        setRegisterModalOpen(false);
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Failed to register student.');
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

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return 'TBA';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: PlacementStatus) => {
    switch (status) {
      case 'placed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Placed
          </span>
        );
      case 'in_process':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            In Process
          </span>
        );
      case 'opted_out':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold bg-[#1F242C] text-[#9AA1AA] border border-[#2A313C]">
            <span className="h-2 w-2 rounded-full bg-[#9AA1AA]" />
            Opted Out
          </span>
        );
      case 'unplaced':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold bg-[#1A1A1A] text-[#EDEDED] border border-[#222222]">
            <span className="h-2 w-2 rounded-full bg-[#9AA1AA]" />
            Unplaced
          </span>
        );
    }
  };

  const getAppStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'placed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
            <CheckCircle2 className="h-3 w-3" />
            Placed
          </span>
        );
      case 'selected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
            Selected
          </span>
        );
      case 'interview':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 capitalize">
            Interview Stage
          </span>
        );
      case 'shortlisted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
            Shortlisted
          </span>
        );
      case 'applied':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-[#1F242C] text-[#EDEDED] border border-[#2A313C] capitalize">
            Applied
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 capitalize">
            Rejected
          </span>
        );
      case 'withdrawn':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-[#1A1A1A] text-[#9AA1AA] border border-[#222222] capitalize">
            Withdrawn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-[#1A1A1A] text-[#9AA1AA] border border-[#222222] capitalize">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-4">
        <div>
          <Link
            href="/admin/placements/students"
            className="inline-flex items-center gap-1.5 text-xs text-[#9AA1AA] hover:text-[#EDEDED] mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Student Placement Roster</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-[#EDEDED] tracking-tight">{student.name}</h1>
            {getStatusBadge(student.placementStatus)}
          </div>
          <p className="text-xs text-[#9AA1AA] mt-1 font-mono">
            {student.studentId} • {student.department} • Year {student.year}
            {student.sectionName ? ` (Section ${student.sectionName})` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setTargetStudentStatus(student.placementStatus);
              setStudentStatusNotes('');
              clearMessages();
              setStatusModalOpen(true);
            }}
            className="text-xs h-8 bg-[#FF6B00] text-black font-medium hover:bg-[#E05E00]"
          >
            <UserCheck className="h-3.5 w-3.5 mr-1.5" />
            Update Placement Status
          </Button>
        </div>
      </div>

      {/* Global Alerts */}
      {errorMessage && (
        <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-xs hover:underline">
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-xs hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Placed Highlight Banner (if placed) */}
      {student.placedDetails && (
        <div className="p-4 rounded-md border border-emerald-500/30 bg-emerald-500/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Verified Placement Offer
            </div>
            <div className="text-xs text-[#9AA1AA]">
              Placed Date: {formatDate(student.placedDetails.placedAt)}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6 pt-1">
            <div>
              <div className="text-xs text-[#9AA1AA]">Corporate Recruiter</div>
              <div className="text-sm font-semibold text-[#EDEDED] mt-0.5">
                {student.placedDetails.companyName}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#9AA1AA]">Hired Role</div>
              <div className="text-sm font-semibold text-[#EDEDED] mt-0.5">
                {student.placedDetails.jobRole}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#9AA1AA]">Annual Package (CTC)</div>
              <div className="text-sm font-semibold text-[#FF6B00] mt-0.5 font-mono">
                {student.placedDetails.packageDetails}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Dossier Overview Card */}
      <div className="rounded-md border border-[#222222] bg-[#0A0A0A] p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-[#9AA1AA]">Academic CGPA</div>
            <div className="text-base font-semibold font-mono text-[#EDEDED] mt-1">
              {student.cgpa.toFixed(2)} / 10.00
            </div>
          </div>

          <div>
            <div className="text-xs text-[#9AA1AA]">Official Email</div>
            <div className="text-xs font-medium text-[#EDEDED] mt-1 truncate">
              {student.email}
            </div>
          </div>

          <div>
            <div className="text-xs text-[#9AA1AA]">Contact Number</div>
            <div className="text-xs font-medium text-[#EDEDED] mt-1">
              {student.contactNumber || 'Not provided'}
            </div>
          </div>

          <div>
            <div className="text-xs text-[#9AA1AA]">Resume Archive</div>
            <div className="mt-1">
              {student.resume ? (
                <a
                  href={`/api/resources/download?path=${encodeURIComponent(student.resume.filePath)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#FF6B00] hover:underline"
                >
                  <FileText className="h-3 w-3" />
                  <span>{student.resume.fileName}</span>
                </a>
              ) : (
                <span className="text-xs text-[#9AA1AA]">No resume uploaded</span>
              )}
            </div>
          </div>
        </div>

        {/* Skills Strip */}
        {student.skills.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[#222222] flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#9AA1AA]">Declared Skills:</span>
            {student.skills.map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded text-[11px] bg-[#121212] border border-[#222222] text-[#EDEDED]"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#222222]">
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'applications'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-[#9AA1AA] hover:text-[#EDEDED]'
          }`}
        >
          <Briefcase className="h-3.5 w-3.5" />
          <span>Applications Pipeline ({student.applications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-[#9AA1AA] hover:text-[#EDEDED]'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>Placement History ({student.history.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('eligible')}
          className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'eligible'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-[#9AA1AA] hover:text-[#EDEDED]'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Eligible Drives ({student.eligibleDrives.filter((d) => d.isEligible).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('academic')}
          className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'academic'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-[#9AA1AA] hover:text-[#EDEDED]'
          }`}
        >
          <GraduationCap className="h-3.5 w-3.5" />
          <span>Academic Profile</span>
        </button>
      </div>

      {/* TAB 1: APPLICATIONS PIPELINE */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="rounded-md border border-[#222222] bg-[#0A0A0A] overflow-hidden">
            {student.applications.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Briefcase className="h-8 w-8 text-[#9AA1AA] mx-auto opacity-40" />
                <div className="text-sm font-medium text-[#EDEDED]">No Applications Submitted Yet</div>
                <p className="text-xs text-[#9AA1AA] max-w-sm mx-auto">
                  This candidate has not applied to any recruitment drives yet. You can register them under
                  the Eligible Drives tab.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#222222] bg-[#121212] text-[#9AA1AA] uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Company & Job Role</th>
                      <th className="py-3 px-4 font-semibold">Package (CTC) & Tier</th>
                      <th className="py-3 px-4 font-semibold">Applied On</th>
                      <th className="py-3 px-4 font-semibold">Current Stage</th>
                      <th className="py-3 px-4 font-semibold">Interview Schedule</th>
                      <th className="py-3 px-4 font-semibold">Notes</th>
                      <th className="py-3 px-4 font-semibold text-right">Stage Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222222] text-[#EDEDED]">
                    {student.applications.map((app) => (
                      <tr key={app.id} className="hover:bg-[#121212]/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#EDEDED] flex items-center gap-1.5">
                            <Building className="h-3.5 w-3.5 text-[#FF6B00]" />
                            {app.companyName}
                          </div>
                          <div className="text-[#9AA1AA] mt-0.5 flex items-center gap-1">
                            <Link
                              href={`/admin/placements/${app.driveId}`}
                              className="hover:text-[#FF6B00] transition-colors"
                            >
                              {app.jobRole}
                            </Link>
                            <ExternalLink className="h-2.5 w-2.5 text-[#9AA1AA]/60" />
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-mono font-medium text-[#FF6B00]">
                            {app.packageDetails}
                          </div>
                          <div className="text-[11px] text-[#9AA1AA]">{app.tier}</div>
                        </td>

                        <td className="py-3 px-4 text-[#9AA1AA]">
                          {formatDate(app.appliedAt)}
                        </td>

                        <td className="py-3 px-4">{getAppStatusBadge(app.status)}</td>

                        <td className="py-3 px-4">
                          {app.interviewDate ? (
                            <div className="space-y-0.5">
                              <div className="text-[#EDEDED] flex items-center gap-1">
                                <Clock className="h-3 w-3 text-purple-400" />
                                <span>{formatDateTime(app.interviewDate)}</span>
                              </div>
                              {app.interviewVenue && (
                                <div className="text-[11px] text-[#9AA1AA] flex items-center gap-1">
                                  <MapPin className="h-2.5 w-2.5" />
                                  <span>{app.interviewVenue}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#9AA1AA] text-[11px]">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-[#9AA1AA] max-w-xs truncate">
                          {app.notes || '—'}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAppModal(app)}
                            className="h-7 text-xs px-2.5 border-[#222222] text-[#EDEDED] hover:border-[#FF6B00] hover:text-[#FF6B00]"
                          >
                            Update Stage
                          </Button>
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

      {/* TAB 2: PLACEMENT ACTIVITY HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="rounded-md border border-[#222222] bg-[#0A0A0A] p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#9AA1AA] mb-4">
              Immutable Placement Activity Timeline ({student.history.length} Events)
            </div>

            {student.history.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#9AA1AA]">
                No recorded historical transitions for this candidate.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-[#222222]">
                {student.history.map((h) => (
                  <div key={h.id} className="relative group">
                    <span className="absolute -left-6 top-1.5 h-2 w-2 rounded-full bg-[#FF6B00] ring-4 ring-[#0A0A0A]" />
                    <div className="p-3.5 rounded border border-[#222222] bg-[#121212]/50 space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <div className="font-semibold text-[#EDEDED] flex items-center gap-2">
                          <span>{h.companyName}</span>
                          <span className="text-[#9AA1AA]">•</span>
                          <span className="text-[#9AA1AA]">{h.jobRole}</span>
                        </div>
                        <div className="text-[11px] text-[#9AA1AA] font-mono">
                          {formatDateTime(h.createdAt)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[#9AA1AA]">Transition:</span>
                        {h.fromStatus ? (
                          <>
                            <span className="font-mono text-[11px] text-[#9AA1AA] uppercase">
                              {h.fromStatus}
                            </span>
                            <span className="text-[#9AA1AA]">→</span>
                          </>
                        ) : (
                          <span className="text-[11px] text-[#9AA1AA]">Initial Registration →</span>
                        )}
                        <span className="font-semibold text-emerald-400 font-mono text-[11px] uppercase">
                          {h.toStatus}
                        </span>
                      </div>

                      {h.notes && (
                        <div className="text-xs text-[#EDEDED] bg-[#0A0A0A] p-2 rounded border border-[#222222] mt-1">
                          {h.notes}
                        </div>
                      )}

                      {(h.interviewDate || h.interviewVenue) && (
                        <div className="text-[11px] text-[#9AA1AA] flex items-center gap-3 pt-1">
                          {h.interviewDate && (
                            <span className="flex items-center gap-1 text-purple-400">
                              <Calendar className="h-3 w-3" />
                              Interview: {formatDateTime(h.interviewDate)}
                            </span>
                          )}
                          {h.interviewVenue && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {h.interviewVenue}
                            </span>
                          )}
                        </div>
                      )}

                      {h.changedByEmail && (
                        <div className="text-[10px] text-[#9AA1AA] pt-1">
                          Authorized by: {h.changedByEmail}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ELIGIBLE DRIVES & NOMINATION */}
      {activeTab === 'eligible' && (
        <div className="space-y-4">
          <div className="rounded-md border border-[#222222] bg-[#0A0A0A] overflow-hidden">
            <div className="p-4 border-b border-[#222222]">
              <div className="text-xs font-semibold text-[#EDEDED] uppercase tracking-wider">
                Recruitment Drive Eligibility Engine
              </div>
              <p className="text-xs text-[#9AA1AA] mt-0.5">
                Dynamic matching based on CGPA ({student.cgpa}), department ({student.department}), and year ({student.year}).
              </p>
            </div>

            {student.eligibleDrives.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Building className="h-8 w-8 text-[#9AA1AA] mx-auto opacity-40" />
                <div className="text-sm font-medium text-[#EDEDED]">No Open Placement Drives</div>
                <p className="text-xs text-[#9AA1AA] max-w-sm mx-auto">
                  There are currently no active or open placement drives available.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#222222] bg-[#121212] text-[#9AA1AA] uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Recruiter & Role</th>
                      <th className="py-3 px-4 font-semibold">Compensation</th>
                      <th className="py-3 px-4 font-semibold">Deadline / Date</th>
                      <th className="py-3 px-4 font-semibold">Eligibility Verification</th>
                      <th className="py-3 px-4 font-semibold">Registration Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222222] text-[#EDEDED]">
                    {student.eligibleDrives.map((drive) => (
                      <tr key={drive.driveId} className="hover:bg-[#121212]/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#EDEDED] flex items-center gap-1.5">
                            <Building className="h-3.5 w-3.5 text-[#FF6B00]" />
                            {drive.companyName}
                          </div>
                          <div className="text-[#9AA1AA] mt-0.5">{drive.jobRole}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-mono text-[#FF6B00] font-medium">
                            {drive.packageDetails}
                          </div>
                          <div className="text-[11px] text-[#9AA1AA]">{drive.tier}</div>
                        </td>

                        <td className="py-3 px-4 text-[#9AA1AA]">
                          <div>Reg: {formatDate(drive.registrationDeadline)}</div>
                          {drive.driveDate && (
                            <div className="text-[11px] text-[#EDEDED]">
                              Drive: {formatDate(drive.driveDate)}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {drive.isEligible ? (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" />
                              Eligible (All checks passed)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                              <AlertCircle className="h-3 w-3" />
                              Ineligible ({drive.eligibilityReasons[0] || 'Criteria not met'})
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {drive.hasApplied ? (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Registered ({drive.applicationStatus?.toUpperCase()})
                            </span>
                          ) : (
                            <span className="text-[#9AA1AA] text-xs">Not Registered</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {drive.hasApplied ? (
                            <Link href={`/admin/placements/${drive.driveId}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2.5 border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]"
                              >
                                View Drive
                              </Button>
                            </Link>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRegisterModal(drive)}
                              className="h-7 text-xs px-2.5 border-[#222222] text-[#FF6B00] hover:bg-[#FF6B00] hover:text-black"
                            >
                              Nominate / Register
                            </Button>
                          )}
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

      {/* TAB 4: ACADEMIC PROFILE & DOSSIER */}
      {activeTab === 'academic' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#EDEDED] flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-[#FF6B00]" />
                Academic Allocation & Enrollment
              </div>
              <div className="border-b border-[#222222]" />

              <div className="space-y-2.5 text-xs">
                <div>
                  <div className="text-[#9AA1AA]">University Roll Number / ID</div>
                  <div className="font-mono text-sm font-semibold text-[#EDEDED] mt-0.5">
                    {student.studentId}
                  </div>
                </div>

                <div>
                  <div className="text-[#9AA1AA]">Department</div>
                  <div className="font-medium text-[#EDEDED] mt-0.5">{student.department}</div>
                </div>

                <div>
                  <div className="text-[#9AA1AA]">Academic Program / Branch</div>
                  <div className="font-medium text-[#EDEDED] mt-0.5">
                    {student.programName || 'Standard Department Program'}
                  </div>
                </div>

                <div>
                  <div className="text-[#9AA1AA]">Section & Cohort</div>
                  <div className="font-medium text-[#EDEDED] mt-0.5">
                    Year {student.year}
                    {student.sectionName ? ` • Section ${student.sectionName}` : ''}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#EDEDED] flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#FF6B00]" />
                Placement Documentation
              </div>
              <div className="border-b border-[#222222]" />

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[#9AA1AA]">Cumulative GPA (Scale of 10)</div>
                  <div className="text-sm font-semibold font-mono text-[#EDEDED] mt-0.5">
                    {student.cgpa.toFixed(2)}
                  </div>
                </div>

                <div>
                  <div className="text-[#9AA1AA]">Active Backlogs</div>
                  <div className="text-sm font-semibold font-mono text-emerald-400 mt-0.5">
                    0 (Eligible for all tiers)
                  </div>
                </div>

                <div>
                  <div className="text-[#9AA1AA]">Active Resume Archive</div>
                  <div className="mt-1">
                    {student.resume ? (
                      <div className="p-2.5 rounded bg-[#121212] border border-[#222222] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#FF6B00]" />
                          <div>
                            <div className="text-xs font-medium text-[#EDEDED]">
                              {student.resume.fileName}
                            </div>
                            <div className="text-[10px] text-[#9AA1AA]">
                              Uploaded on {formatDate(student.resume.updatedAt)}
                            </div>
                          </div>
                        </div>
                        <a
                          href={`/api/resources/download?path=${encodeURIComponent(
                            student.resume.filePath
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#FF6B00] hover:underline"
                        >
                          Download
                        </a>
                      </div>
                    ) : (
                      <span className="text-[#9AA1AA]">No resume uploaded yet</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. Modal: Update Overall Student Placement Status */}
      {statusModalOpen && (
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

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#9AA1AA] block mb-1.5">New Placement Status</label>
                <select
                  value={targetStudentStatus}
                  onChange={(e) => setTargetStudentStatus(e.target.value as PlacementStatus)}
                  className="w-full text-xs h-9 rounded border border-[#222222] bg-[#121212] text-[#EDEDED] px-3 focus:outline-none focus:border-[#FF6B00]"
                >
                  <option value="unplaced">Unplaced (Seeking Opportunities)</option>
                  <option value="in_process">In Process (Interviewing / Shortlisted)</option>
                  <option value="placed">Placed (Hired by Corporate Partner)</option>
                  <option value="opted_out">Opted Out (Higher Studies / Competitive Exams)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#9AA1AA] block mb-1.5">
                  Administrative Note (Logged for Audit)
                </label>
                <textarea
                  value={studentStatusNotes}
                  onChange={(e) => setStudentStatusNotes(e.target.value)}
                  placeholder="Reason or notes regarding placement status modification..."
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
                onClick={handleUpdateStudentStatus}
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

      {/* 2. Modal: Update Application Stage */}
      {appModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-md border border-[#222222] bg-[#0A0A0A] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="text-sm font-semibold text-[#EDEDED] flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#FF6B00]" />
                Advance Application Stage
              </div>
              <button
                onClick={() => setAppModalOpen(false)}
                className="text-xs text-[#9AA1AA] hover:text-[#EDEDED]"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded bg-[#121212] border border-[#222222] text-xs space-y-1">
              <div className="font-semibold text-[#EDEDED]">{selectedApp.companyName}</div>
              <div className="text-[#9AA1AA]">Role: {selectedApp.jobRole}</div>
              <div className="text-[#9AA1AA]">
                Current Stage:{' '}
                <span className="font-mono text-emerald-400 uppercase font-semibold">
                  {selectedApp.status}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#9AA1AA] block mb-1.5">New Application Stage</label>
                <select
                  value={targetAppStatus}
                  onChange={(e) => setTargetAppStatus(e.target.value as ApplicationStatus)}
                  className="w-full text-xs h-9 rounded border border-[#222222] bg-[#121212] text-[#EDEDED] px-3 focus:outline-none focus:border-[#FF6B00]"
                >
                  <option value="applied">Applied (Initial Submission)</option>
                  <option value="shortlisted">Shortlisted for Assessment / Next Round</option>
                  <option value="interview">Interview Scheduled</option>
                  <option value="selected">Selected by Recruiter</option>
                  <option value="placed">Placed (Final Offer Accepted)</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn by Candidate</option>
                </select>
              </div>

              {targetAppStatus === 'interview' && (
                <div className="space-y-2 p-3 rounded bg-[#121212] border border-purple-500/20">
                  <div className="text-xs font-medium text-purple-400">Interview Logistics</div>
                  <div>
                    <label className="text-[11px] text-[#9AA1AA] block mb-1">
                      Date & Time (Optional)
                    </label>
                    <Input
                      type="datetime-local"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="text-xs h-8 bg-[#0A0A0A] border-[#222222] text-[#EDEDED]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#9AA1AA] block mb-1">
                      Venue / Link (Optional)
                    </label>
                    <Input
                      value={interviewVenue}
                      onChange={(e) => setInterviewVenue(e.target.value)}
                      placeholder="e.g. Lab 304, Academic Block or Google Meet link"
                      className="text-xs h-8 bg-[#0A0A0A] border-[#222222] text-[#EDEDED]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-[#9AA1AA] block mb-1.5">
                  Interview / Selection Feedback / Notes (Preserved in History)
                </label>
                <textarea
                  value={appNotes}
                  onChange={(e) => setAppNotes(e.target.value)}
                  placeholder="Notes, interviewer score, or feedback..."
                  rows={2}
                  className="w-full text-xs rounded border border-[#222222] bg-[#121212] text-[#EDEDED] p-2.5 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAppModalOpen(false)}
                disabled={isPending}
                className="text-xs h-8 text-[#9AA1AA] hover:text-[#EDEDED]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUpdateAppStatus}
                disabled={isPending}
                className="text-xs h-8 bg-[#FF6B00] text-black font-medium hover:bg-[#E05E00]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Save Application Stage'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Nominate / Register Student for Drive */}
      {registerModalOpen && selectedDrive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-md border border-[#222222] bg-[#0A0A0A] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="text-sm font-semibold text-[#EDEDED] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#FF6B00]" />
                Register Candidate for Drive
              </div>
              <button
                onClick={() => setRegisterModalOpen(false)}
                className="text-xs text-[#9AA1AA] hover:text-[#EDEDED]"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded bg-[#121212] border border-[#222222] text-xs space-y-1">
              <div className="font-semibold text-[#EDEDED]">{selectedDrive.companyName}</div>
              <div className="text-[#9AA1AA]">Role: {selectedDrive.jobRole}</div>
              <div className="text-mono text-[#FF6B00]">{selectedDrive.packageDetails}</div>
            </div>

            <div>
              <label className="text-xs text-[#9AA1AA] block mb-1.5">
                Nomination Notes (Optional)
              </label>
              <textarea
                value={registerNotes}
                onChange={(e) => setRegisterNotes(e.target.value)}
                placeholder="Nominated by administrator based on candidate skill match..."
                rows={2}
                className="w-full text-xs rounded border border-[#222222] bg-[#121212] text-[#EDEDED] p-2.5 focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRegisterModalOpen(false)}
                disabled={isPending}
                className="text-xs h-8 text-[#9AA1AA] hover:text-[#EDEDED]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRegisterStudent}
                disabled={isPending}
                className="text-xs h-8 bg-[#FF6B00] text-black font-medium hover:bg-[#E05E00]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Confirm Registration'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
