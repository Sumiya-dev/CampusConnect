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

export default async function EditAdminCompanyPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
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
      description="Administrative update for corporate partner profile, campus recruitment points of contact, or operational status."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Companies', href: '/admin/companies' },
        { label: company.company_name, href: `/admin/companies/${company.id}` },
        { label: 'Edit' },
      ]}
      badgeText="Super Admin"
    >
      <CompanyForm
        mode="edit"
        initialCompany={company}
        basePath="/admin/companies"
      />
    </PageContainer>
  );
}
