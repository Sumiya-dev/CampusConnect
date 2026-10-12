'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CompanyStatus } from '@/lib/types/database.types';
import { CompanySummary } from '@/lib/types/company.types';
import { deleteCompanyAction } from '@/lib/companies/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Building,
  Search,
  ExternalLink,
  Plus,
  CheckCircle2,
  XCircle,
  Mail,
  MapPin,
  Briefcase,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface CompanyListViewProps {
  initialCompanies: CompanySummary[];
  basePath: '/placement/companies' | '/admin/companies';
  industries: string[];
  roleTitle: string;
}

export function CompanyListView({
  initialCompanies,
  basePath,
  industries,
  roleTitle,
}: CompanyListViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CompanyStatus>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [companyToDelete, setCompanyToDelete] = useState<CompanySummary | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const filteredCompanies = useMemo(() => {
    return initialCompanies.filter((company) => {
      // Status match
      if (statusFilter !== 'all' && company.status !== statusFilter) {
        return false;
      }

      // Industry match
      if (industryFilter !== 'all' && company.industry !== industryFilter) {
        return false;
      }

      // Search match
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matchesName = company.company_name.toLowerCase().includes(query);
        const matchesIndustry = company.industry?.toLowerCase().includes(query) ?? false;
        const matchesLocation = company.location?.toLowerCase().includes(query) ?? false;
        const matchesContact =
          (company.contact_name?.toLowerCase().includes(query) ?? false) ||
          (company.contact_email?.toLowerCase().includes(query) ?? false);

        if (!matchesName && !matchesIndustry && !matchesLocation && !matchesContact) {
          return false;
        }
      }

      return true;
    });
  }, [initialCompanies, search, statusFilter, industryFilter]);

  const stats = useMemo(() => {
    const total = initialCompanies.length;
    const active = initialCompanies.filter((c) => c.status === 'active').length;
    const inactive = initialCompanies.filter((c) => c.status === 'inactive').length;
    return { total, active, inactive };
  }, [initialCompanies]);

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'all' || industryFilter !== 'all';

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setIndustryFilter('all');
  };

  const handleDelete = (forceDeactivate: boolean = false) => {
    if (!companyToDelete) return;
    setModalError(null);
    setActionSuccess(null);
    startTransition(async () => {
      const res = await deleteCompanyAction(companyToDelete.id, forceDeactivate);
      if (res.success) {
        setCompanyToDelete(null);
        setActionSuccess(res.reason || 'Operation completed successfully.');
        router.refresh();
      } else {
        setModalError(res.reason || res.error || 'Failed to perform operation.');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-md border border-border bg-surface p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted">
              Registered Partners
            </div>
            <div className="text-xl font-semibold text-foreground mt-1">{stats.total}</div>
          </div>
          <Building className="h-5 w-5 text-muted" />
        </div>

        <div className="rounded-md border border-border bg-surface p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted">
              Active Recruiter MoUs
            </div>
            <div className="text-xl font-semibold text-foreground mt-1">{stats.active}</div>
          </div>
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        </div>

        <div className="rounded-md border border-border bg-surface p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted">
              Inactive / Suspended
            </div>
            <div className="text-xl font-semibold text-foreground mt-1">{stats.inactive}</div>
          </div>
          <XCircle className="h-5 w-5 text-red-500" />
        </div>
      </div>

      {/* Action Notification */}
      {actionSuccess && (
        <div className="p-3.5 rounded-md border border-green-500/30 bg-green-500/10 text-xs text-green-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-muted hover:text-foreground">
            &times;
          </button>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies by name, domain, location, or recruiter contact..."
            className="pl-9 text-xs h-10 bg-surface border-border text-foreground placeholder:text-muted focus:border-accent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex rounded-md border border-border bg-surface p-0.5">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs rounded transition-colors font-medium ${
                statusFilter === 'all'
                  ? 'bg-elevated text-accent'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 text-xs rounded transition-colors font-medium ${
                statusFilter === 'active'
                  ? 'bg-elevated text-accent'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 text-xs rounded transition-colors font-medium ${
                statusFilter === 'inactive'
                  ? 'bg-elevated text-accent'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Inactive
            </button>
          </div>

          {/* Industry Filter Dropdown */}
          {industries.length > 0 && (
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="text-xs h-10 px-3 rounded-md bg-surface border border-border text-foreground focus:outline-none focus:border-accent"
            >
              <option value="all">All Industries</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          )}

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-xs h-10 border-border text-muted hover:text-foreground"
            >
              Reset
            </Button>
          )}

          {/* Add Company Action */}
          <Link href={`${basePath}/new`}>
            <Button size="sm" className="text-xs h-10 gap-1.5 font-medium">
              <Plus className="h-3.5 w-3.5" />
              <span>Register Company</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Companies List Table */}
      <div className="border border-border rounded-md bg-surface overflow-hidden">
        {filteredCompanies.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <Building className="h-9 w-8 text-muted mx-auto opacity-50" />
            <div className="text-sm font-medium text-foreground">No companies match your query</div>
            <p className="text-xs text-muted max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Try adjusting your search criteria or filter options to locate the company.'
                : 'No corporate recruiting partners have been registered yet.'}
            </p>
            {hasActiveFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="text-xs border-border text-muted hover:text-foreground mt-2"
              >
                Clear all filters
              </Button>
            ) : (
              <Link href={`${basePath}/new`}>
                <Button size="sm" className="text-xs gap-1.5 font-medium mt-2">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Register First Company</span>
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-elevated text-muted uppercase tracking-wider text-xs">
                <tr>
                  <th className="py-3 px-4 font-semibold">Corporate Partner</th>
                  <th className="py-3 px-4 font-semibold">Industry Sector</th>
                  <th className="py-3 px-4 font-semibold">Location</th>
                  <th className="py-3 px-4 font-semibold">Drives</th>
                  <th className="py-3 px-4 font-semibold">Recruiter Contact</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {filteredCompanies.map((c) => {
                  const isActive = c.status === 'active';
                  const drivesCount = c.drivesCount || 0;
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-elevated/50 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded border border-border bg-background text-accent shrink-0 font-semibold text-xs">
                            {c.company_name.substring(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`${basePath}/${c.id}`}
                              className="font-medium text-foreground hover:text-accent transition-colors truncate block"
                            >
                              {c.company_name}
                            </Link>
                            {c.website && (
                              <a
                                href={c.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-muted hover:text-foreground inline-flex items-center gap-1 mt-0.5 truncate max-w-[200px]"
                              >
                                <span>{c.website.replace(/^https?:\/\//, '')}</span>
                                <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-muted">
                        <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                          <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted/60" />
                          <span className="truncate text-xs">{c.industry || 'Not specified'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-muted">
                        <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted/60" />
                          <span className="truncate text-xs">{c.location || 'Remote / Pan-India'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-foreground bg-elevated border border-border px-2 py-0.5 rounded">
                          <Briefcase className="h-3 w-3 text-accent" />
                          {drivesCount} {drivesCount === 1 ? 'drive' : 'drives'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="min-w-0">
                          <div className="font-medium text-xs text-foreground truncate">
                            {c.contact_name || 'Primary Recruiter'}
                          </div>
                          {c.contact_email && (
                            <div className="text-xs text-muted truncate flex items-center gap-1">
                              <Mail className="h-2.5 w-2.5 text-muted/60" />
                              <span className="truncate">{c.contact_email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-500 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted bg-elevated border border-border px-2 py-0.5 rounded">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`${basePath}/${c.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2.5 border-border text-foreground hover:border-accent hover:text-accent"
                            >
                              Details
                            </Button>
                          </Link>
                          <Link href={`${basePath}/${c.id}/edit`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2.5 border-border text-muted hover:text-foreground"
                            >
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setModalError(null);
                              setCompanyToDelete(c);
                            }}
                            className="h-7 text-xs px-2 border-border text-muted hover:text-red-500 hover:border-red-500/30"
                            title="Delete company"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Safe Deletion Modal from List */}
      {companyToDelete && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-md max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded border border-red-500/30 bg-red-500/10 text-red-500 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                  Delete &quot;{companyToDelete.company_name}&quot;?
                </h3>
                {modalError && (
                  <p className="text-xs text-red-500 bg-red-500/10 p-2 rounded border border-red-500/30">
                    {modalError}
                  </p>
                )}
                {(companyToDelete.drivesCount && companyToDelete.drivesCount > 0) ? (
                  <div className="text-xs text-muted leading-relaxed space-y-2 mt-1">
                    <p className="text-red-500 font-medium">
                      Integrity Check: This company is linked to {companyToDelete.drivesCount} placement drive(s).
                    </p>
                    <p>
                      Permanent deletion is blocked to prevent breaking placement records and student application history. You can <strong>safely deactivate</strong> this company instead.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted leading-relaxed mt-1">
                    This company has <strong>0 associated placement drives</strong>. Are you sure you want to permanently delete it?
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setCompanyToDelete(null)}
                className="text-xs border-border text-muted hover:text-foreground"
              >
                Cancel
              </Button>

              {(companyToDelete.drivesCount && companyToDelete.drivesCount > 0) ? (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDelete(true)}
                  className="text-xs bg-accent text-black hover:bg-accent/90 font-medium"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                  Safely Deactivate Instead
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDelete(false)}
                  className="text-xs bg-red-500 text-white hover:bg-[#DC2626] font-medium"
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

