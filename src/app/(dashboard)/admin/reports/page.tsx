import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { PageContainer } from '@/components/layout/page-container';
import { getPlacementAnalyticsReport } from '@/lib/reports/queries';
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard';
import { AnalyticsFilterOptions } from '@/lib/types/reports.types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Reports & Analytics | Superadmin | CampusConnect AI',
  description:
    'Institutional placement analytics, departmental benchmarks, company recruitment audits, and candidate conversion reports.',
};

interface PageProps {
  searchParams: Promise<{
    department?: string;
    program_id?: string;
    year?: string;
    company_id?: string;
    drive_id?: string;
    placement_status?: string;
  }>;
}

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    redirect('/login?error=unauthorized');
  }

  const filters = await searchParams;
  const reportData = await getPlacementAnalyticsReport(filters);

  return (
    <PageContainer
      title="Institutional Placement Analytics & Reports"
      description="Multi-dimensional conversion metrics, departmental statistics, company recruitment audits, and cohort status reports."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Reports & Analytics' },
      ]}
      badgeText="Executive Intelligence"
    >
      <AnalyticsDashboard
        data={reportData}
        activeFilters={filters}
      />
    </PageContainer>
  );
}
