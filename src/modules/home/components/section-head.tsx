'use client';

/**
 * Section header: title + optional "Hamısına bax" link.
 * Export: title 24/800/-0.5 `ink`, link 15/600 `brand` (tablet/mobile: 20/700 + 14/600).
 *
 * This is **static chrome** — it is never shimmered (BUILD-CONTRACT rule 3).
 */
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n';

export interface SectionHeadProps {
  title: string;
  /** Rendered as a link on the right; omit for a title-only head. */
  actionLabel?: string;
  actionHref?: string;
  /** Id for `aria-labelledby` on the owning section. */
  titleId?: string;
  as?: 'h2' | 'h3';
  children?: ReactNode;
  className?: string;
}

export function SectionHead({
  title,
  actionLabel,
  actionHref,
  titleId,
  as: Tag = 'h2',
  children,
  className,
}: SectionHeadProps) {
  return (
    <div className={cn('flex w-full flex-row items-center justify-between gap-5', className)}>
      <Tag
        id={titleId}
        className="text-h4 font-bold tracking-[-0.5px] text-ink md:text-h3 md:font-extrabold"
      >
        {title}
      </Tag>
      {children}
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="shrink-0 rounded-sm text-label font-semibold text-brand hover:text-brand-dark md:text-body-sm"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
