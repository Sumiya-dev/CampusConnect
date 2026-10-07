'use client';

import React, { useState, useTransition } from 'react';
import {
  FacultyResource,
  ResourceAllocationOptions,
  ResourceTargetType,
} from '@/lib/types/resource.types';
import {
  uploadResource,
  updateResource,
  togglePublishResource,
  deleteResource,
} from '@/lib/resources/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  FileText,
  FileCode,
  FileArchive,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileUp,
  X,
  Layers,
  GraduationCap,
  Users,
} from 'lucide-react';

interface FacultyResourcesClientProps {
  initialResources: FacultyResource[];
  allocationOptions: ResourceAllocationOptions;
  facultyName?: string;
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

export function FacultyResourcesClient({
  initialResources,
  allocationOptions,
}: FacultyResourcesClientProps) {
  const [resources, setResources] = useState<FacultyResource[]>(initialResources);
  const [searchQuery, setSearchQuery] = useState('');
  const [targetFilter, setTargetFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<FacultyResource | null>(null);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);

  // Form States (for Upload / Edit)
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTargetType, setFormTargetType] = useState<ResourceTargetType>('all');
  const [formSectionId, setFormSectionId] = useState('');
  const [formTrainingGroupId, setFormTrainingGroupId] = useState('');
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Reset form
  const resetForm = () => {
    setFormTitle('');
    setFormSubject('');
    setFormDescription('');
    setFormTargetType('all');
    setFormSectionId(allocationOptions.sections[0]?.id || '');
    setFormTrainingGroupId(allocationOptions.training_groups[0]?.id || '');
    setFormIsPublished(true);
    setFormFile(null);
    setFormError(null);
  };

  const openUploadModal = () => {
    resetForm();
    setIsUploadModalOpen(true);
  };

  const openEditModal = (res: FacultyResource) => {
    setFormTitle(res.title);
    setFormSubject(res.subject);
    setFormDescription(res.description || '');
    setFormTargetType(res.target_type);
    setFormSectionId(res.section_id || allocationOptions.sections[0]?.id || '');
    setFormTrainingGroupId(res.training_group_id || allocationOptions.training_groups[0]?.id || '');
    setFormIsPublished(res.is_published);
    setFormFile(null);
    setFormError(null);
    setEditingResource(res);
  };

