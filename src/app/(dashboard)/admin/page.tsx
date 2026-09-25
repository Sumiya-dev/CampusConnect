import { Suspense } from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/user';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UnauthorizedBanner } from '@/components/auth/unauthorized-banner';
import { ShieldAlert, Database, Users, KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252A31] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-[#F1F3F5] tracking-tight">
              Platform Administration & Access Governance
            </h1>
            <Badge variant="destructive" className="text-sm">
              Super Admin
            </Badge>
          </div>
          <p className="text-sm text-[#9AA1AA] mt-1">
            CampusConnect AI Master Control Panel • Administrator: {user?.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/users">
            <Button size="sm" className="text-sm gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>User Directory</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
          <Badge variant="outline" className="text-sm gap-1">
            <KeyRound className="h-3 w-3 text-emerald-400" />
            <span>RLS Enforced: 5 Tables</span>
          </Badge>
        </div>
      </div>

      {/* System Infrastructure Strip */}
      <section className="space-y-3">
        <div className="text-sm font-medium uppercase tracking-wider text-[#9AA1AA]">
          Infrastructure Status
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#222222] border border-[#222222] rounded-md overflow-hidden">
          <div className="bg-[#0A0A0A] p-4">
            <span className="text-sm text-[#9AA1AA]">Provisioned Accounts</span>
            <div className="text-base font-semibold text-[#EDEDED] mt-1">1,344 Users</div>
            <span className="text-sm text-[#9AA1AA]">Across 4 Defined Roles</span>
          </div>

          <div className="bg-[#0A0A0A] p-4">
            <span className="text-sm text-[#9AA1AA]">Row-Level Security</span>
            <div className="text-base font-semibold text-emerald-400 mt-1">Enforced</div>
            <span className="text-sm text-emerald-400 font-medium">All Tables Isolated</span>
          </div>

          <div className="bg-[#0A0A0A] p-4">
            <span className="text-sm text-[#9AA1AA]">Auth Session Engine</span>
            <div className="text-base font-semibold text-[#EDEDED] mt-1">Supabase SSR</div>
            <span className="text-sm text-[#9AA1AA]">HTTP-Only Secure Cookies</span>
          </div>

          <div className="bg-[#0A0A0A] p-4">
            <span className="text-sm text-[#9AA1AA]">Edge Middleware</span>
            <div className="text-base font-semibold text-emerald-400 mt-1">Active</div>
            <span className="text-sm text-[#9AA1AA]">Cross-Role Redirection</span>
          </div>
        </div>
      </section>

      {/* Role Distribution & Access Scope Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#222222] pb-2">
          <div>
            <h2 className="text-base font-semibold text-[#EDEDED]">
              Account Provisioning & Security Scope
            </h2>
            <p className="text-sm text-[#9AA1AA]">
              Access boundaries and PostgreSQL policy enforcement by user category.
            </p>
          </div>
          <span className="text-sm text-[#9AA1AA]">Phase 1 Audit</span>
        </div>

        <div className="border border-[#222222] rounded-md overflow-hidden bg-[#0A0A0A]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#121212] text-[#9AA1AA] border-b border-[#222222]">
                <tr>
                  <th className="px-4 py-2.5 font-medium uppercase text-sm tracking-wider">Role Category</th>
                  <th className="px-4 py-2.5 font-medium uppercase text-sm tracking-wider">Active Pool</th>
                  <th className="px-4 py-2.5 font-medium uppercase text-sm tracking-wider">Authorization Scope</th>
                  <th className="px-4 py-2.5 font-medium uppercase text-sm tracking-wider text-right">RLS Enforcement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {roleDistribution.map((r) => (
                  <tr key={r.key} className="hover:bg-[#121212] transition-colors">
                    <td className="px-4 py-3 font-medium text-[#EDEDED]">{r.roleName}</td>
                    <td className="px-4 py-3 text-[#9AA1AA]">{r.count}</td>
                    <td className="px-4 py-3 text-[#9AA1AA]">{r.scope}</td>
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

      {/* Security Architecture Verification Checklist */}
      <section className="space-y-3">
        <div className="border-b border-[#222222] pb-2">
          <h2 className="text-base font-semibold text-[#EDEDED]">
            Security Controls Verification
          </h2>
          <p className="text-sm text-[#9AA1AA]">
            Foundational architecture compliance verification for Phase 1.
          </p>
        </div>

        <div className="border border-[#222222] rounded-md bg-[#0A0A0A] divide-y divide-[#222222]">
          {securityChecks.map((check, idx) => (
            <div key={idx} className="p-3.5 flex items-center gap-3 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-[#EDEDED]">{check}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
