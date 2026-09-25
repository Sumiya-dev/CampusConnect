import Link from 'next/link';
import { Bell, ArrowLeft } from 'lucide-react';

export default function FacultyNotificationsPlaceholder() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-[#222222] pb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-mono tracking-wider text-[#FF6B00]">Account</span>
        </div>
        <h1 className="text-2xl font-semibold text-[#EDEDED] tracking-tight mt-1">
          Notifications
        </h1>
        <p className="text-sm text-[#9AA1AA] mt-1">
          System alerts, department circulars, and student advisory updates.
        </p>
      </div>

      <div className="border border-[#222222] bg-[#0A0A0A] rounded-md p-8 text-center space-y-3">
        <div className="inline-flex p-3 rounded-full bg-[#161616] border border-[#262626] text-[#FF6B00] mb-2">
          <Bell className="h-6 w-6" />
        </div>
        <h2 className="text-base font-medium text-[#EDEDED]">No Unread Notifications</h2>
        <p className="text-xs text-[#9AA1AA] max-w-md mx-auto">
          You are all caught up with advisory notices and institutional communications.
        </p>
        <div className="pt-2">
          <Link
            href="/faculty"
            className="inline-flex items-center gap-1.5 text-xs text-[#FF6B00] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
