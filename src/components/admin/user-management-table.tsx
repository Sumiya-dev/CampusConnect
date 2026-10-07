'use client';

import React, { useState, useTransition } from 'react';
import { ManagedUserSummary } from '@/lib/types/profile.types';
import { AccountStatus, UserRole } from '@/lib/types/database.types';
import {
  AdminAuditLogEntry,
  CreateUserFormData,
  EditUserFormData,
  UserManagementOverviewData,
} from '@/lib/types/admin-users.types';
import {
  createUserByAdminAction,
  editUserByAdminAction,
  changeUserRoleAction,
  changeUserStatusAction,
  safeDeleteUserAction,
} from '@/lib/admin/user-actions';
import { ROLE_LABELS } from '@/lib/types/auth.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Plus,
  Trash2,
  Edit2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  UserX,
  History,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';

interface UserManagementTableProps {
  initialData: UserManagementOverviewData;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

export function UserManagementTable({ initialData }: UserManagementTableProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'audit_logs'>('users');
  const [users, setUsers] = useState<ManagedUserSummary[]>(initialData.users);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogEntry[]>(initialData.auditLogs);
  const [departments] = useState<string[]>(initialData.departments);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal States
  const [inspectUser, setInspectUser] = useState<ManagedUserSummary | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUserSummary | null>(null);

  // Confirmation Modals
  const [confirmRoleChange, setConfirmRoleChange] = useState<{
    user: ManagedUserSummary;
    targetRole: UserRole;
  } | null>(null);

  const [confirmStatusChange, setConfirmStatusChange] = useState<{
    user: ManagedUserSummary;
    targetStatus: AccountStatus;
  } | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<{
    user: ManagedUserSummary;
    forceHardDelete: boolean;
  } | null>(null);

  // Form State for Create
  const [createForm, setCreateForm] = useState<CreateUserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: 'Computer Science & Engineering',
    contactNumber: '',
    identifier: '',
    cgpa: 8.0,
    year: 4,
    designation: 'Assistant Professor',
    cabinLocation: '',
    officeLocation: '',
    adminCode: '',
    accessLevel: 'superadmin',
  });

  // Form State for Edit
  const [editForm, setEditForm] = useState<EditUserFormData>({
    id: '',
    name: '',
    department: '',
    contactNumber: '',
    identifier: '',
    cgpa: 8.0,
    year: 4,
    designation: '',
    cabinLocation: '',
    officeLocation: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q) ||
      u.identifier.toLowerCase().includes(q);

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesDept = departmentFilter === 'all' || u.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || u.accountStatus === statusFilter;

    return matchesSearch && matchesRole && matchesDept && matchesStatus;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setDepartmentFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    roleFilter !== 'all' ||
    departmentFilter !== 'all' ||
    statusFilter !== 'all';

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormError(null);
    setFormSuccess(null);
    setCreateForm({
      name: '',
      email: '',
      password: '',
      role: 'student',
      department: departments[0] || 'Computer Science & Engineering',
      contactNumber: '',
      identifier: '',
      cgpa: 8.0,
      year: 4,
      designation: 'Assistant Professor',
      cabinLocation: '',
      officeLocation: '',
      adminCode: '',
      accessLevel: 'superadmin',
    });
    setIsCreateModalOpen(true);
  };

  // Submit Create
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      const res = await createUserByAdminAction(createForm);
      if (!res.success) {
        setFormError(res.error || 'Failed to create user.');
        return;
      }

      // Add to local state
      const newUser: ManagedUserSummary = {
        id: res.userId || Math.random().toString(),
        name: createForm.name,
        email: createForm.email,
        role: createForm.role,
        department: createForm.department,
        contactNumber: createForm.contactNumber || null,
        accountStatus: 'active',
        identifier:
          createForm.identifier ||
          (createForm.role === 'student' ? 'STU-' : 'FAC-') +
            Math.random().toString().slice(2, 8),
        year: createForm.year,
        cgpa: createForm.cgpa,
        designation: createForm.designation,
        location: createForm.cabinLocation || createForm.officeLocation,
        createdAt: new Date().toISOString(),
      };

      setUsers((prev) => [newUser, ...prev]);

      // Add audit log
      const newAudit: AdminAuditLogEntry = {
        id: Math.random().toString(),
        actor_id: initialData.currentUserAdminId,
        actor_email: 'admin@campusconnect.edu',
        action: 'user_created',
        target_user_id: newUser.id,
        target_user_email: newUser.email,
        details: { role: newUser.role, department: newUser.department },
        status: 'success',
        created_at: new Date().toISOString(),
      };
      setAuditLogs((prev) => [newAudit, ...prev]);

      setIsCreateModalOpen(false);
    });
  };

  // Open Edit Modal
  const handleOpenEdit = (user: ManagedUserSummary) => {
    setFormError(null);
    setFormSuccess(null);
    setEditingUser(user);
    setEditForm({
      id: user.id,
      name: user.name,
      department: user.department,
      contactNumber: user.contactNumber || '',
      identifier: user.identifier || '',
      cgpa: user.cgpa || 8.0,
      year: user.year || 4,
      designation: user.designation || 'Assistant Professor',
      cabinLocation: user.location || '',
      officeLocation: user.location || '',
    });
  };

  // Submit Edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError(null);

    startTransition(async () => {
      const res = await editUserByAdminAction(editForm);
      if (!res.success) {
        setFormError(res.error || 'Failed to update user.');
        return;
      }

      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === editingUser.id) {
            return {
              ...u,
              name: editForm.name,
              department: editForm.department,
              contactNumber: editForm.contactNumber || null,
              identifier: editForm.identifier || u.identifier,
              cgpa: editForm.cgpa,
              year: editForm.year,
              designation: editForm.designation,
              location: editForm.cabinLocation || editForm.officeLocation || u.location,
            };
          }
          return u;
        })
      );

      setEditingUser(null);
    });
  };

  // Execute Role Change
  const handleExecuteRoleChange = () => {
    if (!confirmRoleChange) return;
    const { user, targetRole } = confirmRoleChange;

    startTransition(async () => {
      const res = await changeUserRoleAction(user.id, targetRole);
      if (!res.success) {
        alert(res.error || 'Failed to update role.');
        setConfirmRoleChange(null);
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: targetRole } : u))
      );

      const newAudit: AdminAuditLogEntry = {
        id: Math.random().toString(),
        actor_id: initialData.currentUserAdminId,
        actor_email: 'admin@campusconnect.edu',
        action: 'role_changed',
        target_user_id: user.id,
        target_user_email: user.email,
        details: { old_role: user.role, new_role: targetRole },
        status: 'success',
        created_at: new Date().toISOString(),
      };
      setAuditLogs((prev) => [newAudit, ...prev]);

      setConfirmRoleChange(null);
      if (inspectUser?.id === user.id) {
        setInspectUser({ ...inspectUser, role: targetRole });
      }
    });
  };

  // Execute Status Change
  const handleExecuteStatusChange = () => {
    if (!confirmStatusChange) return;
    const { user, targetStatus } = confirmStatusChange;

    startTransition(async () => {
      const res = await changeUserStatusAction(user.id, targetStatus);
      if (!res.success) {
        alert(res.error || 'Failed to change status.');
        setConfirmStatusChange(null);
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, accountStatus: targetStatus } : u))
      );

      const newAudit: AdminAuditLogEntry = {
        id: Math.random().toString(),
        actor_id: initialData.currentUserAdminId,
        actor_email: 'admin@campusconnect.edu',
        action: targetStatus === 'active' ? 'user_activated' : 'user_deactivated',
        target_user_id: user.id,
        target_user_email: user.email,
        details: { old_status: user.accountStatus, new_status: targetStatus },
        status: 'success',
        created_at: new Date().toISOString(),
      };
      setAuditLogs((prev) => [newAudit, ...prev]);

      setConfirmStatusChange(null);
      if (inspectUser?.id === user.id) {
        setInspectUser({ ...inspectUser, accountStatus: targetStatus });
      }
    });
  };

  // Execute Deletion
  const handleExecuteDelete = () => {
    if (!confirmDelete) return;
    const { user, forceHardDelete } = confirmDelete;

    startTransition(async () => {
      const res = await safeDeleteUserAction(user.id, forceHardDelete);
      if (!res.success) {
        alert(res.error || 'Failed to delete user.');
        setConfirmDelete(null);
        return;
      }

      if (res.action === 'soft_deleted') {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, accountStatus: 'inactive' } : u))
        );
        alert(res.message || 'User account deactivated safely to protect placement history.');
      } else {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
      }

      const newAudit: AdminAuditLogEntry = {
        id: Math.random().toString(),
        actor_id: initialData.currentUserAdminId,
        actor_email: 'admin@campusconnect.edu',
        action: res.action === 'soft_deleted' ? 'user_deactivated' : 'user_deleted',
        target_user_id: user.id,
        target_user_email: user.email,
        details: { action: res.action, message: res.message },
        status: 'success',
        created_at: new Date().toISOString(),
      };
      setAuditLogs((prev) => [newAudit, ...prev]);

      setConfirmDelete(null);
      if (inspectUser?.id === user.id) setInspectUser(null);
    });
  };

  // Role Badge Styling
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'administrator':
        return (
          <Badge className="bg-rose-950/60 text-rose-300 border-rose-800/50 text-[11px] font-mono">
            Superadmin
          </Badge>
        );
      case 'faculty':
        return (
          <Badge className="bg-purple-950/60 text-purple-300 border-purple-800/50 text-[11px] font-mono">
            Faculty
          </Badge>
        );
      case 'placement_officer':
        return (
          <Badge className="bg-amber-950/60 text-amber-300 border-amber-800/50 text-[11px] font-mono">
            Placement Officer
          </Badge>
        );
      default:
        return (
          <Badge className="bg-sky-950/60 text-sky-300 border-sky-800/50 text-[11px] font-mono">
            Student
          </Badge>
        );
    }
  };

  // Status Badge Styling
  const getStatusBadge = (status: AccountStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Active
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
            Suspended
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-[#9AA1AA] font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-[#666666]"></span>
            Inactive
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* View Switcher Tabs & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-[#181818] text-[#EDEDED] border border-[#333333]'
                : 'text-[#9AA1AA] hover:text-[#EDEDED]'
            }`}
          >
            User Accounts ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit_logs')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'audit_logs'
                ? 'bg-[#181818] text-[#EDEDED] border border-[#333333]'
                : 'text-[#9AA1AA] hover:text-[#EDEDED]'
            }`}
          >
            <History className="h-3 w-3 text-[#FF6B00]" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        {activeTab === 'users' && (
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="bg-[#EDEDED] text-black hover:bg-white text-xs h-8 px-3 gap-1.5 font-medium shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create User</span>
          </Button>
        )}
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Search */}
            <div className="sm:col-span-4 relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9AA1AA]" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search name, email, roll/emp ID..."
                className="pl-8 text-xs bg-[#0A0A0A] border-[#222222] text-[#EDEDED] placeholder:text-[#9AA1AA] h-8"
              />
            </div>

            {/* Role Filter */}
            <div className="sm:col-span-3">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-8 px-2 text-xs bg-[#0A0A0A] border border-[#222222] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
              >
                <option value="all">All Roles</option>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="placement_officer">Placement Officer</option>
                <option value="administrator">Superadmin</option>
              </select>
            </div>

            {/* Department Filter */}
            <div className="sm:col-span-3">
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-8 px-2 text-xs bg-[#0A0A0A] border border-[#222222] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="sm:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-8 px-2 text-xs bg-[#0A0A0A] border border-[#222222] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Active filters notice */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between text-xs text-[#9AA1AA] bg-[#0E0E0E] px-3 py-1.5 rounded border border-[#222222]">
              <span>
                Filtering {filteredUsers.length} of {users.length} users
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="text-[#FF6B00] hover:underline flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Clear Filters
              </button>
            </div>
          )}

          {/* Users Table */}
          <div className="border border-[#222222] rounded-md bg-[#0A0A0A] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121212] border-b border-[#222222] text-[#9AA1AA]">
                  <tr>
                    <th className="py-2.5 px-3 font-medium">User / Identity</th>
                    <th className="py-2.5 px-3 font-medium">Role</th>
                    <th className="py-2.5 px-3 font-medium">Department</th>
                    <th className="py-2.5 px-3 font-medium">Identifier</th>
                    <th className="py-2.5 px-3 font-medium">Status</th>
                    <th className="py-2.5 px-3 font-medium">Created</th>
                    <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#9AA1AA]">
                        No users match the selected query and filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#0E0E0E] transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-[#EDEDED]">{u.name}</div>
                          <div className="text-[11px] text-[#9AA1AA] font-mono">{u.email}</div>
                        </td>
                        <td className="py-2.5 px-3">{getRoleBadge(u.role)}</td>
                        <td className="py-2.5 px-3 text-[#EDEDED] truncate max-w-[180px]">
                          {u.department}
                        </td>
                        <td className="py-2.5 px-3 text-[#9AA1AA] font-mono">{u.identifier}</td>
                        <td className="py-2.5 px-3">{getStatusBadge(u.accountStatus)}</td>
                        <td className="py-2.5 px-3 text-[#9AA1AA] font-mono">
                          {formatDate(u.createdAt).split(',')[0]}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            {/* Inspect */}
                            <button
                              type="button"
                              onClick={() => setInspectUser(u)}
                              title="View Complete Details"
                              className="p-1 rounded text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#181818]"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(u)}
                              title="Edit User Profile"
                              className="p-1 rounded text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#181818]"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>

                            {/* Change Role Trigger */}
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmRoleChange({
                                  user: u,
                                  targetRole:
                                    u.role === 'student'
                                      ? 'faculty'
                                      : u.role === 'faculty'
                                      ? 'placement_officer'
                                      : 'student',
                                })
                              }
                              title="Modify Role"
                              className="p-1 rounded text-[#9AA1AA] hover:text-[#FF6B00] hover:bg-[#181818]"
                            >
                              <Shield className="h-3.5 w-3.5" />
                            </button>

                            {/* Toggle Status Trigger */}
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmStatusChange({
                                  user: u,
                                  targetStatus: u.accountStatus === 'active' ? 'inactive' : 'active',
                                })
                              }
                              title={
                                u.accountStatus === 'active'
                                  ? 'Deactivate User'
                                  : 'Activate User'
                              }
                              className={`p-1 rounded hover:bg-[#181818] ${
                                u.accountStatus === 'active'
                                  ? 'text-[#9AA1AA] hover:text-amber-400'
                                  : 'text-emerald-400 hover:text-emerald-300'
                              }`}
                            >
                              {u.accountStatus === 'active' ? (
                                <UserX className="h-3.5 w-3.5" />
                              ) : (
                                <UserCheck className="h-3.5 w-3.5" />
                              )}
                            </button>

                            {/* Delete Trigger */}
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDelete({ user: u, forceHardDelete: false })
                              }
                              title="Safe Delete User"
                              className="p-1 rounded text-[#9AA1AA] hover:text-rose-400 hover:bg-[#181818]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[#101010] border-t border-[#222222] text-xs text-[#9AA1AA]">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-6 px-1.5 text-xs bg-[#181818] border border-[#262626] rounded text-[#EDEDED]"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="ml-2 font-mono">
                  Showing {filteredUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2 text-xs border-[#262626] text-[#EDEDED] disabled:opacity-30"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span className="sr-only">Previous</span>
                </Button>
                <span className="px-2 font-mono text-xs">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 px-2 text-xs border-[#262626] text-[#EDEDED] disabled:opacity-30"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="sr-only">Next</span>
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Audit Logs Feed */
        <div className="border border-[#222222] rounded-md bg-[#0A0A0A] divide-y divide-[#1A1A1A]">
          <div className="p-4 bg-[#121212] border-b border-[#222222] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-[#EDEDED] uppercase tracking-wider">
                Immutable Privileged Audit Stream
              </h3>
              <p className="text-[11px] text-[#9AA1AA] mt-0.5">
                Every user creation, role modification, status toggle, and deletion event recorded cryptographically.
              </p>
            </div>
            <Badge variant="outline" className="text-xs border-[#333333] text-[#9AA1AA]">
              {auditLogs.length} Records Logged
            </Badge>
          </div>

          {auditLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#9AA1AA]">No audit logs recorded yet.</div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-[#0E0E0E] transition-colors space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                        log.action === 'role_changed'
                          ? 'border-purple-800/40 bg-purple-950/40 text-purple-300'
                          : log.action === 'user_created'
                          ? 'border-emerald-800/40 bg-emerald-950/40 text-emerald-300'
                          : log.action === 'user_deleted'
                          ? 'border-rose-800/40 bg-rose-950/40 text-rose-300'
                          : log.action === 'user_deactivated'
                          ? 'border-amber-800/40 bg-amber-950/40 text-amber-300'
                          : 'border-[#333333] bg-[#181818] text-[#9AA1AA]'
                      }`}
                    >
                      {log.action.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-[#EDEDED] font-mono">
                      Target: {log.target_user_email || log.target_user_id || 'System'}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#9AA1AA] font-mono">
                    {formatDate(log.created_at)}
                  </span>
                </div>

                <div className="text-xs text-[#9AA1AA] font-mono flex items-center gap-2">
                  <span>Actor: {log.actor_email}</span>
                  <span className="text-[#333333]">•</span>
                  <span>Status: {log.status}</span>
                </div>

                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="p-2 rounded bg-[#121212] border border-[#222222] text-[11px] font-mono text-[#9AA1AA] overflow-x-auto">
                    {JSON.stringify(log.details)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Inspect User Modal */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-0">
          <div className="bg-[#0D0D0D] border border-[#222222] rounded-md max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[#FF6B00]" />
                <h3 className="text-sm font-semibold text-[#EDEDED]">Complete User Profile Dossier</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectUser(null)}
                className="text-[#9AA1AA] hover:text-[#EDEDED] p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded bg-[#121212] border border-[#222222]">
                <div>
                  <span className="text-[11px] text-[#9AA1AA] block">Full Name</span>
                  <span className="font-medium text-[#EDEDED]">{inspectUser.name}</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#9AA1AA] block">Institutional Email</span>
                  <span className="font-mono text-[#EDEDED]">{inspectUser.email}</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#9AA1AA] block">Assigned Role</span>
                  <div className="mt-0.5">{getRoleBadge(inspectUser.role)}</div>
                </div>
                <div>
                  <span className="text-[11px] text-[#9AA1AA] block">Account Status</span>
                  <div className="mt-0.5">{getStatusBadge(inspectUser.accountStatus)}</div>
                </div>
                <div>
                  <span className="text-[11px] text-[#9AA1AA] block">Department</span>
                  <span className="text-[#EDEDED]">{inspectUser.department}</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#9AA1AA] block">Primary Identifier</span>
                  <span className="font-mono text-[#EDEDED]">{inspectUser.identifier}</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#9AA1AA] block">Contact Number</span>
                  <span className="text-[#EDEDED]">{inspectUser.contactNumber || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#9AA1AA] block">User UUID</span>
                  <span className="font-mono text-[10px] text-[#9AA1AA] truncate block">
                    {inspectUser.id}
                  </span>
                </div>
              </div>

              {/* Role-Specific Records */}
              {inspectUser.role === 'student' && (
                <div className="p-3 rounded bg-[#121212] border border-[#222222] space-y-2">
                  <span className="text-[11px] text-[#FF6B00] font-mono uppercase block">
                    Academic Candidate Specifications
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-[#9AA1AA] block">Academic Year</span>
                      <span className="text-[#EDEDED] font-mono">Year {inspectUser.year || 4}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9AA1AA] block">Cumulative CGPA</span>
                      <span className="text-[#EDEDED] font-mono">
                        {inspectUser.cgpa?.toFixed(2) || '8.00'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9AA1AA] block">Placement Status</span>
                      <span className="text-[#EDEDED] font-mono uppercase text-[10px]">
                        {inspectUser.placementStatus || 'unplaced'}
                      </span>
                    </div>
                  </div>
                  {inspectUser.skills && inspectUser.skills.length > 0 && (
                    <div>
                      <span className="text-[10px] text-[#9AA1AA] block mb-1">Endorsed Skills</span>
                      <div className="flex flex-wrap gap-1">
                        {inspectUser.skills.map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.5 rounded bg-[#1A1A1A] border border-[#262626] text-[10px] text-[#EDEDED]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {inspectUser.role === 'faculty' && (
                <div className="p-3 rounded bg-[#121212] border border-[#222222] space-y-1">
                  <span className="text-[11px] text-[#FF6B00] font-mono uppercase block">
                    Faculty Appointment Details
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-[#9AA1AA] block">Designation</span>
                      <span className="text-[#EDEDED]">
                        {inspectUser.designation || 'Assistant Professor'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9AA1AA] block">Cabin / Office</span>
                      <span className="text-[#EDEDED]">{inspectUser.location || 'Faculty Block'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectUser(null)}
                className="text-xs border-[#222222] text-[#EDEDED] h-8"
              >
                Close Dossier
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-0">
          <div className="bg-[#0D0D0D] border border-[#222222] rounded-md max-w-lg w-full p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#FF6B00]" />
                <h3 className="text-sm font-semibold text-[#EDEDED]">Provision Institutional Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#9AA1AA] hover:text-[#EDEDED] p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#EDEDED]">
                    Full Name <span className="text-[#FF6B00]">*</span>
                  </label>
                  <Input
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g. Dr. Priya Raman"
                    className="text-xs bg-[#121212] border-[#222222] text-[#EDEDED] h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#EDEDED]">
                    Institutional Email <span className="text-[#FF6B00]">*</span>
                  </label>
                  <Input
                    required
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="priya.raman@university.edu"
                    className="text-xs bg-[#121212] border-[#222222] text-[#EDEDED] h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#EDEDED]">
                    Temporary Password <span className="text-[#FF6B00]">*</span>
                  </label>
                  <Input
                    required
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Min 8 characters"
                    className="text-xs bg-[#121212] border-[#222222] text-[#EDEDED] h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#EDEDED]">
                    Account Role <span className="text-[#FF6B00]">*</span>
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, role: e.target.value as UserRole })
                    }
                    className="w-full h-8 px-2 text-xs bg-[#121212] border border-[#222222] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty Member</option>
                    <option value="placement_officer">Placement Officer</option>
                    <option value="administrator">System Administrator (Superadmin)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#EDEDED]">
                    Department <span className="text-[#FF6B00]">*</span>
                  </label>
                  <select
                    value={createForm.department}
                    onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                    className="w-full h-8 px-2 text-xs bg-[#121212] border border-[#222222] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#EDEDED]">Contact Number</label>
                  <Input
                    value={createForm.contactNumber}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, contactNumber: e.target.value })
                    }
                    placeholder="+91 98765 43210"
                    className="text-xs bg-[#121212] border-[#222222] text-[#EDEDED] h-8"
                  />
                </div>
              </div>

              {/* Dynamic role fields */}
              {createForm.role === 'student' && (
                <div className="p-3 rounded bg-[#121212] border border-[#222222] space-y-2">
                  <span className="text-[10px] text-[#FF6B00] font-mono uppercase block">
                    Student Academic Fields
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#9AA1AA]">Roll No / Identifier</label>
                      <Input
                        value={createForm.identifier}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, identifier: e.target.value })
                        }
                        placeholder="24CSE001"
                        className="text-xs bg-[#181818] border-[#262626] text-[#EDEDED] h-7"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#9AA1AA]">Academic Year</label>
                      <select
                        value={createForm.year}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, year: Number(e.target.value) })
                        }
                        className="w-full h-7 px-1.5 text-xs bg-[#181818] border border-[#262626] text-[#EDEDED] rounded"
                      >
                        <option value={4}>Year 4</option>
                        <option value={3}>Year 3</option>
                        <option value={2}>Year 2</option>
                        <option value={1}>Year 1</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#9AA1AA]">Initial CGPA</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={createForm.cgpa}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, cgpa: Number(e.target.value) })
                        }
                        className="text-xs bg-[#181818] border-[#262626] text-[#EDEDED] h-7"
                      />
                    </div>
                  </div>
                </div>
              )}

              {createForm.role === 'faculty' && (
                <div className="p-3 rounded bg-[#121212] border border-[#222222] space-y-2">
                  <span className="text-[10px] text-[#FF6B00] font-mono uppercase block">
                    Faculty Details
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#9AA1AA]">Employee ID</label>
                      <Input
                        value={createForm.identifier}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, identifier: e.target.value })
                        }
                        placeholder="FAC-CSE-002"
                        className="text-xs bg-[#181818] border-[#262626] text-[#EDEDED] h-7"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#9AA1AA]">Designation</label>
                      <Input
                        value={createForm.designation}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, designation: e.target.value })
                        }
                        placeholder="Associate Professor"
                        className="text-xs bg-[#181818] border-[#262626] text-[#EDEDED] h-7"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222222]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-xs border-[#222222] text-[#EDEDED] h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="bg-[#EDEDED] text-black hover:bg-white text-xs h-8 px-4 font-medium"
                >
                  {isPending ? 'Provisioning...' : 'Provision User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-0">
          <div className="bg-[#0D0D0D] border border-[#222222] rounded-md max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-[#FF6B00]" />
                <h3 className="text-sm font-semibold text-[#EDEDED]">
                  Edit Profile: {editingUser.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-[#9AA1AA] hover:text-[#EDEDED] p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#EDEDED]">Full Name</label>
                <Input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="text-xs bg-[#121212] border-[#222222] text-[#EDEDED] h-8"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#EDEDED]">Department</label>
                  <select
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full h-8 px-2 text-xs bg-[#121212] border border-[#222222] text-[#EDEDED] rounded-md"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#EDEDED]">Identifier / ID</label>
                  <Input
                    value={editForm.identifier}
                    onChange={(e) => setEditForm({ ...editForm, identifier: e.target.value })}
                    className="text-xs bg-[#121212] border-[#222222] text-[#EDEDED] h-8"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#EDEDED]">Contact Number</label>
                <Input
                  value={editForm.contactNumber}
                  onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
                  className="text-xs bg-[#121212] border-[#222222] text-[#EDEDED] h-8"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222222]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingUser(null)}
                  className="text-xs border-[#222222] text-[#EDEDED] h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="bg-[#EDEDED] text-black hover:bg-white text-xs h-8 px-4 font-medium"
                >
                  {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Change Confirmation Modal */}
      {confirmRoleChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-0">
          <div className="bg-[#0D0D0D] border border-purple-800/40 rounded-md max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-2 text-purple-400">
              <ShieldAlert className="h-4 w-4" />
              <h3 className="text-sm font-semibold">Modify Account Authorization</h3>
            </div>
            <p className="text-xs text-[#9AA1AA] leading-relaxed">
              Changing user authorization is a privileged operation. Select the new role for{' '}
              <strong className="text-[#EDEDED]">{confirmRoleChange.user.name}</strong>:
            </p>

            <div className="space-y-2">
              {(['student', 'faculty', 'placement_officer', 'administrator'] as UserRole[]).map(
                (r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() =>
                      setConfirmRoleChange({ ...confirmRoleChange, targetRole: r })
                    }
                    className={`w-full p-2.5 rounded text-left text-xs border transition-colors flex items-center justify-between ${
                      confirmRoleChange.targetRole === r
                        ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-[#EDEDED]'
                        : 'border-[#222222] bg-[#121212] text-[#9AA1AA] hover:text-[#EDEDED]'
                    }`}
                  >
                    <span>{ROLE_LABELS[r]}</span>
                    {confirmRoleChange.targetRole === r && (
                      <Check className="h-3 w-3 text-[#FF6B00]" />
                    )}
                  </button>
                )
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmRoleChange(null)}
                className="text-xs border-[#222222] text-[#EDEDED] h-8"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isPending}
                onClick={handleExecuteRoleChange}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs h-8 px-3 font-medium"
              >
                {isPending ? 'Updating...' : 'Confirm Role'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      {confirmStatusChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-0">
          <div className="bg-[#0D0D0D] border border-amber-800/40 rounded-md max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <h3 className="text-sm font-semibold">
                {confirmStatusChange.targetStatus === 'active'
                  ? 'Reactivate Account'
                  : 'Deactivate Account'}
              </h3>
            </div>
            <p className="text-xs text-[#9AA1AA] leading-relaxed">
              Are you sure you want to change the status of{' '}
              <strong className="text-[#EDEDED]">{confirmStatusChange.user.name}</strong> to{' '}
              <strong className="text-[#EDEDED] uppercase">
                {confirmStatusChange.targetStatus}
              </strong>
              ?{' '}
              {confirmStatusChange.targetStatus !== 'active' &&
                'The user will be immediately barred from logging in.'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmStatusChange(null)}
                className="text-xs border-[#222222] text-[#EDEDED] h-8"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isPending}
                onClick={handleExecuteStatusChange}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs h-8 px-3 font-medium"
              >
                {isPending ? 'Updating...' : 'Confirm Status'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-0">
          <div className="bg-[#0D0D0D] border border-rose-800/40 rounded-md max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <Trash2 className="h-4 w-4" />
              <h3 className="text-sm font-semibold">Delete Account: {confirmDelete.user.name}</h3>
            </div>
            <p className="text-xs text-[#9AA1AA] leading-relaxed">
              If this account has historical placement drives, application history, or academic
              records, the system will apply a <strong>Safe Deactivation (soft delete)</strong> to
              preserve university audit integrity.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(null)}
                className="text-xs border-[#222222] text-[#EDEDED] h-8"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isPending}
                onClick={handleExecuteDelete}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs h-8 px-3 font-medium"
              >
                {isPending ? 'Executing...' : 'Confirm Safe Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
