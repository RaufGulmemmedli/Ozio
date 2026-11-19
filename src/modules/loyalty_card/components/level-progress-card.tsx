'use client';

/**
 * The level-progress block on `/card` — node `z0TQIt` in
 * `app-card-bonus.html`: `block` fill, `rounded-xl` (28), padding 28, gap 16;
 * eyebrow "SƏVİYYƏ" 12/700 +1.5px `on-block2`, "Silver → Gold" 28/800
 * `on-block`, a `yellow` pill (32 high, padding-inline 14) with the percentage
 * in 14/800, a 10-high track (`white/12`, radius 5) with a `brand` fill, and
 * the hint in 14/400 `on-block2`.
 *
 * **MSW-backed.** `GET v1/profile/me` sends no tier, level or cashback
 * percentage, so this whole block is behind `flag:loyaltyTiers` and renders a
 * `<DemoBanner/>` of its own.
 */
import { useTranslations } from 'next-intl';

import { Link, useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { ChevronRight } from '@/shared/lucide';
import { DemoBanner } from '@/shared/states';

import type { TierLadder } from '../data/models/tier';
import { LOYALTY_DEMO_MODULE } from '../loyalty_card.flags';

export interface LevelProgressCardProps {
  ladder: TierLadder;
  className?: string;
}

export function LevelProgressCard({ ladder, className }: LevelProgressCardProps) {
  const t = useTranslations('loyalty_card');
  const { money, percentPoints } = useFormat();

  const current = ladder.tiers.find((tier) => tier.id === ladder.currentTierId);
  const next = ladder.tiers.find((tier) => tier.id === ladder.nextTierId);
  if (!current) return null;

  return (
    <section
      aria-label={t('level.progressLabel')}
      className={cn('flex w-full flex-col gap-4 rounded-xl bg-block p-7', className)}
    >
      <DemoBanner module={LOYALTY_DEMO_MODULE} compact />

      <div className="flex w-full flex-row items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-micro font-bold tracking-[1.5px] text-on-block2">
            {t('level.eyebrow')}
          </span>
          <span className="truncate text-[28px] font-extrabold leading-[1.15] text-on-block">
            {next ? t('level.step', { from: current.name, to: next.name }) : current.name}
          </span>
        </div>

        <span className="flex h-8 shrink-0 items-center rounded-pill bg-yellow px-[14px] text-label font-extrabold text-on-yellow">
          {ladder.progressPercent}%
        </span>
      </div>

      <div
        role="progressbar"
        aria-label={t('level.progressLabel')}
        aria-valuenow={ladder.progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={t('levels.progressValue', {
          spend: money(ladder.spend),
          target: money(ladder.target),
        })}
        className="h-[10px] w-full overflow-hidden rounded-[5px] bg-white/12"
      >
        <div
          className="h-full rounded-[5px] bg-brand transition-[width] duration-[var(--oz-dur-slow)] ease-[var(--oz-ease-out)] motion-reduce:transition-none"
          style={{ width: `${ladder.progressPercent}%` }}
        />
      </div>

      <p className="m-0 text-label text-on-block2">
        {next
          ? t('level.hint', { tier: next.name, amount: money(ladder.remaining) })
          : t('level.hintMax', { percent: percentPoints(current.cashbackPercent) })}
      </p>

      <Link
        href={paths.cardLevels}
        className="flex w-fit items-center gap-1.5 rounded-sm text-body-sm font-semibold text-on-block underline-offset-4 hover:underline"
      >
        {t('level.seeAll')}
        <ChevronRight size={16} aria-hidden="true" />
      </Link>
    </section>
  );
}
