import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/user';
import { getAcademicStructureOverviewAction } from '@/lib/admin/academic-actions';
import { AcademicStructureClient } from '@/components/admin/academic-structure-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Academic Structure & Departments | CampusConnect Admin',
  description: 'Superadmin management for departments, programs, academic years, sections, and training groups.',
};

export default async function AdminDepartmentsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  if (currentUser.role !== 'administrator') {
    redirect('/admin?unauthorized=true&attempted=/admin/departments');
  }

  const { data, error } = await getAcademicStructureOverviewAction();

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
            <span className="text-xs text-[#EDEDED]">Academic Structure</span>
          </div>

          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-[#EDEDED] tracking-tight">
              Academic Structure & Hierarchy
            </h1>
            <Badge variant="destructive" className="text-xs font-mono">
              Superadmin
            </Badge>
          </div>
          <p className="text-xs text-[#9AA1AA] mt-1">
            Configure institutional departments, degree programs, academic cycles, class sections, and specialized training cohorts with automated dependency protection.
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

      {/* Main Interactive Academic Structure Component */}
      {data && <AcademicStructureClient initialData={data} />}
    </div>
  );
}
