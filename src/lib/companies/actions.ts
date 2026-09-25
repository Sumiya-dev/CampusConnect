'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '../supabase/server';
import { getCurrentUser } from '../auth/user';
import { Company, CompanyStatus } from '../types/database.types';
import { CompanyActionState } from '../types/company.types';
import { getCompanies, SEED_COMPANIES } from './queries';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeUrl(urlStr: string): string {
  const trimmed = urlStr.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Creates a new partner company
 */
export async function createCompanyAction(
  prevState: unknown,
  formData: FormData
): Promise<CompanyActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Authentication required. Please log in.' };
  }

  if (user.role !== 'placement_officer' && user.role !== 'administrator') {
    return { success: false, error: 'Unauthorized: Only Placement Officers and Administrators can manage companies.' };
  }

  const company_name = (formData.get('company_name') as string)?.trim();
  const industry = (formData.get('industry') as string)?.trim() || null;
  const description = (formData.get('description') as string)?.trim() || null;
  const rawWebsite = (formData.get('website') as string)?.trim() || '';
  const location = (formData.get('location') as string)?.trim() || null;
  const contact_name = (formData.get('contact_name') as string)?.trim() || null;
  const contact_email = (formData.get('contact_email') as string)?.trim() || null;
  const contact_phone = (formData.get('contact_phone') as string)?.trim() || null;
  const status = ((formData.get('status') as CompanyStatus) || 'active');

  const fieldErrors: CompanyActionState['fieldErrors'] = {};

  if (!company_name || company_name.length < 2) {
    fieldErrors.company_name = 'Company name is required and must be at least 2 characters.';
  }

  if (contact_email && !EMAIL_REGEX.test(contact_email)) {
    fieldErrors.contact_email = 'Please provide a valid corporate contact email address.';
  }

  let website: string | null = null;
  if (rawWebsite) {
    try {
      const sanitized = sanitizeUrl(rawWebsite);
      new URL(sanitized);
      website = sanitized;
    } catch {
      fieldErrors.website = 'Please enter a valid website URL (e.g. https://company.com).';
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, error: 'Please correct the highlighted fields.', fieldErrors };
  }

  // Check duplicate company name
  const existingCompanies = await getCompanies();
  const isDuplicate = existingCompanies.some(
    (c) => c.company_name.toLowerCase() === company_name.toLowerCase()
  );

  if (isDuplicate) {
    return {
      success: false,
      error: `A corporate partner named "${company_name}" already exists in the system.`,
      fieldErrors: { company_name: 'Company name already registered.' },
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  let generatedId = `comp-${Date.now()}`;

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();
      const { data, error } = await supabase
        .from('companies')
        .insert({
          company_name,
          industry,
          description,
          website,
          location,
          contact_name,
          contact_email,
          contact_phone,
          status,
          created_by: user.id !== 'demo-user-id' ? user.id : null,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message || 'Database error occurred while creating company.' };
      }
      if (data?.id) {
        generatedId = data.id;
      }
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Failed to connect to database.' };
    }
  } else {
    // Demo Mode: persist in demo cookie store
    const cookieStore = await cookies();
    const demoCookie = cookieStore.get('campusconnect_demo_companies')?.value;
    let list: Company[] = [...SEED_COMPANIES];
    if (demoCookie) {
      try {
        const parsed = JSON.parse(demoCookie);
        if (Array.isArray(parsed)) list = parsed;
      } catch {
        // use seed
      }
    }

    const newCompany: Company = {
      id: generatedId,
      company_name,
      industry,
      description,
      website,
      location,
      contact_name,
      contact_email,
      contact_phone,
      status,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };

    list.unshift(newCompany);
    cookieStore.set('campusconnect_demo_companies', JSON.stringify(list), {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  revalidatePath('/placement/companies');
  revalidatePath('/admin/companies');

  return {
    success: true,
    message: `"${company_name}" has been successfully registered.`,
    companyId: generatedId,
  };
}

/**
 * Updates an existing partner company
 */
export async function updateCompanyAction(
  companyId: string,
  prevState: unknown,
  formData: FormData
): Promise<CompanyActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Authentication required. Please log in.' };
  }

  if (user.role !== 'placement_officer' && user.role !== 'administrator') {
    return { success: false, error: 'Unauthorized: Only Placement Officers and Administrators can edit companies.' };
  }

  const company_name = (formData.get('company_name') as string)?.trim();
  const industry = (formData.get('industry') as string)?.trim() || null;
  const description = (formData.get('description') as string)?.trim() || null;
  const rawWebsite = (formData.get('website') as string)?.trim() || '';
  const location = (formData.get('location') as string)?.trim() || null;
  const contact_name = (formData.get('contact_name') as string)?.trim() || null;
  const contact_email = (formData.get('contact_email') as string)?.trim() || null;
  const contact_phone = (formData.get('contact_phone') as string)?.trim() || null;
  const status = ((formData.get('status') as CompanyStatus) || 'active');

  const fieldErrors: CompanyActionState['fieldErrors'] = {};

  if (!company_name || company_name.length < 2) {
    fieldErrors.company_name = 'Company name is required and must be at least 2 characters.';
  }

  if (contact_email && !EMAIL_REGEX.test(contact_email)) {
    fieldErrors.contact_email = 'Please provide a valid corporate contact email address.';
  }

  let website: string | null = null;
  if (rawWebsite) {
    try {
      const sanitized = sanitizeUrl(rawWebsite);
      new URL(sanitized);
      website = sanitized;
    } catch {
      fieldErrors.website = 'Please enter a valid website URL (e.g. https://company.com).';
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, error: 'Please correct the highlighted fields.', fieldErrors };
  }

  // Duplicate check excluding current company
  const existingCompanies = await getCompanies();
  const isDuplicate = existingCompanies.some(
    (c) => c.id !== companyId && c.company_name.toLowerCase() === company_name.toLowerCase()
  );

  if (isDuplicate) {
    return {
      success: false,
      error: `Another corporate partner named "${company_name}" already exists.`,
      fieldErrors: { company_name: 'Company name already registered by another record.' },
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();
      const { error } = await supabase
        .from('companies')
        .update({
          company_name,
          industry,
          description,
          website,
          location,
          contact_name,
          contact_email,
          contact_phone,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', companyId);

      if (error) {
        return { success: false, error: error.message || 'Database error occurred while updating company.' };
      }
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Failed to connect to database.' };
    }
  } else {
    // Demo Mode Update
    const cookieStore = await cookies();
    const demoCookie = cookieStore.get('campusconnect_demo_companies')?.value;
    let list: Company[] = [...SEED_COMPANIES];
    if (demoCookie) {
      try {
        const parsed = JSON.parse(demoCookie);
        if (Array.isArray(parsed)) list = parsed;
      } catch {
        // use seed
      }
    }

    const idx = list.findIndex((c) => c.id === companyId);
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        company_name,
        industry,
        description,
        website,
        location,
        contact_name,
        contact_email,
        contact_phone,
        status,
        updated_at: new Date().toISOString(),
      };
    } else {
      list.push({
        id: companyId,
        company_name,
        industry,
        description,
        website,
        location,
        contact_name,
        contact_email,
        contact_phone,
        status,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    cookieStore.set('campusconnect_demo_companies', JSON.stringify(list), {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  revalidatePath('/placement/companies');
  revalidatePath(`/placement/companies/${companyId}`);
  revalidatePath(`/placement/companies/${companyId}/edit`);
  revalidatePath('/admin/companies');
  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath(`/admin/companies/${companyId}/edit`);

  return {
    success: true,
    message: `"${company_name}" details updated successfully.`,
    companyId,
  };
}

/**
 * Toggles company status between active and inactive (Soft Deactivation / Reactivation)
 */
export async function toggleCompanyStatusAction(
  companyId: string,
  targetStatus: CompanyStatus
): Promise<CompanyActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Authentication required. Please log in.' };
  }

  if (user.role !== 'placement_officer' && user.role !== 'administrator') {
    return { success: false, error: 'Unauthorized: Only Placement Officers and Administrators can modify company status.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();
      const { error } = await supabase
        .from('companies')
        .update({
          status: targetStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', companyId);

      if (error) {
        return { success: false, error: error.message || 'Database error while toggling status.' };
      }
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Failed to update company status.' };
    }
  } else {
    // Demo Mode
    const cookieStore = await cookies();
    const demoCookie = cookieStore.get('campusconnect_demo_companies')?.value;
    let list: Company[] = [...SEED_COMPANIES];
    if (demoCookie) {
      try {
        const parsed = JSON.parse(demoCookie);
        if (Array.isArray(parsed)) list = parsed;
      } catch {
        // use seed
      }
    }

    const idx = list.findIndex((c) => c.id === companyId);
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        status: targetStatus,
        updated_at: new Date().toISOString(),
      };
      cookieStore.set('campusconnect_demo_companies', JSON.stringify(list), {
        path: '/',
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
      });
    }
  }

  revalidatePath('/placement/companies');
  revalidatePath(`/placement/companies/${companyId}`);
  revalidatePath('/admin/companies');
  revalidatePath(`/admin/companies/${companyId}`);

  return {
    success: true,
    message: targetStatus === 'inactive'
      ? 'Company deactivated successfully. Historical records preserved.'
      : 'Company reactivated successfully.',
    companyId,
  };
}
