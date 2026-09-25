import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageContainerProps {
  title: string;
  description?: string;
  badgeText?: string;
  badgeVariant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  children: React.ReactNode;
  maxWidth?: 'max-w-4xl' | 'max-w-5xl' | 'max-w-6xl' | 'max-w-7xl' | 'max-w-full';
}

export function PageContainer({
  title,
  description,
  badgeText,
  badgeVariant = 'secondary',
  actions,
  breadcrumbs,
  children,
  maxWidth = 'max-w-6xl',
}: PageContainerProps) {
  return (
    <div className={`space-y-6 ${maxWidth} w-full`}>
      {/* Page Header */}
      <div className="border-b border-[#222222] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1.5 text-sm text-[#9AA1AA] mb-2">
              {breadcrumbs.map((item, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <span key={item.label} className="flex items-center gap-1.5">
                    {idx > 0 && <ChevronRight className="h-3 w-3 text-[#333333]" />}
                    {item.href && !isLast ? (
                      <Link
                        href={item.href}
                        className="hover:text-[#EDEDED] transition-colors"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span className={isLast ? 'text-[#EDEDED] font-medium' : ''}>
                        {item.label}
                      </span>
                    )}
                  </span>
                );
              })}
            </nav>
          )}

          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-[#EDEDED] tracking-tight">{title}</h1>
            {badgeText && (
              <Badge variant={badgeVariant} className="text-sm">
                {badgeText}
              </Badge>
            )}
          </div>

          {description && (
            <p className="text-sm text-[#9AA1AA] mt-1 leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
      </div>

      {/* Page Content */}
      <div>{children}</div>
    </div>
  );
}
