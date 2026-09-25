import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/user';
import { getAllUsersAction } from '@/lib/profile/actions';
import { UserManagementTable } from '@/components/admin/user-management-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  if (currentUser.role !== 'administrator') {
    redirect('/admin?unauthorized=true&attempted=/admin/users');
  }

  const { users, error } = await getAllUsersAction();

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="border-b border-[#252A31] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/admin"
              className="text-sm text-[#9AA1AA] hover:text-[#F1F3F5] flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Administration</span>
            </Link>
            <span className="text-[#252A31]">/</span>
            <span className="text-sm text-[#F1F3F5]">User Accounts</span>
          </div>

          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-[#F1F3F5] tracking-tight">
              User Directory & Account Governance
            </h1>
            <Badge variant="destructive" className="text-sm">
              Super Admin
            </Badge>
          </div>
          <p className="text-sm text-[#9AA1AA] mt-1">
            Search, filter, audit, and modify account status and role authorization across all institutional users.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin">
            <Button variant="outline" size="sm" className="text-sm gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Admin Console</span>
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Interactive User Table */}
      <UserManagementTable initialUsers={users} />
    </div>
  );
}
