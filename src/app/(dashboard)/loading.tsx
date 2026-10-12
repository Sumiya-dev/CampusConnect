import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
      <p className="text-sm text-muted font-medium tracking-wide animate-pulse">
        Loading...
      </p>
    </div>
  );
}
