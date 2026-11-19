'use client';

/**
 * A prize row from `details.lottery_prizes`.
 *
 * A prize carries exactly `{name, quantity, lottery_prizes_uploads[]}` — **no amount, no
 * description, no rank**. So the design's "Baş mükafat 5 000 ₼" hero figure and the
 * "+ 10 nəfərə 100 ₼ alış-veriş kartı" sub-line are rendered as what the API does send:
 * the prize name and how many of it are drawn.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Trophy } from '@/shared/lucide';
import { ProductImage } from '@/shared/media';

import type { LotteryPrize } from '../data/models/lottery';

export interface PrizeCardProps {
  prize: LotteryPrize;
  /** `true` for the first prize in the list — the only "rank" the order gives us. */
  featured?: boolean;
  className?: string;
}

export function PrizeCard({ prize, featured = false, className }: PrizeCardProps) {
  const t = useTranslations('lottery');

  return (
    <article
      className={cn(
        'flex w-full flex-col gap-4 rounded-xl border border-line bg-surface p-6',
        featured && 'border-transparent bg-brand-soft',
        className,
      )}
    >
      {prize.imageUrl ? (
        <ProductImage
          src={prize.imageUrl}
          alt={prize.name}
          ratio="236/200"
          radius="inner"
          className="h-[160px] w-full"
          sizes="(max-width: 767px) 90vw, 340px"
        />
      ) : (
        <div
          aria-hidden="true"
          className="grid h-[160px] w-full place-items-center rounded-[16px] bg-surface2 text-ink3"
        >
          <Trophy size={48} />
        </div>
      )}

      <div className="flex w-full flex-col gap-1">
        <h3 className={cn('text-body-l font-bold', featured ? 'text-brand' : 'text-ink')}>
          {prize.name || t('prizes.unnamed')}
        </h3>
        <p className="text-caption text-ink2">
          {t('prizes.quantity', { count: prize.quantity })}
        </p>
      </div>
    </article>
  );
}

/** The compact list row used beside the draw hero. */
export function PrizeRow({ prize }: { prize: LotteryPrize }) {
  const t = useTranslations('lottery');

  return (
    <li className="flex w-full flex-row items-center gap-[14px]">
      <span
        aria-hidden="true"
        className="grid size-12 shrink-0 place-items-center rounded-md bg-brand-soft text-brand"
      >
        <Trophy size={22} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-body font-bold text-ink">
          {prize.name || t('prizes.unnamed')}
        </span>
        <span className="text-micro font-semibold text-ink3">
          {t('prizes.quantity', { count: prize.quantity })}
        </span>
      </span>
    </li>
  );
}
