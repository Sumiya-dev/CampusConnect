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
          <span className="text-sm font-medium px-2 py-0.5 rounded border border-green-500/30 bg-green-500/10 text-green-500">
            Beginner
          </span>
        );
      case 'Advanced':
        return (
          <span className="text-sm font-medium px-2 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-500">
            Advanced
          </span>
        );
      default:
        return (
          <span className="text-sm font-medium px-2 py-0.5 rounded border border-accent/30 bg-accent/10 text-accent">
            Intermediate
          </span>
        );
    }
  };

  const getProgressBadge = (status?: string | null) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-500 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded">
            <CheckCircle2 className="h-3 w-3" />
            <span>Completed</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent bg-accent/10 border border-accent/30 px-2 py-0.5 rounded">
            <Clock className="h-3 w-3" />
            <span>In Progress</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-muted bg-elevated border border-border px-2 py-0.5 rounded">
            <PlayCircle className="h-3 w-3" />
            <span>Not Started</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Progress Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-border rounded-md overflow-hidden text-sm">
        <div className="bg-surface p-3.5">
          <span className="text-sm uppercase font-semibold text-muted tracking-wider block">
            Curated Modules
          </span>
          <div className="text-base font-semibold text-foreground mt-0.5">
            {stats.total} Training Guides
          </div>
          <span className="text-sm text-muted">Core Institutional Syllabus</span>
        </div>

        <div className="bg-surface p-3.5">
          <span className="text-sm uppercase font-semibold text-muted tracking-wider block">
            Completed Modules
          </span>
          <div className="text-base font-semibold text-green-500 mt-0.5">
            {stats.completed} Completed
          </div>
          <span className="text-sm text-emerald-400">Verified Study Progress</span>
        </div>

        <div className="bg-surface p-3.5">
          <span className="text-sm uppercase font-semibold text-muted tracking-wider block">
            In Progress
          </span>
          <div className="text-base font-semibold text-accent mt-0.5">
            {stats.inProgress} Active
          </div>
          <span className="text-sm text-accent">Ongoing Preparation</span>
        </div>

        <div className="bg-surface p-3.5">
          <span className="text-sm uppercase font-semibold text-muted tracking-wider block">
            Overall Completion
          </span>
          <div className="text-base font-semibold text-foreground mt-0.5">
            {stats.percentCompleted}%
          </div>
          <div className="w-full bg-border h-1 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-accent h-full rounded-full transition-all duration-300"
              style={{ width: `${stats.percentCompleted}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Navigation Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2 text-sm">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-elevated text-accent border border-accent/30'
              : 'text-muted hover:text-foreground hover:bg-elevated'
          }`}
        >
          All Modules ({initialMaterials.length})
        </button>
        <button
          onClick={() => setActiveTab('Technical')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === 'Technical'
              ? 'bg-elevated text-accent border border-accent/30'
              : 'text-muted hover:text-foreground hover:bg-elevated'
          }`}
        >
          Technical Core (
          {initialMaterials.filter((m) => m.category === 'Technical').length})
        </button>
        <button
          onClick={() => setActiveTab('Aptitude')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === 'Aptitude'
              ? 'bg-elevated text-accent border border-accent/30'
              : 'text-muted hover:text-foreground hover:bg-elevated'
          }`}
        >
          Aptitude & Reasoning (
          {initialMaterials.filter((m) => m.category === 'Aptitude').length})
        </button>
        <button
          onClick={() => setActiveTab('HR')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === 'HR'
              ? 'bg-elevated text-accent border border-accent/30'
              : 'text-muted hover:text-foreground hover:bg-elevated'
          }`}
        >
          HR & Behavioral (
          {initialMaterials.filter((m) => m.category === 'HR').length})
        </button>
        <button
          onClick={() => setActiveTab('company')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === 'company'
              ? 'bg-elevated text-accent border border-accent/30'
              : 'text-muted hover:text-foreground hover:bg-elevated'
          }`}
        >
          Company-Specific (
          {initialMaterials.filter((m) => Boolean(m.company_id)).length})
        </button>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search preparation guides by topic, role, keyword, or company..."
            className="pl-9 text-sm h-10 bg-surface border-border text-foreground placeholder:text-muted focus:border-accent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Company Filter */}
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="text-sm h-10 px-3 rounded-md bg-surface border border-border text-foreground focus:outline-none focus:border-accent"
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
            className="text-sm h-10 px-3 rounded-md bg-surface border border-border text-foreground focus:outline-none focus:border-accent"
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
            className="text-sm h-10 px-3 rounded-md bg-surface border border-border text-foreground focus:outline-none focus:border-accent"
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
              className="text-sm h-10 border-border text-muted hover:text-foreground"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* 4. Materials List */}
      {filteredMaterials.length === 0 ? (
        <div className="border border-border rounded-md bg-surface py-16 px-4 text-center space-y-3">
          <BookOpen className="h-9 w-8 text-muted mx-auto opacity-50" />
          <div className="text-base font-medium text-foreground">
            {hasActiveFilters
              ? 'No preparation guides match your filters'
              : 'No preparation materials available'}
          </div>
          <p className="text-sm text-muted max-w-sm mx-auto">
            Try adjusting your search terms or filters to explore technical, aptitude, and HR interview guides.
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-sm border-border text-muted hover:text-foreground mt-2"
            >
              Reset filters
            </Button>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-md bg-surface divide-y divide-border overflow-hidden">
          {filteredMaterials.map((m) => (
            <div
              key={m.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-elevated/50 transition-colors"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium px-2 py-0.5 rounded border border-border bg-elevated text-foreground">
                    {m.category}
                  </span>

                  {getDifficultyBadge(m.difficulty)}

                  {m.company?.company_name && (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent bg-accent/10 border border-accent/30 px-2 py-0.5 rounded">
                      <Building className="h-2.5 w-2.5" />
                      <span>{m.company.company_name}</span>
                    </span>
                  )}

                  {getProgressBadge(m.progress?.status)}

                  {m.estimated_time && (
                    <span className="text-sm text-muted">
                      • {m.estimated_time} read
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-semibold text-foreground tracking-tight">
                    {m.title}
                  </h3>
                  {m.description && (
                    <p className="text-sm text-muted mt-1 leading-relaxed line-clamp-2">
                      {m.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted pt-0.5">
                  {m.sub_category && (
                    <span className="text-foreground font-medium">
                      {m.sub_category}
                    </span>
                  )}
                  {m.job_role && (
                    <>
                      <span className="text-border">|</span>
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
