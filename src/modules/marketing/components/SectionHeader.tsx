/**
 * The landing section header: kicker 14/700 `brand` + 2 px tracking, title at the
 * responsive section-title size, and — on the Ecosystem / Market sections — a
 * 340-wide lead pinned to the right edge (`ay84q`, align-items: flex-end).
 *
 * The heading level is passed in so each page keeps one `h1` and a flat h2 order.
 */
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';

import { brandText, typeEyebrow, typeSectionTitle } from './type';

export interface SectionHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  /** The 340-wide paragraph on the right of the row (desktop only, per the canvas). */
  lead?: ReactNode;
  /** `h1` for the page's own hero-less header, `h2` elsewhere. */
  as?: 'h1' | 'h2';
  /** Centres kicker + title — the "How" section (`CopsG`). */
  align?: 'start' | 'center';
  /** Anchor id so `aria-labelledby` can point at the title. */
  id?: string;
  /** Right-aligned slot used instead of `lead` (e.g. the Market chips row). */
  aside?: ReactNode;
  className?: string;
  titleClassName?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  lead,
  as: Heading = 'h2',
  align = 'start',
  id,
  aside,
  className,
  titleClassName,
}: SectionHeaderProps) {
  const copy = (
    <div
      className={cn(
        'flex flex-col gap-3 md:gap-4',
        align === 'center' && 'items-center text-center',
      )}
    >
      {eyebrow ? <p className={cn('m-0', brandText, typeEyebrow)}>{eyebrow}</p> : null}
      <Heading id={id} className={cn('m-0 max-w-[640px] text-ink', typeSectionTitle, titleClassName)}>
        {title}
      </Heading>
    </div>
  );

  if (!lead && !aside) {
    return <div className={cn('flex w-full flex-col', className)}>{copy}</div>;
  }

  return (
    <div
      className={cn(
        'flex w-full flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10',
        className,
      )}
    >
      {copy}
      {lead ? (
        <p className="m-0 text-body leading-[26px] text-ink2 md:max-w-[340px] md:text-[17px]">
          {lead}
        </p>
      ) : null}
      {aside}
    </div>
  );
}
