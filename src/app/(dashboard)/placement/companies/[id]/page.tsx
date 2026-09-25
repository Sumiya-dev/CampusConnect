import { notFound, redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { CompanyDetailsView } from '@/components/companies/company-details-view';
import { getCompanyById } from '@/lib/companies/queries';
import { getCurrentUser } from '@/lib/auth/user';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PlacementCompanyDetailsPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'placement_officer' && user.role !== 'administrator')) {
    redirect('/login?unauthorized=true');
  }

  const { id } = await params;
  const company = await getCompanyById(id);

  if (!company) {
    notFound();
  }

  return (
    <PageContainer
      title={company.company_name}
      description={company.industry ? `Enterprise Recruiter • ${company.industry}` : 'Enterprise Recruiter'}
      breadcrumbs={[
        { label: 'Placement', href: '/placement' },
        { label: 'Companies', href: '/placement/companies' },
        { label: company.company_name },
      ]}
      badgeText={company.status === 'active' ? 'Active Partner' : 'Inactive'}
    >
      <CompanyDetailsView
        company={company}
        basePath="/placement/companies"
        roleTitle="Placement Officer"
      />
    </PageContainer>
  );
}
