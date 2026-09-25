'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, MessageSquare, ThumbsUp, Trash2 } from 'lucide-react';
import { CommunityPost } from '@/lib/types/community.types';
import { toggleLikeAction, deletePostAction } from '@/lib/community/actions';

interface PostCardProps {
  post: CommunityPost;
  currentUserId?: string;
  baseHref?: string;
}

export function PostCard({ post, currentUserId, baseHref = '/student/community' }: PostCardProps) {
  const [likes, setLikes] = useState(post.like_count);
  const [hasLiked, setHasLiked] = useState(post.has_liked);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const isAuthor = currentUserId && post.author_id === currentUserId;

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiking) return;

    setIsLiking(true);
    // Optimistic update
    const nextLiked = !hasLiked;
    setHasLiked(nextLiked);
    setLikes((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await toggleLikeAction(post.id);
      if (!res.success) {
        // Revert
        setHasLiked(!nextLiked);
        setLikes((prev) => (!nextLiked ? prev + 1 : Math.max(0, prev - 1)));
      }
    } catch {
      setHasLiked(!nextLiked);
      setLikes((prev) => (!nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this discussion post?')) return;

    try {
      const res = await deletePostAction(post.id);
      if (res.success) {
        setIsDeleted(true);
      } else {
        alert(res.error || 'Failed to delete post.');
      }
    } catch {
      alert('Failed to delete post.');
    }
  };

  if (isDeleted) return null;

  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article className="group border border-[#222222] bg-[#0A0A0A] hover:border-[#333333] rounded-md transition-colors">
      <Link href={`${baseHref}/${post.id}`} className="block p-4 sm:p-5 space-y-3">
        {/* Top Meta: Category + Visibility + Date */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium px-2 py-0.5 rounded bg-[#161616] text-[#EDEDED] border border-[#262626]">
              {post.category}
            </span>

            {post.visibility === 'STUDENTS_ONLY' && (
              <span className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20">
                <Lock className="h-3 w-3" />
                <span>Students Only</span>
              </span>
            )}
          </div>

          <span className="text-[#9AA1AA]">{formattedDate}</span>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-[#EDEDED] group-hover:text-[#FF6B00] transition-colors leading-snug">
          {post.title}
        </h3>

        {/* Content Preview */}
        <p className="text-sm text-[#9AA1AA] line-clamp-2 leading-relaxed">
          {post.content}
        </p>

        {/* Footer: Author Info + Actions */}
        <div className="pt-2 border-t border-[#1C1C1C] flex items-center justify-between gap-3 text-xs text-[#9AA1AA]">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-medium text-[#EDEDED]">
              {post.author?.name || 'Anonymous User'}
            </span>
            <span>·</span>
            <span className="truncate">
              {post.author?.department || 'University'}
            </span>
            {post.author?.role && post.author.role !== 'student' && (
              <span className="capitalize px-1.5 py-0.2 rounded bg-[#1A1A1A] text-[#9AA1AA] border border-[#2B2B2B]">
                {post.author.role.replace('_', ' ')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Like Button */}
            <button
              type="button"
              onClick={handleLike}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                hasLiked
                  ? 'text-[#FF6B00] bg-[#FF6B00]/10'
                  : 'hover:text-[#EDEDED] hover:bg-[#161616]'
              }`}
              title={hasLiked ? 'Unlike' : 'Like'}
            >
              <ThumbsUp className={`h-3.5 w-3.5 ${hasLiked ? 'fill-current' : ''}`} />
              <span>{likes}</span>
            </button>

            {/* Comment Count */}
            <div className="flex items-center gap-1 px-2 py-1 text-[#9AA1AA]">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{post.comment_count}</span>
            </div>

            {/* Delete Option for Author */}
            {isAuthor && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-1 rounded text-[#9AA1AA] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete Post"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
