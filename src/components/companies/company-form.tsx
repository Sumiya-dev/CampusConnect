'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Company, CompanyStatus } from '@/lib/types/database.types';
import { CompanyActionState } from '@/lib/types/company.types';
import { createCompanyAction, updateCompanyAction } from '@/lib/companies/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, ArrowLeft, Loader2, Building, Globe, Mail, Phone, MapPin } from 'lucide-react';

interface CompanyFormProps {
  mode: 'create' | 'edit';
  initialCompany?: Company;
  basePath: '/placement/companies' | '/admin/companies';
}

export function CompanyForm({ mode, initialCompany, basePath }: CompanyFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [companyName, setCompanyName] = useState(initialCompany?.company_name || '');
  const [industry, setIndustry] = useState(initialCompany?.industry || '');
  const [description, setDescription] = useState(initialCompany?.description || '');
  const [website, setWebsite] = useState(initialCompany?.website || '');
  const [location, setLocation] = useState(initialCompany?.location || '');
  const [contactName, setContactName] = useState(initialCompany?.contact_name || '');
  const [contactEmail, setContactEmail] = useState(initialCompany?.contact_email || '');
  const [contactPhone, setContactPhone] = useState(initialCompany?.contact_phone || '');
  const [status, setStatus] = useState<CompanyStatus>(initialCompany?.status || 'active');

  const [state, setState] = useState<CompanyActionState | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState(null);

    const formData = new FormData();
    formData.append('company_name', companyName);
    formData.append('industry', industry);
    formData.append('description', description);
    formData.append('website', website);
    formData.append('location', location);
    formData.append('contact_name', contactName);
    formData.append('contact_email', contactEmail);
    formData.append('contact_phone', contactPhone);
    formData.append('status', status);

    startTransition(async () => {
      let res: CompanyActionState;
      if (mode === 'create') {
        res = await createCompanyAction(null, formData);
      } else if (initialCompany) {
        res = await updateCompanyAction(initialCompany.id, null, formData);
      } else {
        return;
      }

      setState(res);

      if (res.success && res.companyId) {
        setTimeout(() => {
          router.push(`${basePath}/${res.companyId}`);
        }, 600);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {/* Back Link */}
      <div>
        <Link
          href={initialCompany ? `${basePath}/${initialCompany.id}` : basePath}
          className="inline-flex items-center gap-1.5 text-sm text-[#9AA1AA] hover:text-[#EDEDED] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to {initialCompany ? initialCompany.company_name : 'Companies Directory'}</span>
        </Link>
      </div>

      {/* Status Banners */}
      {state?.error && (
        <div className="p-3.5 rounded-md border border-[#EF4444]/30 bg-[#EF4444]/10 text-sm text-[#EF4444] flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Submission failed</div>
            <div>{state.error}</div>
          </div>
        </div>
      )}

      {state?.success && (
        <div className="p-3.5 rounded-md border border-[#22C55E]/30 bg-[#22C55E]/10 text-sm text-[#22C55E] flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Success</div>
            <div>{state.message} Redirecting...</div>
          </div>
        </div>
      )}

      {/* SECTION 1: CORPORATE IDENTITY */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#EDEDED]">
            Corporate Entity Information
          </h3>
          <div className="border-b border-[#222222] my-2" />
          <p className="text-sm text-[#9AA1AA]">
            Primary institutional details regarding the recruitment partner.
          </p>
        </div>

        <div className="space-y-4 pt-1">
          {/* Company Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#9AA1AA]">
              Company Name <span className="text-[#FF6B00]">*</span>
            </label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Microsoft India Development Center"
              required
              className="bg-[#0A0A0A] border-[#222222] text-[#EDEDED] text-sm h-10 focus:border-[#FF6B00]"
            />
            {state?.fieldErrors?.company_name && (
              <div className="text-sm text-[#EF4444]">{state.fieldErrors.company_name}</div>
            )}
          </div>

          {/* Industry & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#9AA1AA]">Industry / Domain</label>
              <Input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Cloud & Systems Software"
                className="bg-[#0A0A0A] border-[#222222] text-[#EDEDED] text-sm h-10 focus:border-[#FF6B00]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#9AA1AA]">Office Location(s)</label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Hyderabad / Bengaluru / Pune"
                className="bg-[#0A0A0A] border-[#222222] text-[#EDEDED] text-sm h-10 focus:border-[#FF6B00]"
              />
            </div>
          </div>

          {/* Website */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#9AA1AA]">Corporate Website / Careers URL</label>
            <Input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="e.g. https://careers.microsoft.com"
              className="bg-[#0A0A0A] border-[#222222] text-[#EDEDED] text-sm h-10 focus:border-[#FF6B00]"
            />
            {state?.fieldErrors?.website && (
              <div className="text-sm text-[#EF4444]">{state.fieldErrors.website}</div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#9AA1AA]">Entity Description & Overview</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of company operations, business units, and recruiting profile..."
              className="w-full rounded-md bg-[#0A0A0A] border border-[#222222] p-2.5 text-sm text-[#EDEDED] placeholder:text-[#9AA1AA] focus:outline-none focus:border-[#FF6B00]"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: PRIMARY RECRUITMENT POC */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#EDEDED]">
            Campus Recruitment Contact
          </h3>
          <div className="border-b border-[#222222] my-2" />
          <p className="text-sm text-[#9AA1AA]">
            Direct institutional contact details for university hiring coordination.
          </p>
        </div>

        <div className="space-y-4 pt-1">
          {/* Contact Person Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#9AA1AA]">HR / University Hiring Lead</label>
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Aditi Sharma (Lead Talent Partner)"
              className="bg-[#0A0A0A] border-[#222222] text-[#EDEDED] text-sm h-10 focus:border-[#FF6B00]"
            />
          </div>

          {/* Contact Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#9AA1AA]">Recruitment Email</label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="e.g. university-relations@microsoft.com"
                className="bg-[#0A0A0A] border-[#222222] text-[#EDEDED] text-sm h-10 focus:border-[#FF6B00]"
              />
              {state?.fieldErrors?.contact_email && (
                <div className="text-sm text-[#EF4444]">{state.fieldErrors.contact_email}</div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#9AA1AA]">Contact Phone / Boardline</label>
              <Input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="e.g. +91 80 6789 1200"
                className="bg-[#0A0A0A] border-[#222222] text-[#EDEDED] text-sm h-10 focus:border-[#FF6B00]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: STATUS CONFIGURATION */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#EDEDED]">
            Operational Partnership Status
          </h3>
          <div className="border-b border-[#222222] my-2" />
          <p className="text-sm text-[#9AA1AA]">
            Active partners can participate in drives. Inactive partners are preserved for historical reporting.
          </p>
        </div>

        <div className="pt-1">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="active"
                checked={status === 'active'}
                onChange={() => setStatus('active')}
                className="accent-[#FF6B00]"
              />
              <span className="text-sm font-medium text-[#EDEDED]">
                Active Recruiter
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="inactive"
                checked={status === 'inactive'}
                onChange={() => setStatus('inactive')}
                className="accent-[#FF6B00]"
              />
              <span className="text-sm font-medium text-[#9AA1AA]">
                Inactive / Suspended
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-[#222222]">
        <Button
          type="submit"
          disabled={isPending}
          className="text-sm h-10 px-4 gap-1.5 font-medium"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <span>{mode === 'create' ? 'Register Company' : 'Save Changes'}</span>
        </Button>

        <Link href={initialCompany ? `${basePath}/${initialCompany.id}` : basePath}>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            className="text-sm h-10 px-4 border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]"
          >
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
