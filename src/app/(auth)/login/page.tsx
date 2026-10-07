'use client';

import { Suspense, useActionState, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { GraduationCap, LogIn, Lock, Mail, KeyRound, ArrowLeft } from 'lucide-react';
import { signInAction, forgotPasswordAction } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const unauthorized = searchParams.get('unauthorized');

  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Sign In Form Action
  const [signInState, signInFormAction, isSignInPending] = useActionState(signInAction, {
    success: false,
    error: undefined,
  });

  // Forgot Password Form Action
  const [resetState, resetFormAction, isResetPending] = useActionState(forgotPasswordAction, {
    success: false,
    error: undefined,
  });

  return (
    <div className="w-full max-w-sm border border-[#222222] bg-[#0A0A0A] rounded-md p-6 space-y-5">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-[#EDEDED] tracking-tight">
          {isForgotPassword ? 'Reset Password' : 'Institutional Sign In'}
        </h2>
        <p className="text-sm text-[#9AA1AA]">
          {isForgotPassword
            ? 'Enter your institutional email to receive a secure password reset link.'
            : redirectPath
            ? 'Authentication required to access requested portal resource.'
            : 'Enter credentials to access your designated institutional portal.'}
        </p>
      </div>

      {unauthorized && (
        <Alert variant="destructive" title="Access Intercepted">
          Your account role is not authorized to access that portal. Please sign in with appropriate credentials.
        </Alert>
      )}

      {/* Normal Sign In View */}
      {!isForgotPassword ? (
        <>
          {signInState?.error && (
            <Alert variant="destructive" title="Authentication Failed">
              {signInState.error}
            </Alert>
          )}

          <form action={signInFormAction} className="space-y-4">
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
                  placeholder="name@university.edu"
                  className="pl-8 text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-xs text-[#FF6B00] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9AA1AA]" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="pl-8 text-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full text-sm font-semibold gap-2 mt-2"
              isLoading={isSignInPending}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Button>
          </form>

          <div className="pt-2 text-center text-sm text-[#9AA1AA] border-t border-[#222222]">
            Need a student or faculty account?{' '}
            <Link href="/signup" className="text-[#FF6B00] hover:underline font-medium">
              Sign Up
            </Link>
          </div>
        </>
      ) : (
        /* Forgot Password View */
        <>
          {resetState?.error && (
            <Alert
              variant={resetState.success ? 'success' : 'destructive'}
              title={resetState.success ? 'Reset Link Dispatched' : 'Request Error'}
            >
              {resetState.error}
            </Alert>
          )}

          <form action={resetFormAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reset-email">Institutional Email</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9AA1AA]" />
                <Input
                  id="reset-email"
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
              isLoading={isResetPending}
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Send Reset Link</span>
            </Button>
          </form>

          <div className="pt-2 text-center text-sm text-[#9AA1AA] border-t border-[#222222]">
            <button
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="inline-flex items-center gap-1.5 text-xs text-[#EDEDED] hover:text-[#FF6B00] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>
        </>
      )}
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
            Loading institutional portal...
          </div>
        }
      >
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
