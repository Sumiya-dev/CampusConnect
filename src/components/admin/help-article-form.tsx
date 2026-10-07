'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CreateHelpArticleInput,
  HelpArticle,
  HelpCategory,
  UpdateHelpArticleInput,
} from '@/lib/types/help.types';
import {
  createHelpArticleAction,
  updateHelpArticleAction,
} from '@/lib/help/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Globe,
  Lock,
  Loader2,
  FileText,
} from 'lucide-react';

interface HelpArticleFormProps {
  initialData?: HelpArticle | null;
  isEditing?: boolean;
}

const CATEGORIES: { value: HelpCategory; label: string; desc: string }[] = [
  {
    value: 'FAQs',
    label: 'FAQs',
    desc: 'Frequently asked student questions and quick resolutions',
  },
  {
    value: 'Placement Guidelines',
    label: 'Placement Guidelines',
    desc: 'Candidate conduct, dress code, and attendance expectations',
  },
  {
    value: 'Platform Guide',
    label: 'Platform Guide',
    desc: 'Portal walkthroughs, profile setup, and feature instructions',
  },
  {
    value: 'Interview Preparation',
    label: 'Interview Preparation',
    desc: 'Technical prep tips, HR interview advice, and mock test guidance',
  },
  {
    value: 'Placement Policies',
    label: 'Placement Policies',
    desc: 'Institutional offer acceptance, dream tier rules, and backlogs',
  },
  {
    value: 'General',
    label: 'General',
    desc: 'Campus advisories, contact coordinates, and general help',
  },
];

