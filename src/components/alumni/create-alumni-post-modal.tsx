'use client';

import { useState } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import { AlumniCommunityCategory } from '@/lib/types/alumni.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createAlumniPostAction } from '@/lib/alumni/actions';

interface CreateAlumniPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultCategory?: AlumniCommunityCategory;
}

const CATEGORIES: AlumniCommunityCategory[] = [
  'Placements',
  'Careers',
  'Interviews',
  'Technical',
  'General',
];

export function CreateAlumniPostModal({
  isOpen,
  onClose,
  onSuccess,
  defaultCategory = 'General',
}: CreateAlumniPostModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<AlumniCommunityCategory>(
    defaultCategory === 'All' ? 'General' : defaultCategory
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Discussion title is required.');
      return;
    }
    if (!content.trim()) {
      setError('Discussion content cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('content', content.trim());
    formData.append('category', category);

    const result = await createAlumniPostAction(formData);

    setIsSubmitting(false);

    if (result.success) {
      setTitle('');
      setContent('');
      onClose();
      if (onSuccess) onSuccess();
    } else {
      setError(result.error || 'Failed to publish post.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-surface border border-border rounded-lg shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">Create Post</h3>
            <p className="text-xs text-muted mt-0.5">
              Share career guidance, interview tips, or ask questions to alumni & students.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#717784] hover:text-foreground p-1 rounded-md transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/30 border border-red-800/40 rounded-md flex items-center gap-2.5 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    category === cat
                      ? 'bg-accent text-black font-semibold'
                      : 'bg-elevated text-muted hover:text-foreground border border-border'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How should I prepare for software engineering technical interviews?"
              className="text-xs bg-elevated border-border h-9"
              maxLength={250}
              disabled={isSubmitting}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post here... Share details about the role, questions, or guidance."
              rows={6}
              className="w-full bg-elevated border border-border rounded-md p-3 text-xs text-foreground placeholder-[#717784] focus:outline-none focus:border-accent transition-colors resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="text-xs gap-1.5 font-semibold bg-accent text-black hover:bg-[#E05E00]"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
