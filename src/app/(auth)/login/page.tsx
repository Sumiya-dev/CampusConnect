'use client';

import { Suspense, useActionState, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { GraduationCap, LogIn, Lock, Mail, KeyRound, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { signInAction, forgotPasswordAction, switchDemoRoleAction } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const unauthorized = searchParams.get('unauthorized');

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="w-full max-w-sm border border-border bg-surface rounded-md p-6 space-y-5">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground tracking-tight">
          {isForgotPassword ? 'Reset Password' : 'Institutional Sign In'}
        </h2>
        <p className="text-sm text-muted">
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
                <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
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
                  className="text-xs text-accent hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="pl-8 pr-9 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-muted hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
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

          <div className="pt-2 text-center text-sm text-muted border-t border-border">
            Need a student or faculty account?{' '}
            <Link href="/signup" className="text-accent hover:underline font-medium">
              Sign Up
            </Link>
          </div>

          {/* Localhost Demo Switcher */}
          <div className="pt-4 mt-2 border-t border-border">
            <p className="text-xs text-center text-[#6E7681] uppercase font-semibold mb-3 tracking-wider">
              Demo Quick Login
            </p>
            <div className="grid grid-cols-2 gap-2">
              <form action={switchDemoRoleAction.bind(null, 'student')}>
                <Button type="submit" variant="outline" className="w-full text-xs h-8 border-border bg-elevated hover:bg-[#20252C] text-muted hover:text-foreground">Student</Button>
              </form>
              <form action={switchDemoRoleAction.bind(null, 'faculty')}>
                <Button type="submit" variant="outline" className="w-full text-xs h-8 border-border bg-elevated hover:bg-[#20252C] text-muted hover:text-foreground">Faculty</Button>
              </form>
              <form action={switchDemoRoleAction.bind(null, 'placement_officer')}>
                <Button type="submit" variant="outline" className="w-full text-xs h-8 border-border bg-elevated hover:bg-[#20252C] text-muted hover:text-foreground">Placement Officer</Button>
              </form>
              <form action={switchDemoRoleAction.bind(null, 'administrator')}>
                <Button type="submit" variant="outline" className="w-full text-xs h-8 border-border bg-elevated hover:bg-[#20252C] text-muted hover:text-foreground">Admin</Button>
              </form>
            </div>
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
                <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
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

          <div className="pt-2 text-center text-sm text-muted border-t border-border">
            <button
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="inline-flex items-center gap-1.5 text-xs text-foreground hover:text-accent transition-colors"
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
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 py-12">
      {/* Brand Header */}
      <div className="mb-6 text-center space-y-1">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-border bg-elevated text-accent">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="text-base font-semibold tracking-tight text-foreground">
            CampusConnect <span className="text-accent">AI</span>
          </span>
        </Link>
        <p className="text-sm text-muted">University Placement Platform</p>
      </div>

      <Suspense
        fallback={
          <div className="w-full max-w-sm border border-border bg-surface rounded-md p-6 text-center text-sm text-muted">
            Loading institutional portal...
          </div>
        }
      >
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
