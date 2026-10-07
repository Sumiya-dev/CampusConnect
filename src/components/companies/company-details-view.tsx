'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CompanyDriveDetail, CompanySummary } from '@/lib/types/company.types';
import { toggleCompanyStatusAction, deleteCompanyAction } from '@/lib/companies/actions';
import { Button } from '@/components/ui/button';
import {
  Building,
  ArrowLeft,
  Edit,
  Power,
  Trash2,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Calendar,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Briefcase,
  Users,
  Clock,
} from 'lucide-react';

interface CompanyDetailsViewProps {
  company: CompanySummary;
  drives?: CompanyDriveDetail[];
  basePath: '/placement/companies' | '/admin/companies';
  roleTitle: string;
}

export function CompanyDetailsView({
  company,
  drives = [],
  basePath,
  roleTitle,
}: CompanyDetailsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const isActive = company.status === 'active';
  const hasDrives = (company.drivesCount && company.drivesCount > 0) || drives.length > 0;
  const drivesTotal = drives.length || company.drivesCount || 0;

  const handleToggleStatus = (targetStatus: 'active' | 'inactive') => {
    setErrorMessage(null);
    setActionSuccessMessage(null);
    startTransition(async () => {
      const res = await toggleCompanyStatusAction(company.id, targetStatus);
      if (res.success) {
        setDeactivateModalOpen(false);
        setActionSuccessMessage(res.message || 'Company status updated.');
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Failed to update company status.');
      }
    });
  };

  const handleDelete = (forceDeactivate: boolean = false) => {
    setErrorMessage(null);
    setActionSuccessMessage(null);
    startTransition(async () => {
      const res = await deleteCompanyAction(company.id, forceDeactivate);
      if (res.success) {
        setDeleteModalOpen(false);
        if (res.actionTaken === 'deleted') {
          router.push(basePath);
          router.refresh();
        } else {
          setActionSuccessMessage(res.reason || 'Company has been safely deactivated.');
          router.refresh();
        }
      } else {
        setErrorMessage(res.reason || res.error || 'Failed to delete company.');
      }
    });
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'TBA';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Navigation & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href={basePath}
          className="inline-flex items-center gap-1.5 text-sm text-[#9AA1AA] hover:text-[#EDEDED] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Companies Directory</span>
        </Link>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
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
              onClick={() => setDeactivateModalOpen(true)}
              className="text-sm h-9 gap-1.5 border-[#222222] text-[#9AA1AA] hover:text-[#EF4444] hover:border-[#EF4444]/30"
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
              <span>Reactivate</span>
            </Button>
          )}

          {/* Safe Delete Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
            className="text-sm h-9 gap-1.5 border-[#222222] text-[#EF4444] hover:bg-[#EF4444]/10 hover:border-[#EF4444]/30"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-3.5 rounded-md border border-[#EF4444]/30 bg-[#EF4444]/10 text-sm text-[#EF4444] flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {actionSuccessMessage && (
        <div className="p-3.5 rounded-md border border-[#22C55E]/30 bg-[#22C55E]/10 text-sm text-[#22C55E] flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{actionSuccessMessage}</span>
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
                <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-[#9AA1AA] bg-[#121212] border border-[#222222] px-2 py-0.5 rounded">
                  <Briefcase className="h-3 w-3 text-[#FF6B00]" />
                  {drivesTotal} {drivesTotal === 1 ? 'drive' : 'drives'} linked
                </span>
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
            <p className="text-xs text-[#9AA1AA]">
              Designated corporate point of contact for campus recruitment and interview logistics.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <div className="text-xs text-[#9AA1AA]">Point of Contact</div>
              <div className="text-sm font-medium text-[#EDEDED] mt-0.5">
                {company.contact_name || 'Not specified'}
              </div>
            </div>

            <div>
              <div className="text-xs text-[#9AA1AA]">Recruitment Email</div>
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
              <div className="text-xs text-[#9AA1AA]">Phone / Boardline</div>
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
            <p className="text-xs text-[#9AA1AA]">
              Audit trail, identifier, and institutional registration record.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <div className="text-xs text-[#9AA1AA]">System Identifier</div>
              <div className="text-xs font-mono text-[#9AA1AA] mt-0.5">{company.id}</div>
            </div>

            <div>
              <div className="text-xs text-[#9AA1AA]">Registration Date</div>
              <div className="text-sm font-medium text-[#EDEDED] mt-0.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#9AA1AA]/60" />
                <span>{formatDate(company.created_at)}</span>
              </div>
            </div>

            <div>
              <div className="text-xs text-[#9AA1AA]">Last Modified</div>
              <div className="text-sm font-medium text-[#EDEDED] mt-0.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#9AA1AA]/60" />
                <span>{formatDate(company.updated_at)}</span>
              </div>
            </div>

            {company.creator && (
              <div>
                <div className="text-xs text-[#9AA1AA]">Registered By</div>
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

      {/* Associated Placement Drives Section */}
      <div className="rounded-md border border-[#222222] bg-[#0A0A0A] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-[#EDEDED] flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-[#FF6B00]" />
              Associated Placement Drives ({drives.length})
            </h2>
            <p className="text-xs text-[#9AA1AA] mt-0.5">
              Placement drives, hiring roles, and applicant engagement associated with this corporate partner.
            </p>
          </div>

          <Link href={basePath === '/admin/companies' ? '/admin/placements/new' : '/placement/drives/new'}>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 border-[#222222] text-[#EDEDED] hover:border-[#FF6B00] hover:text-[#FF6B00]"
            >
              Schedule New Drive
            </Button>
          </Link>
        </div>

        {drives.length === 0 ? (
          <div className="py-8 px-4 text-center rounded border border-dashed border-[#222222] bg-[#121212]/30 space-y-2">
            <Briefcase className="h-7 w-7 text-[#9AA1AA] mx-auto opacity-50" />
            <div className="text-sm font-medium text-[#EDEDED]">No Placement Drives Associated Yet</div>
            <p className="text-xs text-[#9AA1AA] max-w-md mx-auto">
              No recruitment drives have been created for {company.company_name}. You can schedule a drive when campus hiring opens.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-[#222222]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#222222] bg-[#121212] text-[#9AA1AA] uppercase tracking-wider text-xs">
                <tr>
                  <th className="py-2.5 px-3.5 font-semibold">Job Role & Tier</th>
                  <th className="py-2.5 px-3.5 font-semibold">Package (CTC)</th>
                  <th className="py-2.5 px-3.5 font-semibold">Location</th>
                  <th className="py-2.5 px-3.5 font-semibold">Status</th>
                  <th className="py-2.5 px-3.5 font-semibold">Applications</th>
                  <th className="py-2.5 px-3.5 font-semibold">Drive Date / Deadline</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222] text-[#EDEDED]">
                {drives.map((d) => {
                  const isDriveActive = d.status === 'active' || d.status === 'scheduled';
                  return (
                    <tr key={d.id} className="hover:bg-[#121212]/50 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="font-medium text-[#EDEDED]">{d.job_role}</div>
                        <div className="text-xs text-[#9AA1AA]">{d.tier}</div>
                      </td>
                      <td className="py-3 px-3.5 font-medium text-[#FF6B00]">
                        {d.package_details}
                      </td>
                      <td className="py-3 px-3.5 text-xs text-[#9AA1AA]">
                        {d.location || 'Pan-India / Remote'}
                      </td>
                      <td className="py-3 px-3.5">
                        {isDriveActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2 py-0.5 rounded capitalize">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                            {d.status}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#9AA1AA] bg-[#121212] border border-[#222222] px-2 py-0.5 rounded capitalize">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#9AA1AA]" />
                            {d.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="inline-flex items-center gap-1 text-xs font-mono text-[#EDEDED] bg-[#121212] border border-[#222222] px-2 py-0.5 rounded">
                          <Users className="h-3 w-3 text-[#9AA1AA]" />
                          {d.applications_count}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-xs text-[#9AA1AA]">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-[#9AA1AA]/60" />
                          <span>{formatDate(d.drive_date || d.registration_deadline)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <Link href={basePath === '/admin/companies' ? `/admin/placements/${d.id}` : `/placement/drives/${d.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2.5 border-[#222222] text-[#EDEDED] hover:border-[#FF6B00] hover:text-[#FF6B00]"
                          >
                            Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Soft Deactivation Confirmation Modal */}
      {deactivateModalOpen && (
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
                <p className="text-xs text-[#9AA1AA] leading-relaxed">
                  This performs a <strong>soft deactivation</strong>. The company will be marked as inactive and hidden from active drive creation, but all historical placement records and audit logs will remain intact.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#222222] flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setDeactivateModalOpen(false)}
                className="text-xs border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]"
              >
                Cancel
              </Button>

              <Button
                size="sm"
                disabled={isPending}
                onClick={() => handleToggleStatus('inactive')}
                className="text-xs bg-[#EF4444] text-white hover:bg-[#DC2626] font-medium"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                Confirm Deactivation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Deletion Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0A0A] border border-[#222222] rounded-md max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded border border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444] shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#EDEDED]">
                  Delete &quot;{company.company_name}&quot;?
                </h3>
                {hasDrives ? (
                  <div className="text-xs text-[#9AA1AA] leading-relaxed space-y-2 mt-1">
                    <p className="text-[#EF4444] font-medium">
                      Integrity Protection: This company is linked to {drivesTotal} placement drive(s) and historical student applications.
                    </p>
                    <p>
                      Permanent deletion is blocked to prevent relational database conflicts and data loss. Instead, you can <strong>safely deactivate</strong> this company. Deactivated companies will no longer accept new drives while preserving student placement history.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-[#9AA1AA] leading-relaxed mt-1">
                    This company has <strong>0 associated placement drives</strong>. Are you sure you want to permanently delete it from the system? This action cannot be undone.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#222222] flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setDeleteModalOpen(false)}
                className="text-xs border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]"
              >
                Cancel
              </Button>

              {hasDrives ? (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDelete(true)}
                  className="text-xs bg-[#FF6B00] text-black hover:bg-[#FF6B00]/90 font-medium"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                  Safely Deactivate Instead
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDelete(false)}
                  className="text-xs bg-[#EF4444] text-white hover:bg-[#DC2626] font-medium"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                  Permanently Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

