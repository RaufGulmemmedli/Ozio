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
  /*
   * The row wraps, and the title is allowed to shrink.
   *
   * Both actions are `shrink-0`, so with a long title ("Mağaza və restoranlar") and two of them
   * the title was the only thing that could give — it folded onto two lines on a phone while the
   * links stayed crushed against the right edge. `flex-wrap` lets the actions drop to their own
   * line when the row genuinely cannot hold everything, and `min-w-0 flex-1` lets the title use
   * the width that is actually free.
   */
  return (
    <div
      className={cn(
        'flex w-full flex-row flex-wrap items-center justify-between gap-x-4 gap-y-2',
        className,
      )}
    >
      <Tag
        id={titleId}
        className="min-w-0 flex-1 text-h4 font-bold tracking-[-0.5px] text-ink md:text-h3 md:font-extrabold"
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
