'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HelpArticle } from '@/lib/types/help.types';
import {
  deleteHelpArticleAction,
  togglePublishArticleAction,
} from '@/lib/help/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Globe,
  Lock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  BookOpen,
} from 'lucide-react';

interface HelpArticleDetailProps {
  article: HelpArticle;
}

export function HelpArticleDetail({ article }: HelpArticleDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleDelete = () => {
    setActionError(null);
    startTransition(async () => {
      const res = await deleteHelpArticleAction(article.id);
      if (!res.success) {
        setActionError(res.error || 'Failed to delete article.');
      } else {
        router.push('/admin/help');
        router.refresh();
      }
    });
  };

  const handleTogglePublish = () => {
    setActionError(null);
    setActionSuccess(null);
    const willPublish = article.status !== 'published';

    startTransition(async () => {
      const res = await togglePublishArticleAction(article.id, willPublish);
      if (!res.success) {
        setActionError(res.error || 'Failed to update article status.');
      } else {
        setActionSuccess(
          willPublish
            ? 'Article is now published and live in Help Center.'
            : 'Article unpublished and reverted to draft.'
        );
        router.refresh();
      }
    });
  };

  const formatTimestamp = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div className="space-y-1">
          <Link
            href="/admin/help"
            className="inline-flex items-center gap-1 text-xs text-[#9AA1AA] hover:text-[#EDEDED] transition-colors mb-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Help Center Dashboard
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs font-mono">
              {article.category}
            </Badge>

            {article.status === 'published' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-900/60">
                <Globe className="h-3 w-3" />
                Live / Published
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium text-neutral-400 bg-neutral-900 border border-neutral-800">
                <Lock className="h-3 w-3" />
                Draft (Internal Only)
              </span>
            )}
          </div>
          <h1 className="text-xl font-semibold text-[#EDEDED] tracking-tight mt-1">
            {article.title}
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Link href={`/admin/help/${article.id}/edit`}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs border-[#222222] bg-[#121212] hover:bg-[#1A1A1A] text-[#EDEDED]"
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={handleTogglePublish}
            disabled={isPending}
            className={`h-8 px-3 text-xs font-semibold ${
              article.status === 'published'
                ? 'border border-[#222222] bg-[#161616] hover:bg-[#222222] text-[#EDEDED]'
                : 'bg-[#FF6B00] hover:bg-[#E05D00] text-black'
            }`}
          >
            {article.status === 'published' ? 'Unpublish' : 'Publish Article'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            disabled={isPending}
            className="h-8 px-2.5 text-xs border-rose-900/60 bg-rose-950/20 hover:bg-rose-900/40 text-rose-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Action alerts */}
      {actionSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-950/30 border border-emerald-900/60 rounded text-emerald-400 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-2 p-3 bg-rose-950/30 border border-rose-900/60 rounded text-rose-400 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Content Card */}
      <div className="border border-[#222222] bg-[#121212] p-5 sm:p-6 rounded-md space-y-4">
        <div className="flex items-center justify-between text-xs text-[#9AA1AA] font-mono border-b border-[#1C1C1C] pb-3">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-[#FF6B00]" />
            ARTICLE RESOLUTION / GUIDANCE
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            Last updated {formatTimestamp(article.updated_at)}
          </span>
        </div>

        <div className="text-xs sm:text-sm text-[#EDEDED] leading-relaxed whitespace-pre-line font-normal">
          {article.content}
        </div>
      </div>

      {/* Governance & Metadata Card */}
      <div className="border border-[#222222] bg-[#0A0A0A] p-4 rounded-md text-xs space-y-2 text-[#9AA1AA]">
        <div className="flex justify-between">
          <span>Author / Created By:</span>
          <span className="text-[#EDEDED] font-mono">
            {article.creator?.name || article.creator?.email || 'Superadmin'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Created Timestamp:</span>
          <span className="text-[#EDEDED] font-mono">
            {formatTimestamp(article.created_at)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Access Boundary:</span>
          <span className="text-[#EDEDED] font-mono">
            {article.status === 'published'
              ? 'Public (Visible in Student/Faculty Help Center)'
              : 'Internal (Superadmin Only)'}
          </span>
        </div>
      </div>

      {/* CONFIRM DELETE MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="border border-[#222222] bg-[#121212] max-w-md w-full rounded-lg p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-rose-950/30 border border-rose-900/60 text-rose-400 shrink-0 mt-0.5">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[#EDEDED]">
                  Delete Help Article?
                </h3>
                <p className="text-xs text-[#9AA1AA]">
                  Are you sure you want to permanently delete{' '}
                  <span className="text-[#EDEDED] font-medium">
                    "{article.title}"
                  </span>
                  ? This action cannot be reversed.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                disabled={isPending}
                className="border-[#222222] bg-[#161616] text-[#EDEDED] text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDelete}
                disabled={isPending}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-8"
              >
                {isPending ? 'Deleting...' : 'Delete Article'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
