/**
 * The marketing hero — node `OhxsB` (layout.md §3).
 *
 * Desktop: padding 40/120/96/120, row, gap 40; copy column 600 with a 28 vertical
 * gap + the 560×620 visual. Tablet (`aE3Pr`) and mobile (`pZkhq`) stack, and on
 * mobile the CTAs become full-width 56 high and the visual goes full-bleed.
 *
 * Every page's `h1` is here (or in `<PageHeader>`-style headers on the pages with
 * no hero visual), so there is exactly one per document.
 */
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';
import { Container } from '@/shared/layout/container';

import { EyebrowChip } from './EyebrowChip';
import { brandText, typeEyebrow, typeHero, typeLead } from './type';

export interface HeroProps {
  /** Rendered as the yellow sparkles chip (`kFYqM`) or a plain brand kicker. */
  eyebrow: string;
  eyebrowStyle?: 'chip' | 'kicker';
  title: string;
  lead: string;
  /** CTA row — `<CtaLink>`s and/or `<StoreBadges>`. */
  actions?: ReactNode;
  /** `<TrustRow>` or a chip under the CTAs. */
  below?: ReactNode;
  /** `<HeroVisual>`; omitted on the pages whose hero is copy-only. */
  visual?: ReactNode;
  className?: string;
}

export function Hero({
  eyebrow,
  eyebrowStyle = 'chip',
  title,
  lead,
  actions,
  below,
  visual,
  className,
}: HeroProps) {
  return (
    <section className={cn('w-full pt-4 md:pt-10', className)}>
      <Container>
        <div
          className={cn(
            'flex flex-col gap-5 pb-8 md:gap-10 md:pb-16',
            'min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:gap-10 min-[1200px]:pb-24',
          )}
        >
          <div className="flex flex-col items-start gap-5 md:gap-7 min-[1200px]:flex-1">
            {eyebrowStyle === 'chip' ? (
              <EyebrowChip>{eyebrow}</EyebrowChip>
            ) : (
              <p className={cn('m-0', brandText, typeEyebrow)}>{eyebrow}</p>
            )}

            <h1 className={cn('m-0 w-full text-ink', typeHero)}>{title}</h1>

            <p className={cn('m-0 max-w-[520px] text-ink2', typeLead)}>{lead}</p>

            {actions ? (
              <div className="flex w-full flex-col gap-[14px] sm:w-fit sm:flex-row sm:items-center">
                {actions}
              </div>
            ) : null}

            {below}
          </div>

          {visual}
        </div>
      </Container>
    </section>
  );
}
