'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { updatePreparationProgressAction } from '@/lib/preparation/actions';
import { PreparationProgressStatus } from '@/lib/types/preparation.types';
import { CheckCircle2, Clock, PlayCircle, Loader2, RotateCcw } from 'lucide-react';

interface ProgressToggleProps {
  materialId: string;
  initialStatus: PreparationProgressStatus;
  lastAccessedAt?: string;
  completedAt?: string | null;
}

export function ProgressToggle({
  materialId,
  initialStatus,
  lastAccessedAt,
  completedAt,
}: ProgressToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<PreparationProgressStatus>(initialStatus);
  const [message, setMessage] = useState<string | null>(null);

  const handleUpdate = (newStatus: PreparationProgressStatus) => {
    setMessage(null);
    startTransition(async () => {
      const res = await updatePreparationProgressAction(materialId, newStatus);
      if (res.success && res.newStatus) {
        setStatus(res.newStatus);
        setMessage(res.message || 'Status updated');
        router.refresh();
      }
    });
  };

  const formatTimestamp = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="border border-[#222222] rounded-md bg-[#0A0A0A] p-4 sm:p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <span className="text-sm uppercase font-semibold text-[#9AA1AA] tracking-wider block">
            Your Preparation Standing
          </span>
          <div className="flex items-center gap-2">
            {status === 'completed' && (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/30 px-2.5 py-1 rounded">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Completed</span>
              </span>
            )}
            {status === 'in_progress' && (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF6B00] bg-[#FF6B00]/10 border border-[#FF6B00]/30 px-2.5 py-1 rounded">
                <Clock className="h-3.5 w-3.5" />
                <span>In Progress</span>
              </span>
            )}
            {status === 'not_started' && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#9AA1AA] bg-[#121212] border border-[#222222] px-2.5 py-1 rounded">
                <PlayCircle className="h-3.5 w-3.5" />
                <span>Not Started</span>
              </span>
            )}

            {completedAt && status === 'completed' && (
              <span className="text-sm text-[#9AA1AA]">
                Completed on {formatTimestamp(completedAt)}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {status !== 'in_progress' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleUpdate('in_progress')}
              disabled={isPending}
              className="text-sm border-[#222222] text-[#EDEDED] hover:border-[#FF6B00] hover:text-[#FF6B00]"
            >
              {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              <span>Mark In Progress</span>
            </Button>
          )}

          {status !== 'completed' && (
            <Button
              size="sm"
              onClick={() => handleUpdate('completed')}
              disabled={isPending}
              className="text-sm font-semibold"
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              )}
              <span>Mark as Completed</span>
            </Button>
          )}

          {status !== 'not_started' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleUpdate('not_started')}
              disabled={isPending}
              className="text-sm text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#121212]"
              title="Reset progress to Not Started"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {message && (
        <p className="text-sm text-[#22C55E] pt-1 font-medium">{message}</p>
      )}
    </div>
  );
}
