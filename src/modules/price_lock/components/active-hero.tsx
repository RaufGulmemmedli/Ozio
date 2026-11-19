'use client';

/**
 * PL1's `Active Hero` (dark block, radius 36, padding 36): the `Aktiv · **** 4821` yellow tag,
 * the big "144 gün qalıb", the elapsed line, the yellow platform total and the 6-month progress.
 *
 * `daysLeft`, `elapsedDays`, `totalDays`, `progress` and `platformPays` are the source's values —
 * recomputed there against the clock — so this component reads, it does not count.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { Badge, Card, Progress } from '@/shared/ui';

import type { Guarantee } from '../data/models/guarantee';

export function ActiveHero({ guarantee }: { guarantee: Guarantee }) {
  const t = useTranslations('price_lock');
  const { money } = useFormat();

  return (
    <Card tone="block" radius="bento" className="flex w-full flex-col gap-5 p-7 md:p-9">
      {guarantee.maskedCard ? (
        <Badge tone="yellow">{t('hero.tag', { card: guarantee.maskedCard })}</Badge>
      ) : null}

      <div className="flex flex-col gap-1">
        <p className="text-[44px] font-extrabold leading-none text-on-block">
          {t('hero.daysLeft', { days: guarantee.daysLeft })}
        </p>
        <p className="text-body-sm text-on-block2">
          {t('hero.elapsed', { days: guarantee.elapsedDays, months: guarantee.months })}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-label text-on-block2">{t('hero.platformPaid')}</p>
        <p className="text-[44px] font-extrabold leading-none text-yellow">
          {t('hero.platformAmount', { amount: money(guarantee.platformPays) })}
        </p>
        <p className="text-caption text-on-block3">{t('hero.perUnit')}</p>
      </div>

      <Progress
        value={guarantee.elapsedDays}
        max={Math.max(1, guarantee.totalDays)}
        tone="yellow"
        height={12}
        trackClassName="bg-on-block/20"
        label={t('hero.progressValue', {
          elapsed: guarantee.elapsedDays,
          total: guarantee.totalDays,
        })}
      />
    </Card>
  );
}
