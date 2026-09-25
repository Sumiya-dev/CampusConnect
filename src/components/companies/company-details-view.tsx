'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Company } from '@/lib/types/database.types';
import { toggleCompanyStatusAction } from '@/lib/companies/actions';
import { Button } from '@/components/ui/button';
import {
  Building,
  ArrowLeft,
  Edit,
  Power,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Calendar,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';

interface CompanyDetailsViewProps {
  company: Company;
  basePath: '/placement/companies' | '/admin/companies';
  roleTitle: string;
}

export function CompanyDetailsView({
  company,
  basePath,
  roleTitle,
}: CompanyDetailsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isActive = company.status === 'active';

  const handleToggleStatus = (targetStatus: 'active' | 'inactive') => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await toggleCompanyStatusAction(company.id, targetStatus);
      if (res.success) {
        setConfirmModalOpen(false);
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Failed to update company status.');
      }
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={basePath}
          className="inline-flex items-center gap-1.5 text-sm text-[#9AA1AA] hover:text-[#EDEDED] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Companies Directory</span>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link href={`${basePath}/${company.id}/edit`}>
            <Button
              variant="outline"
              size="sm"
              className="text-sm h-9 gap-1.5 border-[#222222] text-[#EDEDED] hover:border-[#FF6B00] hover:text-[#FF6B00]"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Edit Company</span>
            </Button>
          </Link>

          {isActive ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmModalOpen(true)}
              className="text-sm h-9 gap-1.5 border-[#222222] text-[#EF4444] hover:bg-[#EF4444]/10 hover:border-[#EF4444]/30"
            >
              <Power className="h-3.5 w-3.5" />
              <span>Deactivate</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => handleToggleStatus('active')}
              disabled={isPending}
              className="text-sm h-9 gap-1.5 font-medium"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              <span>Reactivate Company</span>
            </Button>
          )}
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="p-3.5 rounded-md border border-[#EF4444]/30 bg-[#EF4444]/10 text-sm text-[#EF4444]">
          {errorMessage}
        </div>
      )}

      {/* Company Header Entity Card */}
      <div className="rounded-md border border-[#222222] bg-[#0A0A0A] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-md border border-[#222222] bg-[#000000] text-[#FF6B00] shrink-0 font-bold text-lg">
              {company.company_name.substring(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-[#EDEDED]">{company.company_name}</h1>
                {isActive ? (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2.5 py-0.5 rounded">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                    Active Partner
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-[#9AA1AA] bg-[#121212] border border-[#222222] px-2.5 py-0.5 rounded">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
                    Inactive / Soft-Deactivated
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-[#9AA1AA]">
                {company.industry && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-[#9AA1AA]/60" />
                    <span>{company.industry}</span>
                  </div>
                )}
                {company.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#9AA1AA]/60" />
                    <span>{company.location}</span>
                  </div>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[#FF6B00] hover:underline"
                  >
                    <span>{company.website.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {company.description && (
          <div className="pt-3 border-t border-[#222222] text-sm leading-relaxed text-[#EDEDED]">
            {company.description}
          </div>
        )}
      </div>

      {/* Grid: Recruiter Contact & Corporate Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recruiter POC */}
        <div className="rounded-md border border-[#222222] bg-[#0A0A0A] p-5 space-y-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wider text-[#EDEDED]">
              University Recruitment Lead
            </div>
            <div className="border-b border-[#222222] my-2" />
            <p className="text-sm text-[#9AA1AA]">
              Designated corporate point of contact for drives and scheduling.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <div className="text-sm text-[#9AA1AA]">Point of Contact</div>
              <div className="text-sm font-medium text-[#EDEDED] mt-0.5">
                {company.contact_name || 'Not specified'}
              </div>
            </div>

            <div>
              <div className="text-sm text-[#9AA1AA]">Recruitment Email</div>
              <div className="text-sm font-medium text-[#EDEDED] mt-0.5 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-[#9AA1AA]/60" />
                {company.contact_email ? (
                  <a
                    href={`mailto:${company.contact_email}`}
                    className="hover:text-[#FF6B00] transition-colors"
                  >
                    {company.contact_email}
                  </a>
                ) : (
                  <span className="text-[#9AA1AA]">Not specified</span>
                )}
              </div>
            </div>

            <div>
              <div className="text-sm text-[#9AA1AA]">Phone / Boardline</div>
              <div className="text-sm font-medium text-[#EDEDED] mt-0.5 flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-[#9AA1AA]/60" />
                <span>{company.contact_phone || 'Not specified'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audit & Institutional Records */}
        <div className="rounded-md border border-[#222222] bg-[#0A0A0A] p-5 space-y-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wider text-[#EDEDED]">
              Institutional Governance
            </div>
            <div className="border-b border-[#222222] my-2" />
            <p className="text-sm text-[#9AA1AA]">
              Audit trail, entity identifier, and institutional registration dates.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <div className="text-sm text-[#9AA1AA]">System Identifier</div>
              <div className="text-sm font-mono text-[#9AA1AA] mt-0.5">{company.id}</div>
            </div>

            <div>
              <div className="text-sm text-[#9AA1AA]">Registration Date</div>
              <div className="text-sm font-medium text-[#EDEDED] mt-0.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#9AA1AA]/60" />
                <span>{formatDate(company.created_at)}</span>
              </div>
            </div>

            <div>
              <div className="text-sm text-[#9AA1AA]">Last Modified</div>
              <div className="text-sm font-medium text-[#EDEDED] mt-0.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#9AA1AA]/60" />
                <span>{formatDate(company.updated_at)}</span>
              </div>
            </div>

            {company.creator && (
              <div>
                <div className="text-sm text-[#9AA1AA]">Registered By</div>
                <div className="text-sm font-medium text-[#EDEDED] mt-0.5 flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-[#FF6B00]" />
                  <span>
                    {company.creator.name} ({company.creator.role.replace('_', ' ')})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Soft Deactivation Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0A0A] border border-[#222222] rounded-md max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded border border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444] shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#EDEDED]">
                  Deactivate &quot;{company.company_name}&quot;?
                </h3>
                <p className="text-sm text-[#9AA1AA] leading-relaxed">
                  This performs a <strong>soft deactivation</strong>. The company will be marked as inactive and hidden from active drive creation, but all historical placement records and audit logs will remain intact.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#222222] flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setConfirmModalOpen(false)}
                className="text-sm border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]"
              >
                Cancel
              </Button>

              <Button
                size="sm"
                disabled={isPending}
                onClick={() => handleToggleStatus('inactive')}
                className="text-sm bg-[#EF4444] text-white hover:bg-[#DC2626] font-medium"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                Confirm Deactivation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
