import { cookies } from 'next/headers';
import { createClient } from '../supabase/server';
import { Company, CompanyStatus } from '../types/database.types';
import { CompanyFilterState } from '../types/company.types';

// Initial seed companies for fallback/demo mode
export const SEED_COMPANIES: Company[] = [
  {
    id: 'c101-msft',
    company_name: 'Microsoft India Development Center',
    industry: 'Software & Cloud Infrastructure',
    description: 'Global innovation hub driving Azure distributed systems, developer technologies, Office 365 services, and enterprise artificial intelligence solutions.',
    website: 'https://careers.microsoft.com',
    location: 'Hyderabad / Bengaluru',
    contact_name: 'Aditi Sharma',
    contact_email: 'aditi.sharma@microsoft.com',
    contact_phone: '+91 80 6789 1200',
    status: 'active',
    created_by: null,
    created_at: '2026-08-15T09:00:00Z',
    updated_at: '2026-09-01T14:30:00Z',
  },
  {
    id: 'c102-tcs',
    company_name: 'Tata Consultancy Services',
    industry: 'Information Technology & Consulting',
    description: 'Multinational information technology services and consulting company, pioneering digital business transformation and enterprise AI implementations worldwide.',
    website: 'https://www.tcs.com',
    location: 'Mumbai / Pune / Chennai / Bengaluru',
    contact_name: 'Rajesh Varma',
    contact_email: 'rajesh.varma@tcs.com',
    contact_phone: '+91 22 6778 9000',
    status: 'active',
    created_by: null,
    created_at: '2026-08-18T10:00:00Z',
    updated_at: '2026-08-25T11:00:00Z',
  },
  {
    id: 'c103-deloitte',
    company_name: 'Deloitte USI',
    industry: 'Management & Technology Consulting',
    description: 'Providing audit, consulting, tax, and advisory services to Fortune 500 enterprises with specialization in cloud security, data engineering, and strategy.',
    website: 'https://www2.deloitte.com',
    location: 'Hyderabad / Bengaluru / Gurugram',
    contact_name: 'Pooja Iyer',
    contact_email: 'piyer@deloitte.com',
    contact_phone: '+91 40 7198 5000',
    status: 'active',
    created_by: null,
    created_at: '2026-08-20T11:30:00Z',
    updated_at: '2026-09-05T16:00:00Z',
  },
  {
    id: 'c104-infy',
    company_name: 'Infosys Limited',
    industry: 'Information Technology & Consulting',
    description: 'Global leader in next-generation digital services and consulting, enabling clients in more than 50 countries to navigate their digital transformation.',
    website: 'https://www.infosys.com',
    location: 'Bengaluru / Pune / Hyderabad',
    contact_name: 'Siddharth Rao',
    contact_email: 'siddharth_rao@infosys.com',
    contact_phone: '+91 80 2852 0261',
    status: 'active',
    created_by: null,
    created_at: '2026-08-22T13:00:00Z',
    updated_at: '2026-08-29T10:15:00Z',
  },
  {
    id: 'c105-aws',
    company_name: 'Amazon Web Services India',
    industry: 'Cloud Computing & Distributed Systems',
    description: 'World’s most comprehensive and broadly adopted cloud platform, offering over 200 fully featured services from data centers globally.',
    website: 'https://aws.amazon.com',
    location: 'Bengaluru / Hyderabad',
    contact_name: 'Neha Kapoor',
    contact_email: 'nehak-recruiting@amazon.com',
    contact_phone: '+91 80 4900 8000',
    status: 'inactive',
    created_by: null,
    created_at: '2026-08-28T15:00:00Z',
    updated_at: '2026-09-12T09:45:00Z',
  },
  {
    id: 'c106-cisco',
    company_name: 'Cisco Systems India',
    industry: 'Computer Networking & Cybersecurity',
    description: 'Worldwide technology leader in securely connecting everything to make anything possible, powering high-resilience campus networks and zero-trust security.',
    website: 'https://www.cisco.com',
    location: 'Bengaluru',
    contact_name: 'Karan Mehra',
    contact_email: 'karan.mehra@cisco.com',
    contact_phone: '+91 80 4426 0000',
    status: 'active',
    created_by: null,
    created_at: '2026-09-02T11:00:00Z',
    updated_at: '2026-09-10T14:20:00Z',
  },
];

export async function getCompanies(filters?: CompanyFilterState): Promise<Company[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  if (isLiveSupabase) {
    try {
      const supabase = await createClient();
      let query = supabase
        .from('companies')
        .select(`
          *,
          creator:created_by (
            name,
            email,
            role
          )
        `)
        .order('company_name', { ascending: true });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.industry && filters.industry !== 'all') {
        query = query.eq('industry', filters.industry);
      }

      if (filters?.search && filters.search.trim()) {
        const term = filters.search.trim();
        query = query.or(`company_name.ilike.%${term}%,industry.ilike.%${term}%,location.ilike.%${term}%,contact_name.ilike.%${term}%`);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data as unknown as Company[];
      }
    } catch {
      // Fallback to local store
    }
  }

  // Fallback / Demo Mode store reading from cookies
  const cookieStore = await cookies();
  const demoCompaniesCookie = cookieStore.get('campusconnect_demo_companies')?.value;
  let companies: Company[] = [...SEED_COMPANIES];

  if (demoCompaniesCookie) {
    try {
      const parsed = JSON.parse(demoCompaniesCookie);
      if (Array.isArray(parsed)) {
        companies = parsed;
      }
    } catch {
      // Ignore parse failure
    }
  }

  // Apply filters to local fallback data
  let filtered = [...companies];

  if (filters?.status && filters.status !== 'all') {
    filtered = filtered.filter((c) => c.status === filters.status);
  }

  if (filters?.industry && filters.industry !== 'all') {
    filtered = filtered.filter((c) => c.industry === filters.industry);
  }

  if (filters?.search && filters.search.trim()) {
    const s = filters.search.toLowerCase().trim();
    filtered = filtered.filter(
      (c) =>
        c.company_name.toLowerCase().includes(s) ||
        (c.industry && c.industry.toLowerCase().includes(s)) ||
        (c.location && c.location.toLowerCase().includes(s)) ||
        (c.contact_name && c.contact_name.toLowerCase().includes(s))
    );
  }

  return filtered.sort((a, b) => a.company_name.localeCompare(b.company_name));
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  if (isLiveSupabase) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          creator:created_by (
            name,
            email,
            role
          )
        `)
        .eq('id', id)
        .single();

      if (!error && data) {
        return data as unknown as Company;
      }
    } catch {
      // Continue fallback
    }
  }

  // Fallback / Demo Mode
  const companies = await getCompanies();
  return companies.find((c) => c.id === id) || null;
}

export async function getDistinctIndustries(): Promise<string[]> {
  const companies = await getCompanies();
  const set = new Set<string>();
  companies.forEach((c) => {
    if (c.industry && c.industry.trim()) {
      set.add(c.industry.trim());
    }
  });
  return Array.from(set).sort();
}
