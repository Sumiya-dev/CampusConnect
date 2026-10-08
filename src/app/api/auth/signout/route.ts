import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('campusconnect_demo_user');
    cookieStore.delete('campusconnect_demo_role');
    cookieStore.delete('campusconnect_demo_name');
    cookieStore.delete('campusconnect_demo_dept');
    cookieStore.delete('campusconnect_demo_id');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      try {
        const supabase = await createClient();
        await supabase.auth.signOut();
      } catch {
        // Continue cleanup
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Sign out API error:', err);
    return NextResponse.json({ success: false, error: 'Sign out failed' }, { status: 500 });
  }
}
