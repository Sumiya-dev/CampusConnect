import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { getFacultySessionDetails } from '@/lib/faculty/queries';
import { SessionStudentsView } from '@/components/faculty/session-students-view';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{
    classId: string;
  }>;
}

export default async function FacultyClassDetailsPage({ params }: PageProps) {
  const { classId: sessionId } = await params;
  const user = await getCurrentUser();
  const sessionDetails = await getFacultySessionDetails(sessionId, user?.id);

  if (!sessionDetails) {
    notFound();
  }

  const { session, students, available_training_groups } = sessionDetails;

  return (
    <div className="max-w-2xl space-y-8">
      {/* Subtle Breadcrumb / Back Link */}
      <div className="text-xs text-[#9AA1AA]">
        <Link
          href="/faculty/classes"
          className="inline-flex items-center gap-1.5 hover:text-[#EDEDED] transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Classes
        </Link>
      </div>

      {/* Class Details Header */}
      <div className="space-y-1.5 border-b border-[#222222] pb-5">
        <h1 className="text-2xl font-medium tracking-tight text-[#EDEDED]">
          {session.title}
        </h1>

        <div className="text-xs text-[#9AA1AA]">
          {session.year_label} · {session.section_code}
        </div>

        <div className="text-xs text-[#9AA1AA] font-mono">
          {session.time_range}
        </div>

        <div className="text-xs text-[#9AA1AA]">
          {session.venue}
        </div>
      </div>

      {/* Registered Students Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#9AA1AA]">
            Registered Students
          </span>
          <span className="text-xs text-[#9AA1AA]">
            {students.length} Total
          </span>
        </div>

        {/* Dynamic Training Filter & Student Table */}
        <SessionStudentsView
          students={students}
          availableGroups={available_training_groups}
        />
      </div>
    </div>
  );
}
