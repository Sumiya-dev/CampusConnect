'use client';

import { useState } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import { AlumniExperienceType } from '@/lib/types/alumni.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createAlumniExperienceAction } from '@/lib/alumni/actions';

interface CreateExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EXPERIENCE_TYPES: AlumniExperienceType[] = [
  'Placement Experience',
  'Interview Experience',
  'Company Experience',
  'Career Journey',
  'Preparation Advice',
];

export function CreateExperienceModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateExperienceModalProps) {
  const [type, setType] = useState<AlumniExperienceType>('Interview Experience');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [content, setContent] = useState('');
  const [selectionProcess, setSelectionProcess] = useState('');
  const [preparationTips, setPreparationTips] = useState('');
  const [adviceForJuniors, setAdviceForJuniors] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!content.trim()) {
      setError('Main content cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('type', type);
    formData.append('title', title.trim());
    formData.append('company', company.trim());
    formData.append('jobRole', jobRole.trim());
    formData.append('content', content.trim());
    formData.append('selectionProcess', selectionProcess.trim());
    formData.append('preparationTips', preparationTips.trim());
    formData.append('adviceForJuniors', adviceForJuniors.trim());

    const result = await createAlumniExperienceAction(formData);
    setIsSubmitting(false);

    if (result.success) {
      setTitle('');
      setCompany('');
      setJobRole('');
      setContent('');
      setSelectionProcess('');
      setPreparationTips('');
      setAdviceForJuniors('');
      onClose();
      if (onSuccess) onSuccess();
    } else {
      setError(result.error || 'Failed to publish experience.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0A0A0A] border border-[#222222] rounded-lg shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
          <div>
            <h3 className="text-base font-semibold text-[#EDEDED]">Share Alumni Experience</h3>
            <p className="text-xs text-[#9AA1AA] mt-0.5">
              Empower university juniors with firsthand interview stages, recruitment journeys, and preparation guidance.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#717784] hover:text-[#EDEDED] p-1 rounded-md transition-colors"
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
          {/* Experience Type */}
          <div>
            <label className="block text-xs font-medium text-[#EDEDED] mb-1.5">
              Experience Type
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EXPERIENCE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    type === t
                      ? 'bg-[#FF6B00] text-black font-semibold'
                      : 'bg-[#121212] text-[#9AA1AA] hover:text-[#EDEDED] border border-[#222222]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-[#EDEDED] mb-1.5">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Software Engineer On-Campus Interview Experience 2024"
              className="text-xs bg-[#121212] border-[#222222] h-9"
              required
            />
          </div>

          {/* Company & Job Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#EDEDED] mb-1.5">
                Company (Optional)
              </label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Microsoft"
                className="text-xs bg-[#121212] border-[#222222] h-9"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#EDEDED] mb-1.5">
                Job Role (Optional)
              </label>
              <Input
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g. Software Engineer"
                className="text-xs bg-[#121212] border-[#222222] h-9"
              />
            </div>
          </div>

          {/* Detailed Content */}
          <div>
            <label className="block text-xs font-medium text-[#EDEDED] mb-1.5">
              Detailed Overview / Journey
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide a comprehensive walkthrough of your journey, role responsibilities, or drive structure..."
              rows={4}
              className="w-full bg-[#121212] border border-[#222222] rounded-md p-3 text-xs text-[#EDEDED] placeholder-[#717784] focus:outline-none focus:border-[#FF6B00] resize-none"
              required
            />
          </div>

          {/* Selection Process */}
          <div>
            <label className="block text-xs font-medium text-[#EDEDED] mb-1.5">
              Selection Process Breakdown (Optional)
            </label>
            <textarea
              value={selectionProcess}
              onChange={(e) => setSelectionProcess(e.target.value)}
              placeholder="1. Online Assessment (90 mins, 3 LeetCode Medium questions)&#10;2. Technical Round 1 (Data Structures, System Design basics)&#10;3. HR & Managerial Round"
              rows={3}
              className="w-full bg-[#121212] border border-[#222222] rounded-md p-3 text-xs text-[#EDEDED] placeholder-[#717784] focus:outline-none focus:border-[#FF6B00] resize-none"
            />
          </div>

          {/* Preparation Tips */}
          <div>
            <label className="block text-xs font-medium text-[#EDEDED] mb-1.5">
              Preparation Tips (Optional)
            </label>
            <textarea
              value={preparationTips}
              onChange={(e) => setPreparationTips(e.target.value)}
              placeholder="Focus on Graphs and Dynamic Programming. Practice SQL queries and mock interviews with peers."
              rows={2}
              className="w-full bg-[#121212] border border-[#222222] rounded-md p-3 text-xs text-[#EDEDED] placeholder-[#717784] focus:outline-none focus:border-[#FF6B00] resize-none"
            />
          </div>

          {/* Advice for Juniors */}
          <div>
            <label className="block text-xs font-medium text-[#EDEDED] mb-1.5">
              Advice for Juniors (Optional)
            </label>
            <textarea
              value={adviceForJuniors}
              onChange={(e) => setAdviceForJuniors(e.target.value)}
              placeholder="Stay consistent, build solid core CS fundamentals, and don't panic if your first interview doesn't go as expected."
              rows={2}
              className="w-full bg-[#121212] border border-[#222222] rounded-md p-3 text-xs text-[#EDEDED] placeholder-[#717784] focus:outline-none focus:border-[#FF6B00] resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222222]">
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
              className="text-xs gap-1.5 font-semibold bg-[#FF6B00] text-black hover:bg-[#E05E00]"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Publishing...' : 'Publish Experience'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
