'use client';

/**
 * The entry-point tile another module places (the home / market banner described in
 * `api/mock-modules.md`: group_buy has no nav item of its own).
 *
 * It is exported from `@/modules/group_buy` so nobody has to reach into this module: give it no
 * props and it fetches the overview itself, renders nothing while loading, nothing on failure and
 * nothing when there is no open deal — a promo tile must never be able to break its host screen.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { Users } from '@/shared/lucide';
import { Button, Card, Progress } from '@/shared/ui';

import { useGroupBuyOverview } from '../hooks/use-group-buy';
import { useHref } from '../lib/use-href';
import { CountdownText } from './countdown-text';
import { DealThumb } from './deal-thumb';

export function OpenGroupDealTile({ className }: { className?: string }) {
  const t = useTranslations('group_buy');
  const { money } = useFormat();
  const href = useHref();
  const overview = useGroupBuyOverview();

  const deal =
    overview.data?.mine.find((d) => !d.complete && !d.expired) ??
    overview.data?.nearby.find((d) => !d.complete && !d.expired) ??
    null;

  if (!deal) return null;

  return (
    <Card
      as="section"
      tone="surface"
      radius="xl"
      className={className}
      aria-labelledby="gb-tile-title"
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-[14px]">
          <DealThumb iconKey={deal.iconKey} alt="" size={56} radius="inner" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 id="gb-tile-title" className="flex items-center gap-2 text-body font-bold text-ink">
              <Users size={18} aria-hidden="true" className="shrink-0 text-brand" />
              {t('tile.title')}
            </h2>
            <p className="truncate text-caption text-ink2">
              {t('tile.body', {
                title: deal.title,
                joined: deal.joined,
                target: deal.target,
                price: money(deal.currentPrice),
              })}
            </p>
          </div>
        </div>

        <Progress
          value={deal.joined}
          max={deal.target}
          height={10}
          label={t('progress.value', { joined: deal.joined, target: deal.target })}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <CountdownText
            closesAt={deal.closesAt}
            onElapsed={() => void overview.refetch()}
            className="text-caption font-semibold text-ink2"
          />
          <Button as="a" href={href(paths.groupBuyDeal(deal.id))} variant="soft" size="md">
            {t('tile.cta')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
