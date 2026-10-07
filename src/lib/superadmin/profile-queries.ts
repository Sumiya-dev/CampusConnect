import { createClient } from '../supabase/server';
import { getCurrentUser } from '../auth/user';
import { SuperadminProfileDetails } from '../types/superadmin-profile.types';

export async function getSuperadminProfileDetails(): Promise<SuperadminProfileDetails | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();

      // Query profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching admin profile row:', profileError);
      }

      // Query administrators metadata table
      const { data: adminRecord, error: adminError } = await supabase
        .from('administrators')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (adminError) {
        console.error('Error fetching administrator record:', adminError);
      }

      const p = profileData || user.profile;

      return {
        id: user.id,
        name: p?.name || user.name || 'Administrator',
        email: p?.email || user.email || 'admin@campusconnect.edu',
        contactNumber: p?.contact_number ?? user.contactNumber ?? null,
        avatarUrl: p?.avatar_url ?? null,
        role: (p?.role || user.role) as 'administrator',
        department: p?.department || user.department || 'Central Administration',
        accountStatus: p?.account_status || user.accountStatus || 'active',
        adminCode: adminRecord?.admin_code || user.identifier || 'ADM-SYS-001',
        accessLevel: adminRecord?.access_level || 'Superadmin (Root System Scope)',
        createdAt: p?.created_at || adminRecord?.created_at || new Date().toISOString(),
        updatedAt: p?.updated_at || adminRecord?.updated_at || new Date().toISOString(),
      };
    } catch (err) {
      console.error('getSuperadminProfileDetails database error:', err);
    }
  }

  // Graceful fallback for local demo session
  return {
    id: user.id,
    name: user.name || 'Super Admin',
    email: user.email || 'admin@campusconnect.edu',
    contactNumber: user.contactNumber ?? '+91 98444 55667',
    avatarUrl: null,
    role: 'administrator',
    department: user.department || 'Central Administration',
    accountStatus: user.accountStatus || 'active',
    adminCode: user.identifier || 'ADM-SYS-001',
    accessLevel: 'Superadmin (Root System Scope)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
