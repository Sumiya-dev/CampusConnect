import { Suspense } from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/user';
import { UnauthorizedBanner } from '@/components/auth/unauthorized-banner';
import { getFacultyDashboardSummary } from '@/lib/faculty/queries';
import { ArrowRight, Layers, GraduationCap, Loader2 } from 'lucide-react';



function FacultySkeleton() {
  return (
    <div className="flex h-[40vh] w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  );
}

async function FacultyDashboardContent({ userId }: { userId: string }) {
  const summary = await getFacultyDashboardSummary(userId);

  return (
    <div className="space-y-8">
      {/* High-level Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border p-4 rounded-md">
          <span className="text-xs uppercase font-medium text-muted block">Assigned Classes</span>
          <div className="text-2xl font-semibold text-foreground mt-1">
            {summary.assigned_classes.length}
          </div>
          <span className="text-xs text-muted mt-0.5 block">Academic Sections</span>
        </div>

        <div className="bg-surface border border-border p-4 rounded-md">
          <span className="text-xs uppercase font-medium text-muted block">Training Groups</span>
          <div className="text-2xl font-semibold text-foreground mt-1">
            {summary.assigned_training_groups.length}
          </div>
          <span className="text-xs text-muted mt-0.5 block">Skill & Prep Batches</span>
        </div>

        <div className="bg-surface border border-border p-4 rounded-md">
          <span className="text-xs uppercase font-medium text-muted block">Total Monitored</span>
          <div className="text-2xl font-semibold text-foreground mt-1">
            {summary.total_students_monitored}
          </div>
          <span className="text-xs text-muted mt-0.5 block">Enrolled Candidates</span>
        </div>

        <div className="bg-surface border border-border p-4 rounded-md">
          <span className="text-xs uppercase font-medium text-muted block">Faculty ID</span>
          <div className="text-2xl font-semibold text-foreground mt-1 font-mono text-base pt-1">
            {summary.employee_id}
          </div>
          <span className="text-xs text-muted mt-0.5 block">Active Advisory Role</span>
        </div>
      </div>

      {/* Main Sections: My Classes & My Training Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* My Classes */}
        <div className="border border-border bg-surface rounded-md p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-accent" />
              <h2 className="text-base font-medium text-foreground">My Classes</h2>
            </div>
            <Link
              href="/faculty/classes"
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {summary.assigned_classes.length === 0 ? (
            <p className="text-sm text-muted py-4">No academic classes currently assigned.</p>
          ) : (
            <div className="space-y-2.5">
              {summary.assigned_classes.map((cls) => (
                <Link
                  key={cls.id}
                  href={`/faculty/classes/${cls.id}`}
                  className="group block p-3.5 rounded border border-border bg-background hover:border-[#333333] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                        {cls.department_code || cls.department_name} • Year {cls.year} — {cls.section_name}
                      </div>
                      <div className="text-xs text-muted mt-0.5">
                        {cls.program_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#161616] border border-[#262626] text-foreground">
                        {cls.student_count} Students
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* My Training Groups */}
        <div className="border border-border bg-surface rounded-md p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-accent" />
              <h2 className="text-base font-medium text-foreground">My Training Groups</h2>
            </div>
            <Link
              href="/faculty/classes"
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {summary.assigned_training_groups.length === 0 ? (
            <p className="text-sm text-muted py-4">No training groups currently assigned.</p>
          ) : (
            <div className="space-y-2.5">
              {summary.assigned_training_groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/faculty/classes/groups/${group.id}`}
                  className="group block p-3.5 rounded border border-border bg-background hover:border-[#333333] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                        {group.name}
                      </div>
                      <div className="text-xs text-muted mt-0.5 line-clamp-1">
                        {group.description || 'Specialized placement training batch'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#161616] border border-[#262626] text-foreground">
                        {group.student_count} Students
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation Footer */}
      <div className="p-4 rounded-md border border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-foreground">Access Full Rosters & Groups</h3>
          <p className="text-xs text-muted">
            View complete student lists, filter classes by training programs, and inspect cross-section training cohorts.
          </p>
        </div>
        <Link
          href="/faculty/classes"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded text-xs font-medium bg-foreground text-background hover:bg-white transition-colors shrink-0"
        >
          Go to Classes & Groups
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default async function FacultyHomePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const facultyName = user.name ? user.name.split(' ')[0] : 'Faculty';
  const facultyDept = user.department || 'Department';

  return (
    <div className="space-y-8 max-w-5xl">
      <Suspense fallback={null}>
        <UnauthorizedBanner />
      </Suspense>

      {/* Header / Context */}
      <div className="border-b border-border pb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-mono tracking-wider text-accent">Faculty Portal</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight mt-1">
          Welcome back, {facultyName}
        </h1>
        <p className="text-sm text-muted mt-1">
          Department of {facultyDept} • Academic Year 2025–2026
        </p>
      </div>

      <Suspense fallback={<FacultySkeleton />}>
        <FacultyDashboardContent userId={user.id} />
      </Suspense>
    </div>
  );
}
