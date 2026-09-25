'use client';

import { useState } from 'react';
import { X, Lock, Globe, Plus } from 'lucide-react';
import { CommunityCategory, CommunityVisibility } from '@/lib/types/community.types';
import { createPostAction } from '@/lib/community/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultVisibility: CommunityVisibility;
  isStudent: boolean;
  onSuccess?: () => void;
}

const CATEGORIES: CommunityCategory[] = [
  'Placement',
  'Preparation',
  'Technical',
  'Career',
  'General',
];

export function CreatePostModal({
  isOpen,
  onClose,
  defaultVisibility,
  isStudent,
  onSuccess,
}: CreatePostModalProps) {
  const [category, setCategory] = useState<CommunityCategory>('Placement');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isStudentsOnly = defaultVisibility === 'STUDENTS_ONLY';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a title for the discussion.');
      return;
    }

    if (!content.trim()) {
      setError('Please provide discussion content.');
      return;
    }

    setIsPending(true);

    try {
      const formData = new FormData();
      formData.set('title', title.trim());
      formData.set('content', content.trim());
      formData.set('category', category);
      formData.set('visibility', defaultVisibility);

      const res = await createPostAction(formData);

      if (!res.success) {
        setError(res.error || 'Failed to create discussion.');
        setIsPending(false);
        return;
      }

      setTitle('');
      setContent('');
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'An unexpected error occurred.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#0A0A0A] border border-[#222222] rounded-md shadow-2xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold text-[#EDEDED] flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#FF6B00]" />
              <span>Create New Discussion</span>
            </h2>
            <p className="text-xs text-[#9AA1AA]">
              {isStudentsOnly
                ? 'Private student discussion board'
                : 'Public university discussion forum'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#1A1A1A] rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Space Indicator Banner */}
        {isStudentsOnly ? (
          <div className="p-3 rounded bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-start gap-2 text-xs text-[#FF6B00]">
            <Lock className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold">Students Only Community</span>
              <p className="text-[#9AA1AA]">
                This post is strictly private to students. Faculty, placement officers, and administrators are blocked at the database level from reading this thread.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded bg-[#161616] border border-[#262626] flex items-start gap-2 text-xs text-[#EDEDED]">
            <Globe className="h-4 w-4 text-[#9AA1AA] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold">Public Community</span>
              <p className="text-[#9AA1AA]">
                Visible to all verified students, faculty members, and placement officers across the institution.
              </p>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" title="Publication Error">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as CommunityCategory)}
              className="text-sm bg-[#121212] border-[#222222]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-[#0A0A0A] text-[#EDEDED]">
                  {cat}
                </option>
              ))}
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Amazon SDE-1 Technical Round Experience & Tips"
              maxLength={250}
              required
              className="text-sm bg-[#121212] border-[#222222]"
            />
            <span className="text-[11px] text-[#717784] block text-right">
              {title.length}/250
            </span>
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <Label htmlFor="content">Discussion Content</Label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              required
              placeholder="Share details, interview questions, preparation strategies, or feedback..."
              className="w-full rounded-md border border-[#222222] bg-[#121212] px-3 py-2 text-sm text-[#EDEDED] placeholder-[#717784] focus:outline-none focus:border-[#FF6B00] transition-colors resize-y min-h-[100px]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1C1C1C]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isPending}
              className="gap-1.5 font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Publish Discussion</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