export function HelpArticleForm({
  initialData,
  isEditing = false,
}: HelpArticleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState<HelpCategory>(
    initialData?.category || 'FAQs'
  );
  const [content, setContent] = useState(initialData?.content || '');
  const [status, setStatus] = useState<'draft' | 'published'>(
    initialData?.status || 'published'
  );

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!title.trim()) {
      setFormError('Please enter an article title.');
      return;
    }

    if (!content.trim()) {
      setFormError('Please enter the article content.');
      return;
    }

    startTransition(async () => {
      if (isEditing && initialData) {
        const updatePayload: UpdateHelpArticleInput = {
          title: title.trim(),
          category,
          content: content.trim(),
          status,
        };

        const res = await updateHelpArticleAction(initialData.id, updatePayload);
        if (!res.success) {
          setFormError(res.error || 'Failed to update article.');
        } else {
          setFormSuccess('Article updated successfully.');
          router.push(`/admin/help/${initialData.id}`);
          router.refresh();
        }
      } else {
        const createPayload: CreateHelpArticleInput = {
          title: title.trim(),
          category,
          content: content.trim(),
          status,
        };

        const res = await createHelpArticleAction(createPayload);
        if (!res.success) {
          setFormError(res.error || 'Failed to create article.');
        } else {
          setFormSuccess(res.message || 'Article created successfully.');
          if (res.articleId) {
            router.push(`/admin/help/${res.articleId}`);
          } else {
            router.push('/admin/help');
          }
          router.refresh();
        }
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-[#222222]">
        <Link
          href="/admin/help"
          className="inline-flex items-center gap-1 text-xs text-[#9AA1AA] hover:text-[#EDEDED] transition-colors mb-1"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Help Center
        </Link>
        <h1 className="text-xl font-semibold text-[#EDEDED] tracking-tight">
          {isEditing ? 'Edit Help Article' : 'Create Help Article'}
        </h1>
        <p className="text-xs text-[#9AA1AA]">
          {isEditing
            ? 'Update the article title, content body, category, or publication status.'
            : 'Author new guidance, FAQ answers, or policy documentation for students and faculty.'}
        </p>
      </div>

      {/* Error / Success alerts */}
      {formError && (
        <div className="flex items-center gap-2 p-3 bg-rose-950/30 border border-rose-900/60 rounded-md text-rose-400 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}
      {formSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-950/30 border border-emerald-900/60 rounded-md text-emerald-400 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        <div className="border border-[#222222] bg-[#121212] p-4 sm:p-5 rounded-md space-y-3">
          <label className="text-xs font-semibold text-[#EDEDED] uppercase tracking-wider font-mono block">
            1. Knowledge Category
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.value;
              return (
                <button
                  type="button"
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`flex flex-col items-start p-3 rounded-md border text-left transition-all ${
                    isSelected
                      ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-[#EDEDED]'
                      : 'border-[#222222] bg-[#0A0A0A] hover:bg-[#161616] text-[#9AA1AA]'
                  }`}
                >
                  <span
                    className={`text-xs font-semibold mb-0.5 ${
                      isSelected ? 'text-[#EDEDED]' : 'text-neutral-300'
                    }`}
                  >
                    {cat.label}
                  </span>
                  <span className="text-[10px] text-[#9AA1AA] line-clamp-2">
                    {cat.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title and Content */}
        <div className="border border-[#222222] bg-[#121212] p-4 sm:p-5 rounded-md space-y-4">
          <label className="text-xs font-semibold text-[#EDEDED] uppercase tracking-wider font-mono block">
            2. Article Content
          </label>

          <div className="space-y-1.5">
            <label className="text-xs text-[#EDEDED] font-medium flex justify-between">
              <span>Article Title / Question</span>
              <span className="text-[10px] text-[#9AA1AA]">Clear and searchable</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. How does the one-offer policy apply to tier-1 companies?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#0A0A0A] border-[#222222] text-[#EDEDED] text-xs h-9 focus-visible:ring-1 focus-visible:ring-[#FF6B00]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#EDEDED] font-medium flex justify-between">
              <span>Content Body / Detailed Answer</span>
              <span className="text-[10px] text-[#9AA1AA]">
                Full resolution, policy steps, or guidelines
              </span>
            </label>
            <textarea
              rows={8}
              placeholder="Provide clear, step-by-step guidance, policy clarifications, contact points, or FAQ explanations..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-md bg-[#0A0A0A] border border-[#222222] p-3 text-xs text-[#EDEDED] placeholder-[#555] focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none transition-colors"
              required
            />
          </div>
        </div>

        {/* Publication Status */}
        <div className="border border-[#222222] bg-[#121212] p-4 sm:p-5 rounded-md space-y-3">
          <label className="text-xs font-semibold text-[#EDEDED] uppercase tracking-wider font-mono block">
            3. Publication State
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setStatus('published')}
              className={`flex items-start gap-3 p-3.5 rounded-md border text-left transition-all ${
                status === 'published'
                  ? 'border-emerald-500 bg-emerald-950/20 text-[#EDEDED]'
                  : 'border-[#222222] bg-[#0A0A0A] hover:bg-[#161616] text-[#9AA1AA]'
              }`}
            >
              <Globe
                className={`h-4 w-4 mt-0.5 shrink-0 ${
                  status === 'published' ? 'text-emerald-400' : 'text-[#9AA1AA]'
                }`}
              />
              <div>
                <div className="text-xs font-semibold text-[#EDEDED]">
                  Publish Immediately
                </div>
                <p className="text-[10px] text-[#9AA1AA] mt-0.5">
                  Make this article live in the Student & Faculty Help Center.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStatus('draft')}
              className={`flex items-start gap-3 p-3.5 rounded-md border text-left transition-all ${
                status === 'draft'
                  ? 'border-neutral-500 bg-neutral-900 text-[#EDEDED]'
                  : 'border-[#222222] bg-[#0A0A0A] hover:bg-[#161616] text-[#9AA1AA]'
              }`}
            >
              <Lock
                className={`h-4 w-4 mt-0.5 shrink-0 ${
                  status === 'draft' ? 'text-neutral-300' : 'text-[#9AA1AA]'
                }`}
              />
              <div>
                <div className="text-xs font-semibold text-[#EDEDED]">
                  Save as Draft
                </div>
                <p className="text-[10px] text-[#9AA1AA] mt-0.5">
                  Keep internal. Visible only to Superadmins.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/admin/help">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              className="border-[#222222] bg-[#121212] hover:bg-[#1A1A1A] text-[#EDEDED] text-xs h-9 px-4"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-[#FF6B00] hover:bg-[#E05D00] text-black font-semibold text-xs h-9 px-5"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              'Save Changes'
            ) : status === 'published' ? (
              'Publish Article'
            ) : (
              'Save Draft'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
