import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';

export type ShimmerProps = {
  children: ReactNode;
  /** Layout classes for the skeleton root (it is a real element: `flex`, `grid`, …). */
  className?: string;
  /**
   * Visually-hidden loading announcement, e.g. `t('loading')` → "Yüklənir…".
   * This package localizes nothing, so the caller supplies the string.
   * Omitted → no label is rendered (use that only for nested/decorative roots).
   */
  label?: string;
  id?: string;
};

/**
 * The single skeleton root. One `<Shimmer>` per page/section skeleton — all
 * `Bone`s below it share **one** animation phase (`globals.css` →
 * `.oz-skeleton .oz-bone`), and `prefers-reduced-motion` is handled there too.
 *
 * The bones are wrapped in an `aria-hidden` `display: contents` element, so
 * the skeleton DOM is invisible to assistive tech while the layout is
 * unaffected — and a nested `<Shimmer>` (e.g. a preset that already wraps
 * itself) is harmless: its `role="status"` sits inside an `aria-hidden`
 * subtree and is never announced twice.
 */
export function Shimmer({ children, className, label, id }: ShimmerProps) {
  return (
    <div
      id={id}
      role="status"
      aria-busy="true"
      aria-live="polite"
      data-oz-skeleton=""
      className={cn('oz-skeleton', className)}
    >
      {label ? <span className="sr-only">{label}</span> : null}
      <div aria-hidden="true" className="contents">
        {children}
      </div>
    </div>
  );
}
