import {
  Home,
  Briefcase,
  BookOpen,
  FileText,
  MessageSquare,
  Users,
  Bell,
  HelpCircle,
  User,
  Building,
  GraduationCap,
  Calendar,
  Layers,
  ListFilter,
  BarChart3,
  ShieldAlert,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { UserRole } from '@/lib/types/database.types';

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  exact?: boolean;
}

export interface NavGroup {
  groupTitle?: string;
  items: NavItem[];
}

export const NAVIGATION_BY_ROLE: Record<UserRole, NavGroup[]> = {
  student: [
    {
      items: [
        { title: 'Home', href: '/student', icon: Home, exact: true },
      ],
    },
    {
      groupTitle: 'Career & Drives',
      items: [
        { title: 'Placements', href: '/student/placements', icon: Briefcase },
        { title: 'Preparation', href: '/student/preparation', icon: BookOpen },
        { title: 'Resume', href: '/student/resume', icon: FileText },
      ],
    },
    {
      groupTitle: 'Networking',
      items: [
        { title: 'Community', href: '/student/community', icon: MessageSquare },
        { title: 'Alumni', href: '/student/alumni', icon: GraduationCap },
      ],
    },
    {
      groupTitle: 'Account & Support',
      items: [
        { title: 'Notifications', href: '/student/notifications', icon: Bell },
        { title: 'Help Center', href: '/student/help', icon: HelpCircle },
        { title: 'Profile', href: '/profile', icon: User },
      ],
    },
  ],

  faculty: [
    {
      items: [
        { title: 'Home', href: '/faculty', icon: Home, exact: true },
      ],
    },
    {
      groupTitle: 'ACADEMIC',
      items: [
        { title: 'Classes & Groups', href: '/faculty/classes', icon: Users },
        { title: 'Resources', href: '/faculty/resources', icon: BookOpen },
      ],
    },
    {
      groupTitle: 'PLACEMENTS',
      items: [
        { title: 'Placements', href: '/faculty/placements', icon: Briefcase },
        { title: 'Announcements', href: '/faculty/announcements', icon: Bell },
      ],
    },
    {
      groupTitle: 'COMMUNITY',
      items: [
        { title: 'Community', href: '/faculty/community', icon: MessageSquare },
      ],
    },
    {
      groupTitle: 'ACCOUNT',
      items: [
        { title: 'Notifications', href: '/faculty/notifications', icon: Bell },
        { title: 'Profile', href: '/profile', icon: User },
      ],
    },
  ],

  placement_officer: [
    {
      items: [
        { title: 'Home', href: '/placement', icon: Home, exact: true },
      ],
    },
    {
      groupTitle: 'Recruitment Ops',
      items: [
        { title: 'Companies', href: '/placement/companies', icon: Building },
        { title: 'Placement Drives', href: '/placement/drives', icon: Briefcase },
        { title: 'Students', href: '/placement/students', icon: Users },
        { title: 'Applications', href: '/placement/applications', icon: Layers },
        { title: 'Shortlisting', href: '/placement/shortlisting', icon: ListFilter },
        { title: 'Schedule', href: '/placement/schedule', icon: Calendar },
      ],
    },
    {
      groupTitle: 'Institutional',
      items: [
        { title: 'Announcements', href: '/placement/announcements', icon: Bell },
        { title: 'Analytics', href: '/placement/analytics', icon: BarChart3 },
        { title: 'Profile', href: '/profile', icon: User },
      ],
    },
  ],

  administrator: [
    {
      items: [
        { title: 'Home', href: '/admin', icon: Home, exact: true },
      ],
    },
    {
      groupTitle: 'Directory & Ops',
      items: [
        { title: 'Users', href: '/admin/users', icon: Users },
        { title: 'Companies', href: '/admin/companies', icon: Building },
        { title: 'Placements', href: '/admin/placements', icon: Briefcase },
      ],
    },
    {
      groupTitle: 'Governance',
      items: [
        { title: 'Community Moderation', href: '/admin/moderation', icon: MessageSquare },
        { title: 'Help Center', href: '/admin/help', icon: HelpCircle },
        { title: 'System Settings', href: '/admin/settings', icon: Settings },
        { title: 'Profile', href: '/profile', icon: User },
      ],
    },
  ],
};
