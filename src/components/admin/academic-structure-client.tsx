'use client';

import React, { useState, useTransition } from 'react';
import {
  AcademicStructureOverviewData,
  AcademicYearFormData,
  AcademicYearItem,
  DepartmentFormData,
  DepartmentItem,
  EntityStatus,
  ProgramFormData,
  ProgramItem,
  SectionFormData,
  SectionItem,
  TrainingGroupFormData,
  TrainingGroupItem,
} from '@/lib/types/academic-structure.types';
import {
  createAcademicYearAction,
  createDepartmentAction,
  createProgramAction,
  createSectionAction,
  createTrainingGroupAction,
  deleteAcademicYearAction,
  deleteDepartmentAction,
  deleteProgramAction,
  deleteSectionAction,
  deleteTrainingGroupAction,
  toggleAcademicYearStatusAction,
  toggleDepartmentStatusAction,
  toggleProgramStatusAction,
  toggleSectionStatusAction,
  toggleTrainingGroupStatusAction,
  updateAcademicYearAction,
  updateDepartmentAction,
  updateProgramAction,
  updateSectionAction,
  updateTrainingGroupAction,
} from '@/lib/admin/academic-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle,
  Building,
  Calendar,
  CheckCircle2,
  Code,
  Edit2,
  Layers,
  ListFilter,
  Plus,
  Power,
  RotateCcw,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';

interface AcademicStructureClientProps {
  initialData: AcademicStructureOverviewData;
}

type ActiveTab = 'departments' | 'programs' | 'sections' | 'training_groups' | 'academic_years';

