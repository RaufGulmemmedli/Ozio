'use client';

/**
 * Greeting (`KiN0y`, 1112×71) — the page's single `<h1>`.
 *
 * Export: "Salam, Nurlan" 36/800/-1px, teaser 16/400 `ink2`, and the right-hand brand pill
 * "Marketə keç" (52 high, padding-inline 28). Tablet 32/700 + 15/400, mobile 28/700 + 14/400,
 * where the CTA drops (the export's tablet/mobile greeting has no button).
 */
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { LinkButton } from './link-button';

export interface GreetingProps {
  /** Already-localized title, e.g. "Salam, Nurlan". */
  title: string;
  /** Bonus teaser line. */
  subtitle?: string;
  ctaLabel?: string;
  headingId?: string;
  className?: string;
}

export function Greeting({ title, subtitle, ctaLabel, headingId, className }: GreetingProps) {
  return (
    <div className={cn('flex w-full flex-row items-end justify-between gap-5', className)}>
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1
          id={headingId}
          className="text-[28px] font-bold leading-tight tracking-[-0.5px] text-ink md:text-h2 lg:text-h1-app lg:font-extrabold lg:tracking-[-1px]"
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="text-label text-ink2 md:text-body-sm lg:text-body">{subtitle}</p>
        ) : null}
      </div>
      {/* The tablet/mobile greeting frames have no button — Market is in the nav there. */}
      {ctaLabel ? (
        <LinkButton href={paths.market}
          variant="brand"
          size="xl"
          className="hidden shrink-0 lg:inline-flex"
        >
          {ctaLabel}
        </LinkButton>
      ) : null}
    </div>
  );
}
