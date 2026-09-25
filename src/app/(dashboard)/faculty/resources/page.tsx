import Link from 'next/link';
import { BookOpen, ArrowLeft } from 'lucide-react';

export default function FacultyResourcesPlaceholder() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-[#222222] pb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-mono tracking-wider text-[#FF6B00]">Academic</span>
        </div>
        <h1 className="text-2xl font-semibold text-[#EDEDED] tracking-tight mt-1">
          Resources
        </h1>
        <p className="text-sm text-[#9AA1AA] mt-1">
          Course materials, lecture slides, and study repositories.
        </p>
      </div>

      <div className="border border-[#222222] bg-[#0A0A0A] rounded-md p-8 text-center space-y-3">
        <div className="inline-flex p-3 rounded-full bg-[#161616] border border-[#262626] text-[#FF6B00] mb-2">
          <BookOpen className="h-6 w-6" />
        </div>
        <h2 className="text-base font-medium text-[#EDEDED]">Faculty Resources Module Coming Soon</h2>
        <p className="text-xs text-[#9AA1AA] max-w-md mx-auto">
          This module is reserved for distributing departmental academic guides, syllabi, and lecture references to assigned cohorts.
        </p>
        <div className="pt-2">
          <Link
            href="/faculty/classes"
            className="inline-flex items-center gap-1.5 text-xs text-[#FF6B00] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Go to Classes & Groups
          </Link>
        </div>
      </div>
    </div>
  );
}
