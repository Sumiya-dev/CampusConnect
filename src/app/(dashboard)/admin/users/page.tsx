import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/user';
import { getSuperadminUsersOverviewAction } from '@/lib/admin/user-actions';
import { UserManagementTable } from '@/components/admin/user-management-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldAlert, Loader2 } from 'lucide-react';



function AdminUsersSkeleton() {
  return (
    <div className="flex h-[40vh] w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  );
}

async function AdminUsersContent() {
  const { data, error } = await getSuperadminUsersOverviewAction();

  if (error) {
    return (
      <div className="p-3 rounded-md border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs">
        {error}
      </div>
    );
  }

  return data ? <UserManagementTable initialData={data} /> : null;
}

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  if (currentUser.role !== 'administrator') {
    redirect('/admin?unauthorized=true&attempted=/admin/users');
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/admin"
              className="text-xs text-muted hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Administration</span>
            </Link>
            <span className="text-[#333333]">/</span>
            <span className="text-xs text-foreground">User Accounts</span>
          </div>

          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              Superadmin User Governance
            </h1>
            <Badge variant="destructive" className="text-xs font-mono">
              Superadmin
            </Badge>
          </div>
          <p className="text-xs text-muted mt-1">
            Privileged administrative console for identity lifecycle management, role delegation, account activation, and immutable audit tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-border text-muted hover:text-foreground gap-1.5 h-8"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Admin Console</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Interactive Superadmin Table & Audit */}
      <Suspense fallback={<AdminUsersSkeleton />}>
        <AdminUsersContent />
      </Suspense>
    </div>
  );
}
