'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CommunityCategory,
  CommunityComment,
  CommunityPost,
  CommunityReport,
  CommunityReportStatus,
  ModerationStats,
} from '@/lib/types/community.types';
import {
  moderatePostAction,
  moderateCommentAction,
  updateReportStatusAction,
} from '@/lib/community/moderation-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  MessageSquare,
  MessageCircle,
  Eye,
  EyeOff,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
  AlertCircle,
  Clock,
  User,
  ExternalLink,
  ChevronRight,
  Flag,
} from 'lucide-react';

interface CommunityModerationDashboardProps {
  stats: ModerationStats;
  initialPosts: CommunityPost[];
  initialComments: CommunityComment[];
  initialReports: CommunityReport[];
}

export function CommunityModerationDashboard({
  stats,
  initialPosts,
  initialComments,
  initialReports,
}: CommunityModerationDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Active Tab: 'reports' | 'posts' | 'comments'
  const [activeTab, setActiveTab] = useState<'reports' | 'posts' | 'comments'>('reports');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CommunityCategory | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'moderated' | 'reported'>('all');
  const [reportStatusFilter, setReportStatusFilter] = useState<CommunityReportStatus | 'all'>('all');

  // Modals state
  const [hidePostModal, setHidePostModal] = useState<CommunityPost | null>(null);
  const [restorePostModal, setRestorePostModal] = useState<CommunityPost | null>(null);
  const [hideCommentModal, setHideCommentModal] = useState<CommunityComment | null>(null);
  const [restoreCommentModal, setRestoreCommentModal] = useState<CommunityComment | null>(null);
  const [reportModal, setReportModal] = useState<CommunityReport | null>(null);
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

  // Filtered Reports
  const filteredReports = initialReports.filter((r) => {
    if (reportStatusFilter !== 'all' && r.status !== reportStatusFilter) return false;
    if (search.trim()) {
      const term = search.toLowerCase().trim();
      const matchReason = r.reason.toLowerCase().includes(term);
      const matchReporter = r.reporter?.name?.toLowerCase().includes(term) ?? false;
      const matchPost = r.post?.title.toLowerCase().includes(term) ?? false;
      const matchComment = r.comment?.content.toLowerCase().includes(term) ?? false;
      if (!matchReason && !matchReporter && !matchPost && !matchComment) return false;
    }
    return true;
  });

  // Filtered Posts
  const filteredPosts = initialPosts.filter((p) => {
    if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
    if (statusFilter === 'active' && (p.is_deleted || p.is_moderated)) return false;
    if (statusFilter === 'moderated' && !p.is_deleted && !p.is_moderated) return false;
    if (statusFilter === 'reported' && (p.reports_count || 0) === 0) return false;

    if (search.trim()) {
      const term = search.toLowerCase().trim();
      const matchTitle = p.title.toLowerCase().includes(term);
      const matchContent = p.content.toLowerCase().includes(term);
      const matchAuthor = p.author?.name?.toLowerCase().includes(term) ?? false;
      if (!matchTitle && !matchContent && !matchAuthor) return false;
    }
    return true;
  });

  // Filtered Comments
  const filteredComments = initialComments.filter((c) => {
    if (statusFilter === 'active' && (c.is_deleted || c.is_moderated)) return false;
    if (statusFilter === 'moderated' && !c.is_deleted && !c.is_moderated) return false;
    if (statusFilter === 'reported' && (c.reports_count || 0) === 0) return false;

    if (search.trim()) {
      const term = search.toLowerCase().trim();
      const matchContent = c.content.toLowerCase().includes(term);
      const matchAuthor = c.author?.name?.toLowerCase().includes(term) ?? false;
      const matchPost = c.post?.title.toLowerCase().includes(term) ?? false;
      if (!matchContent && !matchAuthor && !matchPost) return false;
    }
    return true;
  });

  // Actions
  const handleModeratePost = (action: 'hide' | 'restore') => {
    const post = action === 'hide' ? hidePostModal : restorePostModal;
    if (!post) return;
    clearAlerts();

    startTransition(async () => {
      const res = await moderatePostAction(post.id, action, moderationReason);
      if (res.success) {
        setSuccessMessage(res.message || 'Post moderation updated.');
        setHidePostModal(null);
        setRestorePostModal(null);
        setModerationReason('');
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Failed to moderate post.');
      }
    });
  };

  const handleModerateComment = (action: 'hide' | 'restore') => {
    const comment = action === 'hide' ? hideCommentModal : restoreCommentModal;
    if (!comment) return;
    clearAlerts();

    startTransition(async () => {
      const res = await moderateCommentAction(comment.id, action, moderationReason);
      if (res.success) {
        setSuccessMessage(res.message || 'Comment moderation updated.');
        setHideCommentModal(null);
        setRestoreCommentModal(null);
        setModerationReason('');
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Failed to moderate comment.');
      }
    });
  };

  const handleUpdateReportStatus = () => {
    if (!reportModal) return;
    clearAlerts();

    startTransition(async () => {
      const res = await updateReportStatusAction(
        reportModal.id,
        targetReportStatus,
        resolutionNotes
      );
      if (res.success) {
        setSuccessMessage(res.message || 'Report status updated.');
        setReportModal(null);
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

  const getReportBadge = (status: CommunityReportStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            Pending Review
          </span>
        );
      case 'Reviewed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Reviewed
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Resolved
          </span>
        );
      case 'Dismissed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-[#1F242C] text-[#9AA1AA] border border-[#2A313C]">
            Dismissed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Moderation Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-md border border-[#222222] bg-[#0A0A0A]">
          <div className="text-xs text-[#9AA1AA]">Pending Reports</div>
          <div className="text-lg font-semibold text-amber-400 mt-1">{stats.pendingReports}</div>
          <div className="text-[11px] text-[#9AA1AA] mt-0.5">Needs admin action</div>
        </div>

        <div className="p-3.5 rounded-md border border-[#222222] bg-[#0A0A0A]">
          <div className="text-xs text-[#9AA1AA]">Resolved Reports</div>
          <div className="text-lg font-semibold text-emerald-400 mt-1">{stats.resolvedReports}</div>
          <div className="text-[11px] text-[#9AA1AA] mt-0.5">Cases closed</div>
        </div>

        <div className="p-3.5 rounded-md border border-[#222222] bg-[#0A0A0A]">
          <div className="text-xs text-[#9AA1AA]">Total Posts</div>
          <div className="text-lg font-semibold text-[#EDEDED] mt-1">{stats.totalPosts}</div>
          <div className="text-[11px] text-[#9AA1AA] mt-0.5">Community threads</div>
        </div>

        <div className="p-3.5 rounded-md border border-[#222222] bg-[#0A0A0A]">
          <div className="text-xs text-[#9AA1AA]">Moderated Posts</div>
          <div className="text-lg font-semibold text-[#FF6B00] mt-1">{stats.moderatedPosts}</div>
          <div className="text-[11px] text-[#9AA1AA] mt-0.5">Hidden / filtered</div>
        </div>

        <div className="p-3.5 rounded-md border border-[#222222] bg-[#0A0A0A]">
          <div className="text-xs text-[#9AA1AA]">Total Comments</div>
          <div className="text-lg font-semibold text-[#EDEDED] mt-1">{stats.totalComments}</div>
          <div className="text-[11px] text-[#9AA1AA] mt-0.5">Thread replies</div>
        </div>

        <div className="p-3.5 rounded-md border border-[#222222] bg-[#0A0A0A]">
          <div className="text-xs text-[#9AA1AA]">Moderated Comments</div>
          <div className="text-lg font-semibold text-[#FF6B00] mt-1">{stats.moderatedComments}</div>
          <div className="text-[11px] text-[#9AA1AA] mt-0.5">Hidden replies</div>
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

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-[#222222]">
        <button
          onClick={() => {
            setActiveTab('reports');
            setSearch('');
          }}
          className={`px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'reports'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-[#9AA1AA] hover:text-[#EDEDED]'
          }`}
        >
          <Flag className="h-3.5 w-3.5" />
          <span>Reported Items Queue ({initialReports.filter((r) => r.status === 'Pending').length} pending)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('posts');
            setSearch('');
          }}
          className={`px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'posts'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-[#9AA1AA] hover:text-[#EDEDED]'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Discussion Posts ({initialPosts.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('comments');
            setSearch('');
          }}
          className={`px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'comments'
              ? 'border-[#FF6B00] text-[#FF6B00]'
              : 'border-transparent text-[#9AA1AA] hover:text-[#EDEDED]'
          }`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span>Comments Directory ({initialComments.length})</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9AA1AA]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === 'reports'
                  ? 'Search reports by reason, reporter, or reported text...'
                  : activeTab === 'posts'
                  ? 'Search posts by title, content, or author name...'
                  : 'Search comments by content, author, or parent post...'
              }
              className="pl-9 text-xs h-9 bg-[#121212] border-[#222222] text-[#EDEDED] placeholder:text-[#9AA1AA]/60"
            />
          </div>

          {(search ||
            categoryFilter !== 'All' ||
            statusFilter !== 'all' ||
            reportStatusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setCategoryFilter('All');
                setStatusFilter('all');
                setReportStatusFilter('all');
              }}
              className="text-xs h-9 text-[#9AA1AA] hover:text-[#EDEDED]"
            >
              Reset Filters
            </Button>
          )}
        </div>

        {activeTab === 'reports' && (
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[#9AA1AA]">Status:</span>
            {(['all', 'Pending', 'Reviewed', 'Resolved', 'Dismissed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setReportStatusFilter(st)}
                className={`px-2.5 py-1 rounded border transition-colors ${
                  reportStatusFilter === st
                    ? 'bg-[#121212] border-[#FF6B00] text-[#FF6B00] font-medium'
                    : 'border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]'
                }`}
              >
                {st === 'all' ? 'All Reports' : st}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div>
              <label className="text-[11px] text-[#9AA1AA] block mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="w-full h-8 rounded border border-[#222222] bg-[#121212] text-[#EDEDED] px-2 focus:outline-none focus:border-[#FF6B00]"
              >
                <option value="All">All Categories</option>
                <option value="Placement">Placement</option>
                <option value="Preparation">Preparation</option>
                <option value="Technical">Technical</option>
                <option value="Career">Career</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[#9AA1AA] block mb-1">Moderation Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full h-8 rounded border border-[#222222] bg-[#121212] text-[#EDEDED] px-2 focus:outline-none focus:border-[#FF6B00]"
              >
                <option value="all">All Posts</option>
                <option value="active">Active (Visible)</option>
                <option value="moderated">Moderated (Hidden)</option>
                <option value="reported">Has Reports</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div>
              <label className="text-[11px] text-[#9AA1AA] block mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full h-8 rounded border border-[#222222] bg-[#121212] text-[#EDEDED] px-2 focus:outline-none focus:border-[#FF6B00]"
              >
                <option value="all">All Comments</option>
                <option value="active">Active</option>
                <option value="moderated">Moderated (Hidden)</option>
                <option value="reported">Has Reports</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: REPORTS QUEUE */}
      {activeTab === 'reports' && (
        <div className="rounded-md border border-[#222222] bg-[#0A0A0A] overflow-hidden">
          <div className="p-4 border-b border-[#222222] flex items-center justify-between text-xs">
            <span className="text-[#9AA1AA]">
              Showing <span className="text-[#EDEDED] font-mono">{filteredReports.length}</span> reports
            </span>
          </div>

          {filteredReports.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <ShieldCheck className="h-8 w-8 text-emerald-400 mx-auto opacity-60" />
              <div className="text-sm font-medium text-[#EDEDED]">No Flagged Reports In Queue</div>
              <p className="text-xs text-[#9AA1AA] max-w-sm mx-auto">
                No community reports match your current filter. Student and faculty discussions are operating
                smoothly.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#222222] bg-[#121212] text-[#9AA1AA] uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Report Reason</th>
                    <th className="py-3 px-4 font-semibold">Reported Target</th>
                    <th className="py-3 px-4 font-semibold">Filed By</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222] text-[#EDEDED]">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-[#121212]/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#EDEDED] flex items-center gap-1.5">
                          <Flag className="h-3 w-3 text-red-400" />
                          {report.reason}
                        </div>
                        {report.details && (
                          <div className="text-[11px] text-[#9AA1AA] mt-0.5 line-clamp-1">
                            {report.details}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-[11px] font-mono uppercase text-[#9AA1AA]">
                          {report.target_type === 'post' ? 'Post' : 'Comment'}
                        </div>
                        <div className="truncate text-xs font-medium text-[#EDEDED] mt-0.5">
                          {report.target_type === 'post'
                            ? report.post?.title || 'Reported Post'
                            : report.comment?.content || 'Reported Comment'}
                        </div>
                        {report.post_id && (
                          <Link
                            href={`/admin/moderation/posts/${report.post_id}`}
                            className="inline-flex items-center gap-1 text-[11px] text-[#FF6B00] hover:underline mt-0.5"
                          >
                            <span>Inspect Discussion</span>
                            <ChevronRight className="h-2.5 w-2.5" />
                          </Link>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-[#EDEDED]">{report.reporter?.name || 'Anonymous'}</div>
                        <div className="text-[11px] text-[#9AA1AA] capitalize">
                          {report.reporter?.role || 'User'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[#9AA1AA] font-mono">
                        {formatDate(report.created_at)}
                      </td>

                      <td className="py-3 px-4">{getReportBadge(report.status)}</td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReportModal(report);
                              setTargetReportStatus(report.status);
                              setResolutionNotes(report.resolution_notes || '');
                              clearAlerts();
                            }}
                            className="h-7 text-xs px-2.5 border-[#222222] text-[#EDEDED] hover:border-[#FF6B00] hover:text-[#FF6B00]"
                          >
                            Review Report
                          </Button>

                          {report.target_type === 'post' && report.post && !report.post.is_deleted && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setHidePostModal(report.post!);
                                setModerationReason(`Reported for: ${report.reason}`);
                                clearAlerts();
                              }}
                              className="h-7 text-xs px-2 text-red-400 hover:bg-red-500/10"
                            >
                              Hide Post
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: POSTS DIRECTORY */}
      {activeTab === 'posts' && (
        <div className="rounded-md border border-[#222222] bg-[#0A0A0A] overflow-hidden">
          <div className="p-4 border-b border-[#222222] flex items-center justify-between text-xs">
            <span className="text-[#9AA1AA]">
              Showing <span className="text-[#EDEDED] font-mono">{filteredPosts.length}</span> community posts
            </span>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <MessageSquare className="h-8 w-8 text-[#9AA1AA] mx-auto opacity-40" />
              <div className="text-sm font-medium text-[#EDEDED]">No Discussion Posts Found</div>
              <p className="text-xs text-[#9AA1AA] max-w-sm mx-auto">
                No community posts match the current filter parameters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#222222] bg-[#121212] text-[#9AA1AA] uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Post Title & Snippet</th>
                    <th className="py-3 px-4 font-semibold">Category & Scope</th>
                    <th className="py-3 px-4 font-semibold">Author</th>
                    <th className="py-3 px-4 font-semibold">Activity</th>
                    <th className="py-3 px-4 font-semibold">Moderation Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222] text-[#EDEDED]">
                  {filteredPosts.map((post) => {
                    const isHidden = post.is_deleted || post.is_moderated;
                    return (
                      <tr key={post.id} className="hover:bg-[#121212]/50 transition-colors">
                        <td className="py-3 px-4 max-w-sm">
                          <Link
                            href={`/admin/moderation/posts/${post.id}`}
                            className="font-medium text-xs text-[#EDEDED] hover:text-[#FF6B00] transition-colors line-clamp-1"
                          >
                            {post.title}
                          </Link>
                          <div className="text-[11px] text-[#9AA1AA] line-clamp-1 mt-0.5">
                            {post.content}
                          </div>
                          {post.moderation_reason && (
                            <div className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded mt-1 inline-block">
                              Reason: {post.moderation_reason}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-[#121212] border border-[#222222] text-[#EDEDED]">
                            {post.category}
                          </span>
                          <div className="text-[11px] text-[#9AA1AA] mt-1 font-mono">
                            {post.visibility}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-[#EDEDED]">
                            {post.author?.name || 'Anonymous'}
                          </div>
                          <div className="text-[11px] text-[#9AA1AA]">
                            {post.author?.role} • {post.author?.department}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-[#9AA1AA]">
                          <div>{post.comment_count} comments</div>
                          <div>{post.like_count} likes</div>
                          {(post.reports_count || 0) > 0 && (
                            <div className="text-red-400 font-semibold">
                              {post.reports_count} reports
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {isHidden ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                              <EyeOff className="h-3 w-3" />
                              Hidden
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Eye className="h-3 w-3" />
                              Visible
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/admin/moderation/posts/${post.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2 border-[#222222] text-[#EDEDED] hover:border-[#FF6B00] hover:text-[#FF6B00]"
                              >
                                Details
                              </Button>
                            </Link>

                            {isHidden ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setRestorePostModal(post);
                                  clearAlerts();
                                }}
                                className="h-7 text-xs px-2 text-emerald-400 hover:bg-emerald-500/10"
                              >
                                Restore
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setHidePostModal(post);
                                  setModerationReason('');
                                  clearAlerts();
                                }}
                                className="h-7 text-xs px-2 text-red-400 hover:bg-red-500/10"
                              >
                                Hide
                              </Button>
                            )}
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
      )}

      {/* TAB 3: COMMENTS DIRECTORY */}
      {activeTab === 'comments' && (
        <div className="rounded-md border border-[#222222] bg-[#0A0A0A] overflow-hidden">
          <div className="p-4 border-b border-[#222222] flex items-center justify-between text-xs">
            <span className="text-[#9AA1AA]">
              Showing <span className="text-[#EDEDED] font-mono">{filteredComments.length}</span> comments
            </span>
          </div>

          {filteredComments.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <MessageCircle className="h-8 w-8 text-[#9AA1AA] mx-auto opacity-40" />
              <div className="text-sm font-medium text-[#EDEDED]">No Comments Found</div>
              <p className="text-xs text-[#9AA1AA] max-w-sm mx-auto">
                No discussion comments match the current filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#222222] bg-[#121212] text-[#9AA1AA] uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Comment Content</th>
                    <th className="py-3 px-4 font-semibold">Author</th>
                    <th className="py-3 px-4 font-semibold">Parent Post</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222] text-[#EDEDED]">
                  {filteredComments.map((comment) => {
                    const isHidden = comment.is_deleted || comment.is_moderated;
                    return (
                      <tr key={comment.id} className="hover:bg-[#121212]/50 transition-colors">
                        <td className="py-3 px-4 max-w-sm">
                          <div className="text-xs text-[#EDEDED] line-clamp-2">{comment.content}</div>
                          {comment.moderation_reason && (
                            <div className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded mt-1 inline-block">
                              Reason: {comment.moderation_reason}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-[#EDEDED]">
                            {comment.author?.name || 'Anonymous'}
                          </div>
                          <div className="text-[11px] text-[#9AA1AA]">
                            {comment.author?.role} • {comment.author?.department}
                          </div>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          {comment.post ? (
                            <Link
                              href={`/admin/moderation/posts/${comment.post_id}`}
                              className="text-xs text-[#FF6B00] hover:underline line-clamp-1"
                            >
                              {comment.post.title}
                            </Link>
                          ) : (
                            <span className="text-[#9AA1AA]">Unknown Post</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-[#9AA1AA] font-mono">
                          {formatDate(comment.created_at)}
                        </td>

                        <td className="py-3 px-4">
                          {isHidden ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                              <EyeOff className="h-3 w-3" />
                              Hidden
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Eye className="h-3 w-3" />
                              Visible
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isHidden ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setRestoreCommentModal(comment);
                                  clearAlerts();
                                }}
                                className="h-7 text-xs px-2 text-emerald-400 hover:bg-emerald-500/10"
                              >
                                Restore
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setHideCommentModal(comment);
                                  setModerationReason('');
                                  clearAlerts();
                                }}
                                className="h-7 text-xs px-2 text-red-400 hover:bg-red-500/10"
                              >
                                Hide
                              </Button>
                            )}
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
      )}

      {/* MODAL 1: HIDE POST */}
      {hidePostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-md border border-[#222222] bg-[#0A0A0A] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="text-sm font-semibold text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Hide Discussion Post
              </div>
              <button
                onClick={() => setHidePostModal(null)}
                className="text-xs text-[#9AA1AA] hover:text-[#EDEDED]"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded bg-[#121212] border border-[#222222] text-xs space-y-1">
              <div className="font-semibold text-[#EDEDED]">{hidePostModal.title}</div>
              <div className="text-[#9AA1AA]">
                Author: {hidePostModal.author?.name} ({hidePostModal.author?.role})
              </div>
            </div>

            <div>
              <label className="text-xs text-[#9AA1AA] block mb-1.5">
                Moderation Reason (Logged & Recorded)
              </label>
              <textarea
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="Violates institutional code of conduct, inappropriate language..."
                rows={3}
                className="w-full text-xs rounded border border-[#222222] bg-[#121212] text-[#EDEDED] p-2.5 focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <p className="text-[11px] text-[#9AA1AA]">
              Note: This action hides the post from public feeds while preserving database records and author
              attribution for historical auditing.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHidePostModal(null)}
                disabled={isPending}
                className="text-xs h-8 text-[#9AA1AA] hover:text-[#EDEDED]"
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
      {restorePostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-md border border-[#222222] bg-[#0A0A0A] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Restore Discussion Post
              </div>
              <button
                onClick={() => setRestorePostModal(null)}
                className="text-xs text-[#9AA1AA] hover:text-[#EDEDED]"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded bg-[#121212] border border-[#222222] text-xs space-y-1">
              <div className="font-semibold text-[#EDEDED]">{restorePostModal.title}</div>
              <div className="text-[#9AA1AA]">Author: {restorePostModal.author?.name}</div>
            </div>

            <p className="text-xs text-[#9AA1AA]">
              Restoring will make this post publicly visible again on the community feeds.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRestorePostModal(null)}
                disabled={isPending}
                className="text-xs h-8 text-[#9AA1AA] hover:text-[#EDEDED]"
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
      {hideCommentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-md border border-[#222222] bg-[#0A0A0A] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="text-sm font-semibold text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Hide Comment
              </div>
              <button
                onClick={() => setHideCommentModal(null)}
                className="text-xs text-[#9AA1AA] hover:text-[#EDEDED]"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded bg-[#121212] border border-[#222222] text-xs space-y-1">
              <div className="text-[#EDEDED] line-clamp-2">{hideCommentModal.content}</div>
              <div className="text-[#9AA1AA]">Author: {hideCommentModal.author?.name}</div>
            </div>

            <div>
              <label className="text-xs text-[#9AA1AA] block mb-1.5">Moderation Reason</label>
              <textarea
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="Inappropriate remarks, harassment, off-topic spam..."
                rows={2}
                className="w-full text-xs rounded border border-[#222222] bg-[#121212] text-[#EDEDED] p-2.5 focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHideCommentModal(null)}
                disabled={isPending}
                className="text-xs h-8 text-[#9AA1AA] hover:text-[#EDEDED]"
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
      {restoreCommentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-md border border-[#222222] bg-[#0A0A0A] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Restore Comment
              </div>
              <button
                onClick={() => setRestoreCommentModal(null)}
                className="text-xs text-[#9AA1AA] hover:text-[#EDEDED]"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded bg-[#121212] border border-[#222222] text-xs">
              <div className="text-[#EDEDED] line-clamp-2">{restoreCommentModal.content}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRestoreCommentModal(null)}
                disabled={isPending}
                className="text-xs h-8 text-[#9AA1AA] hover:text-[#EDEDED]"
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

      {/* MODAL 5: REVIEW / RESOLVE REPORT */}
      {reportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-md border border-[#222222] bg-[#0A0A0A] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="text-sm font-semibold text-[#EDEDED] flex items-center gap-2">
                <Flag className="h-4 w-4 text-[#FF6B00]" />
                Review Community Report
              </div>
              <button
                onClick={() => setReportModal(null)}
                className="text-xs text-[#9AA1AA] hover:text-[#EDEDED]"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded bg-[#121212] border border-[#222222] text-xs space-y-1.5">
              <div className="font-semibold text-red-400">Reason: {reportModal.reason}</div>
              {reportModal.details && (
                <div className="text-[#9AA1AA]">Details: {reportModal.details}</div>
              )}
              <div className="text-[11px] text-[#9AA1AA] pt-1 border-t border-[#222222]">
                Reported target: {reportModal.target_type === 'post' ? 'Post' : 'Comment'} • Filed by{' '}
                {reportModal.reporter?.name || 'User'} on {formatDate(reportModal.created_at)}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#9AA1AA] block mb-1.5">Update Report Status</label>
                <select
                  value={targetReportStatus}
                  onChange={(e) => setTargetReportStatus(e.target.value as CommunityReportStatus)}
                  className="w-full text-xs h-9 rounded border border-[#222222] bg-[#121212] text-[#EDEDED] px-3 focus:outline-none focus:border-[#FF6B00]"
                >
                  <option value="Reviewed">Reviewed (Under Investigation)</option>
                  <option value="Resolved">Resolved (Action Taken / Content Moderated)</option>
                  <option value="Dismissed">Dismissed (No Violation Found)</option>
                  <option value="Pending">Pending (Re-open)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#9AA1AA] block mb-1.5">
                  Resolution Notes / Findings (Optional)
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Notes on decision taken or rationale..."
                  rows={2}
                  className="w-full text-xs rounded border border-[#222222] bg-[#121212] text-[#EDEDED] p-2.5 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReportModal(null)}
                disabled={isPending}
                className="text-xs h-8 text-[#9AA1AA] hover:text-[#EDEDED]"
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
