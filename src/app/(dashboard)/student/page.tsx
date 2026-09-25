import { Suspense } from 'react';
import Link from 'next/link';
import { getCurrentUser, getFullUserProfile } from '@/lib/auth/user';
import { StudentProfileData } from '@/lib/types/profile.types';
import { getPlacementDrives, getStudentApplications } from '@/lib/placements/queries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UnauthorizedBanner } from '@/components/auth/unauthorized-banner';
import {
  Bell,
  Calendar,
  Clock,
  ArrowRight,
  Briefcase,
  Pin,
  CheckCircle2,
  Megaphone,
  Layers,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StudentHomePage() {
  const user = await getCurrentUser();
  const [profile, drives, applications] = await Promise.all([
    getFullUserProfile(),
    getPlacementDrives(),
    user ? getStudentApplications(user.id) : Promise.resolve([]),
  ]);

  const student = profile?.role === 'student' ? (profile as StudentProfileData) : null;
  const recentDrives = drives.slice(0, 3);

  const announcements = [
    {
      id: 'ann-01',
      author: 'Placement Directorate',
      role: 'Directorate Office',
      title: 'Mandatory Pre-Placement Orientation & Resume Certification Window',
      content:
        'All candidates eligible for recruitment drives must verify their academic credentials and attend the orientation talk. Verified student ID cards are mandatory for entry.',
      date: '2 hours ago',
      pinned: true,
      tag: 'Urgent Directive',
    },
    {
      id: 'ann-02',
      author: 'Dr. Priya Raman',
      role: 'Faculty Advisor, CSE',
      title: 'Department Endorsement & CGPA Audit Period',
      content:
        'Faculty reviews for departmental transcripts are underway. If you updated your CGPA or academic year recently in your profile, ensure your official grade card is uploaded for verification.',
      date: 'Yesterday at 4:30 PM',
      pinned: false,
      tag: 'Departmental',
    },
  ];

  return (
    <div className="space-y-8">
      <Suspense fallback={null}>
        <UnauthorizedBanner />
      </Suspense>

      {/* 1. Contextual Welcome Header */}
      <div className="border-b border-[#222222] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-[#EDEDED] tracking-tight">
              Welcome back, {profile?.name?.split(' ')[0] || 'Student'}
            </h1>
            <span className="inline-flex items-center text-sm font-medium text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2 py-0.5 rounded">
              Placement Cycle Active
            </span>
          </div>
          <p className="text-sm text-[#9AA1AA] mt-1">
            Roll No: <span className="font-mono text-[#EDEDED]">{student?.studentId || 'CS-2026-042'}</span> •{' '}
            Department of {profile?.department} • Year {student?.year ?? 3}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/student/placements">
            <Button size="sm" className="text-sm gap-1.5 font-semibold">
              <Briefcase className="h-3.5 w-3.5" />
              <span>Explore Placements ({drives.length})</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
          <Link href="/student/placements/applications">
            <Button variant="outline" size="sm" className="text-sm gap-1.5 border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]">
              <Layers className="h-3.5 w-3.5" />
              <span>My Applications ({applications.length})</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Compact Academic Standing Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#222222] border border-[#222222] rounded-md overflow-hidden text-sm">
        <div className="bg-[#0A0A0A] p-3.5">
          <span className="text-sm uppercase font-semibold text-[#9AA1AA] tracking-wider block">
            Academic CGPA
          </span>
          <div className="text-base font-semibold text-[#EDEDED] mt-0.5">
            {student?.cgpa ? student.cgpa.toFixed(2) : '8.75'} <span className="text-sm text-[#9AA1AA] font-normal">/ 10.0</span>
          </div>
          <span className="text-sm text-emerald-400">Department Standing</span>
        </div>

        <div className="bg-[#0A0A0A] p-3.5">
          <span className="text-sm uppercase font-semibold text-[#9AA1AA] tracking-wider block">
            Available Drives
          </span>
          <div className="text-base font-semibold text-[#EDEDED] mt-0.5">
            {drives.length} Opportunities
          </div>
          <span className="text-sm text-[#9AA1AA]">Verified Recruitment</span>
        </div>

        <div className="bg-[#0A0A0A] p-3.5">
          <span className="text-sm uppercase font-semibold text-[#9AA1AA] tracking-wider block">
            Submitted Applications
          </span>
          <div className="text-base font-semibold text-[#EDEDED] mt-0.5">
            {applications.length} Submissions
          </div>
          <span className="text-sm text-[#FF6B00]">Active In Pipeline</span>
        </div>

        <div className="bg-[#0A0A0A] p-3.5">
          <span className="text-sm uppercase font-semibold text-[#9AA1AA] tracking-wider block">
            Placement Status
          </span>
          <div className="text-base font-semibold text-[#EDEDED] mt-0.5">
            {student?.placementStatus === 'placed' ? 'Placed' : 'In Process'}
          </div>
          <span className="text-sm text-[#9AA1AA]">Recruitment Pool</span>
        </div>
      </div>

      {/* 3. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Bulletins & Recently Posted Placement Opportunities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recently Posted Placement Drives */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#222222] pb-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#FF6B00]" />
                <h2 className="text-base font-semibold text-[#EDEDED] tracking-tight">
                  Featured Recruitment Opportunities
                </h2>
              </div>
              <Link href="/student/placements" className="text-sm text-[#9AA1AA] hover:text-[#EDEDED] transition-colors">
                View All Drives ({drives.length}) →
              </Link>
            </div>

            {recentDrives.length === 0 ? (
              <div className="p-6 rounded-md border border-[#222222] bg-[#0A0A0A] text-center space-y-2">
                <Briefcase className="h-6 w-6 text-[#9AA1AA] mx-auto opacity-50" />
                <p className="text-sm text-[#9AA1AA]">No active placement drives announced yet.</p>
              </div>
            ) : (
              <div className="border border-[#222222] rounded-md bg-[#0A0A0A] divide-y divide-[#222222] overflow-hidden">
                {recentDrives.map((drive) => (
                  <div
                    key={drive.id}
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-4 hover:bg-[#121212]/50 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm px-1.5 py-0.2 rounded border border-[#222222] bg-[#121212] text-[#EDEDED]">
                          {drive.tier}
                        </span>
                        <span className="text-sm text-[#9AA1AA] truncate">
                          Min CGPA: {Number(drive.min_cgpa).toFixed(2)}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-[#EDEDED] truncate">
                        {drive.company?.company_name} — {drive.job_role}
                      </h3>
                      <p className="text-sm text-[#FF6B00] font-medium">
                        {drive.package_details}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <Link href={`/student/placements/${drive.id}`}>
                        <Button size="sm" variant="outline" className="text-sm border-[#222222] text-[#EDEDED] hover:border-[#FF6B00] hover:text-[#FF6B00]">
                          <span>Check</span>
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bulletins Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#222222] pb-2">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-[#FF6B00]" />
                <h2 className="text-base font-semibold text-[#EDEDED] tracking-tight">
                  Directorate & Department Bulletins
                </h2>
              </div>
              <Link href="/student/notifications" className="text-sm text-[#9AA1AA] hover:text-[#EDEDED] transition-colors">
                View All Bulletins →
              </Link>
            </div>

            <div className="space-y-3">
              {announcements.map((item) => (
                <article
                  key={item.id}
                  className="p-4 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {item.pinned && (
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#FF6B00] bg-[#FF6B00]/10 px-1.5 py-0.2 rounded border border-[#FF6B00]/20">
                            <Pin className="h-2.5 w-2.5" />
                            <span>Pinned</span>
                          </span>
                        )}
                        <span className="text-sm text-[#9AA1AA] uppercase font-semibold tracking-wider">
                          {item.tag}
                        </span>
                        <span className="text-[#222222]">•</span>
                        <span className="text-sm text-[#9AA1AA]">{item.date}</span>
                      </div>

                      <h3 className="text-base font-semibold text-[#EDEDED] leading-snug">
                        {item.title}
                      </h3>
                    </div>

                    <div className="text-right shrink-0 hidden sm:block">
                      <div className="text-sm font-medium text-[#EDEDED]">{item.author}</div>
                      <div className="text-sm text-[#9AA1AA]">{item.role}</div>
                    </div>
                  </div>

                  <p className="text-sm text-[#9AA1AA] leading-relaxed">
                    {item.content}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Application Pipeline & Activity Timeline */}
        <div className="space-y-6">
          {/* Recent Applications Tracker */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#222222] pb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#FF6B00]" />
                <h2 className="text-base font-semibold text-[#EDEDED] tracking-tight">
                  Application Updates
                </h2>
              </div>
              <Link href="/student/placements/applications" className="text-sm text-[#9AA1AA] hover:text-[#EDEDED] transition-colors">
                View All ({applications.length}) →
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="p-4 rounded-md border border-[#222222] bg-[#0A0A0A] text-center space-y-1.5">
                <p className="text-sm text-[#EDEDED]">No applications submitted</p>
                <p className="text-sm text-[#9AA1AA]">Review open drives and apply when eligible.</p>
              </div>
            ) : (
              <div className="border border-[#222222] rounded-md bg-[#0A0A0A] divide-y divide-[#222222]">
                {applications.slice(0, 3).map((app) => (
                  <div key={app.id} className="p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#EDEDED] truncate">
                        {app.drive?.company?.company_name}
                      </span>
                      <span className="text-[9px] font-semibold text-[#FF6B00] uppercase">
                        {app.status}
                      </span>
                    </div>
                    <p className="text-sm text-[#9AA1AA] truncate">
                      {app.drive?.job_role}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
