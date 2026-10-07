'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '../auth/user';
import { createClient } from '../supabase/server';
import {
  CreateHelpArticleInput,
  HelpCategory,
  UpdateHelpArticleInput,
} from '../types/help.types';

export interface HelpActionResponse {
  success: boolean;
  message?: string;
  error?: string;
  articleId?: string;
}

const VALID_CATEGORIES: HelpCategory[] = [
  'FAQs',
  'Placement Guidelines',
  'Platform Guide',
  'Interview Preparation',
  'Placement Policies',
  'General',
];

/**
 * Superadmin authorization check
 */
async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'administrator') {
    throw new Error('Unauthorized: Privileged Superadmin access required.');
  }
  if (user.accountStatus !== 'active') {
    throw new Error('Unauthorized: Account is suspended or inactive.');
  }
  return user;
}

/**
 * Audit log helper
 */
async function logAudit(
  supabase: any,
  admin: { id: string; email: string },
  action: string,
  details: Record<string, unknown>
) {
  try {
    await supabase.from('admin_audit_logs').insert({
      actor_id: admin.id,
      actor_email: admin.email,
      action,
      target_user_id: null,
      target_user_email: null,
      details,
      status: 'success',
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Help center audit logging error:', err);
  }
}

/**
 * Superadmin: Create a new help article
 */
export async function createHelpArticleAction(
  input: CreateHelpArticleInput
): Promise<HelpActionResponse> {
  try {
    const admin = await requireSuperAdmin();
    const supabase: any = await createClient();

    if (!input.title || input.title.trim() === '') {
      return { success: false, error: 'Article title is required.' };
    }
    if (!input.content || input.content.trim() === '') {
      return { success: false, error: 'Article content cannot be empty.' };
    }
    if (!VALID_CATEGORIES.includes(input.category)) {
      return { success: false, error: `Invalid category: ${input.category}` };
    }

    const status = input.status === 'published' ? 'published' : 'draft';

    const insertPayload = {
      title: input.title.trim(),
      category: input.category,
      content: input.content.trim(),
      status,
      created_by: admin.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: created, error: insertError } = await supabase
      .from('help_articles')
      .insert(insertPayload)
      .select('id')
      .single();

    if (insertError || !created) {
      return {
        success: false,
        error: insertError?.message || 'Failed to create help article.',
      };
    }

    await logAudit(supabase, admin, 'HELP_ARTICLE_CREATED', {
      article_id: created.id,
      title: insertPayload.title,
      category: insertPayload.category,
      status,
    });

    revalidatePath('/admin/help');
    revalidatePath(`/admin/help/${created.id}`);
    revalidatePath('/student/help');

    return {
      success: true,
      message:
        status === 'published'
          ? 'Help article published successfully.'
          : 'Help article saved as draft.',
      articleId: created.id,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred.' };
  }
}

/**
 * Superadmin: Update an existing help article
 */
export async function updateHelpArticleAction(
  id: string,
  input: UpdateHelpArticleInput
): Promise<HelpActionResponse> {
  try {
    const admin = await requireSuperAdmin();
    const supabase: any = await createClient();

    const { data: existing, error: fetchErr } = await supabase
      .from('help_articles')
      .select('id, title, category, status')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return { success: false, error: 'Article not found.' };
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) {
      if (!input.title.trim()) {
        return { success: false, error: 'Title cannot be blank.' };
      }
      updatePayload.title = input.title.trim();
    }

    if (input.content !== undefined) {
      if (!input.content.trim()) {
        return { success: false, error: 'Content cannot be blank.' };
      }
      updatePayload.content = input.content.trim();
    }

    if (input.category !== undefined) {
      if (!VALID_CATEGORIES.includes(input.category)) {
        return { success: false, error: `Invalid category: ${input.category}` };
      }
      updatePayload.category = input.category;
    }

    if (input.status !== undefined) {
      updatePayload.status = input.status === 'published' ? 'published' : 'draft';
    }

    const { error: updateErr } = await supabase
      .from('help_articles')
      .update(updatePayload)
      .eq('id', id);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    await logAudit(supabase, admin, 'HELP_ARTICLE_UPDATED', {
      article_id: id,
      changes: updatePayload,
    });

    revalidatePath('/admin/help');
    revalidatePath(`/admin/help/${id}`);
    revalidatePath(`/admin/help/${id}/edit`);
    revalidatePath('/student/help');

    return {
      success: true,
      message: 'Help article updated successfully.',
      articleId: id,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred.' };
  }
}

/**
 * Superadmin: Toggle publish/unpublish status
 */
export async function togglePublishArticleAction(
  id: string,
  publish: boolean
): Promise<HelpActionResponse> {
  try {
    const admin = await requireSuperAdmin();
    const supabase: any = await createClient();

    const newStatus = publish ? 'published' : 'draft';
    const nowIso = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('help_articles')
      .update({
        status: newStatus,
        updated_at: nowIso,
      })
      .eq('id', id)
      .select('id, title')
      .single();

    if (error || !updated) {
      return { success: false, error: error?.message || 'Failed to update article status.' };
    }

    await logAudit(
      supabase,
      admin,
      publish ? 'HELP_ARTICLE_PUBLISHED' : 'HELP_ARTICLE_UNPUBLISHED',
      {
        article_id: id,
        title: updated.title,
        status: newStatus,
      }
    );

    revalidatePath('/admin/help');
    revalidatePath(`/admin/help/${id}`);
    revalidatePath('/student/help');

    return {
      success: true,
      message: publish
        ? 'Article published and now live in Help Center.'
        : 'Article unpublished and reverted to draft.',
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred.' };
  }
}

/**
 * Superadmin: Delete a help article
 */
export async function deleteHelpArticleAction(
  id: string
): Promise<HelpActionResponse> {
  try {
    const admin = await requireSuperAdmin();
    const supabase: any = await createClient();

    const { data: existing, error: fetchErr } = await supabase
      .from('help_articles')
      .select('id, title')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return { success: false, error: 'Article not found.' };
    }

    const { error: delErr } = await supabase
      .from('help_articles')
      .delete()
      .eq('id', id);

    if (delErr) {
      return { success: false, error: delErr.message };
    }

    await logAudit(supabase, admin, 'HELP_ARTICLE_DELETED', {
      article_id: id,
      title: existing.title,
    });

    revalidatePath('/admin/help');
    revalidatePath('/student/help');

    return {
      success: true,
      message: 'Article deleted successfully.',
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred.' };
  }
}
