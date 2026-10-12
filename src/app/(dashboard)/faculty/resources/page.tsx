import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { UnauthorizedBanner } from '@/components/auth/unauthorized-banner';
import {
  getFacultyResources,
  getFacultyAllocatedOptions,
} from '@/lib/resources/queries';
import { FacultyResourcesClient } from '@/components/resources/faculty-resources-client';



export default async function FacultyResourcesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'faculty' && user.role !== 'administrator') {
    redirect('/login?unauthorized=true');
  }

  const [resources, allocationOptions] = await Promise.all([
    getFacultyResources(user.id),
    getFacultyAllocatedOptions(user.id),
  ]);

  return (
    <div className="space-y-6 max-w-5xl">
      <Suspense fallback={null}>
        <UnauthorizedBanner />
      </Suspense>

      {/* Header */}
      <div className="border-b border-border pb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-mono tracking-wider text-accent">
            Academic Distribution
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight mt-1">
          Faculty Resources
        </h1>
        <p className="text-sm text-muted mt-1">
          Distribute lecture notes, lab guides, problem sets, and course materials to your assigned cohorts.
        </p>
      </div>

      {/* Interactive Client View */}
      <FacultyResourcesClient
        initialResources={resources}
        allocationOptions={allocationOptions}
        facultyName={user.name}
        departmentName={user.department}
      />
    </div>
  );
}
