import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { getCurrentUser } from '@/lib/auth/user';
import {
  GraduationCap,
  Users,
  Briefcase,
  ShieldAlert,
  ArrowRight,
  Lock,
  Database,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function HomePage() {
  const userContext = await getCurrentUser();

  const portals = [
    {
      role: 'student',
      title: 'Student Portal',
      description:
        'Placement application pipeline, academic records, skill portfolio, and drive notifications.',
      icon: GraduationCap,
      href: '/student',
      scope: 'Individual Student Access',
    },
    {
      role: 'faculty',
      title: 'Faculty Portal',
      description:
        'Department-level student verification, academic standing oversight, and candidate endorsements.',
      icon: Users,
      href: '/faculty',
      scope: 'Departmental Scope',
    },
    {
      role: 'placement_officer',
      title: 'Placement Office',
      description:
        'University-wide corporate relationships, drive schedules, eligibility criteria, and offer audits.',
      icon: Briefcase,
      href: '/placement',
      scope: 'Institutional Directorate',
    },
    {
      role: 'administrator',
      title: 'System Administration',
      description:
        'Role-based access governance, account provisioning, audit logging, and database policy controls.',
      icon: ShieldAlert,
      href: '/admin',
      scope: 'Platform Administration',
    },
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-[#EDEDED] flex flex-col">
      <Navbar activeRole={userContext?.role} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16 space-y-16">
        {/* Header Section */}
        <section className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              Institutional Platform
            </Badge>
            <span className="text-sm text-[#9AA1AA]">• Academic Year 2025–2026</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#EDEDED] leading-tight">
            CampusConnect Placement Directorate
          </h1>

          <p className="text-base text-[#9AA1AA] leading-relaxed">
            Centralized infrastructure for university placement operations, academic standing verification, corporate recruitment coordination, and strict role-based access management.
          </p>

          <div className="flex items-center gap-3 pt-2">
            {userContext ? (
              <Link href={`/${userContext.role === 'placement_officer' ? 'placement' : userContext.role}`}>
                <Button className="gap-2">
                  <span>Enter Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button className="gap-2">
                    <span>Institutional Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="outline">
                    New Account Registration
                  </Button>
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Portals Section - Open List with 1px border dividers */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#222222] pb-3">
            <div>
              <h2 className="text-base font-semibold tracking-wide uppercase text-[#EDEDED]">
                Authorized Portals
              </h2>
              <p className="text-sm text-[#9AA1AA]">
                Select your designated role to enter the corresponding workspace.
              </p>
            </div>
            <span className="text-sm text-[#9AA1AA] hidden sm:inline">4 Defined Roles</span>
          </div>

          <div className="divide-y divide-[#222222] border-y border-[#222222]">
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <div
                  key={portal.role}
                  className="py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#0A0A0A] px-3 -mx-3 transition-colors rounded-sm"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-9 w-8 items-center justify-center rounded border border-[#222222] bg-[#121212] text-[#EDEDED] shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-[#EDEDED]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base font-medium text-[#EDEDED]">
                          {portal.title}
                        </h3>
                        <Badge variant="secondary" className="text-sm">
                          {portal.scope}
                        </Badge>
                      </div>
                      <p className="text-sm text-[#9AA1AA] mt-1 max-w-xl leading-relaxed">
                        {portal.description}
                      </p>
                    </div>
                  </div>

                  <div className="sm:shrink-0 pl-11 sm:pl-0">
                    <Link href={portal.href}>
                      <Button variant="outline" size="sm" className="gap-1.5 text-sm">
                        <span>Access</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* System Specifications - Clean Table / Two Column Layout */}
        <section className="space-y-4">
          <div className="border-b border-[#222222] pb-3">
            <h2 className="text-base font-semibold tracking-wide uppercase text-[#EDEDED]">
              Architecture & Security Controls
            </h2>
            <p className="text-sm text-[#9AA1AA]">
              Enforced at database and middleware layers to guarantee role separation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#222222] border border-[#222222] rounded-md overflow-hidden">
            <div className="bg-[#0A0A0A] p-5 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-[#EDEDED]">
                <Lock className="h-3.5 w-3.5 text-[#FF6B00]" />
                <span>Edge RBAC Route Enforcement</span>
              </div>
              <p className="text-sm text-[#9AA1AA] leading-relaxed">
                Next.js Edge middleware monitors every inbound navigation against role authorization mappings. Unauthenticated visitors are routed to authentication; cross-role navigation is intercepted and redirected.
              </p>
            </div>

            <div className="bg-[#0A0A0A] p-5 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-[#EDEDED]">
                <Database className="h-3.5 w-3.5 text-[#FF6B00]" />
                <span>PostgreSQL Row-Level Security</span>
              </div>
              <p className="text-sm text-[#9AA1AA] leading-relaxed">
                All database records are guarded by strict RLS policies. Students only access their personal record; faculty access departmental cohorts; placement officers operate university-wide.
              </p>
            </div>

            <div className="bg-[#0A0A0A] p-5 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-[#EDEDED]">
                <Check className="h-3.5 w-3.5 text-[#FF6B00]" />
                <span>Automated User Provisioning</span>
              </div>
              <p className="text-sm text-[#9AA1AA] leading-relaxed">
                Database triggers bind authenticated user records with role-specific profile extensions upon sign-up, ensuring continuous referential integrity.
              </p>
            </div>

            <div className="bg-[#0A0A0A] p-5 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-[#EDEDED]">
                <Check className="h-3.5 w-3.5 text-[#FF6B00]" />
                <span>Audited Institutional Storage</span>
              </div>
              <p className="text-sm text-[#9AA1AA] leading-relaxed">
                Restricted storage buckets configured for sensitive academic transcripts, candidate resumes, and verified identity documents.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-[#222222] py-6 px-4 sm:px-6 bg-[#000000] text-sm text-[#9AA1AA]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>CampusConnect AI • University Placement Directorate</div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-[#EDEDED] transition-colors">
              Sign In
            </Link>
            <span>•</span>
            <Link href="/signup" className="hover:text-[#EDEDED] transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
