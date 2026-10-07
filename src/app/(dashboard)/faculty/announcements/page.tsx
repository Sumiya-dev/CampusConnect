import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { UnauthorizedBanner } from '@/components/auth/unauthorized-banner';
import {
  getFacultyAnnouncements,
  getFacultyAnnouncementAllocations,
} from '@/lib/announcements/queries';
import { FacultyAnnouncementsClient } from '@/components/faculty/faculty-announcements-client';

export const dynamic = 'force-dynamic';

export default async function FacultyAnnouncementsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'faculty' && user.role !== 'administrator') {
    redirect('/login?unauthorized=true');
  }

  const [announcements, allocations] = await Promise.all([
    getFacultyAnnouncements(user.id),
    getFacultyAnnouncementAllocations(user.id),
  ]);

  return (
    <div className="space-y-6 max-w-5xl">
      <Suspense fallback={null}>
        <UnauthorizedBanner />
      </Suspense>

      {/* Header */}
      <div className="border-b border-[#222222] pb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-mono tracking-wider text-[#FF6B00]">
            Academic Broadcasts
          </span>
          <span className="text-[#333333]">/</span>
          <span className="text-xs font-mono text-[#9AA1AA]">
            {allocations.faculty_department}
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-[#EDEDED] tracking-tight mt-1">
          Faculty Announcements
        </h1>
        <p className="text-sm text-[#9AA1AA] mt-1">
          Publish and manage official academic circulars, reschedule advisories, and targeted cohort notices.
        </p>
      </div>

      {/* Interactive Announcements Management */}
      <FacultyAnnouncementsClient
        initialAnnouncements={announcements}
        allocations={allocations}
        facultyName={user.name}
        departmentName={allocations.faculty_department}
      />
    </div>
  );
}
