'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CommunityComment,
  CommunityPost,
  CommunityReport,
  CommunityReportStatus,
} from '@/lib/types/community.types';
import {
  moderatePostAction,
  moderateCommentAction,
  updateReportStatusAction,
} from '@/lib/community/moderation-actions';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  RotateCcw,
  MessageSquare,
  MessageCircle,
  Flag,
  User,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface CommunityPostModerationViewProps {
  post: CommunityPost;
  comments: CommunityComment[];
  reports: CommunityReport[];
}

export function CommunityPostModerationView({
  post,
  comments,
  reports,
}: CommunityPostModerationViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [hidePostOpen, setHidePostOpen] = useState(false);
  const [restorePostOpen, setRestorePostOpen] = useState(false);
  const [hideCommentTarget, setHideCommentTarget] = useState<CommunityComment | null>(null);
  const [restoreCommentTarget, setRestoreCommentTarget] = useState<CommunityComment | null>(null);
  const [reportTarget, setReportTarget] = useState<CommunityReport | null>(null);
  const [targetReportStatus, setTargetReportStatus] = useState<CommunityReportStatus>('Resolved');
  const [moderationReason, setModerationReason] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Alerts
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearAlerts = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleModeratePost = (action: 'hide' | 'restore') => {
    clearAlerts();
    startTransition(async () => {
      const res = await moderatePostAction(post.id, action, moderationReason);
      if (res.success) {
        setSuccessMessage(res.message || 'Post moderation updated.');
        setHidePostOpen(false);
        setRestorePostOpen(false);
        setModerationReason('');
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Failed to moderate post.');
      }
    });
  };

  const handleModerateComment = (action: 'hide' | 'restore') => {
    const comment = action === 'hide' ? hideCommentTarget : restoreCommentTarget;
    if (!comment) return;
    clearAlerts();

    startTransition(async () => {
      const res = await moderateCommentAction(comment.id, action, moderationReason);
      if (res.success) {
        setSuccessMessage(res.message || 'Comment moderation updated.');
        setHideCommentTarget(null);
        setRestoreCommentTarget(null);
        setModerationReason('');
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Failed to moderate comment.');
      }
    });
  };

  const handleUpdateReportStatus = () => {
    if (!reportTarget) return;
    clearAlerts();

    startTransition(async () => {
      const res = await updateReportStatusAction(
        reportTarget.id,
        targetReportStatus,
        resolutionNotes
      );
      if (res.success) {
        setSuccessMessage(res.message || 'Report status updated.');
        setReportTarget(null);
        setResolutionNotes('');
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Failed to update report.');
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

  const isPostHidden = post.is_deleted || post.is_moderated;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-4">
        <div>
          <Link
            href="/admin/moderation"
            className="inline-flex items-center gap-1.5 text-xs text-[#9AA1AA] hover:text-[#EDEDED] mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Moderation Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-[#EDEDED] tracking-tight">{post.title}</h1>
            {isPostHidden ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                <EyeOff className="h-3 w-3" />
                Hidden / Moderated
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Eye className="h-3 w-3" />
                Active / Visible
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-[#9AA1AA] mt-1">
            <span className="px-2 py-0.5 rounded bg-[#121212] border border-[#222222] text-[#EDEDED] text-[10px]">
              {post.category}
            </span>
            <span>•</span>
            <span className="font-mono">{post.visibility}</span>
            <span>•</span>
            <span>Posted on {formatDate(post.created_at)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPostHidden ? (
            <Button
              size="sm"
              onClick={() => {
                clearAlerts();
                setRestorePostOpen(true);
              }}
              className="text-xs h-8 bg-emerald-600 text-white font-medium hover:bg-emerald-700"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Restore Post
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                clearAlerts();
                setModerationReason('');
                setHidePostOpen(true);
              }}
              className="text-xs h-8 bg-red-600 text-white font-medium hover:bg-red-700"
            >
              <EyeOff className="h-3.5 w-3.5 mr-1.5" />
              Hide Inappropriate Post
            </Button>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      {errorMessage && (
        <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
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
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-xs hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Post & Author Details Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Post Content */}
        <div className="md:col-span-2 rounded-md border border-[#222222] bg-[#0A0A0A] p-5 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#9AA1AA]">
            Full Post Content
          </div>
          <div className="text-sm leading-relaxed text-[#EDEDED] whitespace-pre-wrap font-sans bg-[#121212] p-4 rounded border border-[#222222]">
            {post.content}
          </div>

          {post.moderation_reason && (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Moderation Reason:
              </div>
              <div className="text-[#EDEDED]">{post.moderation_reason}</div>
              {post.moderated_at && (
                <div className="text-[10px] text-[#9AA1AA]">
                  Moderated on: {formatDateTime(post.moderated_at)}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-[#9AA1AA] pt-2 border-t border-[#222222]">
            <span>{post.like_count} Likes</span>
            <span>•</span>
            <span>{comments.length} Comments</span>
            <span>•</span>
            <span>{reports.length} Reports Filed</span>
          </div>
        </div>

        {/* Author Dossier */}
        <div className="rounded-md border border-[#222222] bg-[#0A0A0A] p-5 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#9AA1AA] flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-[#FF6B00]" />
            Author Information
          </div>
          <div className="border-b border-[#222222]" />

          <div className="space-y-2.5 text-xs">
            <div>
              <div className="text-[#9AA1AA]">Author Name</div>
              <div className="font-semibold text-sm text-[#EDEDED] mt-0.5">
                {post.author?.name || 'Anonymous User'}
              </div>
            </div>

            <div>
              <div className="text-[#9AA1AA]">Account Role</div>
              <div className="font-medium text-[#EDEDED] capitalize mt-0.5">
                {post.author?.role || 'Unknown'}
              </div>
            </div>

            <div>
              <div className="text-[#9AA1AA]">Department</div>
              <div className="font-medium text-[#EDEDED] mt-0.5">
                {post.author?.department || 'Not specified'}
              </div>
            </div>

            <div className="pt-2">
              <Link href="/admin/users">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-7 border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]"
                >
                  Inspect In User Directory
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Filed Section */}
      {reports.length > 0 && (
        <div className="rounded-md border border-[#222222] bg-[#0A0A0A] p-5 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-red-400 flex items-center gap-2">
            <Flag className="h-3.5 w-3.5" />
            Flagged Reports Against This Discussion ({reports.length})
          </div>

          <div className="space-y-2">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-3 rounded border border-[#222222] bg-[#121212] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-semibold text-[#EDEDED]">Reason: {report.reason}</div>
                  {report.details && <div className="text-[#9AA1AA] mt-0.5">{report.details}</div>}
                  <div className="text-[11px] text-[#9AA1AA] mt-1">
                    Filed by {report.reporter?.name || 'User'} on {formatDateTime(report.created_at)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] uppercase text-[#FF6B00]">
                    Status: {report.status}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReportTarget(report);
                      setTargetReportStatus(report.status);
                      setResolutionNotes(report.resolution_notes || '');
                      clearAlerts();
                    }}
                    className="h-7 text-xs px-2.5 border-[#222222] text-[#EDEDED] hover:border-[#FF6B00] hover:text-[#FF6B00]"
                  >
                    Update Report
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments Thread with Moderation Controls */}
      <div className="rounded-md border border-[#222222] bg-[#0A0A0A] p-5 space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#EDEDED] flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-[#FF6B00]" />
          Thread Comments ({comments.length})
        </div>

        {comments.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#9AA1AA]">
            No replies or comments on this discussion thread.
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => {
              const isCommentHidden = comment.is_deleted || comment.is_moderated;
              return (
                <div
                  key={comment.id}
                  className={`p-3.5 rounded border ${
                    isCommentHidden
                      ? 'border-red-500/20 bg-red-500/5'
                      : 'border-[#222222] bg-[#121212]'
                  } space-y-2 text-xs`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-[#EDEDED] flex items-center gap-2">
                      <span>{comment.author?.name || 'Anonymous User'}</span>
                      <span className="text-[11px] text-[#9AA1AA]">
                        ({comment.author?.role}) • {formatDateTime(comment.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCommentHidden ? (
                        <span className="text-[11px] text-red-400 font-mono">Hidden</span>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-mono">Visible</span>
                      )}

                      {isCommentHidden ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRestoreCommentTarget(comment);
                            clearAlerts();
                          }}
                          className="h-6 text-xs px-2 text-emerald-400 hover:bg-emerald-500/10"
                        >
                          Restore
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setHideCommentTarget(comment);
                            setModerationReason('');
                            clearAlerts();
                          }}
                          className="h-6 text-xs px-2 text-red-400 hover:bg-red-500/10"
                        >
                          Hide Comment
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="text-[#EDEDED] whitespace-pre-wrap">{comment.content}</div>

                  {comment.moderation_reason && (
                    <div className="text-[10px] text-red-400 bg-red-500/10 p-1.5 rounded">
                      Moderation Reason: {comment.moderation_reason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: HIDE POST */}
      {hidePostOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-md border border-[#222222] bg-[#0A0A0A] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="text-sm font-semibold text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Hide Discussion Post
              </div>
              <button onClick={() => setHidePostOpen(false)} className="text-xs text-[#9AA1AA]">
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs text-[#9AA1AA] block mb-1.5">
                Moderation Reason (Recorded in Audit Log)
              </label>
              <textarea
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="Institutional conduct policy violation, inappropriate content..."
                rows={3}
                className="w-full text-xs rounded border border-[#222222] bg-[#121212] text-[#EDEDED] p-2.5 focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHidePostOpen(false)}
                disabled={isPending}
                className="text-xs h-8 text-[#9AA1AA]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleModeratePost('hide')}
                disabled={isPending}
                className="text-xs h-8 bg-red-600 text-white font-medium hover:bg-red-700"
              >
                {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : 'Confirm & Hide Post'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RESTORE POST */}
      {restorePostOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-md border border-[#222222] bg-[#0A0A0A] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Restore Discussion Post
              </div>
              <button onClick={() => setRestorePostOpen(false)} className="text-xs text-[#9AA1AA]">
                ✕
              </button>
            </div>

            <p className="text-xs text-[#9AA1AA]">
              This will restore the post to active community feeds, making it publicly accessible to
              students and faculty.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRestorePostOpen(false)}
                disabled={isPending}
                className="text-xs h-8 text-[#9AA1AA]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleModeratePost('restore')}
                disabled={isPending}
                className="text-xs h-8 bg-emerald-600 text-white font-medium hover:bg-emerald-700"
              >
                {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : 'Restore Post'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: HIDE COMMENT */}
      {hideCommentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-md border border-[#222222] bg-[#0A0A0A] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="text-sm font-semibold text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Hide Comment
              </div>
              <button
                onClick={() => setHideCommentTarget(null)}
                className="text-xs text-[#9AA1AA]"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs text-[#9AA1AA] block mb-1.5">Moderation Reason</label>
              <textarea
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="Reason for hiding comment..."
                rows={2}
                className="w-full text-xs rounded border border-[#222222] bg-[#121212] text-[#EDEDED] p-2.5 focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHideCommentTarget(null)}
                disabled={isPending}
                className="text-xs h-8 text-[#9AA1AA]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleModerateComment('hide')}
                disabled={isPending}
                className="text-xs h-8 bg-red-600 text-white font-medium hover:bg-red-700"
              >
                {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : 'Confirm & Hide'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: RESTORE COMMENT */}
      {restoreCommentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-md border border-[#222222] bg-[#0A0A0A] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Restore Comment
              </div>
              <button
                onClick={() => setRestoreCommentTarget(null)}
                className="text-xs text-[#9AA1AA]"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#9AA1AA]">Restore this comment to the discussion thread?</p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRestoreCommentTarget(null)}
                disabled={isPending}
                className="text-xs h-8 text-[#9AA1AA]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleModerateComment('restore')}
                disabled={isPending}
                className="text-xs h-8 bg-emerald-600 text-white font-medium hover:bg-emerald-700"
              >
                {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : 'Restore Comment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: UPDATE REPORT */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-md border border-[#222222] bg-[#0A0A0A] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="text-sm font-semibold text-[#EDEDED] flex items-center gap-2">
                <Flag className="h-4 w-4 text-[#FF6B00]" />
                Update Report Status
              </div>
              <button onClick={() => setReportTarget(null)} className="text-xs text-[#9AA1AA]">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#9AA1AA] block mb-1.5">New Status</label>
                <select
                  value={targetReportStatus}
                  onChange={(e) => setTargetReportStatus(e.target.value as CommunityReportStatus)}
                  className="w-full text-xs h-9 rounded border border-[#222222] bg-[#121212] text-[#EDEDED] px-3 focus:outline-none focus:border-[#FF6B00]"
                >
                  <option value="Reviewed">Reviewed</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Dismissed">Dismissed</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#9AA1AA] block mb-1.5">
                  Resolution Notes (Optional)
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Decision notes or actions taken..."
                  rows={2}
                  className="w-full text-xs rounded border border-[#222222] bg-[#121212] text-[#EDEDED] p-2.5 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReportTarget(null)}
                disabled={isPending}
                className="text-xs h-8 text-[#9AA1AA]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUpdateReportStatus}
                disabled={isPending}
                className="text-xs h-8 bg-[#FF6B00] text-black font-medium hover:bg-[#E05E00]"
              >
                {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : 'Save Report Status'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
