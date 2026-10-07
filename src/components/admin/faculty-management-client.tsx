'use client';

import React, { useState, useTransition } from 'react';
import {
  CreateFacultyFormData,
  EditFacultyFormData,
  FacultyClassAssignmentDetail,
  FacultyManagementOverviewData,
  FacultyMemberDetail,
  FacultyTrainingAssignmentDetail,
} from '@/lib/types/faculty-allocations.types';
import {
  assignFacultyToSectionAction,
  assignFacultyToTrainingGroupAction,
  createFacultyAction,
  removeFacultyFromSectionAction,
  removeFacultyFromTrainingGroupAction,
  safeDeleteFacultyAction,
  toggleFacultyStatusAction,
  updateFacultyAction,
} from '@/lib/admin/faculty-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AccountStatus } from '@/lib/types/database.types';
import {
  AlertTriangle,
  BookOpen,
  Briefcase,
  Building,
  CheckCircle2,
  Code,
  Edit2,
  GraduationCap,
  Layers,
  ListFilter,
  Plus,
  Power,
  RotateCcw,
  Search,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

interface FacultyManagementClientProps {
  initialData: FacultyManagementOverviewData;
}

export function FacultyManagementClient({ initialData }: FacultyManagementClientProps) {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<FacultyManagementOverviewData>(initialData);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');

  // Notifications
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyMemberDetail | null>(null);
  const [allocatingFaculty, setAllocatingFaculty] = useState<FacultyMemberDetail | null>(null);

  // Delete / Deactivate modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    faculty: FacultyMemberDetail;
    dependencyCount: number;
  } | null>(null);

  const showNotice = (type: 'success' | 'error' | 'info', message: string) => {
    setNotice({ type, message });
    setTimeout(() => {
      setNotice(null);
    }, 6000);
  };

  // Filtered Faculty List
  const filteredFaculty = data.facultyList.filter((f) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      f.name.toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q) ||
      f.employee_id.toLowerCase().includes(q) ||
      f.department.toLowerCase().includes(q) ||
      f.designation.toLowerCase().includes(q);

    const matchesDept = departmentFilter === 'all' || f.department.toLowerCase() === departmentFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || f.account_status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setDepartmentFilter('all');
    setStatusFilter('all');
  };

  // Status toggle
  const handleToggleStatus = (faculty: FacultyMemberDetail) => {
    const newStatus: AccountStatus = faculty.account_status === 'active' ? 'inactive' : 'active';
    startTransition(async () => {
      const res = await toggleFacultyStatusAction(faculty.user_id, newStatus);
      if (res.success) {
        setData((prev) => ({
          ...prev,
          facultyList: prev.facultyList.map((f) => (f.id === faculty.id ? { ...f, account_status: newStatus } : f)),
        }));
        showNotice('success', `Faculty account status updated to ${newStatus}.`);
      } else {
        showNotice('error', res.error || 'Failed to update account status.');
      }
    });
  };

  // Delete / Deactivate handler
  const handleExecuteDeleteOrDeactivate = (forceDeactivate: boolean = false) => {
    if (!deleteConfirm) return;
    const { faculty } = deleteConfirm;

    startTransition(async () => {
      const res = await safeDeleteFacultyAction(faculty.id, faculty.user_id, forceDeactivate);
      if (res.success) {
        if (res.actionTaken === 'deleted') {
          setData((prev) => ({
            ...prev,
            facultyList: prev.facultyList.filter((f) => f.id !== faculty.id),
          }));
          showNotice('success', 'Faculty record permanently removed.');
        } else {
          setData((prev) => ({
            ...prev,
            facultyList: prev.facultyList.map((f) =>
              f.id === faculty.id ? { ...f, account_status: 'inactive' } : f
            ),
          }));
          showNotice('info', res.reason || 'Faculty account safely deactivated.');
        }
      } else {
        showNotice('error', res.reason || res.error || 'Action failed.');
      }
      setDeleteConfirm(null);
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Banner Notice */}
      {notice && (
        <div
          className={`p-3 rounded-md border text-xs flex items-center justify-between ${
            notice.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
              : notice.type === 'error'
              ? 'border-rose-500/20 bg-rose-500/10 text-rose-400'
              : 'border-[#FF6B00]/20 bg-[#FF6B00]/10 text-[#FF6B00]'
          }`}
        >
          <span>{notice.message}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-inherit hover:opacity-75 ml-2">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Action Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#0E0E0E] p-3 rounded-md border border-[#222222]">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9AA1AA]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search faculty by name, employee ID, role..."
              className="pl-8 h-8 text-xs bg-[#0A0A0A] border-[#222222] text-[#EDEDED] placeholder:text-[#666666] focus:border-[#FF6B00]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9AA1AA] hover:text-[#EDEDED]"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="h-8 px-2.5 text-xs bg-[#0A0A0A] border border-[#222222] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00] max-w-[200px] truncate"
          >
            <option value="all">All Departments</option>
            {data.departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.code} — {d.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-8 px-2.5 text-xs bg-[#0A0A0A] border border-[#222222] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="suspended">Suspended Only</option>
          </select>

          {(searchQuery || departmentFilter !== 'all' || statusFilter !== 'all') && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-xs text-[#9AA1AA] hover:text-[#EDEDED] gap-1 px-2"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          )}
        </div>

        <div>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="h-8 text-xs bg-[#FF6B00] hover:bg-[#E56000] text-black font-semibold gap-1.5 shadow-none"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Faculty Member
          </Button>
        </div>
      </div>

      {/* Faculty Table */}
      <div className="border border-[#222222] rounded-md bg-[#0A0A0A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#121212] border-b border-[#222222] text-[#9AA1AA]">
              <tr>
                <th className="py-2.5 px-3 font-medium">Faculty Member</th>
                <th className="py-2.5 px-3 font-medium">Department & Designation</th>
                <th className="py-2.5 px-3 font-medium">Class Section Allocations</th>
                <th className="py-2.5 px-3 font-medium">Training Cohorts</th>
                <th className="py-2.5 px-3 font-medium">Status</th>
                <th className="py-2.5 px-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {filteredFaculty.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[#9AA1AA]">
                    No faculty members found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredFaculty.map((faculty) => (
                  <tr key={faculty.id} className="hover:bg-[#121212]/60 transition-colors">
                    {/* Faculty Details */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-[#EDEDED] flex items-center gap-1.5">
                        <span>{faculty.name}</span>
                      </div>
                      <div className="text-[11px] text-[#9AA1AA]">{faculty.email}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[#FF6B00] bg-[#FF6B00]/10 px-1.5 py-0.5 rounded border border-[#FF6B00]/20">
                          {faculty.employee_id}
                        </span>
                        {faculty.cabin_location && (
                          <span className="text-[10px] text-[#666666]">📍 {faculty.cabin_location}</span>
                        )}
                      </div>
                    </td>

                    {/* Department & Designation */}
                    <td className="py-3 px-3">
                      <div className="text-[#EDEDED] font-medium">{faculty.department}</div>
                      <div className="text-[11px] text-[#9AA1AA]">{faculty.designation}</div>
                    </td>

                    {/* Class Allocations */}
                    <td className="py-3 px-3 max-w-xs">
                      {faculty.class_assignments.length === 0 ? (
                        <span className="text-[#666666] italic">No sections allocated</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {faculty.class_assignments.map((ca) => (
                            <span
                              key={ca.id}
                              title={`${ca.department_code || ''} Year ${ca.year} - ${ca.section_name} (${ca.students_count} students enrolled)`}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#161616] border border-[#282828] text-[#CCCCCC]"
                            >
                              <span className="text-[#FF6B00] font-semibold">{ca.department_code || ca.program_code}</span>
                              <span className="text-[#666666]">Yr{ca.year}</span>
                              <span>{ca.section_name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="text-[10px] text-[#666666] mt-1">
                        {faculty.class_assignments.length} section(s) •{' '}
                        {faculty.class_assignments.reduce((s, a) => s + a.students_count, 0)} student reach
                      </div>
                    </td>

                    {/* Training Allocations */}
                    <td className="py-3 px-3 max-w-xs">
                      {faculty.training_assignments.length === 0 ? (
                        <span className="text-[#666666] italic">No groups allocated</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {faculty.training_assignments.map((ta) => (
                            <span
                              key={ta.id}
                              title={`${ta.training_group_name} (${ta.students_count} students enrolled)`}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-950/30 border border-blue-800/30 text-blue-300"
                            >
                              <Code className="h-2.5 w-2.5" />
                              <span>{ta.training_group_name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="text-[10px] text-[#666666] mt-1">
                        {faculty.training_assignments.length} cohort(s) • {faculty.total_sessions_count} session(s)
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                          faculty.account_status === 'active'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                            : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            faculty.account_status === 'active' ? 'bg-emerald-400' : 'bg-zinc-500'
                          }`}
                        />
                        {faculty.account_status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAllocatingFaculty(faculty)}
                          className="h-7 text-xs border-[#262626] text-[#FF6B00] hover:bg-[#FF6B00]/10 hover:border-[#FF6B00]/30 px-2 gap-1"
                        >
                          <Layers className="h-3 w-3" />
                          <span>Allocations</span>
                        </Button>

                        <button
                          type="button"
                          title="Edit Faculty Details"
                          onClick={() => setEditingFaculty(faculty)}
                          className="p-1 rounded text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#1A1A1A] transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          title={faculty.account_status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                          onClick={() => handleToggleStatus(faculty)}
                          disabled={isPending}
                          className={`p-1 rounded transition-colors ${
                            faculty.account_status === 'active'
                              ? 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-400/10'
                              : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-400/10'
                          }`}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          title="Delete Faculty"
                          onClick={() =>
                            setDeleteConfirm({
                              faculty,
                              dependencyCount:
                                faculty.class_assignments.length +
                                faculty.training_assignments.length +
                                faculty.total_sessions_count,
                            })
                          }
                          className="p-1 rounded text-rose-400/70 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
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
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 1: ADD FACULTY MEMBER                                          */}
      {/* -------------------------------------------------------------------- */}
      {isCreateOpen && (
        <CreateFacultyDialog
          departments={data.departments}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={(newFaculty) => {
            setIsCreateOpen(false);
            setData((prev) => ({
              ...prev,
              facultyList: [newFaculty, ...prev.facultyList],
            }));
            showNotice('success', `Faculty member ${newFaculty.name} provisioned successfully.`);
          }}
        />
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 2: EDIT FACULTY DETAILS                                        */}
      {/* -------------------------------------------------------------------- */}
      {editingFaculty && (
        <EditFacultyDialog
          faculty={editingFaculty}
          departments={data.departments}
          onClose={() => setEditingFaculty(null)}
          onSuccess={(updated) => {
            setEditingFaculty(null);
            setData((prev) => ({
              ...prev,
              facultyList: prev.facultyList.map((f) => (f.id === updated.id ? { ...f, ...updated } : f)),
            }));
            showNotice('success', 'Faculty details updated successfully.');
          }}
        />
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 3: MANAGE ALLOCATIONS (SECTIONS & TRAINING GROUPS)             */}
      {/* -------------------------------------------------------------------- */}
      {allocatingFaculty && (
        <ManageAllocationsDialog
          faculty={allocatingFaculty}
          departments={data.departments}
          programs={data.programs}
          sections={data.sections}
          trainingGroups={data.trainingGroups}
          onClose={() => setAllocatingFaculty(null)}
          onAllocationChanged={(updatedFaculty) => {
            setAllocatingFaculty(updatedFaculty);
            setData((prev) => ({
              ...prev,
              facultyList: prev.facultyList.map((f) => (f.id === updatedFaculty.id ? updatedFaculty : f)),
            }));
          }}
        />
      )}

      {/* -------------------------------------------------------------------- */}
      {/* CONFIRMATION MODAL: DELETE / SAFE DEACTIVATION                       */}
      {/* -------------------------------------------------------------------- */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-[#222222] rounded-lg max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-full ${
                  deleteConfirm.dependencyCount > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                }`}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[#EDEDED]">
                  {deleteConfirm.dependencyCount > 0 ? 'Institutional Record Safeguard' : 'Confirm Permanent Deletion'}
                </h3>
                <p className="text-xs text-[#9AA1AA] mt-1 font-medium">
                  {deleteConfirm.faculty.name} ({deleteConfirm.faculty.employee_id})
                </p>
              </div>
            </div>

            {deleteConfirm.dependencyCount > 0 ? (
              <div className="p-3 rounded-md bg-[#1A1A1A] border border-[#282828] text-xs text-[#CCCCCC] space-y-2">
                <p className="text-[#EDEDED] font-medium">Active Allocations & Schedule History:</p>
                <p>
                  This faculty member currently holds{' '}
                  <span className="font-semibold text-[#FF6B00]">
                    {deleteConfirm.faculty.class_assignments.length} class section(s)
                  </span>
                  ,{' '}
                  <span className="font-semibold text-[#FF6B00]">
                    {deleteConfirm.faculty.training_assignments.length} training group(s)
                  </span>
                  , and{' '}
                  <span className="font-semibold text-[#FF6B00]">
                    {deleteConfirm.faculty.total_sessions_count} scheduled session(s)
                  </span>
                  .
                </p>
                <p className="text-[11px] text-[#9AA1AA]">
                  Hard deletion is prevented by database constraints to safeguard class timetables and student learning
                  histories. You can safely <span className="text-[#EDEDED] font-semibold">deactivate</span> their
                  account instead.
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#9AA1AA]">
                This faculty member has no active class or training allocations. Are you sure you want to permanently
                delete their user account and profile? This action cannot be undone.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirm(null)}
                disabled={isPending}
                className="h-8 text-xs border-[#262626] text-[#9AA1AA] hover:text-[#EDEDED]"
              >
                Cancel
              </Button>

              {deleteConfirm.dependencyCount > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleExecuteDeleteOrDeactivate(true)}
                  disabled={isPending}
                  className="h-8 text-xs bg-amber-600 hover:bg-amber-500 text-black font-semibold gap-1.5"
                >
                  <Power className="h-3.5 w-3.5" />
                  Safely Deactivate
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleExecuteDeleteOrDeactivate(false)}
                  disabled={isPending}
                  className="h-8 text-xs bg-rose-600 hover:bg-rose-500 text-white font-medium gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
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

/* ========================================================================= */
/* DIALOG 1: CREATE FACULTY MEMBER                                           */
/* ========================================================================= */

function CreateFacultyDialog({
  departments,
  onClose,
  onSuccess,
}: {
  departments: { id: string; name: string; code: string }[];
  onClose: () => void;
  onSuccess: (newFaculty: FacultyMemberDetail) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState(departments[0]?.name || 'Computer Science & Engineering');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [employeeId, setEmployeeId] = useState('');
  const [cabinLocation, setCabinLocation] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || !employeeId.trim()) {
      setError('Name, email, password, and employee ID are required.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData: CreateFacultyFormData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      department,
      designation,
      employee_id: employeeId.trim().toUpperCase(),
      cabin_location: cabinLocation.trim() || undefined,
      contact_number: contactNumber.trim() || undefined,
    };

    const res = await createFacultyAction(formData);

    setLoading(false);
    if (res.success && res.userId) {
      onSuccess({
        id: 'fac-' + Date.now(),
        user_id: res.userId,
        name: formData.name,
        email: formData.email,
        employee_id: formData.employee_id,
        department: formData.department,
        designation: formData.designation,
        cabin_location: formData.cabin_location || null,
        contact_number: formData.contact_number || null,
        account_status: 'active',
        created_at: new Date().toISOString(),
        class_assignments: [],
        training_assignments: [],
        total_sessions_count: 0,
        total_students_reach: 0,
      });
    } else {
      setError(res.error || 'Failed to provision faculty user.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-[#222222] rounded-lg max-w-lg w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
          <h3 className="text-sm font-semibold text-[#EDEDED] flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-[#FF6B00]" />
            <span>Add New Faculty Member</span>
          </h3>
          <button type="button" onClick={onClose} className="text-[#9AA1AA] hover:text-[#EDEDED]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#9AA1AA] mb-1 font-medium">Full Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Rajesh Sharma"
                className="h-8 text-xs bg-[#0A0A0A] border-[#262626] text-[#EDEDED] focus:border-[#FF6B00]"
                required
              />
            </div>

            <div>
              <label className="block text-[#9AA1AA] mb-1 font-medium">Employee ID</label>
              <Input
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                placeholder="e.g. FAC-CSE-012"
                className="h-8 text-xs font-mono bg-[#0A0A0A] border-[#262626] text-[#EDEDED] focus:border-[#FF6B00]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#9AA1AA] mb-1 font-medium">Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="faculty@campusconnect.edu"
                className="h-8 text-xs bg-[#0A0A0A] border-[#262626] text-[#EDEDED] focus:border-[#FF6B00]"
                required
              />
            </div>

            <div>
              <label className="block text-[#9AA1AA] mb-1 font-medium">Password (Min 8 chars)</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-8 text-xs bg-[#0A0A0A] border-[#262626] text-[#EDEDED] focus:border-[#FF6B00]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#9AA1AA] mb-1 font-medium">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-[#0A0A0A] border border-[#262626] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.code} — {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#9AA1AA] mb-1 font-medium">Designation</label>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-[#0A0A0A] border border-[#262626] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
              >
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Head of Department">Head of Department</option>
                <option value="Adjunct Faculty">Adjunct Faculty</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#9AA1AA] mb-1 font-medium">Cabin Location (Optional)</label>
              <Input
                value={cabinLocation}
                onChange={(e) => setCabinLocation(e.target.value)}
                placeholder="e.g. Block C, Cabin 402"
                className="h-8 text-xs bg-[#0A0A0A] border-[#262626] text-[#EDEDED] focus:border-[#FF6B00]"
              />
            </div>

            <div>
              <label className="block text-[#9AA1AA] mb-1 font-medium">Contact Number (Optional)</label>
              <Input
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+91 98765 43210"
                className="h-8 text-xs bg-[#0A0A0A] border-[#262626] text-[#EDEDED] focus:border-[#FF6B00]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222222]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="h-8 text-xs border-[#262626] text-[#9AA1AA]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="h-8 text-xs bg-[#FF6B00] hover:bg-[#E56000] text-black font-semibold"
            >
              {loading ? 'Creating...' : 'Provision Faculty'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* DIALOG 2: EDIT FACULTY DETAILS                                            */
/* ========================================================================= */

function EditFacultyDialog({
  faculty,
  departments,
  onClose,
  onSuccess,
}: {
  faculty: FacultyMemberDetail;
  departments: { id: string; name: string; code: string }[];
  onClose: () => void;
  onSuccess: (updated: Partial<FacultyMemberDetail>) => void;
}) {
  const [name, setName] = useState(faculty.name);
  const [department, setDepartment] = useState(faculty.department);
  const [designation, setDesignation] = useState(faculty.designation);
  const [employeeId, setEmployeeId] = useState(faculty.employee_id);
  const [cabinLocation, setCabinLocation] = useState(faculty.cabin_location || '');
  const [contactNumber, setContactNumber] = useState(faculty.contact_number || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !employeeId.trim()) {
      setError('Name and employee ID are required.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData: EditFacultyFormData = {
      faculty_id: faculty.id,
      user_id: faculty.user_id,
      name: name.trim(),
      department,
      designation,
      employee_id: employeeId.trim().toUpperCase(),
      cabin_location: cabinLocation.trim() || undefined,
      contact_number: contactNumber.trim() || undefined,
    };

    const res = await updateFacultyAction(formData);

    setLoading(false);
    if (res.success) {
      onSuccess({
        id: faculty.id,
        name: formData.name,
        department: formData.department,
        designation: formData.designation,
        employee_id: formData.employee_id,
        cabin_location: formData.cabin_location || null,
        contact_number: formData.contact_number || null,
      });
    } else {
      setError(res.error || 'Failed to update faculty details.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-[#222222] rounded-lg max-w-lg w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
          <h3 className="text-sm font-semibold text-[#EDEDED] flex items-center gap-2">
            <Edit2 className="h-4 w-4 text-[#FF6B00]" />
            <span>Edit Faculty Profile</span>
          </h3>
          <button type="button" onClick={onClose} className="text-[#9AA1AA] hover:text-[#EDEDED]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#9AA1AA] mb-1 font-medium">Full Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-xs bg-[#0A0A0A] border-[#262626] text-[#EDEDED] focus:border-[#FF6B00]"
                required
              />
            </div>

            <div>
              <label className="block text-[#9AA1AA] mb-1 font-medium">Employee ID</label>
              <Input
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                className="h-8 text-xs font-mono bg-[#0A0A0A] border-[#262626] text-[#EDEDED] focus:border-[#FF6B00]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#9AA1AA] mb-1 font-medium">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-[#0A0A0A] border border-[#262626] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.code} — {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#9AA1AA] mb-1 font-medium">Designation</label>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-[#0A0A0A] border border-[#262626] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
              >
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Head of Department">Head of Department</option>
                <option value="Adjunct Faculty">Adjunct Faculty</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#9AA1AA] mb-1 font-medium">Cabin Location</label>
              <Input
                value={cabinLocation}
                onChange={(e) => setCabinLocation(e.target.value)}
                placeholder="e.g. Block C, Cabin 402"
                className="h-8 text-xs bg-[#0A0A0A] border-[#262626] text-[#EDEDED] focus:border-[#FF6B00]"
              />
            </div>

            <div>
              <label className="block text-[#9AA1AA] mb-1 font-medium">Contact Number</label>
              <Input
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+91 98765 43210"
                className="h-8 text-xs bg-[#0A0A0A] border-[#262626] text-[#EDEDED] focus:border-[#FF6B00]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222222]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="h-8 text-xs border-[#262626] text-[#9AA1AA]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="h-8 text-xs bg-[#FF6B00] hover:bg-[#E56000] text-black font-semibold"
            >
              {loading ? 'Saving...' : 'Update Faculty'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* DIALOG 3: MANAGE ALLOCATIONS (SECTIONS & TRAINING GROUPS)                 */
/* ========================================================================= */

function ManageAllocationsDialog({
  faculty,
  departments,
  programs,
  sections,
  trainingGroups,
  onClose,
  onAllocationChanged,
}: {
  faculty: FacultyMemberDetail;
  departments: { id: string; name: string; code: string }[];
  programs: { id: string; department_id: string; name: string; code: string; department_code?: string }[];
  sections: {
    id: string;
    program_id: string;
    section_name: string;
    year: number;
    academic_year: string;
    department_code?: string;
    program_code?: string;
    program_name?: string;
  }[];
  trainingGroups: { id: string; name: string; description: string | null }[];
  onClose: () => void;
  onAllocationChanged: (updated: FacultyMemberDetail) => void;
}) {
  const [selectedSectionId, setSelectedSectionId] = useState<string>(sections[0]?.id || '');
  const [selectedTrainingGroupId, setSelectedTrainingGroupId] = useState<string>(trainingGroups[0]?.id || '');

  const [activeSubTab, setActiveSubTab] = useState<'sections' | 'trainings'>('sections');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Available sections not yet allocated
  const allocatedSectionIds = new Set(faculty.class_assignments.map((ca) => ca.section_id));
  const availableSections = sections.filter((s) => !allocatedSectionIds.has(s.id));

  // Available training groups not yet allocated
  const allocatedTrainingGroupIds = new Set(faculty.training_assignments.map((ta) => ta.training_group_id));
  const availableTrainingGroups = trainingGroups.filter((tg) => !allocatedTrainingGroupIds.has(tg.id));

  // 1. Assign Section
  const handleAssignSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSectionId) {
      setError('Please choose a section to allocate.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await assignFacultyToSectionAction({
      faculty_id: faculty.id,
      section_id: selectedSectionId,
    });

    setLoading(false);
    if (res.success) {
      const addedSection = sections.find((s) => s.id === selectedSectionId);
      const newAssignment: FacultyClassAssignmentDetail = {
        id: 'ca-' + Date.now(),
        faculty_id: faculty.id,
        section_id: selectedSectionId,
        section_name: addedSection?.section_name || 'Section',
        year: addedSection?.year || 4,
        academic_year: addedSection?.academic_year || '2025-2026',
        program_id: addedSection?.program_id || '',
        program_name: addedSection?.program_name || 'Program',
        program_code: addedSection?.program_code || '',
        department_name: faculty.department,
        department_code: addedSection?.department_code || 'CSE',
        students_count: 0,
        created_at: new Date().toISOString(),
      };

      const updatedAssignments = [...faculty.class_assignments, newAssignment];
      onAllocationChanged({
        ...faculty,
        class_assignments: updatedAssignments,
      });

      // Reset selection
      if (availableSections.length > 1) {
        setSelectedSectionId(availableSections.find((s) => s.id !== selectedSectionId)?.id || '');
      }
    } else {
      setError(res.error || 'Failed to allocate section.');
    }
  };

  // 2. Remove Section
  const handleRemoveSection = async (assignmentId: string) => {
    setLoading(true);
    setError(null);

    const res = await removeFacultyFromSectionAction(assignmentId);
    setLoading(false);

    if (res.success) {
      const updatedAssignments = faculty.class_assignments.filter((a) => a.id !== assignmentId);
      onAllocationChanged({
        ...faculty,
        class_assignments: updatedAssignments,
      });
    } else {
      setError(res.error || 'Failed to remove section allocation.');
    }
  };

  // 3. Assign Training Group
  const handleAssignTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainingGroupId) {
      setError('Please choose a training group.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await assignFacultyToTrainingGroupAction({
      faculty_id: faculty.id,
      training_group_id: selectedTrainingGroupId,
    });

    setLoading(false);
    if (res.success) {
      const addedGroup = trainingGroups.find((g) => g.id === selectedTrainingGroupId);
      const newAssignment: FacultyTrainingAssignmentDetail = {
        id: 'ta-' + Date.now(),
        faculty_id: faculty.id,
        training_group_id: selectedTrainingGroupId,
        training_group_name: addedGroup?.name || 'Training Group',
        description: addedGroup?.description || null,
        students_count: 0,
        created_at: new Date().toISOString(),
      };

      const updatedAssignments = [...faculty.training_assignments, newAssignment];
      onAllocationChanged({
        ...faculty,
        training_assignments: updatedAssignments,
      });

      // Reset selection
      if (availableTrainingGroups.length > 1) {
        setSelectedTrainingGroupId(availableTrainingGroups.find((g) => g.id !== selectedTrainingGroupId)?.id || '');
      }
    } else {
      setError(res.error || 'Failed to allocate training group.');
    }
  };

  // 4. Remove Training Group
  const handleRemoveTraining = async (assignmentId: string) => {
    setLoading(true);
    setError(null);

    const res = await removeFacultyFromTrainingGroupAction(assignmentId);
    setLoading(false);

    if (res.success) {
      const updatedAssignments = faculty.training_assignments.filter((a) => a.id !== assignmentId);
      onAllocationChanged({
        ...faculty,
        training_assignments: updatedAssignments,
      });
    } else {
      setError(res.error || 'Failed to remove training group allocation.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-[#222222] rounded-lg max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#222222] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#EDEDED]">{faculty.name}</h3>
              <span className="font-mono text-[10px] text-[#FF6B00] bg-[#FF6B00]/10 px-1.5 py-0.5 rounded border border-[#FF6B00]/20">
                {faculty.employee_id}
              </span>
            </div>
            <p className="text-xs text-[#9AA1AA] mt-0.5">
              {faculty.designation} • {faculty.department}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-[#9AA1AA] hover:text-[#EDEDED]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* Sub Tabs */}
        <div className="flex items-center gap-2 border-b border-[#222222] pb-px">
          <button
            type="button"
            onClick={() => setActiveSubTab('sections')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
              activeSubTab === 'sections'
                ? 'border-[#FF6B00] text-[#EDEDED]'
                : 'border-transparent text-[#9AA1AA] hover:text-[#EDEDED]'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Class Section Allocations</span>
            <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] bg-[#161616] text-[#9AA1AA] border border-[#282828]">
              {faculty.class_assignments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('trainings')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
              activeSubTab === 'trainings'
                ? 'border-[#FF6B00] text-[#EDEDED]'
                : 'border-transparent text-[#9AA1AA] hover:text-[#EDEDED]'
            }`}
          >
            <Code className="h-3.5 w-3.5" />
            <span>Training Group Allocations</span>
            <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] bg-[#161616] text-[#9AA1AA] border border-[#282828]">
              {faculty.training_assignments.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Class Section Allocations */}
        {activeSubTab === 'sections' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            {/* Add Section Form */}
            <form onSubmit={handleAssignSection} className="p-3 bg-[#0A0A0A] rounded-md border border-[#222222] space-y-2.5">
              <span className="text-xs font-medium text-[#EDEDED] flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-[#FF6B00]" />
                Allocate Academic Class Section
              </span>

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="flex-1 h-8 px-2.5 text-xs bg-[#121212] border border-[#282828] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
                >
                  <option value="">Select an academic section to allocate...</option>
                  {availableSections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.department_code || s.program_code} — Year {s.year} {s.section_name} ({s.academic_year})
                    </option>
                  ))}
                </select>

                <Button
                  type="submit"
                  size="sm"
                  disabled={loading || !selectedSectionId}
                  className="h-8 text-xs bg-[#FF6B00] hover:bg-[#E56000] text-black font-semibold whitespace-nowrap"
                >
                  Allocate Section
                </Button>
              </div>
            </form>

            {/* List Allocated Sections */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-[#9AA1AA]">Currently Assigned Sections</span>
              {faculty.class_assignments.length === 0 ? (
                <div className="text-xs text-[#666666] py-4 text-center border border-[#1A1A1A] rounded bg-[#0A0A0A]">
                  No academic sections allocated to this faculty member yet.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {faculty.class_assignments.map((ca) => (
                    <div
                      key={ca.id}
                      className="flex items-center justify-between p-2.5 rounded bg-[#0A0A0A] border border-[#222222] text-xs hover:border-[#333333] transition-colors"
                    >
                      <div>
                        <div className="font-medium text-[#EDEDED] flex items-center gap-1.5">
                          <span className="font-semibold text-[#FF6B00]">{ca.department_code || ca.program_code}</span>
                          <span className="text-[#666666]">→</span>
                          <span>Year {ca.year}</span>
                          <span className="text-[#666666]">→</span>
                          <span className="text-[#EDEDED] font-semibold">{ca.section_name}</span>
                          <span className="text-[#666666] text-[10px]">({ca.academic_year})</span>
                        </div>
                        <div className="text-[11px] text-[#9AA1AA] mt-0.5">
                          {ca.program_name} • {ca.students_count} students currently enrolled
                        </div>
                      </div>

                      <button
                        type="button"
                        title="Remove Section Allocation"
                        onClick={() => handleRemoveSection(ca.id)}
                        disabled={loading}
                        className="p-1 rounded text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Training Group Allocations */}
        {activeSubTab === 'trainings' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            {/* Add Training Group Form */}
            <form onSubmit={handleAssignTraining} className="p-3 bg-[#0A0A0A] rounded-md border border-[#222222] space-y-2.5">
              <span className="text-xs font-medium text-[#EDEDED] flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-[#FF6B00]" />
                Allocate Training Cohort / Mentor Track
              </span>

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedTrainingGroupId}
                  onChange={(e) => setSelectedTrainingGroupId(e.target.value)}
                  className="flex-1 h-8 px-2.5 text-xs bg-[#121212] border border-[#282828] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
                >
                  <option value="">Select a specialized training group...</option>
                  {availableTrainingGroups.map((tg) => (
                    <option key={tg.id} value={tg.id}>
                      {tg.name}
                    </option>
                  ))}
                </select>

                <Button
                  type="submit"
                  size="sm"
                  disabled={loading || !selectedTrainingGroupId}
                  className="h-8 text-xs bg-[#FF6B00] hover:bg-[#E56000] text-black font-semibold whitespace-nowrap"
                >
                  Allocate Group
                </Button>
              </div>
            </form>

            {/* List Allocated Training Groups */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-[#9AA1AA]">Currently Assigned Training Groups</span>
              {faculty.training_assignments.length === 0 ? (
                <div className="text-xs text-[#666666] py-4 text-center border border-[#1A1A1A] rounded bg-[#0A0A0A]">
                  No training tracks allocated to this faculty member yet.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {faculty.training_assignments.map((ta) => (
                    <div
                      key={ta.id}
                      className="flex items-center justify-between p-2.5 rounded bg-[#0A0A0A] border border-[#222222] text-xs hover:border-[#333333] transition-colors"
                    >
                      <div>
                        <div className="font-medium text-[#EDEDED] flex items-center gap-1.5">
                          <Code className="h-3.5 w-3.5 text-blue-400" />
                          <span className="text-[#EDEDED] font-semibold">{ta.training_group_name}</span>
                        </div>
                        {ta.description && (
                          <div className="text-[11px] text-[#9AA1AA] mt-0.5 line-clamp-1">{ta.description}</div>
                        )}
                        <div className="text-[10px] text-[#666666] mt-0.5">
                          {ta.students_count} students enrolled in this track
                        </div>
                      </div>

                      <button
                        type="button"
                        title="Remove Training Group Allocation"
                        onClick={() => handleRemoveTraining(ta.id)}
                        disabled={loading}
                        className="p-1 rounded text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end pt-3 border-t border-[#222222]">
          <Button
            type="button"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs bg-[#222222] hover:bg-[#2A2A2A] text-[#EDEDED]"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
