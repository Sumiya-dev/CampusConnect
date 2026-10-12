'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, MessageSquare, ShieldCheck } from 'lucide-react';
import { AlumniCommunityCategory, AlumniCommunityPost } from '@/lib/types/alumni.types';
import { UserRole } from '@/lib/types/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlumniNavigation } from './alumni-navigation';
import { AlumniCommunityPostCard } from './alumni-community-post-card';
import { CreateAlumniPostModal } from './create-alumni-post-modal';

interface AlumniCommunityViewProps {
  initialPosts: AlumniCommunityPost[];
  currentUser: {
    id: string;
    role: UserRole;
    name: string;
  };
  baseHref?: string;
}

const CATEGORIES: AlumniCommunityCategory[] = [
  'All',
  'Placements',
  'Careers',
  'Interviews',
  'Technical',
  'General',
];

export function AlumniCommunityView({
  initialPosts,
  currentUser,
  baseHref = '/student/alumni',
}: AlumniCommunityViewProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<AlumniCommunityCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [posts, setPosts] = useState<AlumniCommunityPost[]>(initialPosts);

  const isStudentOrAlumni = currentUser.role === 'student' || currentUser.role === 'alumni';

  const filteredPosts = posts.filter((post) => {
    if (selectedCategory !== 'All' && post.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = post.title.toLowerCase().includes(q);
      const matchContent = post.content.toLowerCase().includes(q);
      const matchAuthor = post.author?.name?.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchAuthor) return false;
    }
    return true;
  });

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Sub Navigation Bar */}
      <AlumniNavigation baseHref={baseHref} isStudentOrAlumni={isStudentOrAlumni} />

      {/* Scope Banner */}
      <div className="p-3.5 rounded-lg border border-accent/20 bg-accent/5 flex items-start gap-3 text-xs">
        <div className="p-1 rounded bg-accent/10 text-accent shrink-0 mt-0.5">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="space-y-0.5">
          <span className="font-semibold text-foreground text-xs block">
            Alumni & Student Exclusive Community
          </span>
          <p className="text-muted leading-relaxed text-[11px]">
            A career-focused dialogue channel connecting current students directly with university alumni. Ask questions, discuss technical interviews, and exchange workplace preparation insights.
          </p>
        </div>
      </div>

      {/* Top Filter and Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-accent text-black font-semibold'
                  : 'bg-elevated text-muted hover:text-foreground border border-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Create Post */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#717784]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search discussions..."
              className="pl-8 text-xs bg-surface border-border h-8"
            />
          </div>

          <Button
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="gap-1.5 font-semibold text-xs bg-accent text-black hover:bg-[#E05E00] shrink-0 h-8"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Post</span>
          </Button>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16 px-4 border border-border bg-surface rounded-lg space-y-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#161616] text-[#717784]">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">No discussions yet.</h4>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Be the first to share an interview experience, career transition tip, or ask a question.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="text-xs gap-1.5 mt-2 bg-accent text-black hover:bg-[#E05E00]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Post</span>
            </Button>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <AlumniCommunityPostCard
              key={post.id}
              post={post}
              currentUserId={currentUser.id}
              baseHref={`${baseHref}/community`}
              onPostDeleted={handlePostDeleted}
            />
          ))
        )}
      </div>

      <CreateAlumniPostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultCategory={selectedCategory}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
