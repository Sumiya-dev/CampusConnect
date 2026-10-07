'use client';

import React, { useState } from 'react';
import { FacultyResource } from '@/lib/types/resource.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
  FileArchive,
  FileCode,
  Download,
  Search,
  BookOpen,
  GraduationCap,
  Users,
  Layers,
  User,
} from 'lucide-react';

interface StudentResourcesClientProps {
  resources: FacultyResource[];
  studentName?: string;
  departmentName?: string;
}

function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (['zip', 'rar', 'tar', 'gz'].includes(ext)) {
    return <FileArchive className="h-5 w-5 text-amber-400" />;
  }
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) {
    return <FileText className="h-5 w-5 text-sky-400" />;
  }
  if (['ppt', 'pptx'].includes(ext)) {
    return <FileText className="h-5 w-5 text-orange-400" />;
  }
  if (['pdf'].includes(ext)) {
    return <FileText className="h-5 w-5 text-rose-400" />;
  }
  return <FileCode className="h-5 w-5 text-[#9AA1AA]" />;
}

export function StudentResourcesClient({
  resources,
}: StudentResourcesClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');

  // Extract distinct subjects
  const allSubjects = Array.from(new Set(resources.map((r) => r.subject))).filter(Boolean);

  const filteredResources = resources.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.faculty_name && r.faculty_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSubject =
      subjectFilter === 'all' || r.subject === subjectFilter;

    const matchesScope =
      scopeFilter === 'all' || r.target_type === scopeFilter;

    return matchesSearch && matchesSubject && matchesScope;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9AA1AA]" />
          <Input
            type="text"
            placeholder="Search resources by title, subject, or faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-[#0A0A0A] border-[#222222] text-[#EDEDED] text-sm h-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="h-9 px-3 rounded-md bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">All Subjects</option>
            {allSubjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {/* Scope Filter */}
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="h-9 px-3 rounded-md bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">All Audiences</option>
            <option value="section">My Section</option>
            <option value="training_group">My Training Groups</option>
          </select>
        </div>
      </div>

      {/* Resources Feed */}
      {filteredResources.length === 0 ? (
        <div className="border border-[#222222] bg-[#0A0A0A] rounded-md p-10 text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-[#161616] border border-[#262626] text-[#9AA1AA]">
            <BookOpen className="h-6 w-6 text-[#FF6B00]" />
          </div>
          <h3 className="text-base font-medium text-[#EDEDED]">
            {searchQuery || subjectFilter !== 'all' || scopeFilter !== 'all'
              ? 'No matching resources found'
              : 'No academic resources available yet'}
          </h3>
          <p className="text-xs text-[#9AA1AA] max-w-md mx-auto">
            {searchQuery || subjectFilter !== 'all' || scopeFilter !== 'all'
              ? 'Try resetting the filters or modifying your search keywords.'
              : 'Course slides, lab manuals, and syllabus resources shared by your professors will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.map((res) => {
            const uploadDate = new Date(res.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={res.id}
                className="border border-[#222222] bg-[#0A0A0A] rounded-md p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-[#333333] transition-colors"
              >
                <div className="space-y-3">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded border border-[#222222] bg-[#121212] text-[#EDEDED]">
                      {res.subject}
                    </span>

                    {res.target_type === 'all' && (
                      <span className="text-xs px-2 py-0.5 rounded border border-blue-500/20 bg-blue-500/10 text-sky-400 flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        All Cohorts
                      </span>
                    )}
                    {res.target_type === 'section' && (
                      <span className="text-xs px-2 py-0.5 rounded border border-purple-500/20 bg-purple-500/10 text-purple-300 flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        {res.section_name || 'Academic Section'}
                      </span>
                    )}
                    {res.target_type === 'training_group' && (
                      <span className="text-xs px-2 py-0.5 rounded border border-orange-500/20 bg-orange-500/10 text-orange-400 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {res.training_group_name || 'Training Group'}
                      </span>
                    )}
                  </div>

                  {/* Title & Desc */}
                  <div>
                    <h3 className="text-base font-semibold text-[#EDEDED]">
                      {res.title}
                    </h3>
                    {res.description && (
                      <p className="text-xs text-[#9AA1AA] mt-1.5 line-clamp-3">
                        {res.description}
                      </p>
                    )}
                  </div>

                  {/* Faculty Meta */}
                  <div className="flex items-center gap-2 text-xs text-[#9AA1AA] pt-1 border-t border-[#1A1A1A]">
                    <User className="h-3.5 w-3.5 text-[#FF6B00]" />
                    <span className="text-[#EDEDED] font-medium">
                      {res.faculty_name || 'Department Faculty'}
                    </span>
                    {res.faculty_department && (
                      <span>• {res.faculty_department}</span>
                    )}
                  </div>
                </div>

                {/* Footer: File Meta + Download */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#222222]">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded bg-[#161616] border border-[#222222] shrink-0">
                      {getFileIcon(res.file_name)}
                    </div>
                    <div className="min-w-0 text-xs">
                      <p className="font-mono text-[#CCCCCC] truncate">
                        {res.file_name}
                      </p>
                      <p className="text-[11px] text-[#9AA1AA]">
                        {formatBytes(res.file_size)} • {uploadDate}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`/api/resources/download?resourceId=${res.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Button
                      size="sm"
                      className="text-xs font-semibold h-8 gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </Button>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
