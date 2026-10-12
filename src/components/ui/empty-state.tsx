import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  badgeText?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  badgeText,
}: EmptyStateProps) {
  return (
    <div className="border border-border rounded-md bg-surface p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto">
      <div className="flex h-10 w-10 items-center justify-center rounded border border-border bg-elevated text-accent mx-auto">
        <Icon className="h-5 w-5" />
      </div>

      <div className="space-y-1.5">
        {badgeText && (
          <span className="text-sm uppercase font-semibold text-muted tracking-wider block">
            {badgeText}
          </span>
        )}
        <h3 className="text-base font-semibold text-foreground tracking-tight">{title}</h3>
        <p className="text-sm text-muted leading-relaxed max-w-md mx-auto">{description}</p>
      </div>

      {(actionLabel && actionHref) && (
        <div className="pt-2">
          <Link href={actionHref}>
            <Button size="sm" variant="outline" className="text-sm">
              {actionLabel}
            </Button>
          </Link>
        </div>
      )}

      {(actionLabel && onAction && !actionHref) && (
        <div className="pt-2">
          <Button size="sm" variant="outline" onClick={onAction} className="text-sm">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
