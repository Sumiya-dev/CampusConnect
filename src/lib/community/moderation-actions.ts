'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '../auth/user';
import { createClient } from '../supabase/server';
import { CommunityReportStatus, ModerationActionResult } from '../types/community.types';

/**
 * Superadmin authorization check
 */
async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    throw new Error('Unauthorized: Superadmin access required for moderation actions.');
  }
  return user;
}

/**
 * Log moderation action in admin_audit_logs
 */
async function logAudit(
  supabase: any,
  user: { id: string; email: string },
  action: string,
  details: Record<string, unknown>
) {
  try {
    await supabase.from('admin_audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
      action,
      target_user_id: null,
      target_user_email: null,
      details,
      status: 'success',
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Moderation audit logging error:', err);
  }
}

/**
 * Superadmin: Hide or restore a community post
 */
export async function moderatePostAction(
  postId: string,
  action: 'hide' | 'restore',
  reason?: string
): Promise<ModerationActionResult> {
  try {
    const admin = await requireSuperAdmin();
    const supabase: any = await createClient();

    const { data: post, error: fetchErr } = await supabase
      .from('community_posts')
      .select('id, title, author_id, is_deleted, is_moderated')
      .eq('id', postId)
      .single();

    if (fetchErr || !post) {
      return { success: false, error: 'Community post not found.' };
    }

    const isHiding = action === 'hide';

    const updatePayload = isHiding
      ? {
          is_deleted: true,
          is_moderated: true,
          moderation_reason: reason || 'Hidden by Administrator for institutional conduct review.',
          moderated_at: new Date().toISOString(),
          moderated_by: admin.id,
          updated_at: new Date().toISOString(),
        }
      : {
          is_deleted: false,
          is_moderated: false,
          moderation_reason: null,
          moderated_at: null,
          moderated_by: null,
          updated_at: new Date().toISOString(),
        };

    const { error: updateErr } = await supabase
      .from('community_posts')
      .update(updatePayload)
      .eq('id', postId);

    if (updateErr) {
      return { success: false, error: `Failed to update post: ${updateErr.message}` };
    }

    // If hiding the post, auto-resolve any Pending reports filed against it
    if (isHiding) {
      await supabase
        .from('community_reports')
        .update({
          status: 'Resolved',
          resolution_notes: `Post moderated and hidden by Administrator: ${reason || 'Rule violation'}.`,
          reviewed_by: admin.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('post_id', postId)
        .eq('status', 'Pending');
    }

    await logAudit(
      supabase,
      admin,
      isHiding ? 'MODERATE_POST_HIDE' : 'MODERATE_POST_RESTORE',
      {
        post_id: postId,
        post_title: post.title,
        author_id: post.author_id,
        reason: reason || null,
        previous_moderated: post.is_moderated,
      }
    );

    revalidatePath('/admin/moderation');
    revalidatePath(`/admin/moderation/posts/${postId}`);
    revalidatePath('/student/community');
    revalidatePath(`/student/community/${postId}`);
    revalidatePath('/faculty/community');
    revalidatePath(`/faculty/community/${postId}`);

    return {
      success: true,
      message: isHiding
        ? 'Discussion post has been hidden from public community feeds.'
        : 'Discussion post has been restored to active community feeds.',
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'An error occurred during post moderation.' };
  }
}

/**
 * Superadmin: Hide or restore a community comment
 */
export async function moderateCommentAction(
  commentId: string,
  action: 'hide' | 'restore',
  reason?: string
): Promise<ModerationActionResult> {
  try {
    const admin = await requireSuperAdmin();
    const supabase: any = await createClient();

    const { data: comment, error: fetchErr } = await supabase
      .from('community_comments')
      .select('id, post_id, author_id, is_deleted, is_moderated')
      .eq('id', commentId)
      .single();

    if (fetchErr || !comment) {
      return { success: false, error: 'Community comment not found.' };
    }

    const isHiding = action === 'hide';

    const updatePayload = isHiding
      ? {
          is_deleted: true,
          is_moderated: true,
          moderation_reason: reason || 'Hidden by Administrator for inappropriate content.',
          moderated_at: new Date().toISOString(),
          moderated_by: admin.id,
          updated_at: new Date().toISOString(),
        }
      : {
          is_deleted: false,
          is_moderated: false,
          moderation_reason: null,
          moderated_at: null,
          moderated_by: null,
          updated_at: new Date().toISOString(),
        };

    const { error: updateErr } = await supabase
      .from('community_comments')
      .update(updatePayload)
      .eq('id', commentId);

    if (updateErr) {
      return { success: false, error: `Failed to update comment: ${updateErr.message}` };
    }

    // Auto-resolve pending reports if comment was hidden
    if (isHiding) {
      await supabase
        .from('community_reports')
        .update({
          status: 'Resolved',
          resolution_notes: `Comment moderated and hidden: ${reason || 'Inappropriate content'}.`,
          reviewed_by: admin.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('comment_id', commentId)
        .eq('status', 'Pending');
    }

    await logAudit(
      supabase,
      admin,
      isHiding ? 'MODERATE_COMMENT_HIDE' : 'MODERATE_COMMENT_RESTORE',
      {
        comment_id: commentId,
        post_id: comment.post_id,
        author_id: comment.author_id,
        reason: reason || null,
      }
    );

    revalidatePath('/admin/moderation');
    revalidatePath(`/admin/moderation/posts/${comment.post_id}`);
    revalidatePath('/student/community');
    revalidatePath(`/student/community/${comment.post_id}`);
    revalidatePath('/faculty/community');
    revalidatePath(`/faculty/community/${comment.post_id}`);

    return {
      success: true,
      message: isHiding
        ? 'Comment has been hidden from discussion thread.'
        : 'Comment has been restored.',
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'An error occurred during comment moderation.' };
  }
}

/**
 * Superadmin: Review, resolve, or dismiss a report
 */
export async function updateReportStatusAction(
  reportId: string,
  newStatus: CommunityReportStatus,
  resolutionNotes?: string
): Promise<ModerationActionResult> {
  try {
    const admin = await requireSuperAdmin();
    const supabase: any = await createClient();

    const validStatuses: CommunityReportStatus[] = ['Pending', 'Reviewed', 'Resolved', 'Dismissed'];
    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: `Invalid report status: ${newStatus}` };
    }

    const { data: report, error: fetchErr } = await supabase
      .from('community_reports')
      .select('id, target_type, post_id, comment_id, status, reporter_id')
      .eq('id', reportId)
      .single();

    if (fetchErr || !report) {
      return { success: false, error: 'Report not found.' };
    }

    const { error: updateErr } = await supabase
      .from('community_reports')
      .update({
        status: newStatus,
        resolution_notes: resolutionNotes || null,
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    if (updateErr) {
      return { success: false, error: `Failed to update report status: ${updateErr.message}` };
    }

    await logAudit(supabase, admin, 'UPDATE_COMMUNITY_REPORT_STATUS', {
      report_id: reportId,
      target_type: report.target_type,
      post_id: report.post_id,
      comment_id: report.comment_id,
      previous_status: report.status,
      new_status: newStatus,
      resolution_notes: resolutionNotes || null,
    });

    revalidatePath('/admin/moderation');
    if (report.post_id) {
      revalidatePath(`/admin/moderation/posts/${report.post_id}`);
    }

    return {
      success: true,
      message: `Report status updated to "${newStatus}" successfully.`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'An error occurred updating report status.' };
  }
}

/**
 * Public action: Allow authenticated students/faculty to report inappropriate content
 */
export async function fileCommunityReportAction(
  targetType: 'post' | 'comment',
  targetId: string,
  reason: string,
  details?: string
): Promise<ModerationActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required to report content.' };
    }

    if (!reason || reason.trim() === '') {
      return { success: false, error: 'A reason for reporting is required.' };
    }

    const supabase: any = await createClient();

    const insertPayload: Record<string, any> = {
      reporter_id: user.id,
      target_type: targetType,
      reason: reason.trim(),
      details: details ? details.trim() : null,
      status: 'Pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (targetType === 'post') {
      insertPayload.post_id = targetId;
      insertPayload.comment_id = null;
    } else {
      insertPayload.comment_id = targetId;
      // Also lookup parent post_id if comment
      const { data: c } = await supabase
        .from('community_comments')
        .select('post_id')
        .eq('id', targetId)
        .single();
      insertPayload.post_id = c?.post_id || null;
    }

    const { error } = await supabase.from('community_reports').insert(insertPayload);

    if (error) {
      return { success: false, error: `Failed to submit report: ${error.message}` };
    }

    revalidatePath('/admin/moderation');

    return {
      success: true,
      message: 'Thank you. The report has been flagged for institutional administrator review.',
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit report.' };
  }
}
