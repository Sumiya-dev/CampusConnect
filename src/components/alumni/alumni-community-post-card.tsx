'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Heart, Trash2, Briefcase, GraduationCap } from 'lucide-react';
import { AlumniCommunityPost } from '@/lib/types/alumni.types';
import { toggleAlumniLikeAction, deleteAlumniPostAction } from '@/lib/alumni/actions';

interface AlumniCommunityPostCardProps {
  post: AlumniCommunityPost;
  currentUserId?: string;
  baseHref?: string;
  onPostDeleted?: (postId: string) => void;
}

export function AlumniCommunityPostCard({
  post,
  currentUserId,
  baseHref = '/student/alumni/community',
  onPostDeleted,
}: AlumniCommunityPostCardProps) {
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = Boolean(currentUserId && post.author_id === currentUserId);
  const isAlumni = post.author.role === 'alumni';

  async function handleToggleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isLiking) return;

    setIsLiking(true);
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    const res = await toggleAlumniLikeAction(post.id);
    setIsLiking(false);

    if (!res.success) {
      // revert on error
      setIsLiked(!nextState);
      setLikesCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isDeleting) return;

    if (!window.confirm('Are you sure you want to delete this discussion post?')) {
      return;
    }

    setIsDeleting(true);
    const res = await deleteAlumniPostAction(post.id);
    setIsDeleting(false);

    if (res.success && onPostDeleted) {
      onPostDeleted(post.id);
    }
  }

  return (
    <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg p-5 hover:border-[#333333] transition-all space-y-3.5 group">
      {/* Top Bar: Author Meta + Category Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-full bg-[#161616] border border-[#262626] flex items-center justify-center text-xs font-semibold text-[#FF6B00] shrink-0 mt-0.5 overflow-hidden">
            {post.author.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.author.avatar_url}
                alt={post.author.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{post.author.name.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div className="space-y-0.5">
            {/* Author Line: e.g. Rahul Kumar · ALUMNI · CSE 2024 or Sumiya · STUDENT · CSE */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="font-semibold text-[#EDEDED]">{post.author.name}</span>
              <span className="text-[#333333]">•</span>
              <span
                className={`font-mono text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                  isAlumni
                    ? 'bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/30'
                    : 'bg-[#161616] text-[#9AA1AA] border-[#262626]'
                }`}
              >
                {isAlumni ? 'ALUMNI' : 'STUDENT'}
              </span>
              {post.author.department && (
                <>
                  <span className="text-[#333333]">•</span>
                  <span className="text-[#9AA1AA] text-[11px]">{post.author.department}</span>
                </>
              )}
              {isAlumni && post.author.graduation_year && (
                <span className="text-[#FF6B00] font-mono text-[11px]">
                  {post.author.graduation_year}
                </span>
              )}
            </div>

            {/* Alumni Career Subtitle: e.g. Software Engineer @ Microsoft */}
            {isAlumni && (post.author.job_role || post.author.current_company) && (
              <div className="flex items-center gap-1 text-[11px] text-[#9AA1AA]">
                <Briefcase className="h-3 w-3 text-[#717784]" />
                <span>
                  {post.author.job_role}
                  {post.author.current_company && ` @ ${post.author.current_company}`}
                </span>
              </div>
            )}

            <div className="text-[10px] text-[#717784] font-mono">
              {new Date(post.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>

        {/* Category Pill */}
        <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-[#121212] border border-[#222222] text-[#9AA1AA] shrink-0">
          {post.category}
        </span>
      </div>

      {/* Post Content */}
      <Link href={`${baseHref}/${post.id}`} className="block space-y-2">
        <h3 className="text-sm font-semibold text-[#EDEDED] group-hover:text-[#FF6B00] transition-colors leading-snug">
          {post.title}
        </h3>
        <p className="text-xs text-[#9AA1AA] line-clamp-3 leading-relaxed">
          {post.content}
        </p>
      </Link>

      {/* Footer / Interaction Bar */}
      <div className="flex items-center justify-between pt-3 border-t border-[#1C1C1C] text-xs">
        <div className="flex items-center gap-4">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={isLiking}
            className={`inline-flex items-center gap-1.5 transition-colors ${
              isLiked ? 'text-[#FF6B00]' : 'text-[#717784] hover:text-[#EDEDED]'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-[#FF6B00]' : ''}`} />
            <span className="font-mono text-xs">{likesCount}</span>
          </button>

          {/* Comments Link */}
          <Link
            href={`${baseHref}/${post.id}`}
            className="inline-flex items-center gap-1.5 text-[#717784] hover:text-[#EDEDED] transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="font-mono text-xs">{post.comments_count}</span>
            <span className="text-[11px] text-[#717784] hidden sm:inline">comments</span>
          </Link>
        </div>

        {/* Delete button for author */}
        {isOwner && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-[#717784] hover:text-red-400 transition-colors p-1"
            title="Delete post"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
