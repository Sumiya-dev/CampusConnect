import { Suspense } from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/user';
import { UnauthorizedBanner } from '@/components/auth/unauthorized-banner';
import { getFacultyDashboardSummary } from '@/lib/faculty/queries';
import { ArrowRight, Layers, GraduationCap } from 'lucide-react';

export default async function FacultyHomePage() {
  const user = await getCurrentUser();
  const summary = await getFacultyDashboardSummary(user?.id);

  return (
    <div className="space-y-8 max-w-5xl">
      <Suspense fallback={null}>
        <UnauthorizedBanner />
      </Suspense>

      {/* Header / Context */}
      <div className="border-b border-[#222222] pb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-mono tracking-wider text-[#FF6B00]">Faculty Portal</span>
        </div>
        <h1 className="text-2xl font-semibold text-[#EDEDED] tracking-tight mt-1">
          Welcome back, {user?.name || summary.faculty_name}
        </h1>
        <p className="text-sm text-[#9AA1AA] mt-1">
          Department of {summary.department || 'Computer Science & Engineering'} • Academic Year 2025–2026
        </p>
      </div>

      {/* High-level Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0A0A0A] border border-[#222222] p-4 rounded-md">
          <span className="text-xs uppercase font-medium text-[#9AA1AA] block">Assigned Classes</span>
          <div className="text-2xl font-semibold text-[#EDEDED] mt-1">
            {summary.assigned_classes.length}
          </div>
          <span className="text-xs text-[#9AA1AA] mt-0.5 block">Academic Sections</span>
        </div>

        <div className="bg-[#0A0A0A] border border-[#222222] p-4 rounded-md">
          <span className="text-xs uppercase font-medium text-[#9AA1AA] block">Training Groups</span>
          <div className="text-2xl font-semibold text-[#EDEDED] mt-1">
            {summary.assigned_training_groups.length}
          </div>
          <span className="text-xs text-[#9AA1AA] mt-0.5 block">Skill & Prep Batches</span>
        </div>

        <div className="bg-[#0A0A0A] border border-[#222222] p-4 rounded-md">
          <span className="text-xs uppercase font-medium text-[#9AA1AA] block">Total Monitored</span>
          <div className="text-2xl font-semibold text-[#EDEDED] mt-1">
            {summary.total_students_monitored}
          </div>
          <span className="text-xs text-[#9AA1AA] mt-0.5 block">Enrolled Candidates</span>
        </div>

        <div className="bg-[#0A0A0A] border border-[#222222] p-4 rounded-md">
          <span className="text-xs uppercase font-medium text-[#9AA1AA] block">Faculty ID</span>
          <div className="text-2xl font-semibold text-[#EDEDED] mt-1 font-mono text-base pt-1">
            {summary.employee_id}
          </div>
          <span className="text-xs text-[#9AA1AA] mt-0.5 block">Active Advisory Role</span>
        </div>
      </div>

      {/* Main Sections: My Classes & My Training Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* My Classes */}
        <div className="border border-[#222222] bg-[#0A0A0A] rounded-md p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#222222] pb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[#FF6B00]" />
              <h2 className="text-base font-medium text-[#EDEDED]">My Classes</h2>
            </div>
            <Link
              href="/faculty/classes"
              className="text-xs text-[#FF6B00] hover:underline flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {summary.assigned_classes.length === 0 ? (
            <p className="text-sm text-[#9AA1AA] py-4">No academic classes currently assigned.</p>
          ) : (
            <div className="space-y-2.5">
              {summary.assigned_classes.map((cls) => (
                <Link
                  key={cls.id}
                  href={`/faculty/classes/${cls.id}`}
                  className="group block p-3.5 rounded border border-[#222222] bg-[#000000] hover:border-[#333333] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-[#EDEDED] group-hover:text-[#FF6B00] transition-colors">
                        {cls.department_code || cls.department_name} • Year {cls.year} — {cls.section_name}
                      </div>
                      <div className="text-xs text-[#9AA1AA] mt-0.5">
                        {cls.program_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#161616] border border-[#262626] text-[#EDEDED]">
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
        <div className="border border-[#222222] bg-[#0A0A0A] rounded-md p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#222222] pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#FF6B00]" />
              <h2 className="text-base font-medium text-[#EDEDED]">My Training Groups</h2>
            </div>
            <Link
              href="/faculty/classes"
              className="text-xs text-[#FF6B00] hover:underline flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {summary.assigned_training_groups.length === 0 ? (
            <p className="text-sm text-[#9AA1AA] py-4">No training groups currently assigned.</p>
          ) : (
            <div className="space-y-2.5">
              {summary.assigned_training_groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/faculty/classes/groups/${group.id}`}
                  className="group block p-3.5 rounded border border-[#222222] bg-[#000000] hover:border-[#333333] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-[#EDEDED] group-hover:text-[#FF6B00] transition-colors">
                        {group.name}
                      </div>
                      <div className="text-xs text-[#9AA1AA] mt-0.5 line-clamp-1">
                        {group.description || 'Specialized placement training batch'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#161616] border border-[#262626] text-[#EDEDED]">
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
      <div className="p-4 rounded-md border border-[#222222] bg-[#0A0A0A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-[#EDEDED]">Access Full Rosters & Groups</h3>
          <p className="text-xs text-[#9AA1AA]">
            View complete student lists, filter classes by training programs, and inspect cross-section training cohorts.
          </p>
        </div>
        <Link
          href="/faculty/classes"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded text-xs font-medium bg-[#EDEDED] text-[#000000] hover:bg-white transition-colors shrink-0"
        >
          Go to Classes & Groups
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
