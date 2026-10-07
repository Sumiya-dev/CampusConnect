'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Send,
  Clock,
  CheckCircle,
  XCircle,
  CheckCheck,
  Building,
  GraduationCap,
  MessageSquare,
  AlertCircle,
  User,
} from 'lucide-react';
import { GuidanceRequest, GuidanceRequestStatus } from '@/lib/types/alumni.types';
import { UserRole } from '@/lib/types/database.types';
import { Button } from '@/components/ui/button';
import { updateGuidanceRequestStatusAction } from '@/lib/alumni/actions';
import { AlumniNavigation } from './alumni-navigation';

interface GuidanceRequestsViewProps {
  initialRequests: GuidanceRequest[];
  currentUser: {
    id: string;
    role: UserRole;
    name: string;
  };
  baseHref?: string;
}

export function GuidanceRequestsView({
  initialRequests,
  currentUser,
  baseHref = '/student/alumni',
}: GuidanceRequestsViewProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<GuidanceRequest[]>(initialRequests);
  const [activeFilter, setActiveFilter] = useState<'ALL' | GuidanceRequestStatus>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [responseNoteInput, setResponseNoteInput] = useState<Record<string, string>>({});
  const [activeNoteBoxId, setActiveNoteBoxId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isAlumni = currentUser.role === 'alumni';
  const isStudent = currentUser.role === 'student';
  const isStudentOrAlumni = isStudent || isAlumni;

  const filteredRequests = requests.filter((r) => {
    if (activeFilter !== 'ALL' && r.status !== activeFilter) return false;
    return true;
  });

  const getStatusBadge = (status: GuidanceRequestStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-yellow-950/30 text-yellow-400 border border-yellow-800/40">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-emerald-950/30 text-emerald-400 border border-emerald-800/40">
            <CheckCircle className="h-3 w-3" />
            <span>Accepted</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-red-950/30 text-red-400 border border-red-800/40">
            <XCircle className="h-3 w-3" />
            <span>Rejected</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-sky-950/30 text-sky-400 border border-sky-800/40">
            <CheckCheck className="h-3 w-3" />
            <span>Completed</span>
          </span>
        );
    }
  };

  async function handleStatusUpdate(
    requestId: string,
    status: GuidanceRequestStatus,
    note?: string
  ) {
    setUpdatingId(requestId);
    setActionError(null);

    const res = await updateGuidanceRequestStatusAction(requestId, status, note);
    setUpdatingId(null);

    if (res.success) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status,
                response_note: note !== undefined ? note : r.response_note,
                updated_at: new Date().toISOString(),
              }
            : r
        )
      );
      setActiveNoteBoxId(null);
      router.refresh();
    } else {
      setActionError(res.error || 'Failed to update request status.');
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Sub Navigation */}
      <AlumniNavigation baseHref={baseHref} isStudentOrAlumni={isStudentOrAlumni} />

      {/* Header Info Banner */}
      <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg p-5 space-y-1">
        <h2 className="text-base font-semibold text-[#EDEDED]">
          {isAlumni ? 'Incoming Guidance Requests' : 'My Guidance Requests'}
        </h2>
        <p className="text-xs text-[#9AA1AA]">
          {isAlumni
            ? 'Review and manage guidance inquiries submitted by current university students seeking your career mentorship.'
            : 'Track the status of your guidance inquiries sent to alumni graduates.'}
        </p>
      </div>

      {actionError && (
        <div className="p-3 bg-red-950/30 border border-red-800/40 rounded-md flex items-center gap-2 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#222222] scrollbar-none">
        {(['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED'] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setActiveFilter(st)}
            className={`px-3 py-1 text-xs rounded transition-colors whitespace-nowrap ${
              activeFilter === st
                ? 'bg-[#161616] text-[#FF6B00] border border-[#FF6B00]/30 font-semibold'
                : 'text-[#9AA1AA] hover:text-[#EDEDED]'
            }`}
          >
            {st === 'ALL' ? 'All Requests' : st}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-16 px-4 border border-[#222222] bg-[#0A0A0A] rounded-lg space-y-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#161616] text-[#717784]">
              <Send className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-[#EDEDED]">No guidance requests yet.</h4>
              <p className="text-xs text-[#9AA1AA] max-w-sm mx-auto">
                {isAlumni
                  ? 'Inquiries sent to you by students will appear here.'
                  : 'You have not submitted any guidance requests. Discover alumni in the directory to request mentorship.'}
              </p>
            </div>
            {isStudent && (
              <Link
                href={baseHref}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-[#FF6B00] text-black hover:bg-[#E05E00] mt-2 transition-colors"
              >
                <span>Browse Alumni Directory</span>
              </Link>
            )}
          </div>
        ) : (
          filteredRequests.map((req) => {
            const alumniName = req.alumni?.user?.name || 'Alumni';
            const studentName = req.student?.name || 'Student';
            const isUpdatingThis = updatingId === req.id;

            return (
              <div
                key={req.id}
                className="bg-[#0A0A0A] border border-[#222222] rounded-lg p-5 space-y-4 hover:border-[#333333] transition-colors"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C1C1C]">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-[#161616] border border-[#262626] flex items-center justify-center text-xs font-semibold text-[#FF6B00] shrink-0 mt-0.5">
                      {isAlumni
                        ? studentName.charAt(0).toUpperCase()
                        : alumniName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      {isAlumni ? (
                        <>
                          <h4 className="text-sm font-semibold text-[#EDEDED]">{studentName}</h4>
                          <p className="text-xs text-[#9AA1AA]">
                            {req.student?.department || 'Student'} • University Student
                          </p>
                        </>
                      ) : (
                        <>
                          <h4 className="text-sm font-semibold text-[#EDEDED] flex items-center gap-2">
                            <span>{alumniName}</span>
                            {req.alumni && (
                              <Link
                                href={`${baseHref}/${req.alumni.id}`}
                                className="text-[11px] text-[#717784] hover:text-[#FF6B00] underline"
                              >
                                View Profile
                              </Link>
                            )}
                          </h4>
                          <p className="text-xs text-[#9AA1AA] flex items-center gap-1">
                            <Building className="h-3 w-3 text-[#717784]" />
                            {[req.alumni?.job_role, req.alumni?.current_company]
                              .filter(Boolean)
                              .join(' at ') || 'Alumni Member'}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-center">
                    {getStatusBadge(req.status)}
                    <span className="text-[10px] text-[#717784] font-mono">
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Message Body */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#717784] block">
                    Guidance Request Message
                  </span>
                  <div className="p-3 bg-[#121212] border border-[#1F1F1F] rounded-md text-xs text-[#EDEDED] leading-relaxed whitespace-pre-line">
                    {req.message}
                  </div>
                </div>

                {/* Response Note if present */}
                {req.response_note && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF6B00] block">
                      Alumni Response Note
                    </span>
                    <div className="p-3 bg-[#FF6B00]/5 border border-[#FF6B00]/20 rounded-md text-xs text-[#EDEDED] leading-relaxed whitespace-pre-line">
                      {req.response_note}
                    </div>
                  </div>
                )}

                {/* Alumni Action Controls (Accept, Reject, Complete, Add Note) */}
                {isAlumni && (
                  <div className="pt-3 border-t border-[#1C1C1C] space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {req.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            disabled={isUpdatingThis}
                            onClick={() => handleStatusUpdate(req.id, 'ACCEPTED')}
                            className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white h-7 font-medium"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Accept</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isUpdatingThis}
                            onClick={() => handleStatusUpdate(req.id, 'REJECTED')}
                            className="text-xs gap-1.5 border-red-800/40 text-red-400 hover:bg-red-950/30 h-7"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </Button>
                        </>
                      )}

                      {req.status === 'ACCEPTED' && (
                        <Button
                          size="sm"
                          disabled={isUpdatingThis}
                          onClick={() => handleStatusUpdate(req.id, 'COMPLETED')}
                          className="text-xs gap-1.5 bg-sky-600 hover:bg-sky-500 text-white h-7 font-medium"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          <span>Mark Completed</span>
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setActiveNoteBoxId(activeNoteBoxId === req.id ? null : req.id)
                        }
                        className="text-xs gap-1.5 border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED] h-7"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{req.response_note ? 'Edit Note' : 'Add Note'}</span>
                      </Button>
                    </div>

                    {/* Note Box */}
                    {activeNoteBoxId === req.id && (
                      <div className="p-3 bg-[#121212] border border-[#262626] rounded space-y-2">
                        <textarea
                          value={
                            responseNoteInput[req.id] !== undefined
                              ? responseNoteInput[req.id]
                              : req.response_note || ''
                          }
                          onChange={(e) =>
                            setResponseNoteInput((prev) => ({
                              ...prev,
                              [req.id]: e.target.value,
                            }))
                          }
                          placeholder="Add advice, contact instructions, or meeting links for the student..."
                          rows={2}
                          className="w-full bg-[#0A0A0A] border border-[#222222] rounded p-2 text-xs text-[#EDEDED] placeholder-[#717784] focus:outline-none focus:border-[#FF6B00] resize-none"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveNoteBoxId(null)}
                            className="text-xs h-7"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={isUpdatingThis}
                            onClick={() =>
                              handleStatusUpdate(
                                req.id,
                                req.status,
                                responseNoteInput[req.id] !== undefined
                                  ? responseNoteInput[req.id]
                                  : req.response_note || ''
                              )
                            }
                            className="text-xs h-7 bg-[#FF6B00] text-black hover:bg-[#E05E00]"
                          >
                            Save Note
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
