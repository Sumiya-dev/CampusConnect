import { Suspense } from 'react';
import Link from 'next/link';
import { getCurrentUser, getFullUserProfile } from '@/lib/auth/user';
import { StudentProfileData } from '@/lib/types/profile.types';
import {
  getPlacementDrives,
  getStudentApplications,
  getStudentShortlists,
} from '@/lib/placements/queries';
import { Button } from '@/components/ui/button';
import { UnauthorizedBanner } from '@/components/auth/unauthorized-banner';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

function formatShortDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export default async function StudentHomePage() {
  const user = await getCurrentUser();
  const [profile, drives, applications, shortlists] = await Promise.all([
    getFullUserProfile(),
    getPlacementDrives(),
    user ? getStudentApplications(user.id) : Promise.resolve([]),
    user ? getStudentShortlists(user.id) : Promise.resolve([]),
  ]);

  const student = profile?.role === 'student' ? (profile as StudentProfileData) : null;

  // Student Identity Details
  const studentName = profile?.name
    ? profile.name.split(' ')[0]
    : user?.name
    ? user.name.split(' ')[0]
    : 'Student';
  const studentRoll = student?.studentId || user?.identifier || 'Roll No';
  const studentDept = profile?.department || user?.department || 'Department';
  const studentYear = student?.year ? `Year ${student.year}` : 'Year 3';

  // 1. Upcoming Drives (Max 3)
  const now = Date.now();
  const openWithFutureDeadline = drives.filter(
    (d) => d.status === 'open' && new Date(d.registration_deadline).getTime() >= now
  );
  const upcomingDrives = (
    openWithFutureDeadline.length > 0
      ? openWithFutureDeadline
      : drives.filter((d) => d.status === 'open')
  ).slice(0, 3);

  // 2. Recent Activity Items (Max 4)
  const recentActivities = applications.slice(0, 4).map((app) => {
    const company = app.drive?.company?.company_name || 'Placement Drive';
    let label = `Application submitted — ${company}`;

    switch (app.status) {
      case 'shortlisted':
        label = `Shortlisted — ${company}`;
        break;
      case 'interview':
        label = `Interview scheduled — ${company}`;
        break;
      case 'selected':
        label = `Selected — ${company}`;
        break;
      case 'placed':
        label = `Placed — ${company}`;
        break;
      case 'rejected':
        label = `Application status updated — ${company}`;
        break;
      case 'withdrawn':
        label = `Application withdrawn — ${company}`;
        break;
      case 'applied':
      default:
        label = `Application submitted — ${company}`;
        break;
    }

    const date = formatShortDate(app.updated_at || app.applied_at);

    return {
      id: app.id,
      label,
      date,
      href: `/student/placements/${app.drive_id}`,
    };
  });

  return (
    <div className="space-y-8 py-2">
      <Suspense fallback={null}>
        <UnauthorizedBanner />
      </Suspense>

      {/* 1. Simple Welcome Header & Primary Action */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-[#EDEDED] tracking-tight">
            Welcome back, {studentName}
          </h1>
          <p className="text-sm text-[#888888]">
            {studentRoll} · {studentDept} · {studentYear}
          </p>
        </div>

        <div>
          <Link href="/student/placements">
            <Button className="bg-[#FF6B00] hover:bg-[#E56000] text-black font-semibold text-sm px-4 h-9 rounded-md inline-flex items-center gap-1.5 shadow-none border-0">
              <span>View Placements</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Thin Divider */}
      <div className="border-t border-[#1F1F1F]" />

      {/* 2-Column Balanced Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Upcoming & My Applications */}
        <div className="lg:col-span-7 space-y-8">
          {/* Upcoming Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-wider font-semibold text-[#888888]">
                Upcoming
              </h2>
              {upcomingDrives.length > 0 && (
                <Link
                  href="/student/placements"
                  className="text-xs text-[#888888] hover:text-[#EDEDED] transition-colors"
                >
                  View all →
                </Link>
              )}
            </div>

            {upcomingDrives.length === 0 ? (
              <p className="text-sm text-[#666666] py-1">No upcoming drives or deadlines.</p>
            ) : (
              <div className="divide-y divide-[#1A1A1A]">
                {upcomingDrives.map((drive) => (
                  <div
                    key={drive.id}
                    className="py-3 flex items-center justify-between gap-4 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[#EDEDED] truncate">
                        {drive.company?.company_name} — {drive.job_role}
                      </p>
                      <p className="text-xs text-[#888888] mt-0.5">
                        Application closes · {formatShortDate(drive.registration_deadline)}
                      </p>
                    </div>
                    <Link
                      href={`/student/placements/${drive.id}`}
                      className="text-xs text-[#FF6B00] hover:underline shrink-0 font-medium"
                    >
                      View →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Thin Divider */}
          <div className="border-t border-[#1F1F1F]" />

          {/* My Applications Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-wider font-semibold text-[#888888]">
                My Applications {applications.length > 0 && `(${applications.length})`}
              </h2>
              {applications.length > 0 && (
                <Link
                  href="/student/placements/applications"
                  className="text-xs text-[#888888] hover:text-[#EDEDED] transition-colors"
                >
                  View all →
                </Link>
              )}
            </div>

            {applications.length === 0 ? (
              <p className="text-sm text-[#666666] py-1">No applications submitted yet.</p>
            ) : (
              <div className="divide-y divide-[#1A1A1A]">
                {applications.slice(0, 3).map((app) => (
                  <div
                    key={app.id}
                    className="py-3 flex items-center justify-between gap-4 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[#EDEDED] truncate">
                        {app.drive?.company?.company_name} — {app.drive?.job_role}
                      </p>
                      <p className="text-xs text-[#888888] mt-0.5">
                        Applied · {formatShortDate(app.applied_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-[#AAAAAA] capitalize font-mono">
                        {app.status.replace('_', ' ')}
                      </span>
                      <Link
                        href={`/student/placements/${app.drive_id}`}
                        className="text-xs text-[#FF6B00] hover:underline font-medium"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Shortlistings, Recent Activity & Placement Cell */}
        <div className="lg:col-span-5 space-y-8">
          {/* Shortlistings Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-wider font-semibold text-[#888888]">
                Shortlistings {shortlists.length > 0 && `(${shortlists.length})`}
              </h2>
              {shortlists.length > 0 && (
                <Link
                  href="/student/placements/shortlists"
                  className="text-xs text-[#888888] hover:text-[#EDEDED] transition-colors"
                >
                  View all →
                </Link>
              )}
            </div>

            {shortlists.length === 0 ? (
              <p className="text-sm text-[#666666] py-1">No active shortlistings at this time.</p>
            ) : (
              <div className="divide-y divide-[#1A1A1A]">
                {shortlists.slice(0, 3).map((app) => (
                  <div
                    key={app.id}
                    className="py-3 flex items-center justify-between gap-4 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[#EDEDED] truncate">
                        {app.drive?.company?.company_name} — {app.drive?.job_role}
                      </p>
                      <p className="text-xs text-emerald-400 mt-0.5">
                        {app.status === 'interview' && app.interview_date
                          ? `Interview scheduled · ${formatShortDate(app.interview_date)}`
                          : app.status === 'selected' || app.status === 'placed'
                          ? `Offer extended · Final Selection`
                          : `Shortlisted · Next stage pending`}
                      </p>
                    </div>
                    <Link
                      href={`/student/placements/${app.drive_id}`}
                      className="text-xs text-[#FF6B00] hover:underline shrink-0 font-medium"
                    >
                      View →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Thin Divider */}
          <div className="border-t border-[#1F1F1F]" />

          {/* Recent Activity Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-wider font-semibold text-[#888888]">
                Recent Activity
              </h2>
            </div>

            {recentActivities.length === 0 ? (
              <p className="text-sm text-[#666666] py-1">No recent activity.</p>
            ) : (
              <div className="divide-y divide-[#1A1A1A]">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="py-3 flex items-center justify-between gap-4 text-sm"
                  >
                    <p className="font-medium text-[#EDEDED] truncate">
                      {activity.label}
                    </p>
                    <span className="text-xs text-[#888888] shrink-0">
                      {activity.date}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Thin Divider */}
          <div className="border-t border-[#1F1F1F]" />

          {/* Support & Resources Section */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-wider font-semibold text-[#888888]">
                Placement Help & Cell
              </h2>
              <Link
                href="/student/help"
                className="text-xs text-[#888888] hover:text-[#EDEDED] transition-colors"
              >
                Help Center →
              </Link>
            </div>
            <p className="text-xs text-[#777777] leading-relaxed">
              Career & Placement Directorate · Admin Block, Floor 2
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
