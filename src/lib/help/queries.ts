import { createClient } from '../supabase/server';
import {
  HelpArticle,
  HelpArticleFilters,
  HelpCenterStats,
} from '../types/help.types';

/**
 * Fetch all help articles for Superadmin with optional filters
 */
export async function getAdminHelpArticles(
  filters: HelpArticleFilters = {}
): Promise<HelpArticle[]> {
  const supabase: any = await createClient();

  let query = supabase
    .from('help_articles')
    .select(
      `
      id,
      title,
      category,
      content,
      status,
      created_by,
      created_at,
      updated_at,
      creator:profiles!help_articles_created_by_fkey(
        id,
        name,
        email
      )
    `
    )
    .order('created_at', { ascending: false });

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching admin help articles:', error);
    return [];
  }

  let articles: HelpArticle[] = (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    content: row.content,
    status: row.status,
    created_by: row.created_by,
    creator: row.creator,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  if (filters.search && filters.search.trim()) {
    const term = filters.search.toLowerCase().trim();
    articles = articles.filter(
      (a) =>
        a.title.toLowerCase().includes(term) ||
        a.content.toLowerCase().includes(term) ||
        a.category.toLowerCase().includes(term)
    );
  }

  return articles;
}

/**
 * Fetch a single help article by ID
 */
export async function getHelpArticleById(
  id: string
): Promise<HelpArticle | null> {
  const supabase: any = await createClient();

  const { data, error } = await supabase
    .from('help_articles')
    .select(
      `
      id,
      title,
      category,
      content,
      status,
      created_by,
      created_at,
      updated_at,
      creator:profiles!help_articles_created_by_fkey(
        id,
        name,
        email
      )
    `
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching help article by ID:', error);
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    category: data.category,
    content: data.content,
    status: data.status,
    created_by: data.created_by,
    creator: data.creator,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * Get Help Center dashboard metrics
 */
export async function getAdminHelpStats(): Promise<HelpCenterStats> {
  const supabase: any = await createClient();

  const { data, error } = await supabase
    .from('help_articles')
    .select('id, status, category');

  if (error || !data) {
    return {
      total: 0,
      published: 0,
      draft: 0,
      categoriesCount: {},
    };
  }

  let published = 0;
  let draft = 0;
  const categoriesCount: Record<string, number> = {};

  data.forEach((item: any) => {
    if (item.status === 'published') published++;
    else if (item.status === 'draft') draft++;

    if (item.category) {
      categoriesCount[item.category] = (categoriesCount[item.category] || 0) + 1;
    }
  });

  return {
    total: data.length,
    published,
    draft,
    categoriesCount,
  };
}

/**
 * Fetch published help articles for Students / Faculty / Public help center
 */
export async function getPublishedHelpArticles(
  category?: string,
  search?: string
): Promise<HelpArticle[]> {
  const supabase: any = await createClient();

  let query = supabase
    .from('help_articles')
    .select(
      `
      id,
      title,
      category,
      content,
      status,
      created_by,
      created_at,
      updated_at
    `
    )
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error('Error fetching published help articles:', error);
    return [];
  }

  let list: HelpArticle[] = data;

  if (search && search.trim()) {
    const term = search.toLowerCase().trim();
    list = list.filter(
      (a) =>
        a.title.toLowerCase().includes(term) ||
        a.content.toLowerCase().includes(term) ||
        a.category.toLowerCase().includes(term)
    );
  }

  return list;
}
