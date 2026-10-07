import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { AppShell } from '@/components/layout/app-shell';
import { getPublicPlatformStatus } from '@/lib/settings/queries';
import { AlertTriangle } from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userContext = await getCurrentUser();

  if (!userContext) {
    redirect('/login');
  }

  const platform = await getPublicPlatformStatus();
  const showMaintenanceNotice =
    (platform.maintenance_mode || platform.platform_status === 'maintenance' || platform.platform_status === 'read_only') &&
    userContext.role !== 'administrator';

  return (
    <AppShell
      role={userContext.role}
      userName={userContext.name}
      userEmail={userContext.email}
      department={userContext.department}
    >
      {showMaintenanceNotice && (
        <div className="mb-4 p-3 rounded-md bg-amber-950/40 border border-amber-800/80 text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            {platform.maintenance_message ||
              'Scheduled maintenance is in progress. Certain platform submission features may be temporarily restricted.'}
          </span>
        </div>
      )}
      {children}
    </AppShell>
  );
}
