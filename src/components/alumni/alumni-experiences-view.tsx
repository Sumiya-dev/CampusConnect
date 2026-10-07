'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Plus,
  Briefcase,
  Building,
  GraduationCap,
  Calendar,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react';
import { AlumniExperience, AlumniExperienceType } from '@/lib/types/alumni.types';
import { UserRole } from '@/lib/types/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlumniNavigation } from './alumni-navigation';
import { CreateExperienceModal } from './create-experience-modal';

interface AlumniExperiencesViewProps {
  initialExperiences: AlumniExperience[];
  currentUser: {
    id: string;
    role: UserRole;
    name: string;
  };
  baseHref?: string;
}

const EXPERIENCE_TYPES: Array<'All' | AlumniExperienceType> = [
  'All',
  'Placement Experience',
  'Interview Experience',
  'Company Experience',
  'Career Journey',
  'Preparation Advice',
];

export function AlumniExperiencesView({
  initialExperiences,
  currentUser,
  baseHref = '/student/alumni',
}: AlumniExperiencesViewProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<'All' | AlumniExperienceType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isAlumni = currentUser.role === 'alumni';
  const isStudentOrAlumni = currentUser.role === 'student' || currentUser.role === 'alumni';

  const filtered = initialExperiences.filter((exp) => {
    if (selectedType !== 'All' && exp.type !== selectedType) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = exp.title.toLowerCase().includes(q);
      const matchCompany = exp.company?.toLowerCase().includes(q);
      const matchRole = exp.job_role?.toLowerCase().includes(q);
      const matchContent = exp.content.toLowerCase().includes(q);
      const matchAuthor = exp.alumni?.user?.name.toLowerCase().includes(q);
      if (!matchTitle && !matchCompany && !matchRole && !matchContent && !matchAuthor) {
        return false;
      }
    }
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Sub Navigation */}
      <AlumniNavigation baseHref={baseHref} isStudentOrAlumni={isStudentOrAlumni} />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Experience Types Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {EXPERIENCE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                selectedType === t
                  ? 'bg-[#FF6B00] text-black font-semibold'
                  : 'bg-[#121212] text-[#9AA1AA] hover:text-[#EDEDED] border border-[#222222]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search & Action */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#717784]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search experiences..."
              className="pl-8 text-xs bg-[#0A0A0A] border-[#222222] h-8"
            />
          </div>

          {isAlumni && (
            <Button
              onClick={() => setIsCreateOpen(true)}
              size="sm"
              className="gap-1.5 font-semibold text-xs bg-[#FF6B00] text-black hover:bg-[#E05E00] shrink-0 h-8"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Share Experience</span>
            </Button>
          )}
        </div>
      </div>

      {/* Experiences Feed */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-4 border border-[#222222] bg-[#0A0A0A] rounded-lg space-y-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#161616] text-[#717784]">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-[#EDEDED]">
                No alumni experiences have been shared yet.
              </h4>
              <p className="text-xs text-[#9AA1AA] max-w-sm mx-auto">
                {isAlumni
                  ? 'Be the first to share your placement interview rounds and advice for current students.'
                  : 'University alumni experiences will be published here once submitted by graduates.'}
              </p>
            </div>
            {isAlumni && (
              <Button
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="text-xs gap-1.5 mt-2 bg-[#FF6B00] text-black hover:bg-[#E05E00]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Share First Experience</span>
              </Button>
            )}
          </div>
        ) : (
          filtered.map((exp) => {
            const isExpanded = expandedId === exp.id;
            const authorName = exp.alumni?.user?.name || 'Alumni Graduate';
            const authorDept = exp.alumni?.department || exp.alumni?.user?.department;
            const authorGrad = exp.alumni?.graduation_year;

            return (
              <div
                key={exp.id}
                className="bg-[#0A0A0A] border border-[#222222] rounded-lg p-5 hover:border-[#333333] transition-colors space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-[#1C1C1C] text-[#FF6B00] border border-[#2A2A2A]">
                        {exp.type}
                      </span>
                      {(exp.company || exp.job_role) && (
                        <span className="text-xs text-[#9AA1AA] flex items-center gap-1">
                          <Building className="h-3 w-3 text-[#717784]" />
                          {[exp.job_role, exp.company].filter(Boolean).join(' @ ')}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-semibold text-[#EDEDED] leading-snug">
                      {exp.title}
                    </h3>

                    {/* Author Line */}
                    <div className="flex items-center gap-2 text-xs text-[#717784] pt-0.5 flex-wrap">
                      {exp.alumni ? (
                        <Link
                          href={`${baseHref}/${exp.alumni.id}`}
                          className="text-[#9AA1AA] hover:text-[#FF6B00] font-medium transition-colors"
                        >
                          By {authorName}
                        </Link>
                      ) : (
                        <span>By {authorName}</span>
                      )}
                      {authorDept && (
                        <>
                          <span className="text-[#333333]">•</span>
                          <span>{authorDept}</span>
                        </>
                      )}
                      {authorGrad && (
                        <>
                          <span className="text-[#333333]">•</span>
                          <span className="font-mono text-[#FF6B00]">Class of {authorGrad}</span>
                        </>
                      )}
                      <span className="text-[#333333]">•</span>
                      <span className="font-mono text-[10px]">
                        {new Date(exp.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleExpand(exp.id)}
                    className="text-[#717784] hover:text-[#EDEDED] p-1.5 rounded-md transition-colors"
                    title={isExpanded ? 'Collapse' : 'Expand full experience'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Content Preview or Full */}
                <p
                  className={`text-xs text-[#CCCCCC] leading-relaxed whitespace-pre-line ${
                    !isExpanded ? 'line-clamp-3' : ''
                  }`}
                >
                  {exp.content}
                </p>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="space-y-3 pt-3 border-t border-[#1C1C1C] animate-in fade-in duration-150">
                    {exp.selection_process && (
                      <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-md text-xs space-y-1">
                        <span className="font-semibold text-[#EDEDED] text-[11px] block">
                          Selection Process Breakdown
                        </span>
                        <p className="text-[#9AA1AA] leading-relaxed whitespace-pre-line">
                          {exp.selection_process}
                        </p>
                      </div>
                    )}

                    {exp.preparation_tips && (
                      <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-md text-xs space-y-1">
                        <span className="font-semibold text-[#EDEDED] text-[11px] block">
                          Preparation Advice
                        </span>
                        <p className="text-[#9AA1AA] leading-relaxed whitespace-pre-line">
                          {exp.preparation_tips}
                        </p>
                      </div>
                    )}

                    {exp.advice_for_juniors && (
                      <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-md text-xs space-y-1">
                        <span className="font-semibold text-[#FF6B00] text-[11px] block">
                          Advice for Juniors
                        </span>
                        <p className="text-[#9AA1AA] leading-relaxed whitespace-pre-line">
                          {exp.advice_for_juniors}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Expand Link */}
                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => toggleExpand(exp.id)}
                    className="text-xs text-[#FF6B00] hover:underline font-medium"
                  >
                    {isExpanded ? 'Show Less' : 'Read Full Experience →'}
                  </button>

                  {exp.alumni && (
                    <Link
                      href={`${baseHref}/${exp.alumni.id}`}
                      className="text-xs text-[#717784] hover:text-[#EDEDED] transition-colors"
                    >
                      View Alumni Profile →
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <CreateExperienceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
