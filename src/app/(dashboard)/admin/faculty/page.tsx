import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/user';
import { getFacultyManagementOverviewAction } from '@/lib/admin/faculty-actions';
import { FacultyManagementClient } from '@/components/admin/faculty-management-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Faculty Management & Allocations | CampusConnect Admin',
  description: 'Superadmin faculty directory, section allocations, training cohort mentors, and teaching scope governance.',
};

export default async function AdminFacultyPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  if (currentUser.role !== 'administrator') {
    redirect('/admin?unauthorized=true&attempted=/admin/faculty');
  }

  const { data, error } = await getFacultyManagementOverviewAction();

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="border-b border-[#222222] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/admin"
              className="text-xs text-[#9AA1AA] hover:text-[#EDEDED] flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Administration</span>
            </Link>
            <span className="text-[#333333]">/</span>
            <span className="text-xs text-[#EDEDED]">Faculty & Allocations</span>
          </div>

          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-[#EDEDED] tracking-tight">
              Faculty Management & Allocations
            </h1>
            <Badge variant="destructive" className="text-xs font-mono">
              Superadmin
            </Badge>
          </div>
          <p className="text-xs text-[#9AA1AA] mt-1">
            Govern faculty member appointments, assign class sections across degree programs, allocate specialized training tracks, and maintain strict academic isolation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED] gap-1.5 h-8"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Admin Console</span>
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Main Interactive Faculty Management & Allocation Client */}
      {data && <FacultyManagementClient initialData={data} />}
    </div>
  );
}
