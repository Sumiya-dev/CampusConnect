'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, UserPlus, Lock, Mail, User, Phone, Hash } from 'lucide-react';
import { signUpAction } from '@/lib/auth/actions';
import { UserRole } from '@/lib/types/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Management Studies',
];

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(signUpAction, {
    success: false,
    error: undefined,
  });

  const [role, setRole] = useState<UserRole>('student');

  const roleOptions: Array<{ id: UserRole; label: string }> = [
    { id: 'student', label: 'Student' },
    { id: 'faculty', label: 'Faculty' },
    { id: 'placement_officer', label: 'Placement Officer' },
    { id: 'administrator', label: 'Administrator' },
  ];

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
        <p className="text-sm text-[#9AA1AA]">New Institutional Account</p>
      </div>

      <div className="w-full max-w-md border border-[#222222] bg-[#0A0A0A] rounded-md p-6 space-y-5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-[#EDEDED] tracking-tight">
            Account Registration
          </h2>
          <p className="text-sm text-[#9AA1AA]">
            Profiles are provisioned with database-level Row Level Security (RLS).
          </p>
        </div>

        {state?.error && (
          <Alert
            variant={state.success ? 'success' : 'destructive'}
            title={state.success ? 'Registration Successful' : 'Registration Error'}
          >
            {state.error}
          </Alert>
        )}

        <form action={formAction} className="space-y-3.5">
          {/* Role selector */}
          <div className="space-y-1.5">
            <Label htmlFor="role">Institutional Role</Label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#000000] border border-[#222222] rounded-md">
              {roleOptions.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`py-1 text-sm font-medium rounded transition-colors truncate px-1 ${
                    role === r.id
                      ? 'bg-[#121212] text-[#FF6B00] border border-[#FF6B00]/30'
                      : 'text-[#9AA1AA] hover:text-[#EDEDED]'
                  }`}
                >
                  {r.label.split(' ')[0]}
                </button>
              ))}
            </div>
            <input type="hidden" name="role" value={role} />
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9AA1AA]" />
              <Input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Dr. / Prof. / Student Name"
                className="pl-8 text-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9AA1AA]" />
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="name@university.edu"
                className="pl-8 text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9AA1AA]" />
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Min 6 characters"
                minLength={6}
                className="pl-8 text-sm"
              />
            </div>
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <Label htmlFor="department">Department</Label>
            <Select id="department" name="department" defaultValue={DEPARTMENTS[0]} className="text-sm">
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept} className="bg-[#0A0A0A] text-[#EDEDED]">
                  {dept}
                </option>
              ))}
            </Select>
          </div>

          {/* Identifier & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="identifier">
                {role === 'student' ? 'Roll Number' : 'Employee / Admin ID'}
              </Label>
              <div className="relative">
                <Hash className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9AA1AA]" />
                <Input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  placeholder={role === 'student' ? '2026-CS-042' : 'EMP-2026-01'}
                  className="pl-8 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactNumber">Contact Phone</Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9AA1AA]" />
                <Input
                  id="contactNumber"
                  name="contactNumber"
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="pl-8 text-sm"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full text-sm font-semibold gap-2 mt-2"
            isLoading={isPending}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Register Account</span>
          </Button>
        </form>

        <div className="pt-2 text-center text-sm text-[#9AA1AA] border-t border-[#222222]">
          Already have an institutional account?{' '}
          <Link href="/login" className="text-[#FF6B00] hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
