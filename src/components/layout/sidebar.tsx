'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAVIGATION_BY_ROLE } from './sidebar-data';
import { UserRole } from '@/lib/types/database.types';
import { ROLE_LABELS } from '@/lib/types/auth.types';
import { signOutAction } from '@/lib/auth/actions';
import { cn } from '@/lib/utils';
import { GraduationCap, LogOut, X } from 'lucide-react';

interface SidebarProps {
  role: UserRole;
  userName: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ role, userName, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const navGroups = NAVIGATION_BY_ROLE[role] || [];

  const checkIsActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'w-60 border-r border-[#222222] bg-[#000000] flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none z-50 transition-transform duration-200 ease-in-out md:translate-x-0',
          isOpen ? 'fixed inset-y-0 left-0 translate-x-0' : 'hidden md:flex'
        )}
      >
        {/* Brand & Role Header */}
        <div>
          <div className="h-14 px-4 border-b border-[#222222] flex items-center justify-between">
            <Link href={`/${role === 'placement_officer' ? 'placement' : role}`} className="flex items-center gap-2.5 min-w-0" onClick={onClose}>
              <div className="flex h-7 w-7 items-center justify-center rounded border border-[#222222] bg-[#0A0A0A] text-[#FF6B00] shrink-0">
                <GraduationCap className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm tracking-tight text-[#EDEDED] truncate">
                  CampusConnect <span className="text-[#FF6B00]">AI</span>
                </div>
                <div className="text-sm text-[#9AA1AA] tracking-wider uppercase font-medium truncate">
                  {ROLE_LABELS[role]}
                </div>
              </div>
            </Link>

            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden text-[#9AA1AA] hover:text-[#EDEDED] p-1"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Navigation Groups */}
          <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                {group.groupTitle && (
                  <div className="px-2.5 py-1 text-sm font-semibold uppercase tracking-wider text-[#9AA1AA]/60">
                    {group.groupTitle}
                  </div>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = checkIsActive(item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors duration-150',
                        isActive
                          ? 'text-[#FF6B00] bg-[#121212] border-l-2 border-l-[#FF6B00]'
                          : 'text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#0A0A0A]'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={cn(
                            'h-3.5 w-3.5 shrink-0 transition-colors',
                            isActive ? 'text-[#FF6B00]' : 'text-[#9AA1AA]'
                          )}
                        />
                        <span className="truncate">{item.title}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={cn(
                            'text-[9px] px-1.5 py-0.2 rounded font-semibold border',
                            isActive
                              ? 'bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/25'
                              : 'bg-[#121212] text-[#9AA1AA] border-[#222222]'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#222222] space-y-2">
          <div className="px-2.5 py-2 bg-[#0A0A0A] rounded border border-[#222222] text-sm">
            <div className="text-[#9AA1AA] text-sm uppercase font-medium tracking-wider">
              Signed in as
            </div>
            <div className="text-[#EDEDED] font-medium mt-0.5 truncate">
              {userName}
            </div>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-sm font-medium text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#121212] rounded-md transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
