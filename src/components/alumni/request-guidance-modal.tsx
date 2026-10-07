'use client';

import { useState } from 'react';
import { Send, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createGuidanceRequestAction } from '@/lib/alumni/actions';

interface RequestGuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  alumniId: string;
  alumniName: string;
  alumniCompany?: string | null;
  alumniRole?: string | null;
  onSuccess?: () => void;
}

export function RequestGuidanceModal({
  isOpen,
  onClose,
  alumniId,
  alumniName,
  alumniCompany,
  alumniRole,
  onSuccess,
}: RequestGuidanceModalProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 10) {
      setError('Please provide a message with at least 10 characters.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('alumniId', alumniId);
    formData.append('message', message.trim());

    const result = await createGuidanceRequestAction(formData);

    setIsSubmitting(false);

    if (result.success) {
      setSubmitted(true);
      setTimeout(() => {
        setMessage('');
        setSubmitted(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1200);
    } else {
      setError(result.error || 'Failed to submit guidance request.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0A0A0A] border border-[#222222] rounded-lg shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-wider uppercase text-[#FF6B00]">
              Mentorship & Guidance
            </span>
            <h3 className="text-base font-semibold text-[#EDEDED] mt-0.5">
              Request Guidance from {alumniName}
            </h3>
            {(alumniRole || alumniCompany) && (
              <p className="text-xs text-[#9AA1AA] mt-0.5">
                {[alumniRole, alumniCompany].filter(Boolean).join(' at ')}
              </p>
            )}
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

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <div className="h-10 w-10 mx-auto rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00]">
              <Send className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-semibold text-[#EDEDED]">Request Submitted!</h4>
            <p className="text-xs text-[#9AA1AA]">
              Your guidance request has been sent to {alumniName}. You can track status under Guidance Requests.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#EDEDED] mb-1.5">
                Guidance Objective / Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="I would like guidance regarding software engineering interview preparation, resume feedback, or career transitions..."
                rows={5}
                className="w-full bg-[#121212] border border-[#222222] rounded-md p-3 text-xs text-[#EDEDED] placeholder-[#717784] focus:outline-none focus:border-[#FF6B00] transition-colors resize-none"
                disabled={isSubmitting}
              />
              <span className="text-[10px] text-[#717784] mt-1 block">
                Be specific about the advice you are seeking to help the alumni respond effectively.
              </span>
            </div>

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
                disabled={isSubmitting || !message.trim()}
                className="text-xs gap-1.5 font-semibold bg-[#FF6B00] text-black hover:bg-[#E05E00]"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSubmitting ? 'Sending...' : 'Send Request'}</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
