'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { useFormat } from '@/core/i18n';

import { daysLeft, type Campaign } from '../data/models/partner';

export interface CampaignCardProps {
  campaign: Campaign;
  /** `yellow` and `dark` are the two cards drawn in `app-partnyor-detali.html`. */
  tone?: 'yellow' | 'dark';
  className?: string;
}

/**
 * An Ozio Plus campaign card (`Campaign Yellow` / `Campaign Dark`): r28, height 180, padding 24,
 * `space-between`; the headline row carries the lead figure and an end-date pill, the foot carries
 * the title 18/800 + one line 14/400.
 *
 * **What the API actually sends** is only `{id, category_id, name, start_date, end_date}`, where
 * `name` is the *period* ("2-16 noyabr") and there is no discount figure anywhere. So the lead
 * slot shows the days left — the one number the data supports — and the title is the owning store
 * chain. Nothing is invented.
 */
export function CampaignCard({ campaign, tone = 'yellow', className }: CampaignCardProps) {
  const t = useTranslations('partners');
  const { date, number } = useFormat();
  const remaining = daysLeft(campaign.endDate);
  const dark = tone === 'dark';

  return (
    <article
      className={cn(
        'flex h-[180px] flex-col justify-between rounded-xl p-6',
        dark ? 'bg-block text-on-block' : 'bg-yellow text-on-yellow',
        className,
      )}
    >
      <div className="flex w-full flex-row items-start justify-between gap-3">
        <p
          className={cn(
            'm-0 text-[48px] font-extrabold leading-none tracking-[-0.04em]',
            dark ? 'text-yellow' : 'text-on-yellow',
          )}
        >
          {remaining === null ? '—' : number(remaining)}
          <span className="ml-1 align-middle text-h4 font-bold">
            {remaining === null ? '' : t('campaign.daysUnit')}
          </span>
        </p>
        {campaign.endDate ? (
          <span
            className={cn(
              'shrink-0 rounded-pill px-3 py-1.5 text-micro font-bold',
              dark ? 'bg-white/15 text-on-block' : 'bg-ink/15 text-on-yellow',
            )}
          >
            {t('campaign.until', { date: date(campaign.endDate, 'dayMonth') })}
          </span>
        ) : null}
      </div>

      <div className="flex w-full flex-col gap-1">
        <p className="m-0 text-body-l font-extrabold">
          {campaign.categoryName ?? t('campaign.fallbackTitle')}
        </p>
        <p className={cn('m-0 text-label', dark ? 'text-on-block/75' : 'text-on-yellow/80')}>
          {campaign.periodLabel || t('campaign.noPeriod')}
        </p>
      </div>
    </article>
  );
}
