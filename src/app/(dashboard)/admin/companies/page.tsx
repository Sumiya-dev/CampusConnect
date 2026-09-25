import { PageContainer } from '@/components/layout/page-container';
import { CompanyListView } from '@/components/companies/company-list-view';
import { getCompanies, getDistinctIndustries } from '@/lib/companies/queries';
import { getCurrentUser } from '@/lib/auth/user';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminCompaniesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    redirect('/login?unauthorized=true');
  }

  const [companies, industries] = await Promise.all([
    getCompanies(),
    getDistinctIndustries(),
  ]);

  return (
    <PageContainer
      title="Company Directory Governance"
      description="System administrator audit and governance for registered corporate recruitment partners and employer accounts."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Companies' },
      ]}
      badgeText={`${companies.length} Registered`}
    >
      <CompanyListView
        initialCompanies={companies}
        basePath="/admin/companies"
        industries={industries}
        roleTitle="Administrator"
      />
    </PageContainer>
  );
}
