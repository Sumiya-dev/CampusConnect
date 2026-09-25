'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { applyForDriveAction } from '@/lib/placements/actions';
import { ApplyActionState } from '@/lib/types/drive.types';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

interface ApplyButtonProps {
  driveId: string;
  isEligible: boolean;
  hasApplied: boolean;
  isClosed: boolean;
}

export function ApplyButton({
  driveId,
  isEligible,
  hasApplied,
  isClosed,
}: ApplyButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ApplyActionState | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(hasApplied);

  const handleApply = () => {
    setState(null);
    startTransition(async () => {
      const res = await applyForDriveAction(driveId);
      setState(res);
      if (res.success) {
        setAppliedSuccess(true);
        router.refresh();
      }
    });
  };

  if (appliedSuccess) {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E] text-sm font-semibold">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Application Submitted</span>
        </div>
        <Link href="/student/placements/applications">
          <Button variant="outline" size="sm" className="text-sm h-9 gap-1.5 border-[#222222] text-[#EDEDED] hover:border-[#FF6B00] hover:text-[#FF6B00]">
            <span>View Tracker</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    );
  }

  if (isClosed) {
    return (
      <Button size="sm" disabled className="text-sm h-10 px-5 font-medium opacity-60">
        <span>Registrations Closed</span>
      </Button>
    );
  }

  if (!isEligible) {
    return (
      <Button
        size="sm"
        disabled
        className="text-sm h-10 px-5 font-medium border border-[#222222] bg-[#121212] text-[#9AA1AA] cursor-not-allowed"
      >
        <span>Not Eligible to Apply</span>
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      {state?.error && (
        <div className="p-2.5 rounded-md border border-[#EF4444]/30 bg-[#EF4444]/10 text-sm text-[#EF4444] flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {state?.success && (
        <div className="p-2.5 rounded-md border border-[#22C55E]/30 bg-[#22C55E]/10 text-sm text-[#22C55E] flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      <Button
        size="sm"
        onClick={handleApply}
        disabled={isPending}
        className="text-sm h-10 px-6 font-semibold"
      >
        {isPending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            <span>Submitting...</span>
          </>
        ) : (
          <span>APPLY NOW</span>
        )}
      </Button>
    </div>
  );
}
