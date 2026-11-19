'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { FlaskConical } from '@/shared/lucide';

export type DemoBannerProps = {
  /**
   * The mock module this screen belongs to, already localized — passed to the
   * `common.demo.body` message as `{module}`.
   */
  module?: string;
  /** Overrides `common.demo.title` ("Demo rejim"). */
  title?: ReactNode;
  /** Overrides `common.demo.body`. */
  body?: ReactNode;
  /** Chip variant for use inside a card. */
  compact?: boolean;
  className?: string;
};

/**
 * Every mock-module screen renders this at the top of its content
 * (BUILD-CONTRACT "Mock modules"). `role="note"`, `warn-soft` fill,
 * `flask-conical` glyph, bold "Demo rejim" + the body copy, `rounded-card`,
 * padding 8/16. **Not dismissible** — it states what the data is.
 */
export function DemoBanner({ module, title, body, compact = false, className }: DemoBannerProps) {
  const t = useTranslations('common');

  const heading = title ?? (t.has('demo.title') ? t('demo.title') : null);
  const text =
    body ?? (t.has('demo.body') ? t('demo.body', { module: module ?? '' }) : null);

  if (compact) {
    return (
      <span
        role="note"
        className={cn(
          'inline-flex w-fit flex-row items-center gap-2 rounded-pill bg-warn-soft px-3 py-1',
          'text-micro font-semibold text-ink',
          className,
        )}
      >
        <FlaskConical aria-hidden="true" size={14} className="shrink-0 text-warn" />
        {heading}
      </span>
    );
  }

  return (
    <div
      role="note"
      className={cn(
        'flex w-full flex-row items-center gap-3 rounded-card bg-warn-soft px-4 py-2',
        className,
      )}
    >
      <FlaskConical aria-hidden="true" size={20} className="shrink-0 text-warn" />
      <p className="min-w-0 flex-1 text-label text-ink">
        <span className="font-bold">{heading}</span>
        {heading && text ? ' ' : null}
        {text}
      </p>
    </div>
  );
}
