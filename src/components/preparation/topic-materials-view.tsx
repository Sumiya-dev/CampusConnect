'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { PreparationMaterial } from '@/lib/types/preparation.types';
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
} from 'lucide-react';

interface TopicMaterialsViewProps {
  materials: PreparationMaterial[];
  topicTitle: string;
  topicDescription?: string;
  emptyMessage?: string;
}

export function TopicMaterialsView({
  materials,
  topicTitle,
  topicDescription,
  emptyMessage = 'No study materials currently published for this topic.',
}: TopicMaterialsViewProps) {
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    return materials.filter((m) => {
      if (difficultyFilter !== 'all' && m.difficulty !== difficultyFilter) {
        return false;
      }
      if (statusFilter !== 'all') {
        const currentStatus = m.progress?.status || 'not_started';
        if (currentStatus !== statusFilter) return false;
      }
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matchesTitle = m.title.toLowerCase().includes(query);
        const matchesDesc = m.description?.toLowerCase().includes(query) ?? false;
        const matchesRole = m.job_role?.toLowerCase().includes(query) ?? false;
        if (!matchesTitle && !matchesDesc && !matchesRole) return false;
      }
      return true;
    });
  }, [materials, difficultyFilter, statusFilter, search]);

  const hasActiveFilters =
    search.trim() !== '' || difficultyFilter !== 'all' || statusFilter !== 'all';

  const resetFilters = () => {
    setSearch('');
    setDifficultyFilter('all');
    setStatusFilter('all');
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
    <div className="space-y-4">
      {/* Topic Header */}
      <div className="border-b border-[#222222] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-[#EDEDED]">{topicTitle}</h2>
          {topicDescription && (
            <p className="text-sm text-[#9AA1AA] mt-0.5">{topicDescription}</p>
          )}
        </div>
        <span className="text-sm text-[#9AA1AA]">
          {filtered.length} of {materials.length} Guides
        </span>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9AA1AA]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guides within this topic..."
            className="pl-9 text-sm h-10 bg-[#0A0A0A] border-[#222222] text-[#EDEDED] placeholder:text-[#9AA1AA] focus:border-[#FF6B00]"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Difficulty */}
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

          {/* Progress */}
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

      {/* Materials List */}
      {filtered.length === 0 ? (
        <div className="border border-[#222222] rounded-md bg-[#0A0A0A] py-12 px-4 text-center space-y-2">
          <BookOpen className="h-6 w-6 text-[#9AA1AA] mx-auto opacity-50" />
          <p className="text-sm text-[#9AA1AA]">{emptyMessage}</p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-sm border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED] mt-2"
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="border border-[#222222] rounded-md bg-[#0A0A0A] divide-y divide-[#222222] overflow-hidden">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#121212]/50 transition-colors"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  {getDifficultyBadge(m.difficulty)}
                  {getProgressBadge(m.progress?.status)}
                  {m.company?.company_name && (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#FF6B00] bg-[#FF6B00]/10 border border-[#FF6B00]/30 px-2 py-0.5 rounded">
                      <Building className="h-2.5 w-2.5" />
                      <span>{m.company.company_name}</span>
                    </span>
                  )}
                  {m.estimated_time && (
                    <span className="text-sm text-[#9AA1AA]">
                      • {m.estimated_time} read
                    </span>
                  )}
                </div>

                <h3 className="text-base font-semibold text-[#EDEDED]">{m.title}</h3>

                {m.description && (
                  <p className="text-sm text-[#9AA1AA] leading-relaxed line-clamp-2">
                    {m.description}
                  </p>
                )}
              </div>

              <div className="sm:shrink-0">
                <Link href={`/student/preparation/material/${m.id}`}>
                  <Button
                    size="sm"
                    className="text-sm gap-1.5 w-full sm:w-auto font-medium"
                  >
                    <span>Open Material</span>
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
