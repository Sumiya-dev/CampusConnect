import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth/user';
import { TopicMaterialsList } from '@/components/preparation/topic-materials-list';
import { getPreparationMaterials } from '@/lib/preparation/queries';
import { getCompanies } from '@/lib/companies/queries';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    companyId: string;
  }>;
  searchParams: Promise<{
    role?: string;
  }>;
}

export default async function CompanyMaterialsPage({
  params,
  searchParams,
}: PageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') {
    redirect('/login?unauthorized=true');
  }

  const { companyId } = await params;
  const { role } = await searchParams;

  const allCompanies = await getCompanies();
  const company = allCompanies.find((c) => c.id === companyId);

  const allMaterials = await getPreparationMaterials({}, user.id);
  const companyMaterials = allMaterials.filter((m) => m.company_id === companyId);

  if (!company && companyMaterials.length === 0) {
    notFound();
  }

  const companyName = company?.company_name || companyMaterials[0]?.company?.company_name || 'Company';

  // Extract unique job roles for this company
  const availableRoles = Array.from(
    new Set(
      companyMaterials
        .map((m) => m.job_role)
        .filter((r): r is string => !!r && r.trim() !== '')
    )
  );

  const filteredMaterials = role
    ? companyMaterials.filter(
        (m) => m.job_role?.toLowerCase() === role.toLowerCase()
      )
    : companyMaterials;

  const breadcrumbs: { label: string; href?: string }[] = [
    { label: 'Preparation', href: '/student/preparation' },
    { label: 'Company-Specific', href: '/student/preparation/company-specific' },
  ];

  if (role) {
    breadcrumbs.push({
      label: companyName,
      href: `/student/preparation/company-specific/${companyId}`,
    });
    breadcrumbs.push({ label: role });
  } else {
    breadcrumbs.push({ label: companyName });
  }

  return (
    <PageContainer
      title={`${companyName} Preparation`}
      breadcrumbs={breadcrumbs}
      actions={
        role ? (
          <Link href={`/student/preparation/company-specific/${companyId}`}>
            <Button
              variant="outline"
              size="sm"
              className="text-sm gap-1 border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>All {companyName} Roles</span>
            </Button>
          </Link>
        ) : (
          <Link href="/student/preparation/company-specific">
            <Button
              variant="outline"
              size="sm"
              className="text-sm gap-1 border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>All Companies</span>
            </Button>
          </Link>
        )
      }
    >
      <div className="max-w-3xl space-y-6">
        {/* If multiple job roles, show clean role filter */}
        {availableRoles.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm">
            <Link
              href={`/student/preparation/company-specific/${companyId}`}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                !role
                  ? 'text-[#FF6B00] bg-[#FF6B00]/10 border border-[#FF6B00]/30 font-medium'
                  : 'text-[#9AA1AA] hover:text-[#EDEDED] border border-[#222222]'
              }`}
            >
              All Roles ({companyMaterials.length})
            </Link>
            {availableRoles.map((r) => {
              const isSelected = role?.toLowerCase() === r.toLowerCase();
              const count = companyMaterials.filter((m) => m.job_role === r).length;
              return (
                <Link
                  key={r}
                  href={`/student/preparation/company-specific/${companyId}?role=${encodeURIComponent(
                    r
                  )}`}
                  className={`px-3 py-1 rounded text-sm transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'text-[#FF6B00] bg-[#FF6B00]/10 border border-[#FF6B00]/30 font-medium'
                      : 'text-[#9AA1AA] hover:text-[#EDEDED] border border-[#222222]'
                  }`}
                >
                  {r} ({count})
                </Link>
              );
            })}
          </div>
        )}

        <TopicMaterialsList
          materials={filteredMaterials}
          emptyMessage={`No preparation materials published yet for this role.`}
        />
      </div>
    </PageContainer>
  );
}
