'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, Globe, ThumbsUp, MessageSquare, Trash2, Send } from 'lucide-react';
import { CommunityComment, CommunityPost } from '@/lib/types/community.types';
import { toggleLikeAction, createCommentAction, deleteCommentAction, deletePostAction } from '@/lib/community/actions';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

interface PostDetailViewProps {
  post: CommunityPost;
  initialComments: CommunityComment[];
  currentUserId?: string;
  baseHref?: string;
}

export function PostDetailView({
  post,
  initialComments,
  currentUserId,
  baseHref = '/student/community',
}: PostDetailViewProps) {
  const router = useRouter();

  const [likes, setLikes] = useState(post.like_count);
  const [hasLiked, setHasLiked] = useState(post.has_liked);
  const [isLiking, setIsLiking] = useState(false);

  const [comments, setComments] = useState<CommunityComment[]>(initialComments);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const isPostAuthor = currentUserId && post.author_id === currentUserId;

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    const nextLiked = !hasLiked;
    setHasLiked(nextLiked);
    setLikes((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await toggleLikeAction(post.id);
      if (!res.success) {
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

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    setCommentError(null);

    try {
      const formData = new FormData();
      formData.set('postId', post.id);
      formData.set('content', commentText.trim());

      const res = await createCommentAction(formData);

      if (!res.success) {
        setCommentError(res.error || 'Failed to submit comment.');
        setIsSubmittingComment(false);
        return;
      }

      setCommentText('');
      router.refresh();
      if (res.data) {
        setComments((prev) => [...prev, res.data]);
      }
    } catch (err: unknown) {
      setCommentError((err as Error).message || 'Failed to submit comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const res = await deleteCommentAction(commentId, post.id);
      if (res.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        alert(res.error || 'Failed to delete comment.');
      }
    } catch {
      alert('Failed to delete comment.');
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this discussion post? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await deletePostAction(post.id);
      if (res.success) {
        router.push(baseHref);
      } else {
        alert(res.error || 'Failed to delete post.');
      }
    } catch {
      alert('Failed to delete post.');
    }
  };

  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back Link */}
      <div>
        <Link
          href={baseHref}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9AA1AA] hover:text-[#EDEDED] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Community</span>
        </Link>
      </div>

      {/* Main Post Article */}
      <article className="border border-[#222222] bg-[#0A0A0A] rounded-md p-6 space-y-5">
        {/* Header Meta */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium px-2.5 py-0.5 rounded bg-[#161616] text-[#EDEDED] border border-[#262626]">
              {post.category}
            </span>

            {post.visibility === 'STUDENTS_ONLY' ? (
              <span className="inline-flex items-center gap-1 font-medium px-2.5 py-0.5 rounded bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20">
                <Lock className="h-3 w-3" />
                <span>Students Only 🔒</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-medium px-2.5 py-0.5 rounded bg-[#161616] text-[#9AA1AA] border border-[#262626]">
                <Globe className="h-3 w-3" />
                <span>Public Post</span>
              </span>
            )}
          </div>

          <span className="text-[#9AA1AA]">{formattedDate}</span>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-semibold text-[#EDEDED] tracking-tight leading-tight">
          {post.title}
        </h1>

        {/* Author Bio */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1C1C1C]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#1A1A1A] border border-[#2B2B2B] flex items-center justify-center font-semibold text-xs text-[#FF6B00]">
              {post.author?.name ? post.author.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="text-sm font-medium text-[#EDEDED] flex items-center gap-2">
                <span>{post.author?.name || 'Anonymous User'}</span>
                {post.author?.role && post.author.role !== 'student' && (
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-[#1E1E1E] text-[#9AA1AA] border border-[#2E2E2E]">
                    {post.author.role.replace('_', ' ')}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#9AA1AA]">
                {post.author?.department || 'University Member'}
              </p>
            </div>
          </div>

          {isPostAuthor && (
            <button
              type="button"
              onClick={handleDeletePost}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded border border-transparent hover:border-red-500/20 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Post</span>
            </button>
          )}
        </div>

        {/* Full Content */}
        <div className="text-sm text-[#D4D4D4] whitespace-pre-wrap leading-relaxed py-2">
          {post.content}
        </div>

        {/* Interactions Bar */}
        <div className="pt-4 border-t border-[#1C1C1C] flex items-center justify-between">
          <button
            type="button"
            onClick={handleLike}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              hasLiked
                ? 'text-[#FF6B00] bg-[#FF6B00]/10 border-[#FF6B00]/30'
                : 'text-[#9AA1AA] hover:text-[#EDEDED] bg-[#121212] border-[#222222]'
            }`}
          >
            <ThumbsUp className={`h-3.5 w-3.5 ${hasLiked ? 'fill-current' : ''}`} />
            <span>{hasLiked ? 'Liked' : 'Like'}</span>
            <span className="ml-1 text-[11px] font-semibold text-[#EDEDED]">({likes})</span>
          </button>

          <div className="inline-flex items-center gap-1.5 text-xs text-[#9AA1AA]">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{comments.length} comments</span>
          </div>
        </div>
      </article>

      {/* Comments Section */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-[#EDEDED] flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#FF6B00]" />
          <span>Discussion & Comments ({comments.length})</span>
        </h2>

        {commentError && (
          <Alert variant="destructive" title="Comment Submission Error">
            {commentError}
          </Alert>
        )}

        {/* Comment Composer */}
        <form onSubmit={handleAddComment} className="border border-[#222222] bg-[#0A0A0A] rounded-md p-4 space-y-3">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
            placeholder="Write a constructive response or follow-up question..."
            required
            className="w-full rounded-md border border-[#222222] bg-[#121212] px-3 py-2 text-sm text-[#EDEDED] placeholder-[#717784] focus:outline-none focus:border-[#FF6B00] transition-colors resize-y min-h-[70px]"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              isLoading={isSubmittingComment}
              className="gap-1.5 text-xs font-semibold"
            >
              <Send className="h-3 w-3" />
              <span>Post Comment</span>
            </Button>
          </div>
        </form>

        {/* Comments Feed */}
        <div className="space-y-2.5">
          {comments.length === 0 ? (
            <div className="text-center py-8 border border-[#222222] bg-[#0A0A0A] rounded-md text-xs text-[#9AA1AA]">
              No comments yet. Start the conversation.
            </div>
          ) : (
            comments.map((comment) => {
              const isCommentAuthor = currentUserId && comment.author_id === currentUserId;
              const commentDate = new Date(comment.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={comment.id}
                  className="border border-[#1E1E1E] bg-[#0C0C0C] rounded-md p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#EDEDED]">
                        {comment.author?.name || 'Anonymous User'}
                      </span>
                      {comment.author?.role && comment.author.role !== 'student' && (
                        <span className="text-[10px] uppercase tracking-wider font-semibold px-1 py-0.2 rounded bg-[#181818] text-[#9AA1AA] border border-[#262626]">
                          {comment.author.role.replace('_', ' ')}
                        </span>
                      )}
                      <span className="text-[#646B76]">·</span>
                      <span className="text-[#717784]">{commentDate}</span>
                    </div>

                    {isCommentAuthor && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1 rounded text-[#717784] hover:text-red-400 transition-colors"
                        title="Delete Comment"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-[#CCCCCC] whitespace-pre-wrap leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
