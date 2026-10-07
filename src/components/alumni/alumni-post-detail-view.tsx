'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Send,
  Trash2,
  CornerDownRight,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { AlumniCommunityComment, AlumniCommunityPost } from '@/lib/types/alumni.types';
import { UserRole } from '@/lib/types/database.types';
import { Button } from '@/components/ui/button';
import {
  toggleAlumniLikeAction,
  createAlumniCommentAction,
  deleteAlumniCommentAction,
  deleteAlumniPostAction,
} from '@/lib/alumni/actions';

interface AlumniPostDetailViewProps {
  post: AlumniCommunityPost;
  initialComments: AlumniCommunityComment[];
  currentUser: {
    id: string;
    role: UserRole;
    name: string;
  };
  baseHref?: string;
}

export function AlumniPostDetailView({
  post,
  initialComments,
  currentUser,
  baseHref = '/student/alumni/community',
}: AlumniPostDetailViewProps) {
  const router = useRouter();
  const [comments, setComments] = useState<AlumniCommunityComment[]>(initialComments);
  const [commentText, setCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  const isPostOwner = currentUser.id === post.author_id;
  const isPostAlumni = post.author.role === 'alumni';

  async function handleToggleLike() {
    if (isLiking) return;
    setIsLiking(true);
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    const res = await toggleAlumniLikeAction(post.id);
    setIsLiking(false);
    if (!res.success) {
      setIsLiked(!nextState);
      setLikesCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
    }
  }

  async function handleDeletePost() {
    if (!window.confirm('Are you sure you want to delete this discussion post?')) return;
    setIsDeletingPost(true);
    const res = await deleteAlumniPostAction(post.id);
    setIsDeletingPost(false);
    if (res.success) {
      router.push(baseHref);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    setCommentError(null);

    const formData = new FormData();
    formData.append('postId', post.id);
    formData.append('content', commentText.trim());

    const res = await createAlumniCommentAction(formData);
    setIsSubmittingComment(false);

    if (res.success) {
      setCommentText('');
      router.refresh();
      // Optimistic addition
      const newCommentObj: AlumniCommunityComment = {
        id: res.data?.id || crypto.randomUUID(),
        post_id: post.id,
        author_id: currentUser.id,
        parent_comment_id: null,
        content: commentText.trim(),
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
        },
        replies: [],
      };
      setComments((prev) => [...prev, newCommentObj]);
    } else {
      setCommentError(res.error || 'Failed to submit comment.');
    }
  }

  async function handleAddReply(parentId: string) {
    if (!replyText.trim()) return;

    setIsSubmittingReply(true);
    setCommentError(null);

    const formData = new FormData();
    formData.append('postId', post.id);
    formData.append('parentCommentId', parentId);
    formData.append('content', replyText.trim());

    const res = await createAlumniCommentAction(formData);
    setIsSubmittingReply(false);

    if (res.success) {
      setReplyText('');
      setReplyingToId(null);
      router.refresh();

      const newReplyObj: AlumniCommunityComment = {
        id: res.data?.id || crypto.randomUUID(),
        post_id: post.id,
        author_id: currentUser.id,
        parent_comment_id: parentId,
        content: replyText.trim(),
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
        },
      };

      setComments((prev) =>
        prev.map((c) => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: [...(c.replies || []), newReplyObj],
            };
          }
          return c;
        })
      );
    } else {
      setCommentError(res.error || 'Failed to submit reply.');
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!window.confirm('Delete this comment?')) return;

    const res = await deleteAlumniCommentAction(commentId, post.id);
    if (res.success) {
      setComments((prev) =>
        prev
          .filter((c) => c.id !== commentId)
          .map((c) => ({
            ...c,
            replies: c.replies?.filter((r) => r.id !== commentId),
          }))
      );
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back button */}
      <div>
        <Link
          href={baseHref}
          className="inline-flex items-center gap-1.5 text-xs text-[#9AA1AA] hover:text-[#EDEDED] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Discussions</span>
        </Link>
      </div>

      {/* Main Post Card */}
      <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg p-6 space-y-5">
        {/* Author Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-[#161616] border border-[#262626] flex items-center justify-center text-sm font-semibold text-[#FF6B00] shrink-0 mt-0.5 overflow-hidden">
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

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-semibold text-sm text-[#EDEDED]">
                  {post.author.name}
                </span>
                <span className="text-[#333333]">•</span>
                <span
                  className={`font-mono text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                    isPostAlumni
                      ? 'bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/30'
                      : 'bg-[#161616] text-[#9AA1AA] border-[#262626]'
                  }`}
                >
                  {isPostAlumni ? 'ALUMNI' : 'STUDENT'}
                </span>
                {post.author.department && (
                  <>
                    <span className="text-[#333333]">•</span>
                    <span className="text-[#9AA1AA] text-xs">{post.author.department}</span>
                  </>
                )}
                {isPostAlumni && post.author.graduation_year && (
                  <span className="text-[#FF6B00] font-mono text-xs">
                    {post.author.graduation_year}
                  </span>
                )}
              </div>

              {isPostAlumni && (post.author.job_role || post.author.current_company) && (
                <div className="flex items-center gap-1.5 text-xs text-[#9AA1AA]">
                  <Briefcase className="h-3 w-3 text-[#FF6B00]" />
                  <span>
                    {post.author.job_role}
                    {post.author.current_company && ` @ ${post.author.current_company}`}
                  </span>
                </div>
              )}

              <div className="text-[10px] text-[#717784] font-mono">
                {new Date(post.created_at).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-mono uppercase rounded bg-[#121212] border border-[#222222] text-[#9AA1AA]">
              {post.category}
            </span>
            {isPostOwner && (
              <button
                type="button"
                onClick={handleDeletePost}
                disabled={isDeletingPost}
                className="text-[#717784] hover:text-red-400 p-1 rounded transition-colors"
                title="Delete discussion"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Post Title & Content */}
        <div className="space-y-3 pt-2">
          <h1 className="text-lg font-bold text-[#EDEDED] leading-snug">
            {post.title}
          </h1>
          <p className="text-xs text-[#CCCCCC] leading-relaxed whitespace-pre-line">
            {post.content}
          </p>
        </div>

        {/* Footer: Like Action */}
        <div className="flex items-center gap-4 pt-4 border-t border-[#1C1C1C]">
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={isLiking}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              isLiked
                ? 'border-[#FF6B00]/40 text-[#FF6B00] bg-[#FF6B00]/10'
                : 'border-[#222222] text-[#9AA1AA] hover:text-[#EDEDED] bg-[#121212]'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-[#FF6B00]' : ''}`} />
            <span>{likesCount} Likes</span>
          </button>

          <span className="text-xs text-[#717784] font-mono flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{comments.length} Comments</span>
          </span>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg p-6 space-y-6">
        <h3 className="text-sm font-semibold text-[#EDEDED]">
          Comments ({comments.length})
        </h3>

        {commentError && (
          <div className="p-3 bg-red-950/30 border border-red-800/40 rounded-md flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{commentError}</span>
          </div>
        )}

        {/* Add Top-level Comment Composer */}
        <form onSubmit={handleAddComment} className="space-y-3">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Share your thoughts, advice, or follow-up question..."
            rows={3}
            className="w-full bg-[#121212] border border-[#222222] rounded-md p-3 text-xs text-[#EDEDED] placeholder-[#717784] focus:outline-none focus:border-[#FF6B00] transition-colors resize-none"
            disabled={isSubmittingComment}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={isSubmittingComment || !commentText.trim()}
              className="text-xs gap-1.5 font-semibold bg-[#FF6B00] text-black hover:bg-[#E05E00]"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmittingComment ? 'Submitting...' : 'Comment'}</span>
            </Button>
          </div>
        </form>

        {/* Comments Feed */}
        {comments.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-[#222222] rounded-md text-xs text-[#717784]">
            No comments yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {comments.map((comment) => {
              const isCommentAuthor = currentUser.id === comment.author_id;
              const isCommentAlumni = comment.author.role === 'alumni';

              return (
                <div
                  key={comment.id}
                  className="p-4 bg-[#121212] border border-[#222222] rounded-md space-y-3"
                >
                  {/* Comment Author Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-semibold text-[#EDEDED]">
                          {comment.author.name}
                        </span>
                        <span
                          className={`font-mono text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                            isCommentAlumni
                              ? 'bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/30'
                              : 'bg-[#161616] text-[#9AA1AA] border-[#262626]'
                          }`}
                        >
                          {isCommentAlumni ? 'ALUMNI' : 'STUDENT'}
                        </span>
                        {comment.author.department && (
                          <span className="text-[#9AA1AA] text-[11px]">
                            {comment.author.department}
                          </span>
                        )}
                        {isCommentAlumni && (comment.author.job_role || comment.author.current_company) && (
                          <span className="text-[#9AA1AA] text-[11px]">
                            • {[comment.author.job_role, comment.author.current_company].filter(Boolean).join(' @ ')}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#717784] font-mono">
                        {new Date(comment.created_at).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    {isCommentAuthor && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-[#717784] hover:text-red-400 p-1 transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Comment Content */}
                  <p className="text-xs text-[#CCCCCC] leading-relaxed whitespace-pre-line">
                    {comment.content}
                  </p>

                  {/* Reply Button Trigger */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setReplyingToId(replyingToId === comment.id ? null : comment.id)
                      }
                      className="inline-flex items-center gap-1 text-[11px] text-[#717784] hover:text-[#EDEDED] transition-colors"
                    >
                      <CornerDownRight className="h-3 w-3" />
                      <span>{replyingToId === comment.id ? 'Cancel Reply' : 'Reply'}</span>
                    </button>
                  </div>

                  {/* Reply Form */}
                  {replyingToId === comment.id && (
                    <div className="pt-2 pl-4 border-l-2 border-[#FF6B00]/40 space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to ${comment.author.name}...`}
                        rows={2}
                        className="w-full bg-[#0A0A0A] border border-[#262626] rounded p-2.5 text-xs text-[#EDEDED] placeholder-[#717784] focus:outline-none focus:border-[#FF6B00] resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReplyingToId(null);
                            setReplyText('');
                          }}
                          className="text-xs h-7"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isSubmittingReply || !replyText.trim()}
                          onClick={() => handleAddReply(comment.id)}
                          className="text-xs h-7 bg-[#FF6B00] text-black hover:bg-[#E05E00]"
                        >
                          <span>{isSubmittingReply ? 'Replying...' : 'Send Reply'}</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Nested Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="pt-2 pl-4 space-y-2.5 border-l border-[#222222]">
                      {comment.replies.map((reply) => {
                        const isReplyAuthor = currentUser.id === reply.author_id;
                        const isReplyAlumni = reply.author.role === 'alumni';

                        return (
                          <div
                            key={reply.id}
                            className="p-3 bg-[#0A0A0A] border border-[#1F1F1F] rounded space-y-1.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap text-xs">
                                <span className="font-semibold text-[#EDEDED]">
                                  {reply.author.name}
                                </span>
                                <span
                                  className={`font-mono text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                                    isReplyAlumni
                                      ? 'bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/30'
                                      : 'bg-[#161616] text-[#9AA1AA] border-[#262626]'
                                  }`}
                                >
                                  {isReplyAlumni ? 'ALUMNI' : 'STUDENT'}
                                </span>
                                <span className="text-[10px] text-[#717784] font-mono">
                                  {new Date(reply.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              {isReplyAuthor && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(reply.id)}
                                  className="text-[#717784] hover:text-red-400 p-0.5 transition-colors"
                                  title="Delete reply"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-[#CCCCCC] leading-relaxed whitespace-pre-line">
                              {reply.content}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
