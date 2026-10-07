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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#222222] border border-[#222222] rounded-md overflow-hidden text-sm">
        <div className="bg-[#0A0A0A] p-4 space-y-1">
          <span className="text-[#9AA1AA] flex items-center gap-1.5 text-xs uppercase font-semibold">
            <Mail className="h-3.5 w-3.5 text-[#FF6B00]" />
            <span>Directorate Email</span>
          </span>
          <div className="font-medium text-[#EDEDED] text-xs">placements@university.edu</div>
        </div>

        <div className="bg-[#0A0A0A] p-4 space-y-1">
          <span className="text-[#9AA1AA] flex items-center gap-1.5 text-xs uppercase font-semibold">
            <Phone className="h-3.5 w-3.5 text-[#FF6B00]" />
            <span>Helpline Desk</span>
          </span>
          <div className="font-medium text-[#EDEDED] text-xs">+91 98333 44556 (Ext 402)</div>
        </div>

        <div className="bg-[#0A0A0A] p-4 space-y-1">
          <span className="text-[#9AA1AA] flex items-center gap-1.5 text-xs uppercase font-semibold">
            <MapPin className="h-3.5 w-3.5 text-[#FF6B00]" />
            <span>Office Location</span>
          </span>
          <div className="font-medium text-[#EDEDED] text-xs">Admin Block, Room G-04</div>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9AA1AA]" />
          <Input
            type="text"
            placeholder="Search FAQs, policies, and preparation guides..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#0A0A0A] border-[#222222] text-[#EDEDED] text-xs h-9 focus-visible:ring-1 focus-visible:ring-[#FF6B00]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded text-xs font-mono transition-colors border ${
              selectedCategory === 'all'
                ? 'bg-[#FF6B00] text-black border-[#FF6B00] font-semibold'
                : 'bg-[#0A0A0A] text-[#9AA1AA] border-[#222222] hover:bg-[#161616]'
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
                    ? 'bg-[#FF6B00] text-black border-[#FF6B00] font-semibold'
                    : 'bg-[#0A0A0A] text-[#9AA1AA] border-[#222222] hover:bg-[#161616]'
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
        <div className="border-b border-[#222222] pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileQuestion className="h-4 w-4 text-[#FF6B00]" />
            <h2 className="text-sm font-semibold text-[#EDEDED] uppercase tracking-wider font-mono">
              Knowledge Base & FAQs
            </h2>
          </div>
          <span className="text-xs text-[#9AA1AA] font-mono">
            {filteredArticles.length} Article(s)
          </span>
        </div>

        <div className="border border-[#222222] rounded-md bg-[#0A0A0A] divide-y divide-[#222222] overflow-hidden">
          {filteredArticles.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <HelpCircle className="h-6 w-6 text-[#9AA1AA] mx-auto opacity-50" />
              <div className="text-sm font-medium text-[#EDEDED]">
                No matching articles found
              </div>
              <p className="text-xs text-[#9AA1AA] max-w-sm mx-auto">
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
                <h3 className="text-sm font-semibold text-[#EDEDED] leading-snug">
                  {article.title}
                </h3>
                <p className="text-xs text-[#9AA1AA] leading-relaxed whitespace-pre-line">
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
