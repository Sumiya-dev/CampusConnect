import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { UnauthorizedBanner } from '@/components/auth/unauthorized-banner';
import { getStudentResources } from '@/lib/resources/queries';
import { StudentResourcesClient } from '@/components/resources/student-resources-client';

export const dynamic = 'force-dynamic';

export default async function StudentResourcesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'student' && user.role !== 'administrator') {
    redirect('/login?unauthorized=true');
  }

  const resources = await getStudentResources();

  return (
    <div className="space-y-6 max-w-5xl">
      <Suspense fallback={null}>
        <UnauthorizedBanner />
      </Suspense>

      {/* Header */}
      <div className="border-b border-[#222222] pb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-mono tracking-wider text-[#FF6B00]">
            Academic Repositories
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-[#EDEDED] tracking-tight mt-1">
          Course Resources & Materials
        </h1>
        <p className="text-sm text-[#9AA1AA] mt-1">
          Reference materials, lecture slides, and tutorials published by your department professors and trainers.
        </p>
      </div>

      {/* Interactive Client View */}
      <StudentResourcesClient
        resources={resources}
        studentName={user.name}
        departmentName={user.department}
      />
    </div>
  );
}
