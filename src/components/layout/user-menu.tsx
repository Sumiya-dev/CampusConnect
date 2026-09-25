'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { signOutAction } from '@/lib/auth/actions';
import { ROLE_LABELS } from '@/lib/types/auth.types';
import { UserRole } from '@/lib/types/database.types';
import { Badge } from '../ui/badge';

interface UserMenuProps {
  name: string;
  email: string;
  role: UserRole;
  department?: string;
}

export function UserMenu({ name, email, role, department }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-[#171B20] border border-transparent hover:border-[#252A31] transition-colors text-left focus:outline-none cursor-pointer"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded border border-[#252A31] bg-[#171B20] text-[#F1F3F5] text-sm font-medium">
          {initials || 'U'}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-[#F1F3F5] leading-tight">
            {name}
          </div>
          <div className="text-sm text-[#9AA1AA] truncate max-w-[120px]">
            {ROLE_LABELS[role]}
          </div>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-[#9AA1AA] hidden sm:block" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1.5 w-60 rounded-md border border-[#252A31] bg-[#171B20] p-1.5 z-50 animate-in fade-in duration-100 shadow-none">
            {/* Header */}
            <div className="px-3 py-2 border-b border-[#252A31] space-y-1">
              <p className="font-medium text-[#F1F3F5] text-sm truncate">{name}</p>
              <p className="text-sm text-[#9AA1AA] truncate">{email}</p>
              <div className="pt-1 flex items-center justify-between gap-1">
                <Badge variant="secondary" className="text-sm">
                  {ROLE_LABELS[role]}
                </Badge>
                {department && (
                  <span className="text-sm text-[#9AA1AA] truncate max-w-[110px]">
                    {department}
                  </span>
                )}
              </div>
            </div>

            {/* Menu options */}
            <div className="py-1">
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-1.5 text-sm text-[#9AA1AA] hover:text-[#F1F3F5] hover:bg-[#20252C] rounded transition-colors"
              >
                <UserIcon className="h-3.5 w-3.5" />
                <span>My Profile</span>
              </Link>
            </div>

            {/* Logout button */}
            <div className="border-t border-[#252A31] pt-1">
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-[#20252C] rounded transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
