import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { getCurrentUser } from '@/lib/auth/user';
import { getPreparationMaterials } from '@/lib/preparation/queries';
import { getCompanies } from '@/lib/companies/queries';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CompanySpecificSectionPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') {
    redirect('/login?unauthorized=true');
  }

  // 1. Fetch all materials that have a company
  const allMaterials = await getPreparationMaterials({}, user.id);
  const companyMaterials = allMaterials.filter((m) => !!m.company_id);

  // 2. Fetch companies from database/seed
  const allCompanies = await getCompanies();

  // 3. Filter companies with preparation materials
  const companyIdsWithMaterials = new Set(
    companyMaterials.map((m) => m.company_id as string)
  );

  const companiesWithContent = allCompanies.filter((c) =>
    companyIdsWithMaterials.has(c.id)
  );

  companyMaterials.forEach((m) => {
    if (m.company && !companiesWithContent.some((c) => c.id === m.company?.id)) {
      companiesWithContent.push(m.company);
    }
  });

  return (
    <PageContainer
      title="Company-Specific"
      description="Select a visiting recruiter to view company-specific materials."
      breadcrumbs={[
        { label: 'Preparation', href: '/student/preparation' },
        { label: 'Company-Specific' },
      ]}
    >
      <div className="max-w-3xl">
        <div className="border-t border-b border-[#222222] divide-y divide-[#222222]">
          {companiesWithContent.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#9AA1AA]">
              No company-specific preparation kits are currently published.
            </div>
          ) : (
            companiesWithContent.map((company) => (
              <Link
                key={company.id}
                href={`/student/preparation/company-specific/${company.id}`}
                className="group py-4 px-3 -mx-3 flex items-center justify-between gap-4 hover:bg-[#121212]/50 transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <span className="text-base font-medium text-[#EDEDED] group-hover:text-[#FF6B00] transition-colors">
                    {company.company_name}
                  </span>
                  <p className="text-sm text-[#9AA1AA] leading-relaxed line-clamp-1">
                    {company.industry} • {company.location}
                  </p>
                </div>

                <div className="shrink-0">
                  <ArrowRight className="h-4 w-4 text-[#9AA1AA] group-hover:text-[#FF6B00] group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </PageContainer>
  );
}
