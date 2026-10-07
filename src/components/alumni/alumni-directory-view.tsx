'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, RotateCcw, Users } from 'lucide-react';
import { AlumniProfile } from '@/lib/types/alumni.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlumniCard } from './alumni-card';
import { AlumniNavigation } from './alumni-navigation';

interface AlumniDirectoryViewProps {
  initialProfiles: AlumniProfile[];
  isStudent?: boolean;
  baseHref?: string;
}

export function AlumniDirectoryView({
  initialProfiles,
  isStudent = true,
  baseHref = '/student/alumni',
}: AlumniDirectoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');

  // Derive distinct filter values
  const departments = useMemo(() => {
    const set = new Set<string>();
    initialProfiles.forEach((p) => {
      const d = p.department || p.user?.department;
      if (d) set.add(d);
    });
    return Array.from(set).sort();
  }, [initialProfiles]);

  const years = useMemo(() => {
    const set = new Set<number>();
    initialProfiles.forEach((p) => {
      if (p.graduation_year) set.add(p.graduation_year);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [initialProfiles]);

  const companies = useMemo(() => {
    const set = new Set<string>();
    initialProfiles.forEach((p) => {
      if (p.current_company) set.add(p.current_company);
    });
    return Array.from(set).sort();
  }, [initialProfiles]);

  const roles = useMemo(() => {
    const set = new Set<string>();
    initialProfiles.forEach((p) => {
      if (p.job_role) set.add(p.job_role);
    });
    return Array.from(set).sort();
  }, [initialProfiles]);

  // Filter profiles
  const filteredProfiles = useMemo(() => {
    return initialProfiles.filter((p) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = p.user?.name.toLowerCase().includes(q);
        const compMatch = p.current_company?.toLowerCase().includes(q);
        const roleMatch = p.job_role?.toLowerCase().includes(q);
        const deptMatch = (p.department || p.user?.department)?.toLowerCase().includes(q);
        const skillsMatch = p.skills?.some((s) => s.toLowerCase().includes(q));
        if (!nameMatch && !compMatch && !roleMatch && !deptMatch && !skillsMatch) {
          return false;
        }
      }

      // Dept filter
      if (selectedDept !== 'all') {
        const d = p.department || p.user?.department;
        if (d !== selectedDept) return false;
      }

      // Year filter
      if (selectedYear !== 'all') {
        if (String(p.graduation_year) !== selectedYear) return false;
      }

      // Company filter
      if (selectedCompany !== 'all') {
        if (p.current_company?.toLowerCase() !== selectedCompany.toLowerCase()) return false;
      }

      // Role filter
      if (selectedRole !== 'all') {
        if (p.job_role?.toLowerCase() !== selectedRole.toLowerCase()) return false;
      }

      return true;
    });
  }, [initialProfiles, searchQuery, selectedDept, selectedYear, selectedCompany, selectedRole]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedDept !== 'all' ||
    selectedYear !== 'all' ||
    selectedCompany !== 'all' ||
    selectedRole !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDept('all');
    setSelectedYear('all');
    setSelectedCompany('all');
    setSelectedRole('all');
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Sub Navigation Bar */}
      <AlumniNavigation baseHref={baseHref} isStudentOrAlumni={isStudent} />

      {/* Filter and Search Bar */}
      <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Query */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#717784]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by alumni name, company, role, or skills..."
              className="pl-9 text-xs bg-[#121212] border-[#222222] h-9"
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-xs gap-1.5 shrink-0 border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </Button>
          )}
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#1C1C1C]">
          {/* Department Filter */}
          <div>
            <label className="block text-[10px] uppercase font-mono tracking-wider text-[#717784] mb-1">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-[#121212] border border-[#222222] rounded px-2.5 py-1.5 text-xs text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Graduation Year Filter */}
          <div>
            <label className="block text-[10px] uppercase font-mono tracking-wider text-[#717784] mb-1">
              Graduation Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-[#121212] border border-[#222222] rounded px-2.5 py-1.5 text-xs text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="all">All Batches</option>
              {years.map((y) => (
                <option key={y} value={String(y)}>
                  Class of {y}
                </option>
              ))}
            </select>
          </div>

          {/* Company Filter */}
          <div>
            <label className="block text-[10px] uppercase font-mono tracking-wider text-[#717784] mb-1">
              Company
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full bg-[#121212] border border-[#222222] rounded px-2.5 py-1.5 text-xs text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="all">All Companies</option>
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Job Role Filter */}
          <div>
            <label className="block text-[10px] uppercase font-mono tracking-wider text-[#717784] mb-1">
              Job Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-[#121212] border border-[#222222] rounded px-2.5 py-1.5 text-xs text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="all">All Job Roles</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Directory Results Header */}
      <div className="flex items-center justify-between text-xs text-[#9AA1AA]">
        <span>
          Showing <span className="text-[#EDEDED] font-semibold">{filteredProfiles.length}</span>{' '}
          {filteredProfiles.length === 1 ? 'alumni profile' : 'alumni profiles'}
        </span>
      </div>

      {/* Profiles Grid */}
      {filteredProfiles.length === 0 ? (
        <div className="text-center py-16 px-4 border border-[#222222] bg-[#0A0A0A] rounded-lg space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#161616] text-[#717784]">
            <Users className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-[#EDEDED]">No alumni profiles available.</h4>
            <p className="text-xs text-[#9AA1AA] max-w-sm mx-auto">
              {hasActiveFilters
                ? 'No alumni matched your current filter criteria. Try adjusting or resetting your search filters.'
                : 'Alumni members will appear here once verified on the university network.'}
            </p>
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-xs gap-1.5 mt-2"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Clear Filters</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfiles.map((profile) => (
            <AlumniCard
              key={profile.id}
              profile={profile}
              isStudent={isStudent}
              baseHref={baseHref}
            />
          ))}
        </div>
      )}
    </div>
  );
}
