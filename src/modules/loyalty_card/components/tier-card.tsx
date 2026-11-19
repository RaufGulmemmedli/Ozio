'use client';

/**
 * One tier card — nodes `Level · Plus / Silver / Gold / Platinum` in
 * `app-seviyyeler.html`: `surface` (or `block` for the next tier),
 * `rounded-xl` (28), padding 28, gap 20; a 52 round badge tinted per tier, the
 * state tag (`Cari` = `brand` fill / white, `Növbəti` = `yellow` fill /
 * `on-yellow`), the name 26/800, the threshold 13/400, the percentage 48/800
 * `brand` (`yellow` on the dark card) beside "keşbek" 15/600, then the
 * benefits list over a 1px top border with `check` glyphs.
 *
 * **MSW-backed** — the API sends no tier data.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { Check, Crown, Plus, Star, Trophy, type LucideIcon } from '@/shared/lucide';

import type { LoyaltyTier, TierAccent, TierIconKey } from '../data/models/tier';

const ICONS: Record<TierIconKey, LucideIcon> = {
  plus: Plus,
  star: Star,
  trophy: Trophy,
  crown: Crown,
};

const BADGE: Record<TierAccent, string> = {
  neutral: 'bg-surface2 text-ink',
  sky: 'bg-sky-soft text-sky',
  yellow: 'bg-yellow text-on-yellow',
  violet: 'bg-violet-soft text-violet',
};

export interface TierCardProps {
  tier: LoyaltyTier;
  className?: string;
}

export function TierCard({ tier, className }: TierCardProps) {
  const t = useTranslations('loyalty_card');
  const { money, percentPoints } = useFormat();

  const Icon = ICONS[tier.iconKey];
  // The export paints the *next* tier as the dark, highlighted card.
  const dark = tier.isNext;

  return (
    <li
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-5 rounded-xl p-7',
        dark ? 'bg-block' : 'border border-line bg-surface',
        className,
      )}
    >
      <div className="flex w-full flex-row items-center justify-between gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'flex size-[52px] shrink-0 items-center justify-center rounded-pill',
            BADGE[tier.accent],
          )}
        >
          <Icon size={24} />
        </span>

        {tier.isCurrent ? (
          <span className="flex h-7 shrink-0 items-center rounded-pill bg-brand px-3 text-caption font-bold text-white">
            {t('levels.tag.current')}
          </span>
        ) : null}
        {tier.isNext ? (
          <span className="flex h-7 shrink-0 items-center rounded-pill bg-yellow px-3 text-caption font-bold text-on-yellow">
            {t('levels.tag.next')}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <h3
          className={cn(
            'm-0 text-[26px] font-extrabold leading-[1.15]',
            dark ? 'text-on-block' : 'text-ink',
          )}
        >
          {tier.name}
        </h3>
        <p className={cn('m-0 text-caption', dark ? 'text-on-block/70' : 'text-ink2')}>
          {t('levels.threshold', { amount: money(tier.threshold) })}
        </p>
      </div>

      <p className="m-0 flex flex-row items-end gap-2">
        <span
          className={cn(
            'oz-num text-h1 font-extrabold leading-none tracking-[-2px]',
            dark ? 'text-yellow' : 'text-brand',
          )}
        >
          {percentPoints(tier.cashbackPercent)}
        </span>
        <span
          className={cn(
            'pb-2.5 text-body-sm font-semibold',
            dark ? 'text-on-block' : 'text-ink2',
          )}
        >
          {t('levels.cashback')}
        </span>
      </p>

      {tier.perks.length > 0 ? (
        <ul
          aria-label={t('levels.benefits')}
          className={cn(
            'm-0 flex list-none flex-col gap-3 border-t pt-5 ps-0',
            dark ? 'border-white/15' : 'border-line',
          )}
        >
          {tier.perks.map((perk) => (
            <li key={perk} className="flex flex-row items-start gap-2.5">
              <Check
                size={18}
                aria-hidden="true"
                className={cn('mt-0.5 shrink-0', dark ? 'text-yellow' : 'text-success')}
              />
              <span className={cn('text-label', dark ? 'text-on-block' : 'text-ink')}>{perk}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}
