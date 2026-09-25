'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { UserRole } from '@/lib/types/database.types';

interface AppShellProps {
  role: UserRole;
  userName: string;
  userEmail: string;
  department: string;
  children: React.ReactNode;
}

export function AppShell({
  role,
  userName,
  userEmail,
  department,
  children,
}: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#000000]">
      {/* Persistent Sidebar (responsive mobile drawer) */}
      <Sidebar
        role={role}
        userName={userName}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Persistent Header */}
        <Header
          role={role}
          userName={userName}
          userEmail={userEmail}
          department={department}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
