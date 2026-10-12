'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Globe, Plus, Search, MessageSquare } from 'lucide-react';
import { CommunityCategory, CommunityPost, CommunityVisibility } from '@/lib/types/community.types';
import { UserRole } from '@/lib/types/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PostCard } from './post-card';
import { CreatePostModal } from './create-post-modal';

interface CommunityViewProps {
  initialPosts: CommunityPost[];
  currentUser: {
    id: string;
    role: UserRole;
    name: string;
  };
  baseHref?: string;
}

const CATEGORIES: Array<'All' | CommunityCategory> = [
  'All',
  'Placement',
  'Preparation',
  'Technical',
  'Career',
  'General',
];

export function CommunityView({
  initialPosts,
  currentUser,
  baseHref = '/student/community',
}: CommunityViewProps) {
  const router = useRouter();
  const isStudent = currentUser.role === 'student';

  const [activeTab, setActiveTab] = useState<CommunityVisibility>('PUBLIC');
  const [selectedCategory, setSelectedCategory] = useState<'All' | CommunityCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Filter posts based on active space, category, and search query
  const filteredPosts = initialPosts.filter((post) => {
    // Space visibility filter
    if (post.visibility !== activeTab) return false;

    // Category filter
    if (selectedCategory !== 'All' && post.category !== selectedCategory) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = post.title.toLowerCase().includes(q);
      const matchContent = post.content.toLowerCase().includes(q);
      const matchAuthor = post.author?.name?.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchAuthor) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Controls: Space Selector & Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        {/* Space Tabs: Only students see the Students Only tab */}
        <div className="flex items-center gap-1.5 p-1 bg-surface border border-border rounded-md">
          <button
            type="button"
            onClick={() => setActiveTab('PUBLIC')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded transition-colors ${
              activeTab === 'PUBLIC'
                ? 'bg-[#161616] text-accent border border-accent/30 shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Public Community</span>
          </button>

          {isStudent && (
            <button
              type="button"
              onClick={() => setActiveTab('STUDENTS_ONLY')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded transition-colors ${
                activeTab === 'STUDENTS_ONLY'
                  ? 'bg-[#161616] text-accent border border-accent/30 shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Students Only 🔒</span>
            </button>
          )}
        </div>

        {/* Create Post Action */}
        <Button
          onClick={() => setIsCreateOpen(true)}
          size="sm"
          className="gap-1.5 font-semibold text-xs self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>+ Create Post</span>
        </Button>
      </div>

      {/* Students Only Space Banner */}
      {activeTab === 'STUDENTS_ONLY' && (
        <div className="p-4 rounded-md border border-accent/20 bg-accent/5 flex items-start gap-3 text-xs">
          <div className="p-1.5 rounded bg-accent/10 text-accent shrink-0 mt-0.5">
            <Lock className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-foreground text-sm block">
              Students Only Space
            </span>
            <p className="text-muted leading-relaxed">
              A private space for students to discuss placements, preparation and campus experiences.
            </p>
          </div>
        </div>
      )}

      {/* Filter Toolbar: Categories + Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-accent text-black font-semibold'
                  : 'bg-elevated text-muted hover:text-foreground border border-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#717784]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discussions..."
            className="pl-8 text-xs bg-surface border-border h-8"
          />
        </div>
      </div>

      {/* Discussions Feed */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-14 px-4 border border-border bg-surface rounded-md space-y-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#161616] text-muted">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">No discussions yet.</h4>
              <p className="text-xs text-muted max-w-sm mx-auto">
                {activeTab === 'STUDENTS_ONLY'
                  ? 'Be the first to share an interview experience or ask a question in the student circle.'
                  : 'Start a university-wide conversation on placement opportunities, technical skills, or career guidance.'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="text-xs gap-1.5 mt-2"
            >
              <Plus className="h-3 w-3" />
              <span>Create Post</span>
            </Button>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUser.id}
              baseHref={baseHref}
            />
          ))
        )}
      </div>

      {/* Post Composer Modal */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultVisibility={activeTab}
        isStudent={isStudent}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
