import { PageContainer } from '@/components/layout/page-container';
import { CompanyForm } from '@/components/companies/company-form';
import { getCurrentUser } from '@/lib/auth/user';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewAdminCompanyPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    redirect('/login?unauthorized=true');
  }

  return (
    <PageContainer
      title="Register Corporate Partner"
      description="Administrative provisioning and institutional onboarding for corporate recruiters and partner organizations."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Companies', href: '/admin/companies' },
        { label: 'New Registration' },
      ]}
      badgeText="Super Admin"
    >
      <CompanyForm mode="create" basePath="/admin/companies" />
    </PageContainer>
  );
}
