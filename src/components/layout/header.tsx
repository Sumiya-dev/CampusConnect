'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { UserMenu } from './user-menu';
import { UserRole } from '@/lib/types/database.types';
import { ROLE_LABELS } from '@/lib/types/auth.types';

interface HeaderProps {
  role: UserRole;
  userName: string;
  userEmail: string;
  department: string;
  onOpenMobileMenu: () => void;
}

export function Header({
  role,
  userName,
  userEmail,
  department,
  onOpenMobileMenu,
}: HeaderProps) {
  const pathname = usePathname();

  // Determine section title from pathname
  const getSectionTitle = () => {
    if (pathname === '/student') return 'Student Home';
    if (pathname.startsWith('/student/placements')) return 'Placement Opportunities';
    if (pathname.startsWith('/student/preparation')) return 'Placement Preparation';
    if (pathname.startsWith('/student/resume')) return 'Resume Management';
    if (pathname.startsWith('/student/community')) return 'University Community';
    if (pathname.startsWith('/student/alumni')) return 'Alumni Network';
    if (pathname.startsWith('/student/notifications')) return 'Notifications & Bulletins';
    if (pathname.startsWith('/student/help')) return 'Placement Directorate Help';

    if (pathname === '/faculty') return 'Faculty Home';
    if (pathname.startsWith('/faculty/classes')) return 'Classes & Groups';
    if (pathname.startsWith('/faculty/resources')) return 'Academic Resources';
    if (pathname.startsWith('/faculty/placements')) return 'Placement Coordination';
    if (pathname.startsWith('/faculty/announcements')) return 'Faculty Bulletins';
    if (pathname.startsWith('/faculty/community')) return 'Academic Forum';
    if (pathname.startsWith('/faculty/notifications')) return 'Faculty Notifications';
    if (pathname.startsWith('/faculty/students')) return 'Departmental Students';

    if (pathname === '/placement') return 'Directorate Home';
    if (pathname.startsWith('/placement/companies')) return 'Recruiter Directory';
    if (pathname.startsWith('/placement/drives')) return 'Drive Coordinator';
    if (pathname.startsWith('/placement/students')) return 'Candidate Search';
    if (pathname.startsWith('/placement/applications')) return 'Application Pipeline';
    if (pathname.startsWith('/placement/shortlisting')) return 'Shortlist Review';
    if (pathname.startsWith('/placement/schedule')) return 'Drive Calendar';
    if (pathname.startsWith('/placement/analytics')) return 'Placement Analytics';

    if (pathname === '/admin') return 'Administration Home';
    if (pathname.startsWith('/admin/users')) return 'User Directory';
    if (pathname.startsWith('/admin/companies')) return 'Company Audit';
    if (pathname.startsWith('/admin/placements')) return 'Placement Governance';
    if (pathname.startsWith('/admin/moderation')) return 'Community Moderation';
    if (pathname.startsWith('/admin/settings')) return 'System Settings';

    if (pathname === '/profile') return 'My Profile';
    return `${ROLE_LABELS[role]} Workspace`;
  };

  const notificationPath = role === 'student' ? '/student/notifications' : `/${role === 'placement_officer' ? 'placement' : role}/announcements`;

  return (
    <header className="h-14 border-b border-[#222222] bg-[#000000] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden text-[#9AA1AA] hover:text-[#EDEDED] p-1 rounded hover:bg-[#121212] transition-colors"
          aria-label="Open sidebar navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Section title & context */}
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-semibold text-[#EDEDED] tracking-wide">
            {getSectionTitle()}
          </h1>
          <span className="text-[#222222] hidden sm:inline">|</span>
          <Badge variant="secondary" className="text-sm hidden sm:inline-flex truncate max-w-[200px]">
            {department}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Notifications Shortcut */}
        <Link
          href={notificationPath}
          className="text-[#9AA1AA] hover:text-[#EDEDED] p-1.5 rounded hover:bg-[#121212] transition-colors"
          title="Notifications & Bulletins"
        >
          <Bell className="h-4 w-4" />
        </Link>

        {/* User Dropdown Menu */}
        <UserMenu
          name={userName}
          email={userEmail}
          role={role}
          department={department}
        />
      </div>
    </header>
  );
}