  // Filtered resources
  const filteredResources = resources.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTarget =
      targetFilter === 'all' || r.target_type === targetFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && r.is_published) ||
      (statusFilter === 'draft' && !r.is_published);

    return matchesSearch && matchesTarget && matchesStatus;
  });

  // Counters
  const totalCount = resources.length;
  const publishedCount = resources.filter((r) => r.is_published).length;
  const draftCount = totalCount - publishedCount;

  // Handle Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFile) {
      setFormError('Please select a file to upload.');
      return;
    }
    if (!formTitle.trim()) {
      setFormError('Title is required.');
      return;
    }
    if (!formSubject.trim()) {
      setFormError('Subject/Topic is required.');
      return;
    }

    setFormError(null);

    const formData = new FormData();
    formData.append('title', formTitle.trim());
    formData.append('subject', formSubject.trim());
    formData.append('description', formDescription.trim());
    formData.append('target_type', formTargetType);
    if (formTargetType === 'section') {
      formData.append('section_id', formSectionId);
    } else if (formTargetType === 'training_group') {
      formData.append('training_group_id', formTrainingGroupId);
    }
    formData.append('is_published', formIsPublished ? 'true' : 'false');
    formData.append('file', formFile);

    startTransition(async () => {
      const result = await uploadResource(formData);
      if (result.error) {
        setFormError(result.error);
      } else {
        // Find matching section/group names for optimistic UI update
        const sec = allocationOptions.sections.find((s) => s.id === formSectionId);
        const grp = allocationOptions.training_groups.find((g) => g.id === formTrainingGroupId);

        const newRes: FacultyResource = {
          id: result.resourceId || `res-${Date.now()}`,
          faculty_id: 'current-faculty',
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          subject: formSubject.trim(),
          target_type: formTargetType,
          section_id: formTargetType === 'section' ? formSectionId : null,
          training_group_id: formTargetType === 'training_group' ? formTrainingGroupId : null,
          file_path: 'uploaded',
          file_name: formFile.name,
          file_size: formFile.size,
          file_type: formFile.type || 'application/octet-stream',
          is_published: formIsPublished,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          section_name: formTargetType === 'section' ? sec?.section_code : undefined,
          training_group_name: formTargetType === 'training_group' ? grp?.name : undefined,
        };

        setResources([newRes, ...resources]);
        setIsUploadModalOpen(false);
        resetForm();
      }
    });
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;
    if (!formTitle.trim()) {
      setFormError('Title is required.');
      return;
    }
    if (!formSubject.trim()) {
      setFormError('Subject/Topic is required.');
      return;
    }

    setFormError(null);

    const formData = new FormData();
    formData.append('title', formTitle.trim());
    formData.append('subject', formSubject.trim());
    formData.append('description', formDescription.trim());
    formData.append('target_type', formTargetType);
    if (formTargetType === 'section') {
      formData.append('section_id', formSectionId);
    } else if (formTargetType === 'training_group') {
      formData.append('training_group_id', formTrainingGroupId);
    }
    formData.append('is_published', formIsPublished ? 'true' : 'false');
    if (formFile) {
      formData.append('file', formFile);
    }

    startTransition(async () => {
      const result = await updateResource(editingResource.id, formData);
      if (result.error) {
        setFormError(result.error);
      } else {
        const sec = allocationOptions.sections.find((s) => s.id === formSectionId);
        const grp = allocationOptions.training_groups.find((g) => g.id === formTrainingGroupId);

        setResources((prev) =>
          prev.map((r) => {
            if (r.id !== editingResource.id) return r;
            return {
              ...r,
              title: formTitle.trim(),
              description: formDescription.trim() || null,
              subject: formSubject.trim(),
              target_type: formTargetType,
              section_id: formTargetType === 'section' ? formSectionId : null,
              training_group_id: formTargetType === 'training_group' ? formTrainingGroupId : null,
              file_name: formFile ? formFile.name : r.file_name,
              file_size: formFile ? formFile.size : r.file_size,
              file_type: formFile ? formFile.type : r.file_type,
              is_published: formIsPublished,
              updated_at: new Date().toISOString(),
              section_name: formTargetType === 'section' ? sec?.section_code : undefined,
              training_group_name: formTargetType === 'training_group' ? grp?.name : undefined,
            };
          })
        );
        setEditingResource(null);
        resetForm();
      }
    });
  };

  // Handle Toggle Publish
  const handleTogglePublish = (res: FacultyResource) => {
    const nextState = !res.is_published;
    startTransition(async () => {
      const resResult = await togglePublishResource(res.id, nextState);
      if (!resResult.error) {
        setResources((prev) =>
          prev.map((item) =>
            item.id === res.id ? { ...item, is_published: nextState } : item
          )
        );
      }
    });
  };

  // Handle Delete
  const handleDeleteConfirm = () => {
    if (!deletingResourceId) return;
    const targetId = deletingResourceId;
    startTransition(async () => {
      const result = await deleteResource(targetId);
      if (!result.error) {
        setResources((prev) => prev.filter((item) => item.id !== targetId));
      }
      setDeletingResourceId(null);
    });
  };

  return (
    <div className="space-y-6">
      {/* Counters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0A0A0A] border border-[#222222] p-4 rounded-md">
          <span className="text-xs uppercase font-medium text-[#9AA1AA] block">
            Total Uploads
          </span>
          <div className="text-2xl font-semibold text-[#EDEDED] mt-1">
            {totalCount}
          </div>
          <span className="text-xs text-[#9AA1AA] mt-0.5 block">
            Course Documents
          </span>
        </div>

        <div className="bg-[#0A0A0A] border border-[#222222] p-4 rounded-md">
          <span className="text-xs uppercase font-medium text-[#9AA1AA] block">
            Published
          </span>
          <div className="text-2xl font-semibold text-emerald-400 mt-1">
            {publishedCount}
          </div>
          <span className="text-xs text-[#9AA1AA] mt-0.5 block">
            Accessible to Cohorts
          </span>
        </div>

        <div className="bg-[#0A0A0A] border border-[#222222] p-4 rounded-md">
          <span className="text-xs uppercase font-medium text-[#9AA1AA] block">
            Drafts / Hidden
          </span>
          <div className="text-2xl font-semibold text-amber-400 mt-1">
            {draftCount}
          </div>
          <span className="text-xs text-[#9AA1AA] mt-0.5 block">
            Unpublished to Students
          </span>
        </div>

        <div className="bg-[#0A0A0A] border border-[#222222] p-4 rounded-md">
          <span className="text-xs uppercase font-medium text-[#9AA1AA] block">
            Allocated Scope
          </span>
          <div className="text-2xl font-semibold text-[#FF6B00] mt-1">
            {allocationOptions.sections.length + allocationOptions.training_groups.length}
          </div>
          <span className="text-xs text-[#9AA1AA] mt-0.5 block">
            Sections & Batches
          </span>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9AA1AA]" />
            <Input
              type="text"
              placeholder="Search by title, subject, or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#0A0A0A] border-[#222222] text-[#EDEDED] text-sm h-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Target Filter */}
          <select
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            className="h-9 px-3 rounded-md bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">All Audiences</option>
            <option value="section">Academic Sections</option>
            <option value="training_group">Training Groups</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
            className="h-9 px-3 rounded-md bg-[#0A0A0A] border border-[#222222] text-xs text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Drafts Only</option>
          </select>

          {/* Upload Button */}
          <Button
            onClick={openUploadModal}
            size="sm"
            className="text-xs font-semibold gap-1.5 h-9"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Resource</span>
          </Button>
        </div>
      </div>

      {/* Resources List / Table */}
      {filteredResources.length === 0 ? (
        <div className="border border-[#222222] bg-[#0A0A0A] rounded-md p-10 text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-[#161616] border border-[#262626] text-[#9AA1AA]">
            <Upload className="h-6 w-6 text-[#FF6B00]" />
          </div>
          <h3 className="text-base font-medium text-[#EDEDED]">
            {searchQuery ? 'No resources match your filter' : 'No resources uploaded yet'}
          </h3>
          <p className="text-xs text-[#9AA1AA] max-w-md mx-auto">
            {searchQuery
              ? 'Try adjusting your search query or reset the target filters.'
              : 'Upload lecture slides, syllabus documents, lab guides, and reference material for your allocated sections and training batches.'}
          </p>
          {!searchQuery && (
            <div className="pt-2">
              <Button onClick={openUploadModal} size="sm" className="text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Upload First Resource
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-[#222222] bg-[#0A0A0A] rounded-md divide-y divide-[#222222] overflow-hidden">
          {filteredResources.map((res) => {
            const uploadDate = new Date(res.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={res.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#121212]/60 transition-colors"
              >
                {/* Left: Icon & Meta */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="p-2.5 rounded border border-[#222222] bg-[#161616] shrink-0 mt-0.5">
                    {getFileIcon(res.file_name)}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded border border-[#222222] bg-[#121212] text-[#EDEDED]">
                        {res.subject}
                      </span>

                      {/* Target Audience Badge */}
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

                      {/* Publication Status */}
                      {res.is_published ? (
                        <Badge variant="success" className="text-xs gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="text-xs gap-1">
                          <XCircle className="h-3 w-3" />
                          Draft (Hidden)
                        </Badge>
                      )}
                    </div>

                    <h4 className="text-base font-medium text-[#EDEDED] truncate">
                      {res.title}
                    </h4>

                    {res.description && (
                      <p className="text-xs text-[#9AA1AA] line-clamp-2 max-w-2xl">
                        {res.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-[#9AA1AA] pt-1">
                      <span className="font-mono text-[#CCCCCC]">{res.file_name}</span>
                      <span>•</span>
                      <span>{formatBytes(res.file_size)}</span>
                      <span>•</span>
                      <span>Uploaded {uploadDate}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {/* Download / View Button */}
                  <a
                    href={`/api/resources/download?resourceId=${res.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED]"
                      title="Download or Preview File"
                    >
                      <Download className="h-3.5 w-3.5 sm:mr-1" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  </a>

                  {/* Toggle Publish */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTogglePublish(res)}
                    disabled={isPending}
                    className={`text-xs h-8 border-[#222222] ${
                      res.is_published
                        ? 'text-amber-400 hover:text-amber-300'
                        : 'text-emerald-400 hover:text-emerald-300'
                    }`}
                    title={res.is_published ? 'Unpublish Resource' : 'Publish Resource'}
                  >
                    {res.is_published ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5 sm:mr-1" />
                        <span className="hidden sm:inline">Unpublish</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5 sm:mr-1" />
                        <span className="hidden sm:inline">Publish</span>
                      </>
                    )}
                  </Button>

                  {/* Edit Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(res)}
                    disabled={isPending}
                    className="text-xs h-8 border-[#222222] text-[#EDEDED] hover:border-[#FF6B00]"
                    title="Edit Resource Details & Replace File"
                  >
                    <Edit className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>

                  {/* Delete Button */}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeletingResourceId(res.id)}
                    disabled={isPending}
                    className="text-xs h-8 px-2.5"
                    title="Delete Resource"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* UPLOAD MODAL */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg max-w-lg w-full p-6 space-y-5 text-[#EDEDED] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center gap-2">
                <FileUp className="h-5 w-5 text-[#FF6B00]" />
                <h3 className="text-base font-semibold">Upload Course Resource</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-[#9AA1AA] hover:text-[#EDEDED]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded border border-red-500/20 bg-red-500/10 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-[#9AA1AA] font-medium block">
                  Resource Title <span className="text-[#FF6B00]">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Lecture 04: Dynamic Programming & Knapsack Guide"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="bg-[#121212] border-[#222222] text-[#EDEDED] text-xs h-9"
                  required
                />
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <label className="text-[#9AA1AA] font-medium block">
                  Subject / Topic <span className="text-[#FF6B00]">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Algorithms, Data Structures, Operating Systems, Java"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="bg-[#121212] border-[#222222] text-[#EDEDED] text-xs h-9"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[#9AA1AA] font-medium block">
                  Description / Study Guidelines (Optional)
                </label>
                <textarea
                  placeholder="Provide context, lecture numbers, or instructions for students..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-md bg-[#121212] border border-[#222222] p-2.5 text-xs text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <label className="text-[#9AA1AA] font-medium block">
                  Target Audience Scope
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormTargetType('all')}
                    className={`p-2.5 rounded border text-left flex flex-col gap-1 transition-colors ${
                      formTargetType === 'all'
                        ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-[#EDEDED]'
                        : 'border-[#222222] bg-[#121212] text-[#9AA1AA]'
                    }`}
                  >
                    <Layers className="h-4 w-4" />
                    <span className="font-medium text-xs">All Cohorts</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormTargetType('section')}
                    className={`p-2.5 rounded border text-left flex flex-col gap-1 transition-colors ${
                      formTargetType === 'section'
                        ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-[#EDEDED]'
                        : 'border-[#222222] bg-[#121212] text-[#9AA1AA]'
                    }`}
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span className="font-medium text-xs">Academic Section</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormTargetType('training_group')}
                    className={`p-2.5 rounded border text-left flex flex-col gap-1 transition-colors ${
                      formTargetType === 'training_group'
                        ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-[#EDEDED]'
                        : 'border-[#222222] bg-[#121212] text-[#9AA1AA]'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span className="font-medium text-xs">Training Group</span>
                  </button>
                </div>

                {/* Sub-selectors */}
                {formTargetType === 'section' && (
                  <div className="pt-1">
                    <label className="text-[#9AA1AA] font-medium block mb-1">
                      Select Allocated Academic Section
                    </label>
                    <select
                      value={formSectionId}
                      onChange={(e) => setFormSectionId(e.target.value)}
                      className="w-full h-9 px-3 rounded-md bg-[#121212] border border-[#222222] text-xs text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
                      required
                    >
                      {allocationOptions.sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.section_code}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formTargetType === 'training_group' && (
                  <div className="pt-1">
                    <label className="text-[#9AA1AA] font-medium block mb-1">
                      Select Allocated Training Group
                    </label>
                    <select
                      value={formTrainingGroupId}
                      onChange={(e) => setFormTrainingGroupId(e.target.value)}
                      className="w-full h-9 px-3 rounded-md bg-[#121212] border border-[#222222] text-xs text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
                      required
                    >
                      {allocationOptions.training_groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* File Upload */}
              <div className="space-y-1">
                <label className="text-[#9AA1AA] font-medium block">
                  Select Document <span className="text-[#FF6B00]">*</span>
                </label>
                <div className="border border-dashed border-[#333333] hover:border-[#FF6B00] rounded-md p-4 bg-[#121212] text-center space-y-2 transition-colors">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFormFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="resource-upload-input"
                    required
                  />
                  <label
                    htmlFor="resource-upload-input"
                    className="cursor-pointer block space-y-1"
                  >
                    <Upload className="h-6 w-6 text-[#9AA1AA] mx-auto" />
                    <p className="text-xs font-medium text-[#EDEDED]">
                      {formFile ? formFile.name : 'Click to browse or drop file'}
                    </p>
                    <p className="text-[11px] text-[#9AA1AA]">
                      {formFile
                        ? `${formatBytes(formFile.size)} • Selected`
                        : 'PDF, Word (DOC/DOCX), PowerPoint (PPT/PPTX), TXT, ZIP up to 20MB'}
                    </p>
                  </label>
                </div>
              </div>

              {/* Published Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="form-is-published"
                  checked={formIsPublished}
                  onChange={(e) => setFormIsPublished(e.target.checked)}
                  className="rounded border-[#222222] bg-[#121212] text-[#FF6B00] focus:ring-0 cursor-pointer"
                />
                <label
                  htmlFor="form-is-published"
                  className="text-xs text-[#EDEDED] cursor-pointer"
                >
                  Publish immediately (Students in targeted cohort can view and download)
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222222]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={isPending}
                  className="text-xs border-[#222222]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isPending}
                  className="text-xs font-semibold"
                >
                  Upload & Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT MODAL */}
      {/* ========================================================================= */}
      {editingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg max-w-lg w-full p-6 space-y-5 text-[#EDEDED] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-[#FF6B00]" />
                <h3 className="text-base font-semibold">Edit Resource Details</h3>
              </div>
              <button
                onClick={() => setEditingResource(null)}
                className="text-[#9AA1AA] hover:text-[#EDEDED]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded border border-red-500/20 bg-red-500/10 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-[#9AA1AA] font-medium block">
                  Resource Title <span className="text-[#FF6B00]">*</span>
                </label>
                <Input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="bg-[#121212] border-[#222222] text-[#EDEDED] text-xs h-9"
                  required
                />
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <label className="text-[#9AA1AA] font-medium block">
                  Subject / Topic <span className="text-[#FF6B00]">*</span>
                </label>
                <Input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="bg-[#121212] border-[#222222] text-[#EDEDED] text-xs h-9"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[#9AA1AA] font-medium block">
                  Description / Study Guidelines
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-md bg-[#121212] border border-[#222222] p-2.5 text-xs text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <label className="text-[#9AA1AA] font-medium block">
                  Target Audience Scope
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormTargetType('all')}
                    className={`p-2.5 rounded border text-left flex flex-col gap-1 transition-colors ${
                      formTargetType === 'all'
                        ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-[#EDEDED]'
                        : 'border-[#222222] bg-[#121212] text-[#9AA1AA]'
                    }`}
                  >
                    <Layers className="h-4 w-4" />
                    <span className="font-medium text-xs">All Cohorts</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormTargetType('section')}
                    className={`p-2.5 rounded border text-left flex flex-col gap-1 transition-colors ${
                      formTargetType === 'section'
                        ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-[#EDEDED]'
                        : 'border-[#222222] bg-[#121212] text-[#9AA1AA]'
                    }`}
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span className="font-medium text-xs">Academic Section</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormTargetType('training_group')}
                    className={`p-2.5 rounded border text-left flex flex-col gap-1 transition-colors ${
                      formTargetType === 'training_group'
                        ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-[#EDEDED]'
                        : 'border-[#222222] bg-[#121212] text-[#9AA1AA]'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span className="font-medium text-xs">Training Group</span>
                  </button>
                </div>

                {formTargetType === 'section' && (
                  <div className="pt-1">
                    <label className="text-[#9AA1AA] font-medium block mb-1">
                      Select Allocated Academic Section
                    </label>
                    <select
                      value={formSectionId}
                      onChange={(e) => setFormSectionId(e.target.value)}
                      className="w-full h-9 px-3 rounded-md bg-[#121212] border border-[#222222] text-xs text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
                      required
                    >
                      {allocationOptions.sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.section_code}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formTargetType === 'training_group' && (
                  <div className="pt-1">
                    <label className="text-[#9AA1AA] font-medium block mb-1">
                      Select Allocated Training Group
                    </label>
                    <select
                      value={formTrainingGroupId}
                      onChange={(e) => setFormTrainingGroupId(e.target.value)}
                      className="w-full h-9 px-3 rounded-md bg-[#121212] border border-[#222222] text-xs text-[#EDEDED] focus:outline-none focus:border-[#FF6B00]"
                      required
                    >
                      {allocationOptions.training_groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Replace File (Optional) */}
              <div className="space-y-1">
                <label className="text-[#9AA1AA] font-medium block">
                  Replace File (Optional)
                </label>
                <div className="p-3 rounded-md bg-[#121212] border border-[#222222] text-xs space-y-2">
                  <div className="text-xs text-[#9AA1AA]">
                    Current file: <span className="font-mono text-[#EDEDED]">{editingResource.file_name}</span> ({formatBytes(editingResource.file_size)})
                  </div>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFormFile(e.target.files[0]);
                      }
                    }}
                    className="bg-[#0A0A0A] border-[#222222] text-[#EDEDED] text-xs h-9 cursor-pointer"
                  />
                  {formFile && (
                    <div className="text-xs text-emerald-400">
                      New replacement: {formFile.name} ({formatBytes(formFile.size)})
                    </div>
                  )}
                </div>
              </div>

              {/* Published Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-form-is-published"
                  checked={formIsPublished}
                  onChange={(e) => setFormIsPublished(e.target.checked)}
                  className="rounded border-[#222222] bg-[#121212] text-[#FF6B00] focus:ring-0 cursor-pointer"
                />
                <label
                  htmlFor="edit-form-is-published"
                  className="text-xs text-[#EDEDED] cursor-pointer"
                >
                  Published (Visible to students in target cohort)
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222222]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingResource(null)}
                  disabled={isPending}
                  className="text-xs border-[#222222]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isPending}
                  className="text-xs font-semibold"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deletingResourceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg max-w-sm w-full p-5 space-y-4 text-[#EDEDED]">
            <div className="flex items-center gap-2.5 text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <h3 className="text-base font-semibold">Delete Resource?</h3>
            </div>
            <p className="text-xs text-[#9AA1AA]">
              This will permanently delete the resource record and remove the file from storage. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingResourceId(null)}
                disabled={isPending}
                className="text-xs border-[#222222]"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteConfirm}
                isLoading={isPending}
                className="text-xs"
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
