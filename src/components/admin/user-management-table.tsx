'use client';

import { useState, useTransition } from 'react';
import { ManagedUserSummary } from '@/lib/types/profile.types';
import { AccountStatus, UserRole } from '@/lib/types/database.types';
import { updateUserRoleAction, updateUserStatusAction } from '@/lib/profile/actions';
import { ROLE_LABELS } from '@/lib/types/auth.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import {
  Search,
  Filter,
  X,
  User,
  Shield,
  Eye,
  Check,
  AlertTriangle,
  RotateCcw,
  Building,
  Mail,
  Phone,
  Hash,
  Calendar,
  Award,
} from 'lucide-react';

interface UserManagementTableProps {
  initialUsers: ManagedUserSummary[];
}

export function UserManagementTable({ initialUsers }: UserManagementTableProps) {
  const [users, setUsers] = useState<ManagedUserSummary[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [inspectUser, setInspectUser] = useState<ManagedUserSummary | null>(null);
  const [targetStatus, setTargetStatus] = useState<AccountStatus>('active');
  const [targetRole, setTargetRole] = useState<UserRole>('student');

  const [isPending, startTransition] = useTransition();
  const [actionAlert, setActionAlert] = useState<{ success: boolean; text: string } | null>(null);

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.identifier.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.accountStatus === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters = searchQuery !== '' || roleFilter !== 'all' || statusFilter !== 'all';

  // Open modal
  const handleOpenInspect = (user: ManagedUserSummary) => {
    setInspectUser(user);
    setTargetStatus(user.accountStatus);
    setTargetRole(user.role);
    setActionAlert(null);
  };

  // Change Status Handler
  const handleChangeStatus = () => {
    if (!inspectUser) return;
    setActionAlert(null);

    startTransition(async () => {
      const res = await updateUserStatusAction(inspectUser.id, targetStatus);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === inspectUser.id ? { ...u, accountStatus: targetStatus } : u))
        );
        setInspectUser((prev) => (prev ? { ...prev, accountStatus: targetStatus } : null));
        setActionAlert({ success: true, text: res.message || 'Account status updated successfully.' });
      } else {
        setActionAlert({ success: false, text: res.error || 'Failed to update account status.' });
      }
    });
  };

  // Change Role Handler
  const handleChangeRole = () => {
    if (!inspectUser) return;
    setActionAlert(null);

    startTransition(async () => {
      const res = await updateUserRoleAction(inspectUser.id, targetRole);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === inspectUser.id ? { ...u, role: targetRole } : u))
        );
        setInspectUser((prev) => (prev ? { ...prev, role: targetRole } : null));
        setActionAlert({ success: true, text: res.message || 'Role updated successfully.' });
      } else {
        setActionAlert({ success: false, text: res.error || 'Failed to update role.' });
      }
    });
  };

  const roleBadgeMap: Record<UserRole, 'default' | 'secondary' | 'warning' | 'destructive'> = {
    student: 'default',
    faculty: 'secondary',
    placement_officer: 'warning',
    administrator: 'destructive',
  };

  const statusBadgeMap: Record<AccountStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
    active: 'success',
    pending: 'warning',
    suspended: 'destructive',
    inactive: 'secondary',
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters Strip */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 border border-[#222222] bg-[#0A0A0A] rounded-md">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9AA1AA]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name, email, department, or ID..."
            className="pl-8 text-sm h-9 bg-[#000000]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-[#9AA1AA] hover:text-[#EDEDED]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-sm text-[#9AA1AA]">
            <Filter className="h-3 w-3" />
            <span className="hidden sm:inline">Role:</span>
          </div>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-sm h-9 w-32 bg-[#000000]"
          >
            <option value="all">All Roles</option>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
            <option value="placement_officer">Placement</option>
            <option value="administrator">Admin</option>
          </Select>

          <div className="flex items-center gap-1.5 text-sm text-[#9AA1AA] ml-1">
            <span className="hidden sm:inline">Status:</span>
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm h-9 w-32 bg-[#000000]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 text-sm text-[#9AA1AA] gap-1 px-2"
              title="Reset all filters"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Result Count and Status Header */}
      <div className="flex items-center justify-between text-sm text-[#9AA1AA] px-1">
        <span>
          Showing <span className="font-medium text-[#EDEDED]">{filteredUsers.length}</span> of{' '}
          <span className="font-medium text-[#EDEDED]">{users.length}</span> total user accounts
        </span>
        {hasActiveFilters && (
          <span className="text-sm text-[#FF6B00]">Filtered Results</span>
        )}
      </div>

      {/* Users Table */}
      <div className="border border-[#222222] rounded-md overflow-hidden bg-[#0A0A0A]">
        {filteredUsers.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded border border-[#222222] bg-[#121212] text-[#9AA1AA] mx-auto">
              <Search className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-medium text-[#EDEDED]">No matching users found</h3>
              <p className="text-sm text-[#9AA1AA] max-w-sm mx-auto">
                No user accounts match your search query or selected filters. Try broadening your criteria.
              </p>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="text-sm">
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#121212] text-[#9AA1AA] border-b border-[#222222]">
                <tr>
                  <th className="px-4 py-2.5 font-medium uppercase text-sm tracking-wider">User Account</th>
                  <th className="px-4 py-2.5 font-medium uppercase text-sm tracking-wider">Role</th>
                  <th className="px-4 py-2.5 font-medium uppercase text-sm tracking-wider">Department</th>
                  <th className="px-4 py-2.5 font-medium uppercase text-sm tracking-wider">Identifier</th>
                  <th className="px-4 py-2.5 font-medium uppercase text-sm tracking-wider">Account Status</th>
                  <th className="px-4 py-2.5 font-medium uppercase text-sm tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#121212] transition-colors">
                    {/* Name & Email */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#EDEDED]">{user.name}</div>
                      <div className="text-sm text-[#9AA1AA]">{user.email}</div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <Badge variant={roleBadgeMap[user.role]} className="text-sm">
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3 text-[#9AA1AA] max-w-[180px] truncate">
                      {user.department}
                    </td>

                    {/* Identifier */}
                    <td className="px-4 py-3 font-mono text-[#9AA1AA]">
                      {user.identifier}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge variant={statusBadgeMap[user.accountStatus]} className="text-sm">
                        {user.accountStatus.toUpperCase()}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenInspect(user)}
                        className="text-sm h-7 gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Inspect</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details & Governance Modal */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80">
          <div className="w-full max-w-lg border border-[#222222] bg-[#0A0A0A] rounded-md p-6 space-y-6 shadow-none animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#222222] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-[#EDEDED] tracking-tight">
                    User Account Governance
                  </h3>
                  <Badge variant={roleBadgeMap[inspectUser.role]} className="text-sm">
                    {ROLE_LABELS[inspectUser.role]}
                  </Badge>
                </div>
                <p className="text-sm text-[#9AA1AA] mt-0.5">
                  ID: <span className="font-mono text-[#EDEDED]">{inspectUser.identifier}</span>
                </p>
              </div>

              <button
                onClick={() => setInspectUser(null)}
                className="text-[#9AA1AA] hover:text-[#EDEDED] p-1 rounded hover:bg-[#121212] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Action Alert in Modal */}
            {actionAlert && (
              <Alert
                variant={actionAlert.success ? 'success' : 'destructive'}
                title={actionAlert.success ? 'Success' : 'Error'}
              >
                {actionAlert.text}
              </Alert>
            )}

            {/* User Details Grid */}
            <div className="space-y-3">
              <div className="text-sm font-medium uppercase tracking-wider text-[#9AA1AA]">
                Account Information
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm p-3.5 rounded-md bg-[#000000] border border-[#222222]">
                <div>
                  <span className="text-[#9AA1AA] text-sm block">Full Name</span>
                  <span className="font-medium text-[#EDEDED]">{inspectUser.name}</span>
                </div>
                <div>
                  <span className="text-[#9AA1AA] text-sm block">Email Address</span>
                  <span className="font-medium text-[#EDEDED] truncate block">{inspectUser.email}</span>
                </div>
                <div>
                  <span className="text-[#9AA1AA] text-sm block">Department</span>
                  <span className="text-[#EDEDED] truncate block">{inspectUser.department}</span>
                </div>
                <div>
                  <span className="text-[#9AA1AA] text-sm block">Contact Telephone</span>
                  <span className="text-[#EDEDED]">{inspectUser.contactNumber || 'Not specified'}</span>
                </div>

                {inspectUser.role === 'student' && (
                  <>
                    <div>
                      <span className="text-[#9AA1AA] text-sm block">Academic Year</span>
                      <span className="text-[#EDEDED]">Year {inspectUser.year ?? 3}</span>
                    </div>
                    <div>
                      <span className="text-[#9AA1AA] text-sm block">CGPA Standing</span>
                      <span className="font-medium text-[#FF6B00]">{inspectUser.cgpa ?? '8.75'} / 10.0</span>
                    </div>
                  </>
                )}

                {inspectUser.designation && (
                  <div>
                    <span className="text-[#9AA1AA] text-sm block">Designation</span>
                    <span className="text-[#EDEDED]">{inspectUser.designation}</span>
                  </div>
                )}
                {inspectUser.location && (
                  <div>
                    <span className="text-[#9AA1AA] text-sm block">Location</span>
                    <span className="text-[#EDEDED]">{inspectUser.location}</span>
                  </div>
                )}
              </div>

              {/* Skills for students */}
              {inspectUser.role === 'student' && inspectUser.skills && inspectUser.skills.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-sm uppercase font-semibold text-[#9AA1AA] tracking-wider block">
                    Verified Competencies
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {inspectUser.skills.map((sk) => (
                      <span
                        key={sk}
                        className="text-sm px-1.5 py-0.5 rounded border border-[#222222] bg-[#121212] text-[#EDEDED]"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Governance Controls */}
            <div className="space-y-4 pt-3 border-t border-[#222222]">
              <div className="text-sm font-medium uppercase tracking-wider text-[#9AA1AA]">
                Administrative Overrides
              </div>

              {/* Status Update Control */}
              <div className="space-y-2 p-3 bg-[#000000] rounded-md border border-[#222222]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#EDEDED]">
                    Modify Account Status
                  </span>
                  <Badge variant={statusBadgeMap[inspectUser.accountStatus]} className="text-sm">
                    Current: {inspectUser.accountStatus.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as AccountStatus)}
                    className="text-sm h-9 flex-1 bg-[#0A0A0A]"
                    disabled={isPending}
                  >
                    <option value="active">Active (Full Portal Access)</option>
                    <option value="pending">Pending (Awaiting Verification)</option>
                    <option value="inactive">Inactive (Disabled)</option>
                    <option value="suspended">Suspended (Access Revoked)</option>
                  </Select>
                  <Button
                    size="sm"
                    onClick={handleChangeStatus}
                    disabled={isPending || targetStatus === inspectUser.accountStatus}
                    isLoading={isPending}
                    className="h-9 text-sm shrink-0"
                  >
                    Update Status
                  </Button>
                </div>
              </div>

              {/* Role Reassignment Control */}
              <div className="space-y-2 p-3 bg-[#000000] rounded-md border border-[#222222]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#EDEDED]">
                    Reassign Role Authorization
                  </span>
                  <Badge variant={roleBadgeMap[inspectUser.role]} className="text-sm">
                    Current: {ROLE_LABELS[inspectUser.role]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as UserRole)}
                    className="text-sm h-9 flex-1 bg-[#0A0A0A]"
                    disabled={isPending}
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty Member</option>
                    <option value="placement_officer">Placement Officer</option>
                    <option value="administrator">Administrator</option>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleChangeRole}
                    disabled={isPending || targetRole === inspectUser.role}
                    isLoading={isPending}
                    className="h-9 text-sm shrink-0"
                  >
                    Reassign Role
                  </Button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#222222] flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInspectUser(null)}
                className="text-sm text-[#9AA1AA]"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
