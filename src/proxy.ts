import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';
import { ROLE_HOME_ROUTES } from './lib/types/auth.types';
import { UserRole } from './lib/types/database.types';

// Protected path prefixes and their required roles
const ROLE_ROUTE_MAP: Record<string, UserRole> = {
  '/student': 'student',
  '/faculty': 'faculty',
  '/placement': 'placement_officer',
  '/admin': 'administrator',
  '/superadmin': 'administrator',
};

const PROTECTED_PREFIXES = ['/student', '/faculty', '/placement', '/admin', '/superadmin', '/profile'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check Supabase session
  const { supabaseResponse, user, role: supabaseRole } = await updateSession(request);

  // 2. Determine active role (from Supabase or local demo session cookie)
  const demoRoleCookie = request.cookies.get('campusconnect_demo_role')?.value as UserRole | undefined;
  const demoUserCookie = request.cookies.get('campusconnect_demo_user')?.value;

  const activeUser = user || (demoUserCookie ? { id: 'demo-user', email: demoUserCookie } : null);
  const activeRole: UserRole | null = (supabaseRole as UserRole) || demoRoleCookie || null;

  const isProtectedPath = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthPath =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password');

  // Helper to preserve refreshed session cookies across redirects
  function createRedirect(targetUrl: URL | string) {
    const redirectResponse = NextResponse.redirect(targetUrl);
    const cookiesToCopy = supabaseResponse.cookies.getAll();
    for (const cookie of cookiesToCopy) {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    }
    return redirectResponse;
  }

  // Case 1: Unauthenticated user trying to access a protected route
  if (isProtectedPath && !activeUser) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return createRedirect(redirectUrl);
  }

  // Case 2: Authenticated user visiting /login or /signup -> redirect to their role dashboard
  if (isAuthPath && activeUser && activeRole) {
    const targetDashboard = ROLE_HOME_ROUTES[activeRole] || '/student';
    return createRedirect(new URL(targetDashboard, request.url));
  }

  // Case 3: RBAC authorization check for role-specific routes
  for (const [routePrefix, requiredRole] of Object.entries(ROLE_ROUTE_MAP)) {
    if (pathname.startsWith(routePrefix)) {
      // Special allowance: Alumni and students can access alumni resources under /student/alumni
      if (pathname.startsWith('/student/alumni') && (activeRole === 'alumni' || activeRole === 'student')) {
        continue;
      }

      if (activeRole !== requiredRole) {
        // Unauthorized access attempt - redirect to their authorized dashboard
        const fallbackDashboard = activeRole ? ROLE_HOME_ROUTES[activeRole] : '/login';
        const redirectUrl = new URL(fallbackDashboard, request.url);
        redirectUrl.searchParams.set('unauthorized', 'true');
        redirectUrl.searchParams.set('attempted', pathname);
        return createRedirect(redirectUrl);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (.svg, .png, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
