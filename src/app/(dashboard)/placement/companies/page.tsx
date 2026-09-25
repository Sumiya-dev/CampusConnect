import { PageContainer } from '@/components/layout/page-container';
import { CompanyListView } from '@/components/companies/company-list-view';
import { getCompanies, getDistinctIndustries } from '@/lib/companies/queries';
import { getCurrentUser } from '@/lib/auth/user';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PlacementCompaniesPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'placement_officer' && user.role !== 'administrator')) {
    redirect('/login?unauthorized=true');
  }

  const [companies, industries] = await Promise.all([
    getCompanies(),
    getDistinctIndustries(),
  ]);

  return (
    <PageContainer
      title="Corporate Recruiting Partners"
      description="Manage enterprise employer partnerships, bilateral MoUs, and university campus recruitment coordination leads."
      breadcrumbs={[
        { label: 'Placement', href: '/placement' },
        { label: 'Companies' },
      ]}
      badgeText={`${companies.length} Partners`}
    >
      <CompanyListView
        initialCompanies={companies}
        basePath="/placement/companies"
        industries={industries}
        roleTitle="Placement Officer"
      />
    </PageContainer>
  );
}
