import { notFound, redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { CompanyForm } from '@/components/companies/company-form';
import { getCompanyById } from '@/lib/companies/queries';
import { getCurrentUser } from '@/lib/auth/user';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPlacementCompanyPage({ params }: PageProps) {
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
      title={`Edit ${company.company_name}`}
      description="Update corporate partner profile, campus recruitment points of contact, or operational status."
      breadcrumbs={[
        { label: 'Placement', href: '/placement' },
        { label: 'Companies', href: '/placement/companies' },
        { label: company.company_name, href: `/placement/companies/${company.id}` },
        { label: 'Edit' },
      ]}
      badgeText="Edit Partner"
    >
      <CompanyForm
        mode="edit"
        initialCompany={company}
        basePath="/placement/companies"
      />
    </PageContainer>
  );
}
