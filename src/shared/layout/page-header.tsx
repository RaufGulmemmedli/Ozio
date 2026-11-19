'use client';

/**
 * The page title row inside `Content` (layout.md §4): title block
 * (36/800/-1 + a 16 `ink2` subtitle, gap 6) on the left, a CTA slot on the
 * right (brand button 52 high).
 *
 * Measured responsive rule (typography.md §1): the app page title is
 * 36/800 on desktop, **32/700 at 768** and **28/700 at 390**.
 *
 * Renders the page's single `<h1>`.
 */

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n/navigation';
import { ArrowLeft } from '@/shared/lucide';

export interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  /** Right-hand slot — a 52 high brand button, chips, a filter control, … */
  actions?: ReactNode;
  /** `<Breadcrumbs>` or any nav element, rendered above the title. */
  breadcrumbs?: ReactNode;
  /** Renders a back link above the title (label defaults to "Geri"). */
  backHref?: string;
  /** Use instead of `backHref` when going back is history-based. */
  onBack?: () => void;
  backLabel?: string;
  /** Extra id so a section can be labelled by the heading. */
  headingId?: string;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumbs,
  backHref,
  onBack,
  backLabel,
  headingId,
  className,
}: PageHeaderProps) {
  const t = useTranslations('shell');
  const label = backLabel ?? t('pageHeader.back');
  const showBack = Boolean(backHref || onBack);

  return (
    <div className={cn('flex w-full shrink-0 flex-col gap-3', className)}>
      {breadcrumbs}

      {showBack ? (
        backHref ? (
          <Link
            href={backHref}
            className="flex w-fit items-center gap-2 text-label font-semibold text-ink2 hover:text-ink"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            {label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onBack}
            className="flex w-fit items-center gap-2 text-label font-semibold text-ink2 hover:text-ink"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            {label}
          </button>
        )
      ) : null}

      <div className="flex w-full flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1
            id={headingId}
            className="m-0 text-[28px] font-bold leading-[1.2] tracking-[-0.02em] text-ink md:text-h2 lg:text-h1-app lg:font-extrabold"
          >
            {title}
          </h1>
          {subtitle ? <p className="m-0 text-body text-ink2">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}
