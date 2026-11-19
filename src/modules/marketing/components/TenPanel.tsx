/**
 * The 10-lar teaser panel — node `DKz2n` / `Ten Block` (layout.md §3).
 *
 * Desktop: a 1200×424 `ink` panel at radius 48, padding 64, gap 64; copy column
 * 480 (kicker `yellow` 14/700/+2, headline 52/800, text 18/27 `on-block2`, a
 * 52-high `brand` CTA) beside the stamp card.
 * Tablet (`EnaLe`) and mobile stack. Mobile keeps radius 32 and 28 padding.
 *
 * Also used for the `/ten` lottery panel shape and the `/delivery` closing CTA
 * via `children` (pass any right-hand visual).
 */
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';
import { Container } from '@/shared/layout/container';

import { typeEyebrow, typePanelTitle } from './type';

export interface TenPanelProps {
  eyebrow?: string;
  title: string;
  text?: string;
  /** CTA row. */
  actions?: ReactNode;
  /** Right-hand visual — the stamp card, the lottery ticket, store badges. */
  aside?: ReactNode;
  /** `aria-labelledby` target. */
  id?: string;
  /** `ink`/`block` (default) or `brand` for the closing CTA bands. */
  tone?: 'block' | 'brand';
  className?: string;
}

export function TenPanel({
  eyebrow,
  title,
  text,
  actions,
  aside,
  id,
  tone = 'block',
  className,
}: TenPanelProps) {
  return (
    <section className={cn('w-full', className)} aria-labelledby={id}>
      <Container>
        <div
          className={cn(
            'flex flex-col gap-8 rounded-modal p-7',
            'md:gap-10 md:rounded-2xl md:p-10',
            'min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:gap-16 min-[1200px]:p-16',
            tone === 'brand' ? 'bg-brand' : 'bg-block',
          )}
        >
          <div className="flex flex-col items-start gap-5 min-[1200px]:w-[480px] min-[1200px]:shrink-0">
            {eyebrow ? (
              <p className={cn('m-0', typeEyebrow, tone === 'brand' ? 'text-white/85' : 'text-yellow')}>
                {eyebrow}
              </p>
            ) : null}
            <h2 id={id} className={cn('m-0 w-full text-on-block', typePanelTitle)}>
              {title}
            </h2>
            {text ? (
              <p
                className={cn(
                  'm-0 text-body leading-[27px] md:text-[18px]',
                  tone === 'brand' ? 'text-white/85' : 'text-on-block2',
                )}
              >
                {text}
              </p>
            ) : null}
            {actions ? (
              <div className="flex w-full flex-col gap-3 sm:w-fit sm:flex-row sm:items-center">
                {actions}
              </div>
            ) : null}
          </div>

          {aside ? <div className="min-w-0 min-[1200px]:flex-1">{aside}</div> : null}
        </div>
      </Container>
    </section>
  );
}
