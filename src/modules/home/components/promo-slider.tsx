'use client';

/**
 * The hero's no-active-order variant: the promo slider (`app-core.md` §1 "Hidden when no active
 * order (then show promo slider)").
 *
 * `GET v1/sliders/images` is verified but **empty on live**, so the empty variant is the normal
 * state and must look deliberate — a brand-less `surface` panel with the Market CTA, never a grey
 * placeholder box. Occupies the tracker's 300 slot so the hero row never changes height.
 */
import { useState } from 'react';

import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { ChevronLeft, ChevronRight, Sparkles } from '@/shared/lucide';
import { IconButton } from '@/shared/ui';

import { LinkButton } from './link-button';
import { ProductImage } from '@/shared/media';

import type { HomeSlide } from '../data/models';

export interface PromoSliderProps {
  slides: readonly HomeSlide[];
  /** Copy for the empty variant. */
  emptyTitle: string;
  emptyBody: string;
  ctaLabel: string;
  previousLabel: string;
  nextLabel: string;
  regionLabel: string;
  className?: string;
}

export function PromoSlider({
  slides,
  emptyTitle,
  emptyBody,
  ctaLabel,
  previousLabel,
  nextLabel,
  regionLabel,
  className,
}: PromoSliderProps) {
  const [index, setIndex] = useState(0);
  const count = slides.length;
  const slide = count > 0 ? slides[Math.min(index, count - 1)] : null;

  const shell = cn(
    'flex w-full flex-col justify-between overflow-hidden rounded-xl bg-surface p-[22px] lg:h-[300px] lg:flex-1 lg:p-7',
    className,
  );

  if (!slide) {
    return (
      <section aria-label={regionLabel} className={shell}>
        <span className="flex size-[52px] items-center justify-center rounded-md bg-brand-soft text-brand">
          <Sparkles aria-hidden className="size-[26px]" />
        </span>
        <div className="flex flex-col gap-1.5">
          <p className="text-h4 font-bold text-ink lg:text-[26px] lg:font-extrabold">{emptyTitle}</p>
          <p className="max-w-[420px] text-caption text-ink2 lg:text-body-sm">{emptyBody}</p>
        </div>
        <LinkButton href={paths.market} variant="primary" size="lg" className="self-start">
          {ctaLabel}
        </LinkButton>
      </section>
    );
  }

  return (
    <section aria-label={regionLabel} className={shell}>
      <div className="flex w-full flex-1 flex-row items-stretch gap-5">
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            {slide.title ? (
              <p className="text-h4 font-bold text-ink lg:text-[26px] lg:font-extrabold">{slide.title}</p>
            ) : null}
            {slide.subtitle ? (
              <p className="max-w-[420px] text-caption text-ink2 lg:text-body-sm">{slide.subtitle}</p>
            ) : null}
          </div>
          <LinkButton href={slide.href ?? paths.market}
            variant="primary"
            size="lg"
            className="self-start"
          >
            {ctaLabel}
          </LinkButton>
        </div>
        {slide.imageUrl ? (
          <ProductImage
            src={slide.imageUrl}
            alt={slide.title ?? ''}
            ratio="1/1"
            radius="lg"
            sizes="220px"
            className="hidden w-[220px] shrink-0 lg:block"
          />
        ) : null}
      </div>
      {count > 1 ? (
        <div className="flex flex-row items-center gap-2 pt-4">
          <IconButton
            aria-label={previousLabel}
            size={36}
            onClick={() => setIndex((i) => (i - 1 + count) % count)}
          >
            <ChevronLeft />
          </IconButton>
          <IconButton
            aria-label={nextLabel}
            size={36}
            onClick={() => setIndex((i) => (i + 1) % count)}
          >
            <ChevronRight />
          </IconButton>
          <span className="text-micro text-ink3">
            {Math.min(index, count - 1) + 1}/{count}
          </span>
        </div>
      ) : null}
    </section>
  );
}
