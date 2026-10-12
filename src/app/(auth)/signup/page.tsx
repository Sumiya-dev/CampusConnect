'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  UserPlus,
  Lock,
  Mail,
  User,
  Hash,
  Eye,
  EyeOff,
} from 'lucide-react';
import { signUpAction, switchDemoRoleAction } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';

export const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Management Studies',
  'Training & Placement Directorate',
  'Central Administration',
];

export const ACADEMIC_YEARS = [
  { value: '1', label: '1st Year (Freshman)' },
  { value: '2', label: '2nd Year (Sophomore)' },
  { value: '3', label: '3rd Year (Junior)' },
  { value: '4', label: '4th Year (Senior)' },
];

export const SECTIONS = ['A', 'B', 'C', 'D'];

type SignupRole = 'student' | 'faculty' | 'placement_officer' | 'administrator';

interface RoleOption {
  id: SignupRole;
  label: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  { id: 'student', label: 'Student' },
  { id: 'faculty', label: 'Faculty' },
  { id: 'placement_officer', label: 'Placement Officer' },
  { id: 'administrator', label: 'Admin / Superadmin' },
];

export default function SignUpPage() {
  const [selectedRole, setSelectedRole] = useState<SignupRole>('student');
  const [clientError, setClientError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [state, formAction, isPending] = useActionState(signUpAction, {
    success: false,
    error: undefined,
  });

  const handleSubmit = (formData: FormData) => {
    setClientError(null);

    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setClientError('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (password.length < 6) {
      setClientError('Password must be at least 6 characters long.');
      return;
    }

    formAction(formData);
  };

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
        <p className="text-sm text-muted">Institutional Access Platform</p>
      </div>

      <div className="w-full max-w-lg border border-border bg-surface rounded-md p-6 space-y-5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground tracking-tight">
            Account Registration
          </h2>
          <p className="text-sm text-muted">
            Select your institutional role to create your verified portal profile.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="space-y-1.5">
          <Label>Select Institutional Role</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-background border border-border rounded-md">
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setSelectedRole(r.id);
                  setClientError(null);
                }}
                className={`py-1.5 px-2 text-xs sm:text-sm font-medium rounded transition-colors text-center truncate ${
                  selectedRole === r.id
                    ? 'bg-elevated text-accent border border-accent/40'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status / Error Alerts */}
        {(clientError || state?.error) && (
          <Alert
            variant={state?.success ? 'success' : 'destructive'}
            title={state?.success ? 'Registration Successful' : 'Registration Error'}
          >
            {clientError || state?.error}
          </Alert>
        )}

        {/* Role 1: Student Registration Form */}
        {selectedRole === 'student' && (
          <form action={handleSubmit} className="space-y-3.5">
            <input type="hidden" name="role" value="student" />

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  className="pl-8 text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Institutional Email</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="student@university.edu"
                  className="pl-8 text-sm"
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
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

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Re-enter password"
                    className="pl-8 pr-9 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-2.5 text-muted hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Roll Number & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="identifier">Student / Roll Number</Label>
                <div className="relative">
                  <Hash className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
                  <Input
                    id="identifier"
                    name="identifier"
                    type="text"
                    required
                    placeholder="e.g. 2026-CS-042"
                    className="pl-8 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="department">Department</Label>
                <div className="relative">
                  <Select id="department" name="department" defaultValue={DEPARTMENTS[0]} className="text-sm">
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept} className="bg-surface text-foreground">
                        {dept}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            {/* Academic Year & Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="academicYear">Academic Year</Label>
                <div className="relative">
                  <Select id="academicYear" name="academicYear" defaultValue="3" className="text-sm">
                    {ACADEMIC_YEARS.map((yr) => (
                      <option key={yr.value} value={yr.value} className="bg-surface text-foreground">
                        {yr.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="section">Section</Label>
                <div className="relative">
                  <Select id="section" name="section" defaultValue="A" className="text-sm">
                    {SECTIONS.map((sec) => (
                      <option key={sec} value={sec} className="bg-surface text-foreground">
                        Section {sec}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full text-sm font-semibold gap-2 mt-2"
              isLoading={isPending}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Register as Student</span>
            </Button>
          </form>
        )}

        {/* Role 2: Faculty Registration Form */}
        {selectedRole === 'faculty' && (
          <form action={handleSubmit} className="space-y-3.5">
            <input type="hidden" name="role" value="faculty" />

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Dr. Priya Raman"
                  className="pl-8 text-sm"
                />
              </div>
            </div>

            {/* Official Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Official Email</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="faculty@university.edu"
                  className="pl-8 text-sm"
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    className="pl-8 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Re-enter password"
                    className="pl-8 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Faculty ID & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="identifier">Faculty ID</Label>
                <div className="relative">
                  <Hash className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
                  <Input
                    id="identifier"
                    name="identifier"
                    type="text"
                    required
                    placeholder="e.g. FAC-2026-001"
                    className="pl-8 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="department">Department</Label>
                <div className="relative">
                  <Select id="department" name="department" defaultValue={DEPARTMENTS[0]} className="text-sm">
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept} className="bg-surface text-foreground">
                        {dept}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full text-sm font-semibold gap-2 mt-2"
              isLoading={isPending}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Register as Faculty</span>
            </Button>
          </form>
        )}

        {/* Role 3: Placement Officer Registration Form */}
        {selectedRole === 'placement_officer' && (
          <form action={handleSubmit} className="space-y-3.5">
            <input type="hidden" name="role" value="placement_officer" />

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Vikram Verma"
                  className="pl-8 text-sm"
                />
              </div>
            </div>

            {/* Official Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Official Email</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="placement@university.edu"
                  className="pl-8 text-sm"
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    className="pl-8 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Re-enter password"
                    className="pl-8 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Placement Officer ID & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="identifier">Placement Officer ID</Label>
                <div className="relative">
                  <Hash className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
                  <Input
                    id="identifier"
                    name="identifier"
                    type="text"
                    required
                    placeholder="e.g. TPO-2026-001"
                    className="pl-8 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="department">Department</Label>
                <div className="relative">
                  <Select
                    id="department"
                    name="department"
                    defaultValue="Training & Placement Directorate"
                    className="text-sm"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept} className="bg-surface text-foreground">
                        {dept}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full text-sm font-semibold gap-2 mt-2"
              isLoading={isPending}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Register as Placement Officer</span>
            </Button>
          </form>
        )}

        {/* Role 4: Administrator Registration Form */}
        {selectedRole === 'administrator' && (
          <form action={handleSubmit} className="space-y-3.5">
            <input type="hidden" name="role" value="administrator" />

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Dr. Vikram Singhania"
                  className="pl-8 text-sm"
                />
              </div>
            </div>

            {/* Official Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Administrator Email</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="admin@university.edu"
                  className="pl-8 text-sm"
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    className="pl-8 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Re-enter password"
                    className="pl-8 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Administrator Code & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="identifier">Administrator Code</Label>
                <div className="relative">
                  <Hash className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
                  <Input
                    id="identifier"
                    name="identifier"
                    type="text"
                    required
                    placeholder="e.g. ADM-2026-001"
                    className="pl-8 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="department">Department / Office</Label>
                <div className="relative">
                  <Select
                    id="department"
                    name="department"
                    defaultValue="Central Administration"
                    className="text-sm"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept} className="bg-surface text-foreground">
                        {dept}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full text-sm font-semibold gap-2 mt-2"
              isLoading={isPending}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Register as Administrator</span>
            </Button>
          </form>
        )}

        {/* Footer Navigation */}
        <div className="pt-2 text-center text-sm text-muted border-t border-border">
          Already have an institutional account?{' '}
          <Link href="/login" className="text-accent hover:underline font-medium">
            Sign In
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
      </div>
    </div>
  );
}
