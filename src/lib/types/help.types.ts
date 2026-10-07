export type HelpCategory =
  | 'FAQs'
  | 'Placement Guidelines'
  | 'Platform Guide'
  | 'Interview Preparation'
  | 'Placement Policies'
  | 'General';

export type HelpArticleStatus = 'draft' | 'published';

export interface HelpArticle {
  id: string;
  title: string;
  category: HelpCategory;
  content: string;
  status: HelpArticleStatus;
  created_by: string | null;
  creator?: {
    id: string;
    name: string;
    email: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface CreateHelpArticleInput {
  title: string;
  category: HelpCategory;
  content: string;
  status?: HelpArticleStatus;
}

export interface UpdateHelpArticleInput {
  title?: string;
  category?: HelpCategory;
  content?: string;
  status?: HelpArticleStatus;
}

export interface HelpArticleFilters {
  search?: string;
  category?: string;
  status?: string;
}

export interface HelpCenterStats {
  total: number;
  published: number;
  draft: number;
  categoriesCount: Record<string, number>;
}
