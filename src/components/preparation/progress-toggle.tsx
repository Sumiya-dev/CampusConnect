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
    <div className="border border-border rounded-md bg-surface p-4 sm:p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <span className="text-sm uppercase font-semibold text-muted tracking-wider block">
            Your Preparation Standing
          </span>
          <div className="flex items-center gap-2">
            {status === 'completed' && (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-500 bg-green-500/10 border border-green-500/30 px-2.5 py-1 rounded">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Completed</span>
              </span>
            )}
            {status === 'in_progress' && (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent bg-accent/10 border border-accent/30 px-2.5 py-1 rounded">
                <Clock className="h-3.5 w-3.5" />
                <span>In Progress</span>
              </span>
            )}
            {status === 'not_started' && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted bg-elevated border border-border px-2.5 py-1 rounded">
                <PlayCircle className="h-3.5 w-3.5" />
                <span>Not Started</span>
              </span>
            )}

            {completedAt && status === 'completed' && (
              <span className="text-sm text-muted">
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
              className="text-sm border-border text-foreground hover:border-accent hover:text-accent"
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
              className="text-sm text-muted hover:text-foreground hover:bg-elevated"
              title="Reset progress to Not Started"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {message && (
        <p className="text-sm text-green-500 pt-1 font-medium">{message}</p>
      )}
    </div>
  );
}
