import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { AppShell } from '@/components/layout/app-shell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userContext = await getCurrentUser();

  if (!userContext) {
    redirect('/login');
  }

  return (
    <AppShell
      role={userContext.role}
      userName={userContext.name}
      userEmail={userContext.email}
      department={userContext.department}
    >
      {children}
    </AppShell>
  );
}
