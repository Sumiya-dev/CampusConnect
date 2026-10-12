import { Suspense } from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/user';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UnauthorizedBanner } from '@/components/auth/unauthorized-banner';
import { ShieldAlert, Database, Users, KeyRound, CheckCircle2, ArrowRight, GraduationCap, Briefcase, UserCheck, Bell, HelpCircle, BarChart3, Settings, Building, MessageSquare } from 'lucide-react';

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  const roleDistribution = [
    {
      roleName: 'Student Candidates',
      key: 'student',
      count: '1,240 Accounts',
      scope: 'Personal Records & Application Pipeline',
      rlsStatus: 'Self-Only Read/Update',
    },
    {
      roleName: 'Faculty Advisors',
      key: 'faculty',
      count: '86 Accounts',
      scope: 'Department Cohort Records',
      rlsStatus: 'Departmental Isolation',
    },
    {
      roleName: 'Placement Officers',
      key: 'placement_officer',
      count: '14 Accounts',
      scope: 'University-Wide Corporate Operations',
      rlsStatus: 'Supervisory Read/Write',
    },
    {
      roleName: 'System Administrators',
      key: 'administrator',
      count: '4 Accounts',
      scope: 'Complete Schema & Governance',
      rlsStatus: 'Full Control Policy',
    },
  ];

  const securityChecks = [
    'Next.js App Router with TypeScript strict mode enabled',
    'PostgreSQL schema with 5 primary tables, strict foreign keys, and cascading deletes',
    'Edge Middleware route protection with cross-role redirection active',
    'Supabase Service Role Key strictly isolated from client-side bundle',
    'Automated trigger on auth.users for profile and role provisioning verified',
    'Private storage bucket configured for student resume archives',
  ];

  return (
    <div className="space-y-8">
      <Suspense fallback={null}>
        <UnauthorizedBanner />
      </Suspense>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              Platform Administration & Access Governance
            </h1>
            <Badge variant="destructive" className="text-sm">
              Super Admin
            </Badge>
          </div>
          <p className="text-sm text-muted mt-1">
            CampusConnect AI Master Control Panel • Administrator: {user?.name}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-sm gap-1">
            <KeyRound className="h-3 w-3 text-emerald-400" />
            <span>RLS Enforced: 5 Tables</span>
          </Badge>
        </div>
      </div>

      {/* System Infrastructure Strip */}
      <section className="space-y-3">
        <div className="text-sm font-medium uppercase tracking-wider text-muted">
          Infrastructure Status
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border rounded-md overflow-hidden">
          <div className="bg-surface p-4">
            <span className="text-sm text-muted">Provisioned Accounts</span>
            <div className="text-base font-semibold text-foreground mt-1">1,344 Users</div>
            <span className="text-sm text-muted">Across 4 Defined Roles</span>
          </div>

          <div className="bg-surface p-4">
            <span className="text-sm text-muted">Row-Level Security</span>
            <div className="text-base font-semibold text-emerald-400 mt-1">Enforced</div>
            <span className="text-sm text-emerald-400 font-medium">All Tables Isolated</span>
          </div>

          <div className="bg-surface p-4">
            <span className="text-sm text-muted">Auth Session Engine</span>
            <div className="text-base font-semibold text-foreground mt-1">Supabase SSR</div>
            <span className="text-sm text-muted">HTTP-Only Secure Cookies</span>
          </div>

          <div className="bg-surface p-4">
            <span className="text-sm text-muted">Edge Middleware</span>
            <div className="text-base font-semibold text-emerald-400 mt-1">Active</div>
            <span className="text-sm text-muted">Cross-Role Redirection</span>
          </div>
        </div>
      </section>

      {/* Role Distribution & Access Scope Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Account Provisioning & Security Scope
            </h2>
            <p className="text-sm text-muted">
              Access boundaries and PostgreSQL policy enforcement by user category.
            </p>
          </div>
          <span className="text-sm text-muted">Phase 1 Audit</span>
        </div>

        <div className="border border-border rounded-md overflow-hidden bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-elevated text-muted border-b border-border">
                <tr>
                  <th className="px-4 py-2.5 font-medium uppercase text-sm tracking-wider">Role Category</th>
                  <th className="px-4 py-2.5 font-medium uppercase text-sm tracking-wider">Active Pool</th>
                  <th className="px-4 py-2.5 font-medium uppercase text-sm tracking-wider">Authorization Scope</th>
                  <th className="px-4 py-2.5 font-medium uppercase text-sm tracking-wider text-right">RLS Enforcement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {roleDistribution.map((r) => (
                  <tr key={r.key} className="hover:bg-elevated transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{r.roleName}</td>
                    <td className="px-4 py-3 text-muted">{r.count}</td>
                    <td className="px-4 py-3 text-muted">{r.scope}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="outline" className="text-sm">
                        {r.rlsStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
}
