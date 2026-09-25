import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ROLE_HOME_ROUTES } from '@/lib/types/auth.types';
import { UserRole } from '@/lib/types/database.types';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        const userProfile = profile as { role: UserRole } | null;
        const role = (userProfile?.role as UserRole) || (user.user_metadata?.role as UserRole) || 'student';
        return NextResponse.redirect(`${origin}${ROLE_HOME_ROUTES[role] || next}`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
