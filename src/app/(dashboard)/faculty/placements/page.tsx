import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { UnauthorizedBanner } from '@/components/auth/unauthorized-banner';
import { getFacultyPlacementsOverview } from '@/lib/faculty/placement-queries';
import { FacultyPlacementsListClient } from '@/components/faculty/faculty-placements-list-client';

export const dynamic = 'force-dynamic';

export default async function FacultyPlacementsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'faculty' && user.role !== 'administrator') {
    redirect('/login?unauthorized=true');
  }

  const data = await getFacultyPlacementsOverview(user.id);

  return (
    <div className="space-y-6 max-w-6xl">
      <Suspense fallback={null}>
        <UnauthorizedBanner />
      </Suspense>

      {/* Header */}
      <div className="border-b border-[#222222] pb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-mono tracking-wider text-[#FF6B00]">
            Placement Oversight
          </span>
          <span className="text-[#333333]">/</span>
          <span className="text-xs font-mono text-[#9AA1AA]">
            {data.faculty_department}
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-[#EDEDED] tracking-tight mt-1">
          Placement Coordination
        </h1>
        <p className="text-sm text-[#9AA1AA] mt-1">
          Monitor recruitment drives, verify applicant eligibility, and track candidate progress for your authorized student cohorts.
        </p>
      </div>

      <FacultyPlacementsListClient
        initialDrives={data.drives}
        allocatedDepartments={data.allocated_departments}
        allocatedYears={data.allocated_years}
        allocatedSections={data.allocated_sections}
        facultyDepartment={data.faculty_department}
        totalAuthorizedStudents={data.total_authorized_students}
        totalPlacedAuthorizedStudents={data.total_placed_authorized_students}
      />
    </div>
  );
}
