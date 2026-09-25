'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  PreparationMaterial,
  PreparationCategory,
} from '@/lib/types/preparation.types';
import { Company } from '@/lib/types/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BookOpen,
  Search,
  CheckCircle2,
  Clock,
  PlayCircle,
  Building,
  ArrowRight,
  Sparkles,
  BarChart3,
  Award,
} from 'lucide-react';

interface PreparationHubViewProps {
  initialMaterials: PreparationMaterial[];
  companies: Company[];
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    percentCompleted: number;
  };
}

export function PreparationHubView({
  initialMaterials,
  companies,
  stats,
}: PreparationHubViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | PreparationCategory | 'company'>('all');
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  const filteredMaterials = useMemo(() => {
    return initialMaterials.filter((m) => {
      // Tab filter
      if (activeTab === 'company') {
        if (!m.company_id) return false;
      } else if (activeTab !== 'all') {
        if (m.category !== activeTab) return false;
      }

      // Company dropdown filter
      if (companyFilter !== 'all' && m.company_id !== companyFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const currentStatus = m.progress?.status || 'not_started';
        if (currentStatus !== statusFilter) return false;
      }

      // Difficulty filter
      if (difficultyFilter !== 'all' && m.difficulty !== difficultyFilter) {
        return false;
      }

      // Search term
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matchesTitle = m.title.toLowerCase().includes(query);
        const matchesDesc = m.description?.toLowerCase().includes(query) ?? false;
        const matchesSub = m.sub_category?.toLowerCase().includes(query) ?? false;
        const matchesRole = m.job_role?.toLowerCase().includes(query) ?? false;
        const matchesCompany =
          m.company?.company_name?.toLowerCase().includes(query) ?? false;

        if (!matchesTitle && !matchesDesc && !matchesSub && !matchesRole && !matchesCompany) {
          return false;
        }
      }

      return true;
    });
  }, [initialMaterials, activeTab, companyFilter, statusFilter, difficultyFilter, search]);

  const hasActiveFilters =
    search.trim() !== '' ||
    companyFilter !== 'all' ||
    statusFilter !== 'all' ||
    difficultyFilter !== 'all' ||
    activeTab !== 'all';

  const resetFilters = () => {
    setActiveTab('all');
    setSearch('');
    setCompanyFilter('all');
    setStatusFilter('all');
    setDifficultyFilter('all');
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return (
          <span className="text-sm font-medium px-2 py-0.5 rounded border border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]">
            Beginner
          </span>
        );
      case 'Advanced':
        return (
          <span className="text-sm font-medium px-2 py-0.5 rounded border border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444]">
            Advanced
          </span>
        );
      default:
        return (
          <span className="text-sm font-medium px-2 py-0.5 rounded border border-[#FF6B00]/30 bg-[#FF6B00]/10 text-[#FF6B00]">
            Intermediate
          </span>
        );
    }
  };

  const getProgressBadge = (status?: string | null) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/30 px-2 py-0.5 rounded">
            <CheckCircle2 className="h-3 w-3" />
            <span>Completed</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#FF6B00] bg-[#FF6B00]/10 border border-[#FF6B00]/30 px-2 py-0.5 rounded">
            <Clock className="h-3 w-3" />
            <span>In Progress</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-[#9AA1AA] bg-[#121212] border border-[#222222] px-2 py-0.5 rounded">
            <PlayCircle className="h-3 w-3" />
            <span>Not Started</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Progress Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#222222] border border-[#222222] rounded-md overflow-hidden text-sm">
        <div className="bg-[#0A0A0A] p-3.5">
          <span className="text-sm uppercase font-semibold text-[#9AA1AA] tracking-wider block">
            Curated Modules
          </span>
          <div className="text-base font-semibold text-[#EDEDED] mt-0.5">
            {stats.total} Training Guides
          </div>
          <span className="text-sm text-[#9AA1AA]">Core Institutional Syllabus</span>
        </div>

        <div className="bg-[#0A0A0A] p-3.5">
          <span className="text-sm uppercase font-semibold text-[#9AA1AA] tracking-wider block">
            Completed Modules
          </span>
          <div className="text-base font-semibold text-[#22C55E] mt-0.5">
            {stats.completed} Completed
          </div>
          <span className="text-sm text-emerald-400">Verified Study Progress</span>
        </div>

        <div className="bg-[#0A0A0A] p-3.5">
          <span className="text-sm uppercase font-semibold text-[#9AA1AA] tracking-wider block">
            In Progress
          </span>
          <div className="text-base font-semibold text-[#FF6B00] mt-0.5">
            {stats.inProgress} Active
          </div>
          <span className="text-sm text-[#FF6B00]">Ongoing Preparation</span>
        </div>

        <div className="bg-[#0A0A0A] p-3.5">
          <span className="text-sm uppercase font-semibold text-[#9AA1AA] tracking-wider block">
            Overall Completion
          </span>
          <div className="text-base font-semibold text-[#EDEDED] mt-0.5">
            {stats.percentCompleted}%
          </div>
          <div className="w-full bg-[#222222] h-1 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-[#FF6B00] h-full rounded-full transition-all duration-300"
              style={{ width: `${stats.percentCompleted}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Navigation Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#222222] pb-2 text-sm">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-[#121212] text-[#FF6B00] border border-[#FF6B00]/30'
              : 'text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#121212]'
          }`}
        >
          All Modules ({initialMaterials.length})
        </button>
        <button
          onClick={() => setActiveTab('Technical')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === 'Technical'
              ? 'bg-[#121212] text-[#FF6B00] border border-[#FF6B00]/30'
              : 'text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#121212]'
          }`}
        >
          Technical Core (
          {initialMaterials.filter((m) => m.category === 'Technical').length})
        </button>
        <button
          onClick={() => setActiveTab('Aptitude')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === 'Aptitude'
              ? 'bg-[#121212] text-[#FF6B00] border border-[#FF6B00]/30'
              : 'text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#121212]'
          }`}
        >
          Aptitude & Reasoning (
          {initialMaterials.filter((m) => m.category === 'Aptitude').length})
        </button>
        <button
          onClick={() => setActiveTab('HR')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === 'HR'
              ? 'bg-[#121212] text-[#FF6B00] border border-[#FF6B00]/30'
              : 'text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#121212]'
          }`}
        >
          HR & Behavioral (
          {initialMaterials.filter((m) => m.category === 'HR').length})
        </button>
        <button
          onClick={() => setActiveTab('company')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === 'company'
              ? 'bg-[#121212] text-[#FF6B00] border border-[#FF6B00]/30'
              : 'text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#121212]'
          }`}
        >
          Company-Specific (
          {initialMaterials.filter((m) => Boolean(m.company_id)).length})
        </button>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9AA1AA]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search preparation guides by topic, role, keyword, or company..."
            className="pl-9 text-sm h-10 bg-[#0A0A0A] border-[#222222] text-[#EDEDED] placeholder:text-[#9AA1AA] focus:border-[#FF6B00]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Company Filter */}
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="text-sm h-10 px-3 rounded-md bg-[#0A0A0A] border border-[#222222] text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">All Companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </select>

          {/* Progress Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm h-10 px-3 rounded-md bg-[#0A0A0A] border border-[#222222] text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">All Progress</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="not_started">Not Started</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="text-sm h-10 px-3 rounded-md bg-[#0A0A0A] border border-[#222222] text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-sm h-10 border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* 4. Materials List */}
      {filteredMaterials.length === 0 ? (
        <div className="border border-[#222222] rounded-md bg-[#0A0A0A] py-16 px-4 text-center space-y-3">
          <BookOpen className="h-9 w-8 text-[#9AA1AA] mx-auto opacity-50" />
          <div className="text-base font-medium text-[#EDEDED]">
            {hasActiveFilters
              ? 'No preparation guides match your filters'
              : 'No preparation materials available'}
          </div>
          <p className="text-sm text-[#9AA1AA] max-w-sm mx-auto">
            Try adjusting your search terms or filters to explore technical, aptitude, and HR interview guides.
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-sm border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED] mt-2"
            >
              Reset filters
            </Button>
          )}
        </div>
      ) : (
        <div className="border border-[#222222] rounded-md bg-[#0A0A0A] divide-y divide-[#222222] overflow-hidden">
          {filteredMaterials.map((m) => (
            <div
              key={m.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#121212]/50 transition-colors"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium px-2 py-0.5 rounded border border-[#222222] bg-[#121212] text-[#EDEDED]">
                    {m.category}
                  </span>

                  {getDifficultyBadge(m.difficulty)}

                  {m.company?.company_name && (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#FF6B00] bg-[#FF6B00]/10 border border-[#FF6B00]/30 px-2 py-0.5 rounded">
                      <Building className="h-2.5 w-2.5" />
                      <span>{m.company.company_name}</span>
                    </span>
                  )}

                  {getProgressBadge(m.progress?.status)}

                  {m.estimated_time && (
                    <span className="text-sm text-[#9AA1AA]">
                      • {m.estimated_time} read
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-semibold text-[#EDEDED] tracking-tight">
                    {m.title}
                  </h3>
                  {m.description && (
                    <p className="text-sm text-[#9AA1AA] mt-1 leading-relaxed line-clamp-2">
                      {m.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#9AA1AA] pt-0.5">
                  {m.sub_category && (
                    <span className="text-[#EDEDED] font-medium">
                      {m.sub_category}
                    </span>
                  )}
                  {m.job_role && (
                    <>
                      <span className="text-[#222222]">|</span>
                      <span>Role: {m.job_role}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="sm:shrink-0 pt-2 sm:pt-0">
                <Link href={`/student/preparation/${m.id}`}>
                  <Button
                    size="sm"
                    className="text-sm gap-1.5 w-full sm:w-auto font-medium"
                  >
                    <span>Open Study Guide</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
