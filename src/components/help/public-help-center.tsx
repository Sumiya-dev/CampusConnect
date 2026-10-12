'use client';

import { useState, useMemo } from 'react';
import { HelpArticle } from '@/lib/types/help.types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  FileQuestion,
  Search,
  BookOpen,
  HelpCircle,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

interface PublicHelpCenterProps {
  initialArticles: HelpArticle[];
}

export function PublicHelpCenter({ initialArticles }: PublicHelpCenterProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const set = new Set<string>();
    initialArticles.forEach((a) => set.add(a.category));
    return Array.from(set);
  }, [initialArticles]);

  const filteredArticles = useMemo(() => {
    return initialArticles.filter((article) => {
      if (selectedCategory !== 'all' && article.category !== selectedCategory) {
        return false;
      }

      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matchesTitle = article.title.toLowerCase().includes(query);
        const matchesContent = article.content.toLowerCase().includes(query);
        const matchesCat = article.category.toLowerCase().includes(query);
        if (!matchesTitle && !matchesContent && !matchesCat) return false;
      }

      return true;
    });
  }, [initialArticles, search, selectedCategory]);

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Contact Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border border border-border rounded-md overflow-hidden text-sm">
        <div className="bg-surface p-4 space-y-1">
          <span className="text-muted flex items-center gap-1.5 text-xs uppercase font-semibold">
            <Mail className="h-3.5 w-3.5 text-accent" />
            <span>Directorate Email</span>
          </span>
          <div className="font-medium text-foreground text-xs">placements@university.edu</div>
        </div>

        <div className="bg-surface p-4 space-y-1">
          <span className="text-muted flex items-center gap-1.5 text-xs uppercase font-semibold">
            <Phone className="h-3.5 w-3.5 text-accent" />
            <span>Helpline Desk</span>
          </span>
          <div className="font-medium text-foreground text-xs">+91 98333 44556 (Ext 402)</div>
        </div>

        <div className="bg-surface p-4 space-y-1">
          <span className="text-muted flex items-center gap-1.5 text-xs uppercase font-semibold">
            <MapPin className="h-3.5 w-3.5 text-accent" />
            <span>Office Location</span>
          </span>
          <div className="font-medium text-foreground text-xs">Admin Block, Room G-04</div>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <Input
            type="text"
            placeholder="Search FAQs, policies, and preparation guides..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-surface border-border text-foreground text-xs h-9 focus-visible:ring-1 focus-visible:ring-accent"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded text-xs font-mono transition-colors border ${
              selectedCategory === 'all'
                ? 'bg-accent text-black border-accent font-semibold'
                : 'bg-surface text-muted border-border hover:bg-[#161616]'
            }`}
          >
            All Categories ({initialArticles.length})
          </button>
          {categories.map((cat) => {
            const count = initialArticles.filter((a) => a.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded text-xs font-mono transition-colors border ${
                  isSelected
                    ? 'bg-accent text-black border-accent font-semibold'
                    : 'bg-surface text-muted border-border hover:bg-[#161616]'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Articles Section */}
      <div className="space-y-4">
        <div className="border-b border-border pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileQuestion className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider font-mono">
              Knowledge Base & FAQs
            </h2>
          </div>
          <span className="text-xs text-muted font-mono">
            {filteredArticles.length} Article(s)
          </span>
        </div>

        <div className="border border-border rounded-md bg-surface divide-y divide-border overflow-hidden">
          {filteredArticles.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <HelpCircle className="h-6 w-6 text-muted mx-auto opacity-50" />
              <div className="text-sm font-medium text-foreground">
                No matching articles found
              </div>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Try searching for different keywords or reset the category filter.
              </p>
            </div>
          ) : (
            filteredArticles.map((article) => (
              <div key={article.id} className="p-4 sm:p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {article.category}
                  </Badge>
                </div>
                <h3 className="text-sm font-semibold text-foreground leading-snug">
                  {article.title}
                </h3>
                <p className="text-xs text-muted leading-relaxed whitespace-pre-line">
                  {article.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
