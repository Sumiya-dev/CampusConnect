'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { GraduationCap, Mail, KeyRound, ArrowLeft } from 'lucide-react';
import { forgotPasswordAction } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, {
    success: false,
    error: undefined,
  });

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

      <div className="w-full max-w-sm border border-[#222222] bg-[#0A0A0A] rounded-md p-6 space-y-5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-[#EDEDED] tracking-tight">
            Reset Password
          </h2>
          <p className="text-sm text-[#9AA1AA]">
            Enter your institutional email to receive a secure password reset link.
          </p>
        </div>

        {state?.error && (
          <Alert
            variant={state.success ? 'success' : 'destructive'}
            title={state.success ? 'Reset Link Dispatched' : 'Request Error'}
          >
            {state.error}
          </Alert>
        )}

        <form action={formAction} className="space-y-4">
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
                placeholder="name@university.edu"
                className="pl-8 text-sm"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full text-sm font-semibold gap-2 mt-2"
            isLoading={isPending}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Send Reset Link</span>
          </Button>
        </form>

        <div className="pt-2 text-center text-sm text-[#9AA1AA] border-t border-[#222222]">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-[#EDEDED] hover:text-[#FF6B00] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
