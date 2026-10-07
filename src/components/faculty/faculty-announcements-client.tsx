'use client';

import React, { useState, useTransition } from 'react';
import {
  FacultyAnnouncement,
  AnnouncementAllocationOptions,
  AnnouncementTargetType,
  AnnouncementFormData,
} from '@/lib/types/announcement.types';
import {
  createAnnouncementAction,
  updateAnnouncementAction,
  toggleAnnouncementPublishAction,
  deleteAnnouncementAction,
} from '@/lib/announcements/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Layers,
  GraduationCap,
  Users,
  Building,
  Clock,
  Send,
  AlertCircle,
  Radio,
} from 'lucide-react';

interface FacultyAnnouncementsClientProps {
  initialAnnouncements: FacultyAnnouncement[];
  allocations: AnnouncementAllocationOptions;
  facultyName: string;
  departmentName: string;
}

function formatAnnouncementDate(dateStr: string): string {
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

export function FacultyAnnouncementsClient({
  initialAnnouncements,
  allocations,
  facultyName,
  departmentName,
}: FacultyAnnouncementsClientProps) {
  const [announcements, setAnnouncements] =
    useState<FacultyAnnouncement[]>(initialAnnouncements);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FacultyAnnouncement | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetType, setTargetType] = useState<AnnouncementTargetType>('all');
  const [targetDepartment, setTargetDepartment] = useState(
    allocations.faculty_department || departmentName
  );
  const [targetYear, setTargetYear] = useState<number>(4);
  const [sectionId, setSectionId] = useState<string>(
    allocations.sections[0]?.id || ''
  );
  const [trainingGroupId, setTrainingGroupId] = useState<string>(
    allocations.training_groups[0]?.id || ''
  );
  const [isPublished, setIsPublished] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Reset form to defaults
  const resetForm = () => {
    setTitle('');
    setContent('');
    setTargetType('all');
    setTargetDepartment(allocations.faculty_department || departmentName);
    setTargetYear(4);
    setSectionId(allocations.sections[0]?.id || '');
    setTrainingGroupId(allocations.training_groups[0]?.id || '');
    setIsPublished(true);
    setFormError(null);
    setEditingItem(null);
  };

  // Open modal for new creation
  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (item: FacultyAnnouncement) => {
    setEditingItem(item);
    setTitle(item.title);
    setContent(item.content);
    setTargetType(item.target_type);
    setTargetDepartment(
      item.target_department || allocations.faculty_department || departmentName
    );
    setTargetYear(item.target_year || 4);
    setSectionId(item.section_id || allocations.sections[0]?.id || '');
    setTrainingGroupId(
      item.training_group_id || allocations.training_groups[0]?.id || ''
    );
    setIsPublished(item.is_published);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle Submit (Create or Update)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || title.trim().length < 3) {
      setFormError('Title must be at least 3 characters long.');
      return;
    }

    if (!content.trim() || content.trim().length < 5) {
      setFormError('Content must be at least 5 characters long.');
      return;
    }

    if (targetType === 'section' && !sectionId) {
      setFormError('Please select a target academic section.');
      return;
    }

    if (targetType === 'training_group' && !trainingGroupId) {
      setFormError('Please select a target training group.');
      return;
    }

    const payload: AnnouncementFormData = {
      title: title.trim(),
      content: content.trim(),
      target_type: targetType,
      target_department: targetType === 'department' ? targetDepartment : null,
      target_year: targetType === 'year' ? targetYear : null,
      section_id: targetType === 'section' ? sectionId : null,
      training_group_id: targetType === 'training_group' ? trainingGroupId : null,
      is_published: isPublished,
    };

    startTransition(async () => {
      if (editingItem) {
        const res = await updateAnnouncementAction(editingItem.id, payload);
        if (!res.success) {
          setFormError(res.error || 'Failed to update announcement.');
          return;
        }

        // Optimistically update list
        setAnnouncements((prev) =>
          prev.map((item) => {
            if (item.id === editingItem.id) {
              let label = 'All Students';
              if (payload.target_type === 'department') {
                label = `Department: ${payload.target_department}`;
              } else if (payload.target_type === 'year') {
                label = `Class: Year ${payload.target_year}`;
              } else if (payload.target_type === 'section') {
                const sec = allocations.sections.find((s) => s.id === payload.section_id);
                label = sec ? `Section: ${sec.section_code}` : 'Academic Section';
              } else if (payload.target_type === 'training_group') {
                const grp = allocations.training_groups.find(
                  (g) => g.id === payload.training_group_id
                );
                label = grp ? `Training: ${grp.name}` : 'Training Group';
              }

              return {
                ...item,
                title: payload.title,
                content: payload.content,
                target_type: payload.target_type,
                target_department: payload.target_department || null,
                target_year: payload.target_year || null,
                section_id: payload.section_id || null,
                training_group_id: payload.training_group_id || null,
                is_published: payload.is_published,
                target_label: label,
                updated_at: new Date().toISOString(),
              };
            }
            return item;
          })
        );

        setIsModalOpen(false);
      } else {
        const res = await createAnnouncementAction(payload);
        if (!res.success) {
          setFormError(res.error || 'Failed to create announcement.');
          return;
        }

        let label = 'All Students';
        if (payload.target_type === 'department') {
          label = `Department: ${payload.target_department}`;
        } else if (payload.target_type === 'year') {
          label = `Class: Year ${payload.target_year}`;
        } else if (payload.target_type === 'section') {
          const sec = allocations.sections.find((s) => s.id === payload.section_id);
          label = sec ? `Section: ${sec.section_code}` : 'Academic Section';
        } else if (payload.target_type === 'training_group') {
          const grp = allocations.training_groups.find(
            (g) => g.id === payload.training_group_id
          );
          label = grp ? `Training: ${grp.name}` : 'Training Group';
        }

        const newAnnouncement: FacultyAnnouncement = {
          id: res.id || Math.random().toString(),
          faculty_id: 'current',
          title: payload.title,
          content: payload.content,
          target_type: payload.target_type,
          target_department: payload.target_department || null,
          target_year: payload.target_year || null,
          section_id: payload.section_id || null,
          training_group_id: payload.training_group_id || null,
          is_published: payload.is_published,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          faculty_name: facultyName,
          faculty_department: departmentName,
          target_label: label,
        };

        setAnnouncements((prev) => [newAnnouncement, ...prev]);
        setIsModalOpen(false);
      }
    });
  };

  // Toggle Publish / Unpublish
  const handleTogglePublish = (item: FacultyAnnouncement) => {
    const nextStatus = !item.is_published;
    startTransition(async () => {
      const res = await toggleAnnouncementPublishAction(item.id, nextStatus);
      if (res.success) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === item.id ? { ...a, is_published: nextStatus } : a))
        );
      }
    });
  };

  // Delete Announcement
  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteAnnouncementAction(id);
      if (res.success) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        setDeletingId(null);
      }
    });
  };

  // Filtered List
  const filteredAnnouncements = announcements.filter((item) => {
    if (statusFilter === 'published' && !item.is_published) return false;
    if (statusFilter === 'draft' && item.is_published) return false;

    if (targetTypeFilter !== 'all' && item.target_type !== targetTypeFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchContent = item.content.toLowerCase().includes(q);
      const matchTarget = (item.target_label || '').toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchTarget) return false;
    }

    return true;
  });

  const totalCount = announcements.length;
  const publishedCount = announcements.filter((a) => a.is_published).length;
  const draftCount = totalCount - publishedCount;

  return (
    <div className="space-y-6">
      {/* Top Action & Sub-bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#222222] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#9AA1AA]">
            <span className="text-[#EDEDED] font-mono font-medium">{totalCount}</span> Total
          </div>
          <span className="text-[#262626]">•</span>
          <div className="flex items-center gap-1.5 text-xs text-[#9AA1AA]">
            <span className="text-emerald-400 font-mono font-medium">{publishedCount}</span> Published
          </div>
          <span className="text-[#262626]">•</span>
          <div className="flex items-center gap-1.5 text-xs text-[#9AA1AA]">
            <span className="text-amber-400 font-mono font-medium">{draftCount}</span> Drafts
          </div>
        </div>

        <Button
          onClick={handleOpenCreate}
          size="sm"
          className="bg-[#EDEDED] text-black hover:bg-white text-xs h-8 px-3 gap-1.5 font-medium shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Announcement</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Search */}
        <div className="sm:col-span-6 relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9AA1AA]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, directive keyword, or target audience..."
            className="pl-8 text-xs bg-[#0A0A0A] border-[#222222] text-[#EDEDED] placeholder:text-[#9AA1AA] h-8"
          />
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3 flex items-center bg-[#0A0A0A] border border-[#222222] rounded-md p-0.5">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`flex-1 text-xs py-1 rounded transition-colors text-center font-medium ${
              statusFilter === 'all'
                ? 'bg-[#181818] text-[#EDEDED]'
                : 'text-[#9AA1AA] hover:text-[#EDEDED]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('published')}
            className={`flex-1 text-xs py-1 rounded transition-colors text-center font-medium ${
              statusFilter === 'published'
                ? 'bg-[#181818] text-emerald-400'
                : 'text-[#9AA1AA] hover:text-[#EDEDED]'
            }`}
          >
            Published
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('draft')}
            className={`flex-1 text-xs py-1 rounded transition-colors text-center font-medium ${
              statusFilter === 'draft'
                ? 'bg-[#181818] text-amber-400'
                : 'text-[#9AA1AA] hover:text-[#EDEDED]'
            }`}
          >
            Drafts
          </button>
        </div>

        {/* Target Scope Select */}
        <div className="sm:col-span-3">
          <select
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            className="w-full h-8 px-2.5 text-xs bg-[#0A0A0A] border border-[#222222] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">Audience: All Scopes</option>
            <option value="department">Department Directives</option>
            <option value="year">Class / Year Level</option>
            <option value="section">Section Specific</option>
            <option value="training_group">Training Group</option>
          </select>
        </div>
      </div>

      {/* Announcements Feed / List Style with Thin Dividers */}
      <div className="border border-[#222222] rounded-md bg-[#0A0A0A] divide-y divide-[#1A1A1A]">
        {filteredAnnouncements.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2">
            <Megaphone className="h-6 w-6 text-[#9AA1AA] mx-auto opacity-50" />
            <div className="text-sm font-medium text-[#EDEDED]">No announcements found</div>
            <p className="text-xs text-[#9AA1AA] max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || targetTypeFilter !== 'all'
                ? 'No circulars match your current search or filter criteria.'
                : 'You have not authored any departmental announcements or class notices yet.'}
            </p>
            {searchQuery || statusFilter !== 'all' || targetTypeFilter !== 'all' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setTargetTypeFilter('all');
                }}
                className="text-xs border-[#222222] text-[#EDEDED] h-7 mt-2"
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                onClick={handleOpenCreate}
                size="sm"
                className="text-xs bg-[#EDEDED] text-black hover:bg-white h-7 mt-2 font-medium"
              >
                <Plus className="h-3 w-3 mr-1" />
                Create First Notice
              </Button>
            )}
          </div>
        ) : (
          filteredAnnouncements.map((item) => (
            <article
              key={item.id}
              className="p-5 hover:bg-[#0E0E0E] transition-colors space-y-3"
            >
              {/* Header: Title, Status, and Scope Badges */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Pill */}
                    {item.is_published ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded">
                        <Clock className="h-2.5 w-2.5" />
                        Draft / Unpublished
                      </span>
                    )}

                    {/* Target Scope Badge */}
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#9AA1AA] bg-[#141414] border border-[#222222] px-2 py-0.5 rounded">
                      {item.target_type === 'department' && (
                        <Building className="h-2.5 w-2.5 text-[#FF6B00]" />
                      )}
                      {item.target_type === 'year' && (
                        <GraduationCap className="h-2.5 w-2.5 text-[#FF6B00]" />
                      )}
                      {item.target_type === 'section' && (
                        <Layers className="h-2.5 w-2.5 text-[#FF6B00]" />
                      )}
                      {item.target_type === 'training_group' && (
                        <Users className="h-2.5 w-2.5 text-[#FF6B00]" />
                      )}
                      {item.target_type === 'all' && (
                        <Radio className="h-2.5 w-2.5 text-[#FF6B00]" />
                      )}
                      <span>{item.target_label || 'All Students'}</span>
                    </span>

                    <span className="text-xs text-[#9AA1AA] font-mono ml-auto sm:ml-0">
                      {formatAnnouncementDate(item.created_at)}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-[#EDEDED] tracking-tight leading-snug">
                    {item.title}
                  </h3>
                </div>

                {/* Right Quick Action Toolbar */}
                <div className="flex items-center gap-1 shrink-0 self-end sm:self-start pt-1 sm:pt-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleTogglePublish(item)}
                    title={item.is_published ? 'Unpublish Notice' : 'Publish Notice'}
                    className="h-7 px-2 text-xs text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#1A1A1A] gap-1"
                  >
                    {item.is_published ? (
                      <>
                        <EyeOff className="h-3 w-3 text-amber-400" />
                        <span className="hidden md:inline text-[11px]">Unpublish</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 text-emerald-400" />
                        <span className="hidden md:inline text-[11px]">Publish</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleOpenEdit(item)}
                    title="Edit Announcement"
                    className="h-7 px-2 text-xs text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#1A1A1A] gap-1"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span className="hidden md:inline text-[11px]">Edit</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => setDeletingId(item.id)}
                    title="Delete Announcement"
                    className="h-7 px-2 text-xs text-[#9AA1AA] hover:text-rose-400 hover:bg-[#1A1A1A] gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span className="hidden md:inline text-[11px]">Delete</span>
                  </Button>
                </div>
              </div>

              {/* Main Content Body */}
              <p className="text-xs text-[#9AA1AA] leading-relaxed whitespace-pre-line">
                {item.content}
              </p>

              {/* Footer Meta */}
              <div className="flex items-center justify-between text-[11px] text-[#9AA1AA] font-mono pt-1">
                <span>
                  Author: <span className="text-[#EDEDED]">{item.faculty_name}</span> (
                  {item.faculty_designation || 'Faculty Member'})
                </span>
                {item.updated_at !== item.created_at && (
                  <span className="text-[#9AA1AA]">
                    Edited {formatAnnouncementDate(item.updated_at)}
                  </span>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-0">
          <div className="bg-[#0D0D0D] border border-[#222222] rounded-md max-w-xl w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-[#FF6B00]" />
                <h3 className="text-sm font-semibold text-[#EDEDED]">
                  {editingItem ? 'Edit Announcement' : 'Author Official Circular'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#9AA1AA] hover:text-[#EDEDED] p-1 rounded hover:bg-[#181818]"
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Notice Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#EDEDED]">
                  Announcement Title <span className="text-[#FF6B00]">*</span>
                </label>
                <Input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mandatory Pre-Placement Briefing & Lab Reschedule"
                  className="text-xs bg-[#121212] border-[#222222] text-[#EDEDED] placeholder:text-[#9AA1AA]"
                />
              </div>

              {/* Target Audience Scope */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#EDEDED]">
                  Target Audience Scope <span className="text-[#FF6B00]">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTargetType('all')}
                    className={`text-xs py-1.5 px-2 rounded border transition-colors text-center font-medium ${
                      targetType === 'all'
                        ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-[#FF6B00]'
                        : 'border-[#222222] bg-[#121212] text-[#9AA1AA] hover:text-[#EDEDED]'
                    }`}
                  >
                    All Students
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('department')}
                    className={`text-xs py-1.5 px-2 rounded border transition-colors text-center font-medium ${
                      targetType === 'department'
                        ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-[#FF6B00]'
                        : 'border-[#222222] bg-[#121212] text-[#9AA1AA] hover:text-[#EDEDED]'
                    }`}
                  >
                    Department
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('year')}
                    className={`text-xs py-1.5 px-2 rounded border transition-colors text-center font-medium ${
                      targetType === 'year'
                        ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-[#FF6B00]'
                        : 'border-[#222222] bg-[#121212] text-[#9AA1AA] hover:text-[#EDEDED]'
                    }`}
                  >
                    Class / Year
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('section')}
                    className={`text-xs py-1.5 px-2 rounded border transition-colors text-center font-medium ${
                      targetType === 'section'
                        ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-[#FF6B00]'
                        : 'border-[#222222] bg-[#121212] text-[#9AA1AA] hover:text-[#EDEDED]'
                    }`}
                  >
                    Section
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('training_group')}
                    className={`text-xs py-1.5 px-2 rounded border transition-colors text-center font-medium col-span-2 sm:col-span-1 ${
                      targetType === 'training_group'
                        ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-[#FF6B00]'
                        : 'border-[#222222] bg-[#121212] text-[#9AA1AA] hover:text-[#EDEDED]'
                    }`}
                  >
                    Training
                  </button>
                </div>

                {/* Sub-selectors depending on targetType */}
                {targetType === 'department' && (
                  <div className="pt-1.5">
                    <label className="text-[11px] text-[#9AA1AA] block mb-1">
                      Allocated Department
                    </label>
                    <select
                      value={targetDepartment}
                      onChange={(e) => setTargetDepartment(e.target.value)}
                      className="w-full h-8 px-2 text-xs bg-[#121212] border border-[#222222] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
                    >
                      {allocations.departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {targetType === 'year' && (
                  <div className="pt-1.5">
                    <label className="text-[11px] text-[#9AA1AA] block mb-1">
                      Academic Year Level
                    </label>
                    <select
                      value={targetYear}
                      onChange={(e) => setTargetYear(Number(e.target.value))}
                      className="w-full h-8 px-2 text-xs bg-[#121212] border border-[#222222] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
                    >
                      <option value={4}>4th Year (Graduating Cohort 2026)</option>
                      <option value={3}>3rd Year (Pre-Final Cohort 2027)</option>
                      <option value={2}>2nd Year (Sophomore 2028)</option>
                      <option value={1}>1st Year (Freshman 2029)</option>
                    </select>
                  </div>
                )}

                {targetType === 'section' && (
                  <div className="pt-1.5">
                    <label className="text-[11px] text-[#9AA1AA] block mb-1">
                      Allocated Academic Section
                    </label>
                    {allocations.sections.length === 0 ? (
                      <p className="text-xs text-amber-400">
                        No sections allocated to your profile. (Broadcasting will apply to all your department sections).
                      </p>
                    ) : (
                      <select
                        value={sectionId}
                        onChange={(e) => setSectionId(e.target.value)}
                        className="w-full h-8 px-2 text-xs bg-[#121212] border border-[#222222] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
                      >
                        {allocations.sections.map((sec) => (
                          <option key={sec.id} value={sec.id}>
                            {sec.section_code}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {targetType === 'training_group' && (
                  <div className="pt-1.5">
                    <label className="text-[11px] text-[#9AA1AA] block mb-1">
                      Allocated Training Group
                    </label>
                    {allocations.training_groups.length === 0 ? (
                      <p className="text-xs text-amber-400">
                        No training groups assigned to your profile.
                      </p>
                    ) : (
                      <select
                        value={trainingGroupId}
                        onChange={(e) => setTrainingGroupId(e.target.value)}
                        className="w-full h-8 px-2 text-xs bg-[#121212] border border-[#222222] text-[#EDEDED] rounded-md focus:outline-none focus:border-[#FF6B00]"
                      >
                        {allocations.training_groups.map((grp) => (
                          <option key={grp.id} value={grp.id}>
                            {grp.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* Announcement Content */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#EDEDED]">
                  Announcement Content <span className="text-[#FF6B00]">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Detail instructions, deadlines, lab venue updates, or exam guidelines..."
                  className="w-full rounded-md border border-[#222222] bg-[#121212] p-2.5 text-xs text-[#EDEDED] placeholder:text-[#9AA1AA] focus:outline-none focus:border-[#FF6B00] resize-y"
                />
              </div>

              {/* Publishing Status Toggle */}
              <div className="flex items-center justify-between p-3 rounded bg-[#121212] border border-[#222222]">
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-[#EDEDED]">
                    Publish Immediately
                  </div>
                  <div className="text-[11px] text-[#9AA1AA]">
                    {isPublished
                      ? 'Notice will be visible to authorized students on their dashboard bulletin.'
                      : 'Saved as draft. Only visible to you until published.'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-[#333333] bg-[#181818] accent-[#FF6B00] cursor-pointer"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED] h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="bg-[#EDEDED] text-black hover:bg-white text-xs h-8 px-4 font-medium"
                >
                  {isPending ? (
                    'Saving...'
                  ) : editingItem ? (
                    'Update Announcement'
                  ) : isPublished ? (
                    'Publish Notice'
                  ) : (
                    'Save Draft'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-0">
          <div className="bg-[#0D0D0D] border border-[#222222] rounded-md max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <Trash2 className="h-4 w-4" />
              <h3 className="text-sm font-semibold">Delete Announcement</h3>
            </div>
            <p className="text-xs text-[#9AA1AA] leading-relaxed">
              Are you sure you want to permanently remove this announcement? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setDeletingId(null)}
                className="text-xs border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED] h-8"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => handleDelete(deletingId)}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs h-8 px-3 font-medium"
              >
                {isPending ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
