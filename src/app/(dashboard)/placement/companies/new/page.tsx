import { PageContainer } from '@/components/layout/page-container';
import { CompanyForm } from '@/components/companies/company-form';
import { getCurrentUser } from '@/lib/auth/user';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewPlacementCompanyPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'placement_officer' && user.role !== 'administrator')) {
    redirect('/login?unauthorized=true');
  }

  return (
    <PageContainer
      title="Register Corporate Partner"
      description="Register a new enterprise employer into the institutional placement network with verified recruiter points of contact."
      breadcrumbs={[
        { label: 'Placement', href: '/placement' },
        { label: 'Companies', href: '/placement/companies' },
        { label: 'New Registration' },
      ]}
      badgeText="Placement Ops"
    >
      <CompanyForm mode="create" basePath="/placement/companies" />
    </PageContainer>
  );
}
