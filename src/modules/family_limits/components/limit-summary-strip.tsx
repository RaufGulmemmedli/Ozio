'use client';

/**
 * The `block` strip above the member grid (`limits-list.html` → `Summary Strip`): radius 28,
 * padding 28, three stat columns at gap 48 — a 14/400 label over a 32/800 value, all on
 * `on-block`.
 *
 * Every number comes from the API's `summary` object; nothing is summed in the view.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import type { LimitSummary } from '../data/models/limit-member';

export interface LimitSummaryStripProps {
  summary: LimitSummary;
}

export function LimitSummaryStrip({ summary }: LimitSummaryStripProps) {
  const t = useTranslations('family_limits');
  const { money, number } = useFormat();

  const stats: readonly { key: string; value: string }[] = [
    { key: 'spend', value: money(summary.spend) },
    { key: 'active', value: number(summary.activeLimits) },
    { key: 'exhausted', value: number(summary.exhausted) },
  ];

  return (
    <dl className="flex w-full flex-row flex-wrap items-center gap-x-12 gap-y-6 rounded-xl bg-block p-7 text-on-block">
      {stats.map((stat) => (
        <div key={stat.key} className="flex flex-col gap-1">
          <dt className="text-label font-normal">{t(`summary.${stat.key}`)}</dt>
          <dd className="text-h2 font-extrabold">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
