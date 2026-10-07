'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  HelpArticle,
  HelpCategory,
  HelpCenterStats,
} from '@/lib/types/help.types';
import {
  deleteHelpArticleAction,
  togglePublishArticleAction,
} from '@/lib/help/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  HelpCircle,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  FileText,
  Clock,
  Layers,
  AlertCircle,
  Globe,
  Lock,
  ArrowUpRight,
  BookOpen,
} from 'lucide-react';

interface HelpDashboardProps {
  initialArticles: HelpArticle[];
  stats: HelpCenterStats;
}

const CATEGORIES: HelpCategory[] = [
  'FAQs',
  'Placement Guidelines',
  'Platform Guide',
  'Interview Preparation',
  'Placement Policies',
  'General',
];

export function HelpDashboard({
  initialArticles,
  stats,
}: HelpDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Filters state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal / action state
  const [articleToDelete, setArticleToDelete] = useState<HelpArticle | null>(null);
  const [articleToToggle, setArticleToToggle] = useState<HelpArticle | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Client filtering
  const filteredArticles = useMemo(() => {
    return initialArticles.filter((article) => {
      if (statusFilter !== 'all' && article.status !== statusFilter) {
        return false;
      }
      if (categoryFilter !== 'all' && article.category !== categoryFilter) {
        return false;
      }
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const titleMatch = article.title.toLowerCase().includes(query);
        const contentMatch = article.content.toLowerCase().includes(query);
        const catMatch = article.category.toLowerCase().includes(query);
        if (!titleMatch && !contentMatch && !catMatch) return false;
      }
      return true;
    });
  }, [initialArticles, search, categoryFilter, statusFilter]);

  const handleDelete = () => {
    if (!articleToDelete) return;
    setActionError(null);
    setActionMessage(null);

    startTransition(async () => {
      const res = await deleteHelpArticleAction(articleToDelete.id);
      if (!res.success) {
        setActionError(res.error || 'Failed to delete article.');
      } else {
        setActionMessage('Article deleted successfully.');
        setArticleToDelete(null);
        router.refresh();
      }
    });
  };

  const handleTogglePublish = () => {
    if (!articleToToggle) return;
    setActionError(null);
    setActionMessage(null);

    const willPublish = articleToToggle.status !== 'published';
    startTransition(async () => {
      const res = await togglePublishArticleAction(articleToToggle.id, willPublish);
      if (!res.success) {
        setActionError(res.error || 'Failed to update article status.');
      } else {
        setActionMessage(
          willPublish
            ? 'Article published to live Help Center.'
            : 'Article unpublished and saved as draft.'
        );
        setArticleToToggle(null);
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
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert banners */}
      {actionMessage && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-950/30 border border-emerald-900/60 rounded-md text-emerald-400 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-neutral-400 hover:text-neutral-200 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {actionError && (
        <div className="flex items-center justify-between p-3.5 bg-rose-950/30 border border-rose-900/60 rounded-md text-rose-400 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-neutral-400 hover:text-neutral-200 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border border-[#222222] bg-[#121212] p-4 rounded-md">
          <div className="flex items-center justify-between text-xs text-[#9AA1AA]">
            <span>Total Articles</span>
            <BookOpen className="h-3.5 w-3.5 text-[#FF6B00]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#EDEDED] mt-2">
            {stats.total}
          </div>
        </div>

        <div className="border border-[#222222] bg-[#121212] p-4 rounded-md">
          <div className="flex items-center justify-between text-xs text-[#9AA1AA]">
            <span>Live / Published</span>
            <Globe className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-2">
            {stats.published}
          </div>
        </div>

        <div className="border border-[#222222] bg-[#121212] p-4 rounded-md">
          <div className="flex items-center justify-between text-xs text-[#9AA1AA]">
            <span>Draft Articles</span>
            <FileText className="h-3.5 w-3.5 text-neutral-400" />
          </div>
          <div className="text-xl font-bold font-mono text-neutral-300 mt-2">
            {stats.draft}
          </div>
        </div>

        <div className="border border-[#222222] bg-[#121212] p-4 rounded-md">
          <div className="flex items-center justify-between text-xs text-[#9AA1AA]">
            <span>Active Categories</span>
            <Layers className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-bold font-mono text-[#EDEDED] mt-2">
            {Object.keys(stats.categoriesCount).length}
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="border border-[#222222] bg-[#121212] p-4 rounded-md space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9AA1AA]" />
            <Input
              type="text"
              placeholder="Search articles by title, content, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#0A0A0A] border-[#222222] text-[#EDEDED] text-xs h-9 focus-visible:ring-1 focus-visible:ring-[#FF6B00]"
            />
          </div>

          {/* Action Button */}
          <Link href="/admin/help/new">
            <Button className="bg-[#FF6B00] hover:bg-[#E05D00] text-black text-xs font-semibold h-9 px-4 shrink-0">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Article
            </Button>
          </Link>
        </div>

        {/* Category & Status Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#1C1C1C]">
          {/* Category Filter */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-[#9AA1AA]">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] focus:border-[#FF6B00] outline-none"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({stats.categoriesCount[cat] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-[#9AA1AA]">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] focus:border-[#FF6B00] outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Reset Filter indicator */}
        {(search || categoryFilter !== 'all' || statusFilter !== 'all') && (
          <div className="flex items-center justify-between text-xs text-[#9AA1AA] pt-1">
            <span>
              Showing {filteredArticles.length} of {initialArticles.length} articles
            </span>
            <button
              onClick={() => {
                setSearch('');
                setCategoryFilter('all');
                setStatusFilter('all');
              }}
              className="text-[#FF6B00] hover:underline"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* ARTICLES LIST */}
      <div className="border border-[#222222] bg-[#0A0A0A] rounded-md divide-y divide-[#1A1A1A] overflow-hidden">
        {filteredArticles.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <HelpCircle className="h-8 w-8 text-[#9AA1AA] mx-auto opacity-40" />
            <div className="text-sm font-medium text-[#EDEDED]">
              No help articles found
            </div>
            <p className="text-xs text-[#9AA1AA] max-w-sm mx-auto">
              No help articles match the active search or filter criteria. Create
              a new article or reset filters.
            </p>
            <div className="pt-2">
              <Link href="/admin/help/new">
                <Button className="bg-[#FF6B00] hover:bg-[#E05D00] text-black text-xs font-semibold h-8 px-3">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Create Article
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          filteredArticles.map((article) => (
            <div
              key={article.id}
              className="p-4 sm:p-5 hover:bg-[#121212]/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Content Column */}
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-mono">
                    {article.category}
                  </Badge>

                  {article.status === 'published' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-900/60">
                      <Globe className="h-3 w-3" />
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-neutral-400 bg-neutral-900 border border-neutral-800">
                      <Lock className="h-3 w-3" />
                      Draft (Admin Only)
                    </span>
                  )}

                  <span className="text-xs text-[#9AA1AA] font-mono">
                    Updated {formatTimestamp(article.updated_at)}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-[#EDEDED] leading-snug">
                  <Link
                    href={`/admin/help/${article.id}`}
                    className="hover:text-[#FF6B00] transition-colors"
                  >
                    {article.title}
                  </Link>
                </h3>

                <p className="text-xs text-[#9AA1AA] line-clamp-2 leading-relaxed">
                  {article.content}
                </p>
              </div>

              {/* Action Buttons Column */}
              <div className="flex items-center gap-1.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#1A1A1A]">
                {/* View Details */}
                <Link href={`/admin/help/${article.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs border-[#222222] bg-[#121212] hover:bg-[#1A1A1A] text-[#EDEDED]"
                    title="View article details"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    View
                  </Button>
                </Link>

                {/* Edit */}
                <Link href={`/admin/help/${article.id}/edit`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs border-[#222222] bg-[#121212] hover:bg-[#1A1A1A] text-[#EDEDED]"
                    title="Edit article"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                </Link>

                {/* Toggle Publish / Unpublish */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setArticleToToggle(article)}
                  className={`h-7 px-2.5 text-xs ${
                    article.status === 'published'
                      ? 'border-neutral-700 bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
                      : 'border-emerald-900/60 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/40'
                  }`}
                  title={
                    article.status === 'published'
                      ? 'Unpublish article'
                      : 'Publish article'
                  }
                >
                  {article.status === 'published' ? 'Unpublish' : 'Publish'}
                </Button>

                {/* Delete */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setArticleToDelete(article)}
                  className="h-7 px-2 text-xs border-rose-900/60 bg-rose-950/20 hover:bg-rose-900/40 text-rose-400"
                  title="Delete article"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CONFIRM DELETE MODAL */}
      {articleToDelete && (
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
                  Are you sure you want to delete{' '}
                  <span className="text-[#EDEDED] font-medium">
                    "{articleToDelete.title}"
                  </span>
                  ? This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setArticleToDelete(null)}
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

      {/* CONFIRM TOGGLE PUBLISH MODAL */}
      {articleToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="border border-[#222222] bg-[#121212] max-w-md w-full rounded-lg p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00] shrink-0 mt-0.5">
                {articleToToggle.status === 'published' ? (
                  <Lock className="h-5 w-5" />
                ) : (
                  <Globe className="h-5 w-5" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[#EDEDED]">
                  {articleToToggle.status === 'published'
                    ? 'Unpublish Help Article?'
                    : 'Publish Help Article?'}
                </h3>
                <p className="text-xs text-[#9AA1AA]">
                  {articleToToggle.status === 'published'
                    ? `This will remove "${articleToToggle.title}" from the public Help Center and revert it to an internal draft.`
                    : `This will make "${articleToToggle.title}" live and visible to students and faculty in the Help Center.`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setArticleToToggle(null)}
                disabled={isPending}
                className="border-[#222222] bg-[#161616] text-[#EDEDED] text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleTogglePublish}
                disabled={isPending}
                className="bg-[#FF6B00] hover:bg-[#E05D00] text-black font-semibold text-xs h-8"
              >
                {isPending
                  ? 'Updating...'
                  : articleToToggle.status === 'published'
                  ? 'Confirm Unpublish'
                  : 'Confirm & Publish'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
