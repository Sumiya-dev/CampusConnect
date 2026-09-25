import { Company, CompanyStatus } from './database.types';

export interface CompanyFormData {
  company_name: string;
  industry: string;
  description: string;
  website: string;
  location: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  status: CompanyStatus;
}

export interface CompanyFilterState {
  search?: string;
  status?: 'all' | CompanyStatus;
  industry?: string;
}

export interface CompanyActionState {
  success: boolean;
  message?: string;
  error?: string;
  companyId?: string;
  fieldErrors?: {
    company_name?: string;
    contact_email?: string;
    website?: string;
    contact_phone?: string;
  };
}

export interface CompanySummary extends Company {
  drivesCount?: number;
}
