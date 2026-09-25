'use client';

import { Suspense, useActionState, useState, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { GraduationCap, LogIn, Lock, Mail } from 'lucide-react';
import { signInAction, switchDemoRoleAction } from '@/lib/auth/actions';
import { UserRole } from '@/lib/types/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  const [state, formAction, isPending] = useActionState(signInAction, {
    success: false,
    error: undefined,
  });

  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [isRoleSwitching, startRoleSwitch] = useTransition();

  const handleRoleQuickSwitch = (role: UserRole) => {
    startRoleSwitch(async () => {
      await switchDemoRoleAction(role);
    });
  };

  const roles: Array<{ id: UserRole; label: string }> = [
    { id: 'student', label: 'Student' },
    { id: 'faculty', label: 'Faculty' },
    { id: 'placement_officer', label: 'Placement' },
    { id: 'administrator', label: 'Admin' },
  ];

  return (
    <div className="w-full max-w-sm border border-[#222222] bg-[#0A0A0A] rounded-md p-6 space-y-5">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-[#EDEDED] tracking-tight">
          Institutional Sign In
        </h2>
        <p className="text-sm text-[#9AA1AA]">
          {redirectPath
            ? 'Authentication required to access requested resource.'
            : 'Enter institutional credentials to access your portal.'}
        </p>
      </div>

      {state?.error && (
        <Alert variant="destructive" title="Authentication Error">
          {state.error}
        </Alert>
      )}

      <form action={formAction} className="space-y-4">
        {/* Role Segmented Selector */}
        <div className="space-y-1.5">
          <Label htmlFor="role">Select Active Role</Label>
          <div className="grid grid-cols-4 gap-1 p-1 bg-[#000000] border border-[#222222] rounded-md">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRole(r.id)}
                className={`py-1 text-sm font-medium rounded transition-colors ${
                  selectedRole === r.id
                    ? 'bg-[#121212] text-[#FF6B00] border border-[#FF6B00]/30'
                    : 'text-[#9AA1AA] hover:text-[#EDEDED]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <input type="hidden" name="role" value={selectedRole} />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Institutional Email</Label>
          <div className="relative">
            <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9AA1AA]" />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder={`${selectedRole}@university.edu`}
              defaultValue={`${selectedRole}@university.edu`}
              className="pl-8 text-sm"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <span className="text-sm text-[#9AA1AA]">Default: ••••••••</span>
          </div>
          <div className="relative">
            <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9AA1AA]" />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              defaultValue="password123"
              className="pl-8 text-sm"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full text-sm font-semibold gap-2"
          isLoading={isPending}
        >
          <LogIn className="h-3.5 w-3.5" />
          <span>Sign In as {roles.find((r) => r.id === selectedRole)?.label}</span>
        </Button>
      </form>

      {/* 1-Click Role Switcher for Phase 1 Demo */}
      <div className="pt-3 border-t border-[#222222] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm uppercase font-semibold text-[#9AA1AA] tracking-wider">
            Quick Role Switcher
          </span>
          <span className="text-sm text-[#9AA1AA]">Phase 1 Evaluation</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {roles.map((r) => (
            <Button
              key={r.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleRoleQuickSwitch(r.id)}
              disabled={isRoleSwitching}
              className="text-sm justify-start px-2.5 py-1.5 h-9 font-normal"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] mr-1.5" />
              <span>As {r.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="pt-2 text-center text-sm text-[#9AA1AA] border-t border-[#222222]">
        Need a new profile?{' '}
        <Link href="/signup" className="text-[#FF6B00] hover:underline">
          Register account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-[#EDEDED] flex flex-col justify-center items-center px-4 py-12">
      {/* Brand Header */}
      <div className="mb-6 text-center space-y-1">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-[#222222] bg-[#121212] text-[#FF6B00]">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="text-base font-semibold tracking-tight text-[#EDEDED]">
            CampusConnect <span className="text-[#FF6B00]">AI</span>
          </span>
        </Link>
        <p className="text-sm text-[#9AA1AA]">University Placement Platform</p>
      </div>

      <Suspense
        fallback={
          <div className="w-full max-w-sm border border-[#222222] bg-[#0A0A0A] rounded-md p-6 text-center text-sm text-[#9AA1AA]">
            Loading authentication portal...
          </div>
        }
      >
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
