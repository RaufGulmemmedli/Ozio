'use client';

/**
 * `<StampCard>` — the 10-lar stamp grid from `app-ozio-10-lar.html`.
 *
 * Measured (`Stamp Card` inside the `block` hero): `surface`, radius 32, padding 28,
 * gap 20; header row with the title 18/700 and a `brand-soft` count pill (30 high,
 * padding-inline 14, 14/700 `brand`); then two rows of five **72px** circles,
 * `justify-between`:
 *   earned → `brand` fill + a 28px white check
 *   empty  → `surface` fill + a 2px `line` border + the step number 16/700 `ink2`
 *            (the design also shows a `circle` glyph variant; the number is what the
 *            export draws and it tells the user which stamp is which)
 *   gift   → the last slot, `yellow` fill + a `gift` glyph
 *
 * Driven entirely by `current_step` / `steps` from `GET v1/ten-carts`. The newest stamp
 * animates .6 → 1 over 320 ms with a 1.1 overshoot, skipped under
 * `prefers-reduced-motion`.
 *
 * a11y: the grid is a list with a text alternative ("7 / 10 möhür"); the circles
 * themselves are `aria-hidden` so a screen reader hears the summary, not ten items.
 */
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/core/lib/cn';
import { useReducedMotion } from '@/core/lib/use-reduced-motion';
import { Check, Gift } from '@/shared/lucide';

import type { TenCart } from '../data/models/ten-cart';

export interface StampCardProps {
  card: TenCart;
  /** Heading level inside the card, so the page's heading order stays valid. */
  titleAs?: 'h2' | 'h3';
  className?: string;
}

/** Row width in the export is the full card, five circles per row. */
const PER_ROW = 5;

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

export function StampCard({ card, titleAs: Title = 'h3', className }: StampCardProps) {
  const t = useTranslations('lottery');
  const reduced = useReducedMotion();

  // Which slot just became earned — the one stamp that animates.
  const previous = useRef<number>(card.currentStep);
  const [pop, setPop] = useState<number | null>(null);

  useEffect(() => {
    if (card.currentStep > previous.current) setPop(card.currentStep);
    previous.current = card.currentStep;
    if (card.currentStep <= 0) return;
    const timer = setTimeout(() => setPop(null), 400);
    return () => clearTimeout(timer);
  }, [card.currentStep]);

  const slots = Array.from({ length: card.slots }, (_, index) => index + 1);
  const rows = chunk(slots, PER_ROW);
  const summary = t('tens.stampSummary', { current: card.currentStep, total: card.slots });

  return (
    <section
      className={cn('flex w-full flex-col gap-5 rounded-modal bg-surface p-5 md:p-7', className)}
    >
      <div className="flex w-full flex-row items-center justify-between gap-3">
        <Title className="text-[18px] font-bold text-ink">{t('tens.yourCard')}</Title>
        <span className="inline-flex h-[30px] shrink-0 items-center rounded-pill bg-brand-soft px-[14px] text-label font-bold text-brand">
          {card.currentStep} / {card.slots}
        </span>
      </div>

      <ul
        aria-label={summary}
        className="flex w-full list-none flex-col gap-3 p-0"
      >
        <li className="sr-only">{summary}</li>
        {rows.map((row, rowIndex) => (
          <li
            key={rowIndex}
            aria-hidden="true"
            className="flex w-full flex-row justify-between gap-1 md:gap-2"
          >
            {row.map((slot) => {
              const isGift = slot === card.slots;
              const earned = slot <= card.currentStep;
              const animate = pop === slot && !reduced;

              return (
                <span
                  key={slot}
                  // 44 at 320–479, 56 to 767, the drawn 72 from 768 up: five circles plus the
                  // gaps have to fit the card's inner width without a horizontal scrollbar.
                  className={cn(
                    'grid size-11 shrink-0 place-items-center rounded-pill sm:size-14 md:size-[72px]',
                    isGift
                      ? 'bg-yellow text-on-yellow'
                      : earned
                        ? 'bg-brand text-white'
                        : 'border-2 border-line bg-surface text-ink2',
                    animate && 'oz-stamp-pop',
                  )}
                >
                  {isGift ? (
                    <Gift aria-hidden="true" className="size-5 md:size-7" />
                  ) : earned ? (
                    <Check aria-hidden="true" strokeWidth={3} className="size-5 md:size-7" />
                  ) : (
                    <span className="text-label font-bold md:text-body">{slot}</span>
                  )}
                </span>
              );
            })}
          </li>
        ))}
      </ul>

      {/*
        The motion spec: .6 -> 1 over 320 ms with a 1.1 overshoot. Scoped here rather than in
        globals.css, which this module may not edit.
        TODO(core): a shared `oz-pop` keyframe in globals.css would remove this style tag.
      */}
      <style>{`
        @keyframes oz-stamp-pop {
          0%   { transform: scale(.6); }
          65%  { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .oz-stamp-pop { animation: oz-stamp-pop var(--oz-dur-slow, 320ms) var(--oz-ease-out) both; }
        @media (prefers-reduced-motion: reduce) { .oz-stamp-pop { animation: none; } }
      `}</style>
    </section>
  );
}

/** The compact 24px stamp row used on the per-card tiles ("Mağazalar üzrə proqress"). */
export function MiniStamps({ card, className }: { card: TenCart; className?: string }) {
  const t = useTranslations('lottery');

  return (
    <div
      role="img"
      aria-label={t('tens.stampSummary', { current: card.currentStep, total: card.slots })}
      className={cn('flex w-full flex-row justify-between gap-0.5 sm:gap-1', className)}
    >
      {Array.from({ length: card.slots }, (_, index) => {
        const slot = index + 1;
        const isGift = slot === card.slots;
        const earned = slot <= card.currentStep;
        return (
          <span
            key={slot}
            // 18 at 320–479 so ten circles still fit the tile; the drawn 24 from 480 up.
            className={cn(
              'size-[18px] shrink-0 rounded-pill sm:size-6',
              isGift ? 'bg-yellow' : earned ? 'bg-brand' : 'border border-line bg-surface2',
            )}
          />
        );
      })}
    </div>
  );
}
