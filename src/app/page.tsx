import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { ROLE_HOME_ROUTES } from '@/lib/types/auth.types';
import SignUpPage from './(auth)/signup/page';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const userContext = await getCurrentUser();

  // If user is already authenticated, redirect to their role-specific portal
  if (userContext) {
    const targetDashboard = ROLE_HOME_ROUTES[userContext.role] || '/student';
    redirect(targetDashboard);
  }

  // When an unauthenticated user opens '/', show the Sign Up page by default
  return <SignUpPage />;
}
