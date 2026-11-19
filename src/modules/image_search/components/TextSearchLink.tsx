'use client';

/** `Text Search Link` node: `search` 16 + 15/700 `brand`, padding 4/8 — the way out to `/search`. */
import { Link } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { Search } from '@/shared/lucide';

export function TextSearchLink({ label, className }: { label: string; className?: string }) {
  return (
    <Link
      href={paths.search}
      className={cn(
        'flex w-fit min-h-11 flex-row items-center gap-2 rounded-sm px-2 py-1',
        'text-body-sm font-bold text-brand hover:text-brand-dark md:min-h-0',
        className,
      )}
    >
      <Search aria-hidden="true" size={16} className="shrink-0" />
      {label}
    </Link>
  );
}
