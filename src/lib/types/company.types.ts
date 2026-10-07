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

export interface CompanyDriveDetail {
  id: string;
  company_id: string;
  job_role: string;
  package_details: string;
  tier: string;
  location: string | null;
  status: string;
  registration_deadline: string;
  drive_date: string | null;
  drive_time: string | null;
  venue: string | null;
  applications_count: number;
}

export interface DeleteCompanyResult {
  success: boolean;
  blocked?: boolean;
  actionTaken?: 'deleted' | 'deactivated';
  reason?: string;
  error?: string;
}
