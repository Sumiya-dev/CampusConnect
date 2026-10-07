'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, MessageSquare, BookOpen, Send } from 'lucide-react';

interface AlumniNavigationProps {
  baseHref?: string;
  isStudentOrAlumni?: boolean;
}

export function AlumniNavigation({
  baseHref = '/student/alumni',
  isStudentOrAlumni = true,
}: AlumniNavigationProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Alumni Directory',
      href: baseHref,
      icon: Users,
      exact: true,
    },
    ...(isStudentOrAlumni
      ? [
          {
            label: 'Alumni Community',
            href: `${baseHref}/community`,
            icon: MessageSquare,
            exact: false,
          },
        ]
      : []),
    {
      label: 'Experiences',
      href: `${baseHref}/experiences`,
      icon: BookOpen,
      exact: false,
    },
    {
      label: 'Guidance Requests',
      href: `${baseHref}/guidance`,
      icon: Send,
      exact: false,
    },
  ];

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <div className="flex items-center gap-1.5 p-1 bg-[#0A0A0A] border border-[#222222] rounded-md overflow-x-auto scrollbar-none w-full sm:w-auto">
      {navItems.map((item) => {
        const active = isActive(item);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded whitespace-nowrap transition-colors ${
              active
                ? 'bg-[#161616] text-[#FF6B00] border border-[#FF6B00]/30 shadow-sm'
                : 'text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#121212]'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
