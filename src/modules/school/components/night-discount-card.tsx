'use client';

/**
 * SC4's dark "Gecə endirimi" block, plus the "Endirimli kateqoriyalar" column next to it.
 *
 * Measured: `block` fill, radius 36, padding 32, gap 10 — `moon` glyph, title 26/800, body 15/400
 * reading "Başlayır: 2 saat 14 dəq sonra (22:00–06:00). …". The categories card is white, radius
 * 28, padding 24, gap 14, 400 wide, with 60-high `surface2` rows at radius 20 and a brand `-15%`.
 *
 * **The clock is the server's.** `active`, `startsAt` and `endsAt` all come from the mock; the
 * countdown here only formats the remaining distance and the hook refetches the card when it
 * reaches zero (see `useNightDiscountBoundary`). The percentage is mock data too.
 *
 * The remaining time is announced politely but **not on every tick**: the ticking text is
 * `aria-hidden` and a separate live region is refreshed once a minute.
 */
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { Coffee, Moon, Smartphone, type LucideIcon } from '@/shared/lucide';

import type { NightCategory, NightDiscount } from '../data/models/student-card';
import { Cookie, IdCard } from './icons';

/** Matches the three glyphs drawn on SC4; anything else falls back to the card mark. */
const CATEGORY_ICON: Record<string, LucideIcon> = {
  snacks: Cookie,
  coffee: Coffee,
  digital: Smartphone,
};

export interface NightDiscountCardProps {
  discount: NightDiscount;
  /** `true` once a card is linked; without one the block explains what to do first. */
  linked: boolean;
  /** Whole seconds to the next boundary, from `useNightDiscountBoundary`. */
  secondsLeft: number | null;
}

export function NightDiscountCard({ discount, linked, secondsLeft }: NightDiscountCardProps) {
  const t = useTranslations('school');

  const distance = useMemo(() => {
    if (secondsLeft === null) return null;
    const total = Math.max(0, secondsLeft);
    return { hours: Math.floor(total / 3600), minutes: Math.floor((total % 3600) / 60) };
  }, [secondsLeft]);

  // Baku wall-clock `HH:mm` strings, read literally (api/README.md) — never re-zoned.
  const hours = { start: discount.windowStart, end: discount.windowEnd };

  const body = (() => {
    if (!linked) return t('night.body.none');
    if (discount.active) {
      return distance
        ? t('night.body.active', {
            time: t('night.in', { hours: distance.hours, minutes: distance.minutes }),
            percent: discount.percent,
          })
        : t('night.body.activeNoEnd', { percent: discount.percent });
    }
    return distance
      ? t('night.body.pending', {
          time: t('night.in', { hours: distance.hours, minutes: distance.minutes }),
          start: hours.start,
          end: hours.end,
          percent: discount.percent,
        })
      : t('night.body.none');
  })();

  return (
    <div
      aria-labelledby="night-discount"
      className="flex w-full flex-col gap-2.5 rounded-bento bg-block p-6 lg:p-8"
    >
      <div className="flex flex-row items-center gap-3">
        <Moon size={24} aria-hidden="true" className="shrink-0 text-on-block" />
        <h2 id="night-discount" className="text-h3 font-extrabold text-on-block lg:text-[26px]">
          {discount.active && linked
            ? t('night.activeTitle', { percent: discount.percent })
            : t('night.title', { start: hours.start })}
        </h2>
      </div>

      {/* The ticking copy, hidden from readers so a per-second change is never announced. */}
      <p aria-hidden="true" className="text-body-sm text-on-block2">
        {body}
      </p>

      {/* The polite summary: minute resolution, so it changes at most once a minute. */}
      <p aria-live="polite" className="sr-only">
        {linked && distance
          ? discount.active
            ? t('night.live.active', { minutes: distance.hours * 60 + distance.minutes })
            : t('night.live.pending', { minutes: distance.hours * 60 + distance.minutes })
          : body}
      </p>
    </div>
  );
}

export function NightCategories({
  categories,
  percent,
}: {
  categories: NightCategory[];
  percent: number;
}) {
  const t = useTranslations('school');

  return (
    <aside
      aria-labelledby="night-categories"
      className="flex w-full flex-col gap-[14px] rounded-xl bg-surface p-6 lg:w-[400px] lg:shrink-0"
    >
      <h2 id="night-categories" className="text-h4 font-extrabold text-ink">
        {t('categories.title')}
      </h2>

      <ul className="flex w-full flex-col gap-[14px]">
        {categories.map((category) => {
          const Icon = CATEGORY_ICON[category.id] ?? IdCard;
          return (
            <li
              key={category.id}
              className="flex h-15 flex-row items-center gap-[14px] rounded-lg bg-surface2 px-4"
            >
              <Icon size={20} aria-hidden="true" className="shrink-0 text-ink2" />
              <span className="min-w-0 flex-1 text-body-sm font-bold text-ink">
                {category.name}
              </span>
              <span className="text-body-sm font-extrabold text-brand">
                {t('categories.percent', { percent })}
              </span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