export function AcademicStructureClient({ initialData }: AcademicStructureClientProps) {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<AcademicStructureOverviewData>(initialData);
  const [activeTab, setActiveTab] = useState<ActiveTab>('departments');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | EntityStatus>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');

  // Notification Banner
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Modal States
  const [deptModal, setDeptModal] = useState<{ open: boolean; item?: DepartmentItem } | null>(null);
  const [progModal, setProgModal] = useState<{ open: boolean; item?: ProgramItem } | null>(null);
  const [secModal, setSecModal] = useState<{ open: boolean; item?: SectionItem } | null>(null);
  const [trainModal, setTrainModal] = useState<{ open: boolean; item?: TrainingGroupItem } | null>(null);
  const [yearModal, setYearModal] = useState<{ open: boolean; item?: AcademicYearItem } | null>(null);

  // Delete / Deactivate Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    entityType: 'department' | 'program' | 'section' | 'training_group' | 'academic_year';
    id: string;
    name: string;
    yearNumber?: number;
    dependencyCount: number;
    dependencyLabel: string;
  } | null>(null);

  const showNotice = (type: 'success' | 'error' | 'info', message: string) => {
    setNotice({ type, message });
    setTimeout(() => {
      setNotice(null);
    }, 6000);
  };

  /* -------------------------------------------------------------------------- */
  /* FILTERED LIST COMPUTATIONS                                                 */
  /* -------------------------------------------------------------------------- */

  const filteredDepartments = data.departments.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPrograms = data.programs.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (p.department_name && p.department_name.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesDept = departmentFilter === 'all' || p.department_id === departmentFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  const filteredSections = data.sections.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.section_name.toLowerCase().includes(q) ||
      (s.program_name && s.program_name.toLowerCase().includes(q)) ||
      (s.department_name && s.department_name.toLowerCase().includes(q)) ||
      s.academic_year.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesDept = departmentFilter === 'all' || s.department_id === departmentFilter;
    const matchesProg = programFilter === 'all' || s.program_id === programFilter;
    const matchesYear = yearFilter === 'all' || String(s.year) === yearFilter;
    return matchesSearch && matchesStatus && matchesDept && matchesProg && matchesYear;
  });

  const filteredTrainingGroups = data.trainingGroups.filter((tg) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      tg.name.toLowerCase().includes(q) ||
      (tg.description && tg.description.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'all' || tg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredAcademicYears = data.academicYears.filter((ay) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      ay.display_name.toLowerCase().includes(q) ||
      ay.current_academic_calendar.toLowerCase().includes(q) ||
      String(ay.year_number).includes(q);
    const matchesStatus = statusFilter === 'all' || ay.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDepartmentFilter('all');
    setProgramFilter('all');
    setYearFilter('all');
  };

  /* -------------------------------------------------------------------------- */
  /* STATUS TOGGLES                                                             */
  /* -------------------------------------------------------------------------- */

  const handleToggleDepartment = (id: string, currentStatus: EntityStatus) => {
    const newStatus: EntityStatus = currentStatus === 'active' ? 'inactive' : 'active';
    startTransition(async () => {
      const res = await toggleDepartmentStatusAction(id, newStatus);
      if (res.success) {
        setData((prev) => ({
          ...prev,
          departments: prev.departments.map((d) => (d.id === id ? { ...d, status: newStatus } : d)),
        }));
        showNotice('success', `Department status updated to ${newStatus}.`);
      } else {
        showNotice('error', res.error || 'Failed to update department status.');
      }
    });
  };

  const handleToggleProgram = (id: string, currentStatus: EntityStatus) => {
    const newStatus: EntityStatus = currentStatus === 'active' ? 'inactive' : 'active';
    startTransition(async () => {
      const res = await toggleProgramStatusAction(id, newStatus);
      if (res.success) {
        setData((prev) => ({
          ...prev,
          programs: prev.programs.map((p) => (p.id === id ? { ...p, status: newStatus } : p)),
        }));
        showNotice('success', `Program status updated to ${newStatus}.`);
      } else {
        showNotice('error', res.error || 'Failed to update program status.');
      }
    });
  };

  const handleToggleSection = (id: string, currentStatus: EntityStatus) => {
    const newStatus: EntityStatus = currentStatus === 'active' ? 'inactive' : 'active';
    startTransition(async () => {
      const res = await toggleSectionStatusAction(id, newStatus);
      if (res.success) {
        setData((prev) => ({
          ...prev,
          sections: prev.sections.map((s) => (s.id === id ? { ...s, status: newStatus } : s)),
        }));
        showNotice('success', `Section status updated to ${newStatus}.`);
      } else {
        showNotice('error', res.error || 'Failed to update section status.');
      }
    });
  };

  const handleToggleTrainingGroup = (id: string, currentStatus: EntityStatus) => {
    const newStatus: EntityStatus = currentStatus === 'active' ? 'inactive' : 'active';
    startTransition(async () => {
      const res = await toggleTrainingGroupStatusAction(id, newStatus);
      if (res.success) {
        setData((prev) => ({
          ...prev,
          trainingGroups: prev.trainingGroups.map((tg) => (tg.id === id ? { ...tg, status: newStatus } : tg)),
        }));
        showNotice('success', `Training group status updated to ${newStatus}.`);
      } else {
        showNotice('error', res.error || 'Failed to update training group status.');
      }
    });
  };

  const handleToggleAcademicYear = (id: string, currentStatus: EntityStatus) => {
    const newStatus: EntityStatus = currentStatus === 'active' ? 'inactive' : 'active';
    startTransition(async () => {
      const res = await toggleAcademicYearStatusAction(id, newStatus);
      if (res.success) {
        setData((prev) => ({
          ...prev,
          academicYears: prev.academicYears.map((ay) => (ay.id === id ? { ...ay, status: newStatus } : ay)),
        }));
        showNotice('success', `Academic Year status updated to ${newStatus}.`);
      } else {
        showNotice('error', res.error || 'Failed to update academic year status.');
      }
    });
  };

  /* -------------------------------------------------------------------------- */
  /* DELETE & SAFE DEACTIVATION HANDLERS                                        */
  /* -------------------------------------------------------------------------- */

  const handleExecuteDeleteOrDeactivate = (forceDeactivate: boolean = false) => {
    if (!deleteConfirm) return;
    const { entityType, id, yearNumber } = deleteConfirm;

    startTransition(async () => {
      let res: any;

      if (entityType === 'department') {
        res = await deleteDepartmentAction(id, forceDeactivate);
        if (res.success) {
          if (res.actionTaken === 'deleted') {
            setData((prev) => ({ ...prev, departments: prev.departments.filter((d) => d.id !== id) }));
            showNotice('success', 'Department permanently deleted.');
          } else {
            setData((prev) => ({
              ...prev,
              departments: prev.departments.map((d) => (d.id === id ? { ...d, status: 'inactive' } : d)),
            }));
            showNotice('info', res.reason || 'Department safely deactivated.');
          }
        }
      } else if (entityType === 'program') {
        res = await deleteProgramAction(id, forceDeactivate);
        if (res.success) {
          if (res.actionTaken === 'deleted') {
            setData((prev) => ({ ...prev, programs: prev.programs.filter((p) => p.id !== id) }));
            showNotice('success', 'Program permanently deleted.');
          } else {
            setData((prev) => ({
              ...prev,
              programs: prev.programs.map((p) => (p.id === id ? { ...p, status: 'inactive' } : p)),
            }));
            showNotice('info', res.reason || 'Program safely deactivated.');
          }
        }
      } else if (entityType === 'section') {
        res = await deleteSectionAction(id, forceDeactivate);
        if (res.success) {
          if (res.actionTaken === 'deleted') {
            setData((prev) => ({ ...prev, sections: prev.sections.filter((s) => s.id !== id) }));
            showNotice('success', 'Section permanently deleted.');
          } else {
            setData((prev) => ({
              ...prev,
              sections: prev.sections.map((s) => (s.id === id ? { ...s, status: 'inactive' } : s)),
            }));
            showNotice('info', res.reason || 'Section safely deactivated.');
          }
        }
      } else if (entityType === 'training_group') {
        res = await deleteTrainingGroupAction(id, forceDeactivate);
        if (res.success) {
          if (res.actionTaken === 'deleted') {
            setData((prev) => ({ ...prev, trainingGroups: prev.trainingGroups.filter((tg) => tg.id !== id) }));
            showNotice('success', 'Training group permanently deleted.');
          } else {
            setData((prev) => ({
              ...prev,
              trainingGroups: prev.trainingGroups.map((tg) => (tg.id === id ? { ...tg, status: 'inactive' } : tg)),
            }));
            showNotice('info', res.reason || 'Training group safely deactivated.');
          }
        }
      } else if (entityType === 'academic_year') {
        res = await deleteAcademicYearAction(id, yearNumber || 1, forceDeactivate);
        if (res.success) {
          if (res.actionTaken === 'deleted') {
            setData((prev) => ({ ...prev, academicYears: prev.academicYears.filter((ay) => ay.id !== id) }));
            showNotice('success', 'Academic Year permanently deleted.');
          } else {
            setData((prev) => ({
              ...prev,
              academicYears: prev.academicYears.map((ay) => (ay.id === id ? { ...ay, status: 'inactive' } : ay)),
            }));
            showNotice('info', res.reason || 'Academic Year safely deactivated.');
          }
        }
      }

      if (res && !res.success) {
        showNotice('error', res.reason || res.error || 'Action could not be completed.');
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
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-inherit hover:opacity-75 ml-2"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Tabs Header */}
      <div className="border-b border-[#222222] flex items-center gap-2 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => {
            setActiveTab('departments');
            clearFilters();
          }}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'departments'
              ? 'border-[#FF6B00] text-[#EDEDED]'
              : 'border-transparent text-[#9AA1AA] hover:text-[#EDEDED]'
          }`}
        >
          <Building className="h-3.5 w-3.5" />
          <span>Departments</span>
          <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-[#161616] text-[#9AA1AA] border border-[#262626]">
            {data.departments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('programs');
            clearFilters();
          }}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'programs'
              ? 'border-[#FF6B00] text-[#EDEDED]'
              : 'border-transparent text-[#9AA1AA] hover:text-[#EDEDED]'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Programs / Branches</span>
          <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-[#161616] text-[#9AA1AA] border border-[#262626]">
            {data.programs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('sections');
            clearFilters();
          }}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'sections'
              ? 'border-[#FF6B00] text-[#EDEDED]'
              : 'border-transparent text-[#9AA1AA] hover:text-[#EDEDED]'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Sections</span>
          <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-[#161616] text-[#9AA1AA] border border-[#262626]">
            {data.sections.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('training_groups');
            clearFilters();
          }}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'training_groups'
              ? 'border-[#FF6B00] text-[#EDEDED]'
              : 'border-transparent text-[#9AA1AA] hover:text-[#EDEDED]'
          }`}
        >
          <Code className="h-3.5 w-3.5" />
          <span>Training Groups</span>
          <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-[#161616] text-[#9AA1AA] border border-[#262626]">
            {data.trainingGroups.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('academic_years');
            clearFilters();
          }}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'academic_years'
              ? 'border-[#FF6B00] text-[#EDEDED]'
              : 'border-transparent text-[#9AA1AA] hover:text-[#EDEDED]'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Academic Years</span>
          <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-[#161616] text-[#9AA1AA] border border-[#262626]">
            {data.academicYears.length}
          </span>
        </button>
      </div>

      {/* Action Bar (Search, Filters, Add Button) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#0E0E0E] p-3 rounded-md border border-[#222222]">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Bar */}
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9AA1AA]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab.replace('_', ' ')}...`}
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

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-8 px-2.5 text-xs bg-[#0A0A0A] border border-[#222222] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Program/Section Specific Filters */}
          {(activeTab === 'programs' || activeTab === 'sections') && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="h-8 px-2.5 text-xs bg-[#0A0A0A] border border-[#222222] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00] max-w-[180px] truncate"
            >
              <option value="all">All Departments</option>
              {data.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          )}

          {activeTab === 'sections' && (
            <>
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="h-8 px-2.5 text-xs bg-[#0A0A0A] border border-[#222222] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00] max-w-[180px] truncate"
              >
                <option value="all">All Programs</option>
                {data.programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>

              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="h-8 px-2.5 text-xs bg-[#0A0A0A] border border-[#222222] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
              >
                <option value="all">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </>
          )}

          {(searchQuery || statusFilter !== 'all' || departmentFilter !== 'all' || programFilter !== 'all' || yearFilter !== 'all') && (
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

        {/* Create Button */}
        <div>
          {activeTab === 'departments' && (
            <Button
              size="sm"
              onClick={() => setDeptModal({ open: true })}
              className="h-8 text-xs bg-[#FF6B00] hover:bg-[#E56000] text-black font-medium gap-1.5 shadow-none"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Department
            </Button>
          )}
          {activeTab === 'programs' && (
            <Button
              size="sm"
              onClick={() => setProgModal({ open: true })}
              className="h-8 text-xs bg-[#FF6B00] hover:bg-[#E56000] text-black font-medium gap-1.5 shadow-none"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Program
            </Button>
          )}
          {activeTab === 'sections' && (
            <Button
              size="sm"
              onClick={() => setSecModal({ open: true })}
              className="h-8 text-xs bg-[#FF6B00] hover:bg-[#E56000] text-black font-medium gap-1.5 shadow-none"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Section
            </Button>
          )}
          {activeTab === 'training_groups' && (
            <Button
              size="sm"
              onClick={() => setTrainModal({ open: true })}
              className="h-8 text-xs bg-[#FF6B00] hover:bg-[#E56000] text-black font-medium gap-1.5 shadow-none"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Training Group
            </Button>
          )}
          {activeTab === 'academic_years' && (
            <Button
              size="sm"
              onClick={() => setYearModal({ open: true })}
              className="h-8 text-xs bg-[#FF6B00] hover:bg-[#E56000] text-black font-medium gap-1.5 shadow-none"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Academic Year
            </Button>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 1. DEPARTMENTS TAB CONTENT                                           */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'departments' && (
        <div className="border border-[#222222] rounded-md bg-[#0A0A0A] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121212] border-b border-[#222222] text-[#9AA1AA]">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Department Name</th>
                  <th className="py-2.5 px-3 font-medium">Code</th>
                  <th className="py-2.5 px-3 font-medium">Programs</th>
                  <th className="py-2.5 px-3 font-medium">Affiliated Students</th>
                  <th className="py-2.5 px-3 font-medium">Faculty</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {filteredDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[#9AA1AA]">
                      No departments found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDepartments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-[#121212]/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-medium text-[#EDEDED]">{dept.name}</div>
                        <div className="text-[11px] text-[#666666] font-mono">ID: {dept.id.slice(0, 8)}...</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs text-[#FF6B00] bg-[#FF6B00]/10 px-2 py-0.5 rounded border border-[#FF6B00]/20">
                          {dept.code}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#9AA1AA]">
                        <span className="font-mono text-[#EDEDED]">{dept.programs_count || 0}</span> program(s)
                      </td>
                      <td className="py-3 px-3 text-[#9AA1AA]">
                        <span className="font-mono text-[#EDEDED]">{dept.students_count || 0}</span> student(s)
                      </td>
                      <td className="py-3 px-3 text-[#9AA1AA]">
                        <span className="font-mono text-[#EDEDED]">{dept.faculty_count || 0}</span> faculty
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                            dept.status === 'active'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                              : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              dept.status === 'active' ? 'bg-emerald-400' : 'bg-zinc-500'
                            }`}
                          />
                          {dept.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="Edit Department"
                            onClick={() => setDeptModal({ open: true, item: dept })}
                            className="p-1 rounded text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#1A1A1A] transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title={dept.status === 'active' ? 'Deactivate Department' : 'Activate Department'}
                            onClick={() => handleToggleDepartment(dept.id, dept.status)}
                            disabled={isPending}
                            className={`p-1 rounded transition-colors ${
                              dept.status === 'active'
                                ? 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-400/10'
                                : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-400/10'
                            }`}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete Department"
                            onClick={() =>
                              setDeleteConfirm({
                                entityType: 'department',
                                id: dept.id,
                                name: `${dept.name} (${dept.code})`,
                                dependencyCount: dept.programs_count || 0,
                                dependencyLabel: 'programs',
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
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 2. PROGRAMS TAB CONTENT                                              */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'programs' && (
        <div className="border border-[#222222] rounded-md bg-[#0A0A0A] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121212] border-b border-[#222222] text-[#9AA1AA]">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Program / Branch</th>
                  <th className="py-2.5 px-3 font-medium">Code</th>
                  <th className="py-2.5 px-3 font-medium">Parent Department</th>
                  <th className="py-2.5 px-3 font-medium">Active Sections</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {filteredPrograms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-[#9AA1AA]">
                      No programs found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPrograms.map((prog) => (
                    <tr key={prog.id} className="hover:bg-[#121212]/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-medium text-[#EDEDED]">{prog.name}</div>
                        <div className="text-[11px] text-[#666666] font-mono">ID: {prog.id.slice(0, 8)}...</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs text-[#EDEDED] bg-[#161616] px-2 py-0.5 rounded border border-[#262626]">
                          {prog.code}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-[#EDEDED]">{prog.department_name || '—'}</div>
                        <div className="text-[11px] text-[#9AA1AA] font-mono">{prog.department_code}</div>
                      </td>
                      <td className="py-3 px-3 text-[#9AA1AA]">
                        <span className="font-mono text-[#EDEDED]">{prog.sections_count || 0}</span> section(s)
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                            prog.status === 'active'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                              : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              prog.status === 'active' ? 'bg-emerald-400' : 'bg-zinc-500'
                            }`}
                          />
                          {prog.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="Edit Program"
                            onClick={() => setProgModal({ open: true, item: prog })}
                            className="p-1 rounded text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#1A1A1A] transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title={prog.status === 'active' ? 'Deactivate Program' : 'Activate Program'}
                            onClick={() => handleToggleProgram(prog.id, prog.status)}
                            disabled={isPending}
                            className={`p-1 rounded transition-colors ${
                              prog.status === 'active'
                                ? 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-400/10'
                                : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-400/10'
                            }`}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete Program"
                            onClick={() =>
                              setDeleteConfirm({
                                entityType: 'program',
                                id: prog.id,
                                name: `${prog.name} (${prog.code})`,
                                dependencyCount: prog.sections_count || 0,
                                dependencyLabel: 'sections',
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
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 3. SECTIONS TAB CONTENT                                              */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'sections' && (
        <div className="border border-[#222222] rounded-md bg-[#0A0A0A] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121212] border-b border-[#222222] text-[#9AA1AA]">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Academic Hierarchy</th>
                  <th className="py-2.5 px-3 font-medium">Section Name</th>
                  <th className="py-2.5 px-3 font-medium">Academic Calendar</th>
                  <th className="py-2.5 px-3 font-medium">Enrolled Students</th>
                  <th className="py-2.5 px-3 font-medium">Faculty Allotted</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {filteredSections.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[#9AA1AA]">
                      No academic sections found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSections.map((sec) => (
                    <tr key={sec.id} className="hover:bg-[#121212]/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-xs text-[#EDEDED]">
                          <span className="font-semibold text-[#FF6B00]">{sec.department_code || sec.program_code}</span>
                          <span className="text-[#444444]">→</span>
                          <span>Year {sec.year}</span>
                          <span className="text-[#444444]">→</span>
                          <span className="font-medium text-[#EDEDED]">{sec.section_name}</span>
                        </div>
                        <div className="text-[11px] text-[#9AA1AA] mt-0.5 truncate max-w-xs">
                          {sec.program_name} {sec.semester ? `• Sem ${sec.semester}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-xs text-[#EDEDED] bg-[#161616] px-2 py-0.5 rounded border border-[#262626]">
                          {sec.section_name}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono text-xs text-[#EDEDED]">{sec.academic_year}</div>
                        <div className="text-[10px] text-[#9AA1AA]">Year {sec.year}</div>
                      </td>
                      <td className="py-3 px-3 text-[#9AA1AA]">
                        <span className="font-mono text-[#EDEDED]">{sec.students_count || 0}</span> student(s)
                      </td>
                      <td className="py-3 px-3 text-[#9AA1AA]">
                        <span className="font-mono text-[#EDEDED]">{sec.faculty_count || 0}</span> faculty
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                            sec.status === 'active'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                              : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              sec.status === 'active' ? 'bg-emerald-400' : 'bg-zinc-500'
                            }`}
                          />
                          {sec.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="Edit Section"
                            onClick={() => setSecModal({ open: true, item: sec })}
                            className="p-1 rounded text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#1A1A1A] transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title={sec.status === 'active' ? 'Deactivate Section' : 'Activate Section'}
                            onClick={() => handleToggleSection(sec.id, sec.status)}
                            disabled={isPending}
                            className={`p-1 rounded transition-colors ${
                              sec.status === 'active'
                                ? 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-400/10'
                                : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-400/10'
                            }`}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete Section"
                            onClick={() =>
                              setDeleteConfirm({
                                entityType: 'section',
                                id: sec.id,
                                name: `${sec.program_code || ''} Year ${sec.year} - ${sec.section_name}`,
                                dependencyCount: (sec.students_count || 0) + (sec.faculty_count || 0),
                                dependencyLabel: 'students & faculty allocations',
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
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 4. TRAINING GROUPS TAB CONTENT                                       */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'training_groups' && (
        <div className="space-y-4">
          <div className="bg-[#121212] border border-[#222222] p-3 rounded-md text-xs text-[#9AA1AA] flex items-center justify-between">
            <div>
              <span className="text-[#EDEDED] font-medium">Cross-Disciplinary Cohorts: </span>
              Training groups allow students from any branch to enroll in specialized tracks (e.g. Java, Python, Aptitude, Fullstack). A single student can belong to multiple groups concurrently.
            </div>
            <Badge variant="outline" className="text-[10px] font-mono border-[#333333] text-[#EDEDED] whitespace-nowrap ml-3">
              M:N Enrollment
            </Badge>
          </div>

          <div className="border border-[#222222] rounded-md bg-[#0A0A0A] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121212] border-b border-[#222222] text-[#9AA1AA]">
                  <tr>
                    <th className="py-2.5 px-3 font-medium">Training Track</th>
                    <th className="py-2.5 px-3 font-medium">Curriculum / Description</th>
                    <th className="py-2.5 px-3 font-medium">Enrolled Students</th>
                    <th className="py-2.5 px-3 font-medium">Faculty Mentors</th>
                    <th className="py-2.5 px-3 font-medium">Status</th>
                    <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {filteredTrainingGroups.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-[#9AA1AA]">
                        No training groups found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTrainingGroups.map((tg) => (
                      <tr key={tg.id} className="hover:bg-[#121212]/60 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-medium text-[#EDEDED]">{tg.name}</div>
                          <div className="text-[11px] text-[#666666] font-mono">ID: {tg.id.slice(0, 8)}...</div>
                        </td>
                        <td className="py-3 px-3 max-w-md">
                          <p className="text-[#9AA1AA] text-xs line-clamp-2">
                            {tg.description || 'No description provided.'}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-[#9AA1AA]">
                          <span className="font-mono text-[#EDEDED]">{tg.students_count || 0}</span> student(s)
                        </td>
                        <td className="py-3 px-3 text-[#9AA1AA]">
                          <span className="font-mono text-[#EDEDED]">{tg.faculty_count || 0}</span> faculty
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                              tg.status === 'active'
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                tg.status === 'active' ? 'bg-emerald-400' : 'bg-zinc-500'
                              }`}
                            />
                            {tg.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              title="Edit Training Group"
                              onClick={() => setTrainModal({ open: true, item: tg })}
                              className="p-1 rounded text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#1A1A1A] transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              title={tg.status === 'active' ? 'Deactivate Group' : 'Activate Group'}
                              onClick={() => handleToggleTrainingGroup(tg.id, tg.status)}
                              disabled={isPending}
                              className={`p-1 rounded transition-colors ${
                                tg.status === 'active'
                                  ? 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-400/10'
                                  : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-400/10'
                              }`}
                            >
                              <Power className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Delete Training Group"
                              onClick={() =>
                                setDeleteConfirm({
                                  entityType: 'training_group',
                                  id: tg.id,
                                  name: tg.name,
                                  dependencyCount: (tg.students_count || 0) + (tg.faculty_count || 0),
                                  dependencyLabel: 'student enrollments & mentor allocations',
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
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 5. ACADEMIC YEARS TAB CONTENT                                        */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'academic_years' && (
        <div className="border border-[#222222] rounded-md bg-[#0A0A0A] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121212] border-b border-[#222222] text-[#9AA1AA]">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Year Level</th>
                  <th className="py-2.5 px-3 font-medium">Display Title</th>
                  <th className="py-2.5 px-3 font-medium">Current Calendar Cycle</th>
                  <th className="py-2.5 px-3 font-medium">Associated Sections</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {filteredAcademicYears.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-[#9AA1AA]">
                      No academic years found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAcademicYears.map((ay) => (
                    <tr key={ay.id} className="hover:bg-[#121212]/60 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs font-semibold text-[#FF6B00] bg-[#FF6B00]/10 px-2 py-0.5 rounded border border-[#FF6B00]/20">
                          Year {ay.year_number}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-[#EDEDED]">{ay.display_name}</td>
                      <td className="py-3 px-3 font-mono text-[#9AA1AA]">{ay.current_academic_calendar}</td>
                      <td className="py-3 px-3 text-[#9AA1AA]">
                        <span className="font-mono text-[#EDEDED]">{ay.sections_count || 0}</span> section(s)
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                            ay.status === 'active'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                              : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              ay.status === 'active' ? 'bg-emerald-400' : 'bg-zinc-500'
                            }`}
                          />
                          {ay.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="Edit Academic Year"
                            onClick={() => setYearModal({ open: true, item: ay })}
                            className="p-1 rounded text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#1A1A1A] transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title={ay.status === 'active' ? 'Deactivate Year' : 'Activate Year'}
                            onClick={() => handleToggleAcademicYear(ay.id, ay.status)}
                            disabled={isPending}
                            className={`p-1 rounded transition-colors ${
                              ay.status === 'active'
                                ? 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-400/10'
                                : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-400/10'
                            }`}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete Academic Year"
                            onClick={() =>
                              setDeleteConfirm({
                                entityType: 'academic_year',
                                id: ay.id,
                                name: `Year ${ay.year_number}: ${ay.display_name}`,
                                yearNumber: ay.year_number,
                                dependencyCount: ay.sections_count || 0,
                                dependencyLabel: 'sections',
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
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 1: DEPARTMENT CREATE / EDIT                                    */}
      {/* -------------------------------------------------------------------- */}
      {deptModal && (
        <DepartmentDialog
          item={deptModal.item}
          onClose={() => setDeptModal(null)}
          onSuccess={(savedDept, isNew) => {
            setDeptModal(null);
            setData((prev) => {
              if (isNew) {
                return {
                  ...prev,
                  departments: [...prev.departments, savedDept].sort((a, b) => a.name.localeCompare(b.name)),
                };
              }
              return {
                ...prev,
                departments: prev.departments.map((d) => (d.id === savedDept.id ? { ...d, ...savedDept } : d)),
              };
            });
            showNotice('success', `Department ${isNew ? 'created' : 'updated'} successfully.`);
          }}
        />
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 2: PROGRAM CREATE / EDIT                                       */}
      {/* -------------------------------------------------------------------- */}
      {progModal && (
        <ProgramDialog
          item={progModal.item}
          departments={data.departments}
          onClose={() => setProgModal(null)}
          onSuccess={(savedProg, isNew) => {
            setProgModal(null);
            setData((prev) => {
              if (isNew) {
                return {
                  ...prev,
                  programs: [...prev.programs, savedProg].sort((a, b) => a.name.localeCompare(b.name)),
                };
              }
              return {
                ...prev,
                programs: prev.programs.map((p) => (p.id === savedProg.id ? { ...p, ...savedProg } : p)),
              };
            });
            showNotice('success', `Program ${isNew ? 'created' : 'updated'} successfully.`);
          }}
        />
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 3: SECTION CREATE / EDIT                                       */}
      {/* -------------------------------------------------------------------- */}
      {secModal && (
        <SectionDialog
          item={secModal.item}
          programs={data.programs}
          academicYears={data.academicYears}
          onClose={() => setSecModal(null)}
          onSuccess={(savedSec, isNew) => {
            setSecModal(null);
            setData((prev) => {
              if (isNew) {
                return {
                  ...prev,
                  sections: [...prev.sections, savedSec],
                };
              }
              return {
                ...prev,
                sections: prev.sections.map((s) => (s.id === savedSec.id ? { ...s, ...savedSec } : s)),
              };
            });
            showNotice('success', `Section ${isNew ? 'created' : 'updated'} successfully.`);
          }}
        />
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 4: TRAINING GROUP CREATE / EDIT                                */}
      {/* -------------------------------------------------------------------- */}
      {trainModal && (
        <TrainingGroupDialog
          item={trainModal.item}
          onClose={() => setTrainModal(null)}
          onSuccess={(savedTg, isNew) => {
            setTrainModal(null);
            setData((prev) => {
              if (isNew) {
                return {
                  ...prev,
                  trainingGroups: [...prev.trainingGroups, savedTg].sort((a, b) => a.name.localeCompare(b.name)),
                };
              }
              return {
                ...prev,
                trainingGroups: prev.trainingGroups.map((tg) => (tg.id === savedTg.id ? { ...tg, ...savedTg } : tg)),
              };
            });
            showNotice('success', `Training Group ${isNew ? 'created' : 'updated'} successfully.`);
          }}
        />
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 5: ACADEMIC YEAR CREATE / EDIT                                 */}
      {/* -------------------------------------------------------------------- */}
      {yearModal && (
        <AcademicYearDialog
          item={yearModal.item}
          onClose={() => setYearModal(null)}
          onSuccess={(savedYear, isNew) => {
            setYearModal(null);
            setData((prev) => {
              if (isNew) {
                return {
                  ...prev,
                  academicYears: [...prev.academicYears, savedYear].sort((a, b) => a.year_number - b.year_number),
                };
              }
              return {
                ...prev,
                academicYears: prev.academicYears.map((ay) => (ay.id === savedYear.id ? { ...ay, ...savedYear } : ay)),
              };
            });
            showNotice('success', `Academic Year ${isNew ? 'created' : 'updated'} successfully.`);
          }}
        />
      )}

      {/* -------------------------------------------------------------------- */}
      {/* CONFIRMATION MODAL: SAFE DEACTIVATION / PERMANENT DELETE             */}
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
                  {deleteConfirm.dependencyCount > 0 ? 'Protected Institutional Record' : 'Confirm Permanent Deletion'}
                </h3>
                <p className="text-xs text-[#9AA1AA] mt-1 font-medium">{deleteConfirm.name}</p>
              </div>
            </div>

            {deleteConfirm.dependencyCount > 0 ? (
              <div className="p-3 rounded-md bg-[#1A1A1A] border border-[#282828] text-xs text-[#CCCCCC] space-y-2">
                <p className="text-[#EDEDED] font-medium">Active Dependencies Detected:</p>
                <p>
                  This record is referenced by{' '}
                  <span className="font-semibold text-[#FF6B00]">
                    {deleteConfirm.dependencyCount} {deleteConfirm.dependencyLabel}
                  </span>
                  .
                </p>
                <p className="text-[11px] text-[#9AA1AA]">
                  Hard deletion is prevented by database constraints to safeguard academic data integrity. You can
                  safely <span className="text-[#EDEDED] font-semibold">deactivate</span> it instead.
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#9AA1AA]">
                This entity has zero active dependencies. Are you sure you want to permanently remove it from the
                database? This action is logged to the Superadmin audit trail and cannot be undone.
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
/* DIALOG 1: DEPARTMENT FORM                                                 */
/* ========================================================================= */

function DepartmentDialog({
  item,
  onClose,
  onSuccess,
}: {
  item?: DepartmentItem;
  onClose: () => void;
  onSuccess: (savedDept: DepartmentItem, isNew: boolean) => void;
}) {
  const [name, setName] = useState(item?.name || '');
  const [code, setCode] = useState(item?.code || '');
  const [status, setStatus] = useState<EntityStatus>(item?.status || 'active');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError('Please provide both department name and code.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData: DepartmentFormData = {
      id: item?.id,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      status,
    };

    const res = item?.id ? await updateDepartmentAction(formData) : await createDepartmentAction(formData);

    setLoading(false);
    if (res.success) {
      onSuccess(
        {
          id: item?.id || 'temp-' + Date.now(),
          name: formData.name,
          code: formData.code,
          status: formData.status,
          created_at: item?.created_at || new Date().toISOString(),
          programs_count: item?.programs_count || 0,
          students_count: item?.students_count || 0,
          faculty_count: item?.faculty_count || 0,
        },
        !item?.id
      );
    } else {
      setError(res.error || 'Failed to save department.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-[#222222] rounded-lg max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
          <h3 className="text-sm font-semibold text-[#EDEDED] flex items-center gap-2">
            <Building className="h-4 w-4 text-[#FF6B00]" />
            <span>{item ? 'Edit Department' : 'Create Department'}</span>
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
          <div>
            <label className="block text-[#9AA1AA] mb-1 font-medium">Department Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Computer Science & Engineering"
              className="h-8 text-xs bg-[#0A0A0A] border-[#262626] text-[#EDEDED] focus:border-[#FF6B00]"
              required
            />
          </div>

          <div>
            <label className="block text-[#9AA1AA] mb-1 font-medium">Department Code</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. CSE"
              className="h-8 text-xs font-mono bg-[#0A0A0A] border-[#262626] text-[#EDEDED] focus:border-[#FF6B00]"
              required
            />
          </div>

          <div>
            <label className="block text-[#9AA1AA] mb-1 font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EntityStatus)}
              className="w-full h-8 px-2.5 text-xs bg-[#0A0A0A] border border-[#262626] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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
              {loading ? 'Saving...' : item ? 'Update Department' : 'Create Department'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* DIALOG 2: PROGRAM FORM                                                    */
/* ========================================================================= */

function ProgramDialog({
  item,
  departments,
  onClose,
  onSuccess,
}: {
  item?: ProgramItem;
  departments: DepartmentItem[];
  onClose: () => void;
  onSuccess: (savedProg: ProgramItem, isNew: boolean) => void;
}) {
  const [departmentId, setDepartmentId] = useState(item?.department_id || departments[0]?.id || '');
  const [name, setName] = useState(item?.name || '');
  const [code, setCode] = useState(item?.code || '');
  const [status, setStatus] = useState<EntityStatus>(item?.status || 'active');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !departmentId) {
      setError('Please fill in department, program name, and code.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData: ProgramFormData = {
      id: item?.id,
      department_id: departmentId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      status,
    };

    const res = item?.id ? await updateProgramAction(formData) : await createProgramAction(formData);

    setLoading(false);
    if (res.success) {
      const selectedDept = departments.find((d) => d.id === departmentId);
      onSuccess(
        {
          id: item?.id || 'temp-' + Date.now(),
          department_id: departmentId,
          name: formData.name,
          code: formData.code,
          status: formData.status,
          created_at: item?.created_at || new Date().toISOString(),
          department_name: selectedDept?.name,
          department_code: selectedDept?.code,
          sections_count: item?.sections_count || 0,
        },
        !item?.id
      );
    } else {
      setError(res.error || 'Failed to save program.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-[#222222] rounded-lg max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
          <h3 className="text-sm font-semibold text-[#EDEDED] flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#FF6B00]" />
            <span>{item ? 'Edit Program / Branch' : 'Create Program / Branch'}</span>
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
          <div>
            <label className="block text-[#9AA1AA] mb-1 font-medium">Parent Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full h-8 px-2.5 text-xs bg-[#0A0A0A] border border-[#262626] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
              required
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} — {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#9AA1AA] mb-1 font-medium">Program / Branch Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. B.Tech Computer Science & Engineering"
              className="h-8 text-xs bg-[#0A0A0A] border-[#262626] text-[#EDEDED] focus:border-[#FF6B00]"
              required
            />
          </div>

          <div>
            <label className="block text-[#9AA1AA] mb-1 font-medium">Program Code</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. CSE"
              className="h-8 text-xs font-mono bg-[#0A0A0A] border-[#262626] text-[#EDEDED] focus:border-[#FF6B00]"
              required
            />
          </div>

          <div>
            <label className="block text-[#9AA1AA] mb-1 font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EntityStatus)}
              className="w-full h-8 px-2.5 text-xs bg-[#0A0A0A] border border-[#262626] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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
              {loading ? 'Saving...' : item ? 'Update Program' : 'Create Program'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* DIALOG 3: SECTION FORM                                                    */
/* ========================================================================= */

function SectionDialog({
  item,
  programs,
  academicYears,
  onClose,
  onSuccess,
}: {
  item?: SectionItem;
  programs: ProgramItem[];
  academicYears: AcademicYearItem[];
  onClose: () => void;
  onSuccess: (savedSec: SectionItem, isNew: boolean) => void;
}) {
  const [programId, setProgramId] = useState(item?.program_id || programs[0]?.id || '');
  const [yearNumber, setYearNumber] = useState<number>(item?.year || 4);
  const [academicYear, setAcademicYear] = useState(item?.academic_year || '2025-2026');
  const [semester, setSemester] = useState<string>(item?.semester ? String(item.semester) : '');
  const [sectionName, setSectionName] = useState(item?.section_name || 'Section A');
  const [status, setStatus] = useState<EntityStatus>(item?.status || 'active');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionName.trim() || !programId || !yearNumber || !academicYear.trim()) {
      setError('Please fill in program, academic year, year level, and section name.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData: SectionFormData = {
      id: item?.id,
      program_id: programId,
      academic_year: academicYear.trim(),
      year: Number(yearNumber),
      semester: semester ? Number(semester) : null,
      section_name: sectionName.trim(),
      status,
    };

    const res = item?.id ? await updateSectionAction(formData) : await createSectionAction(formData);

    setLoading(false);
    if (res.success) {
      const selectedProg = programs.find((p) => p.id === programId);
      onSuccess(
        {
          id: item?.id || 'temp-' + Date.now(),
          program_id: programId,
          academic_year: formData.academic_year,
          year: formData.year,
          semester: formData.semester ?? null,
          section_name: formData.section_name,
          status: formData.status,
          created_at: item?.created_at || new Date().toISOString(),
          program_name: selectedProg?.name,
          program_code: selectedProg?.code,
          department_id: selectedProg?.department_id,
          department_name: selectedProg?.department_name,
          department_code: selectedProg?.department_code,
          students_count: item?.students_count || 0,
          faculty_count: item?.faculty_count || 0,
        },
        !item?.id
      );
    } else {
      setError(res.error || 'Failed to save section.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-[#222222] rounded-lg max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
          <h3 className="text-sm font-semibold text-[#EDEDED] flex items-center gap-2">
            <Users className="h-4 w-4 text-[#FF6B00]" />
            <span>{item ? 'Edit Section' : 'Create Section'}</span>
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
          <div>
            <label className="block text-[#9AA1AA] mb-1 font-medium">Program / Branch</label>
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="w-full h-8 px-2.5 text-xs bg-[#0A0A0A] border border-[#262626] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
              required
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#9AA1AA] mb-1 font-medium">Year Level</label>
              <select
                value={yearNumber}
                onChange={(e) => setYearNumber(Number(e.target.value))}
                className="w-full h-8 px-2.5 text-xs bg-[#0A0A0A] border border-[#262626] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
              >
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-[#9AA1AA] mb-1 font-medium">Semester (Optional)</label>
              <Input
                type="number"
                min={1}
                max={10}
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="e.g. 7 or 8"
                className="h-8 text-xs bg-[#0A0A0A] border-[#262626] text-[#EDEDED] focus:border-[#FF6B00]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#9AA1AA] mb-1 font-medium">Academic Cycle</label>
              <Input
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2025-2026"
                className="h-8 text-xs font-mono bg-[#0A0A0A] border-[#262626] text-[#EDEDED] focus:border-[#FF6B00]"
                required
              />
            </div>

            <div>
              <label className="block text-[#9AA1AA] mb-1 font-medium">Section Name</label>
              <Input
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                placeholder="e.g. Section A or CSE-A"
                className="h-8 text-xs bg-[#0A0A0A] border-[#262626] text-[#EDEDED] focus:border-[#FF6B00]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[#9AA1AA] mb-1 font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EntityStatus)}
              className="w-full h-8 px-2.5 text-xs bg-[#0A0A0A] border border-[#262626] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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
              {loading ? 'Saving...' : item ? 'Update Section' : 'Create Section'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* DIALOG 4: TRAINING GROUP FORM                                             */
/* ========================================================================= */

function TrainingGroupDialog({
  item,
  onClose,
  onSuccess,
}: {
  item?: TrainingGroupItem;
  onClose: () => void;
  onSuccess: (savedTg: TrainingGroupItem, isNew: boolean) => void;
}) {
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [status, setStatus] = useState<EntityStatus>(item?.status || 'active');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Training group name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData: TrainingGroupFormData = {
      id: item?.id,
      name: name.trim(),
      description: description.trim() || undefined,
      status,
    };

    const res = item?.id ? await updateTrainingGroupAction(formData) : await createTrainingGroupAction(formData);

    setLoading(false);
    if (res.success) {
      onSuccess(
        {
          id: item?.id || 'temp-' + Date.now(),
          name: formData.name,
          description: formData.description || null,
          status: formData.status,
          created_at: item?.created_at || new Date().toISOString(),
          students_count: item?.students_count || 0,
          faculty_count: item?.faculty_count || 0,
        },
        !item?.id
      );
    } else {
      setError(res.error || 'Failed to save training group.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-[#222222] rounded-lg max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
          <h3 className="text-sm font-semibold text-[#EDEDED] flex items-center gap-2">
            <Code className="h-4 w-4 text-[#FF6B00]" />
            <span>{item ? 'Edit Training Group' : 'Create Training Group'}</span>
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
          <div>
            <label className="block text-[#9AA1AA] mb-1 font-medium">Group Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Java Training, Python Training, Aptitude"
              className="h-8 text-xs bg-[#0A0A0A] border-[#262626] text-[#EDEDED] focus:border-[#FF6B00]"
              required
            />
          </div>

          <div>
            <label className="block text-[#9AA1AA] mb-1 font-medium">Curriculum / Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline the core topics, technologies, and objectives..."
              rows={3}
              className="w-full p-2.5 text-xs bg-[#0A0A0A] border border-[#262626] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00] resize-none"
            />
          </div>

          <div>
            <label className="block text-[#9AA1AA] mb-1 font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EntityStatus)}
              className="w-full h-8 px-2.5 text-xs bg-[#0A0A0A] border border-[#262626] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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
              {loading ? 'Saving...' : item ? 'Update Training Group' : 'Create Training Group'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* DIALOG 5: ACADEMIC YEAR FORM                                              */
/* ========================================================================= */

function AcademicYearDialog({
  item,
  onClose,
  onSuccess,
}: {
  item?: AcademicYearItem;
  onClose: () => void;
  onSuccess: (savedYear: AcademicYearItem, isNew: boolean) => void;
}) {
  const [yearNumber, setYearNumber] = useState<number>(item?.year_number || 1);
  const [displayName, setDisplayName] = useState(item?.display_name || '');
  const [calendar, setCalendar] = useState(item?.current_academic_calendar || '2025-2026');
  const [status, setStatus] = useState<EntityStatus>(item?.status || 'active');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !calendar.trim() || !yearNumber) {
      setError('Please provide year number, display name, and calendar year.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData: AcademicYearFormData = {
      id: item?.id,
      year_number: Number(yearNumber),
      display_name: displayName.trim(),
      current_academic_calendar: calendar.trim(),
      status,
    };

    const res = item?.id ? await updateAcademicYearAction(formData) : await createAcademicYearAction(formData);

    setLoading(false);
    if (res.success) {
      onSuccess(
        {
          id: item?.id || 'temp-' + Date.now(),
          year_number: formData.year_number,
          display_name: formData.display_name,
          current_academic_calendar: formData.current_academic_calendar,
          status: formData.status,
          created_at: item?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sections_count: item?.sections_count || 0,
        },
        !item?.id
      );
    } else {
      setError(res.error || 'Failed to save academic year.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-[#222222] rounded-lg max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
          <h3 className="text-sm font-semibold text-[#EDEDED] flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#FF6B00]" />
            <span>{item ? 'Edit Academic Year' : 'Create Academic Year'}</span>
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
          <div>
            <label className="block text-[#9AA1AA] mb-1 font-medium">Year Number (1 - 5)</label>
            <Input
              type="number"
              min={1}
              max={5}
              value={yearNumber}
              onChange={(e) => setYearNumber(Number(e.target.value))}
              disabled={Boolean(item?.id)}
              className="h-8 text-xs font-mono bg-[#0A0A0A] border-[#262626] text-[#EDEDED] focus:border-[#FF6B00]"
              required
            />
          </div>

          <div>
            <label className="block text-[#9AA1AA] mb-1 font-medium">Display Title</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. 4th Year (Graduating)"
              className="h-8 text-xs bg-[#0A0A0A] border-[#262626] text-[#EDEDED] focus:border-[#FF6B00]"
              required
            />
          </div>

          <div>
            <label className="block text-[#9AA1AA] mb-1 font-medium">Academic Calendar Cycle</label>
            <Input
              value={calendar}
              onChange={(e) => setCalendar(e.target.value)}
              placeholder="e.g. 2025-2026"
              className="h-8 text-xs font-mono bg-[#0A0A0A] border-[#262626] text-[#EDEDED] focus:border-[#FF6B00]"
              required
            />
          </div>

          <div>
            <label className="block text-[#9AA1AA] mb-1 font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EntityStatus)}
              className="w-full h-8 px-2.5 text-xs bg-[#0A0A0A] border border-[#262626] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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
              {loading ? 'Saving...' : item ? 'Update Academic Year' : 'Create Academic Year'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
