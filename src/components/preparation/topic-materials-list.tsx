'use client';

import Link from 'next/link';
import { PreparationMaterial } from '@/lib/types/preparation.types';
import { ArrowRight, Clock, CheckCircle2 } from 'lucide-react';

interface TopicMaterialsListProps {
  materials: PreparationMaterial[];
  emptyMessage?: string;
}

export function TopicMaterialsList({
  materials,
  emptyMessage = 'No preparation materials currently available for this topic.',
}: TopicMaterialsListProps) {
  if (materials.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted">
        {emptyMessage}
      </div>
    );
  }

  const getProgressLabel = (status?: string | null) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-sm text-green-500">
            <CheckCircle2 className="h-3 w-3" />
            <span>Completed</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-sm text-accent">
            <Clock className="h-3 w-3" />
            <span>In Progress</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="border-t border-b border-border divide-y divide-border">
      {materials.map((m) => (
        <Link
          key={m.id}
          href={`/student/preparation/material/${m.id}`}
          className="group py-4 px-3 -mx-3 flex items-center justify-between gap-4 hover:bg-elevated/50 transition-colors"
        >
          <div className="space-y-1 min-w-0">
            {m.technical_type && (
              <span className="text-xs font-semibold uppercase tracking-wider text-accent mb-1 block">
                {m.technical_type === 'theory' ? 'Theory' : 'Coding'}
              </span>
            )}
            <h3 className="text-base font-medium text-foreground group-hover:text-accent transition-colors truncate">
              {m.title}
            </h3>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {getProgressLabel(m.progress?.status)}
            <ArrowRight className="h-4 w-4 text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      ))}
    </div>
  );
}
