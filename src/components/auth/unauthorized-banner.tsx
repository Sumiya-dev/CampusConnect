'use client';

import { useSearchParams } from 'next/navigation';
import { Alert } from '@/components/ui/alert';

export function UnauthorizedBanner() {
  const searchParams = useSearchParams();
  const isUnauthorized = searchParams.get('unauthorized');
  const attemptedPath = searchParams.get('attempted');

  if (!isUnauthorized) return null;

  return (
    <div className="mb-6">
      <Alert variant="warning" title="Access Restricted">
        You attempted to access <code className="font-mono bg-[#171B20] text-[#F1F3F5] px-1 py-0.5 rounded border border-[#252A31] text-sm">{attemptedPath || 'a restricted portal'}</code>. Your current account role does not have authorization for that section. You have been routed to your authorized workspace.
      </Alert>
    </div>
  );
}
