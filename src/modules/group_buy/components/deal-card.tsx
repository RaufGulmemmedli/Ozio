'use client';

/**
 * GB1's deal card (`Deal Card · …`): 96 thumb, title, pack, the `-%` and building tags, the
 * current group price over the retail price, `joined / target`, the countdown and the progress bar.
 *
 * Every number is read straight off the model — the source computed them (see
 * `data/group_buy.mock.ts`).
 *
 * The export's `Şəkər tozu` card prints the **best** tier price (13,6 ₼) next to the **current**
 * discount (-20%), while its other three cards print the current price with the current discount.
 * This renders the consistent pair (current price + current discount); see the hand-off note.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { Badge, Button, Card, Progress } from '@/shared/ui';

import type { GroupDeal } from '../data/models/group-deal';
import { useHref } from '../lib/use-href';
import { CountdownText } from './countdown-text';
import { DealThumb } from './deal-thumb';

export interface DealCardProps {
  deal: GroupDeal;
  /** Fired when this card's window elapses on screen — the list refetches. */
  onElapsed?: () => void;
}

export function DealCard({ deal, onElapsed }: DealCardProps) {
  const t = useTranslations('group_buy');
  const { money } = useFormat();
  const href = useHref();

  return (
    <Card
      as="article"
      tone="surface"
      radius="xl"
      className="flex flex-col items-start gap-4 p-5"
      aria-labelledby={`gb-deal-${deal.id}`}
    >
      <DealThumb iconKey={deal.iconKey} alt="" size={96} radius="card" />

      <div className="flex w-full min-w-0 flex-col gap-1">
        <h3 id={`gb-deal-${deal.id}`} className="text-h4 font-bold text-ink">
          {deal.title}
        </h3>
        <p className="text-caption text-ink3">{t('card.groupPrice', { pack: deal.pack })}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-brand-soft text-brand">
          {t('tag.discount', { percent: deal.discountPercent })}
        </Badge>
        <Badge tone="success">
          {deal.sameBuilding ? t('tag.sameBuilding') : t('tag.nextBuilding')}
        </Badge>
        {deal.complete ? <Badge tone="yellow">{t('tag.complete')}</Badge> : null}
        {deal.expired ? <Badge tone="neutral">{t('tag.expired')}</Badge> : null}
      </div>

      <div className="flex w-full flex-col gap-1">
        <p className="text-[30px] font-extrabold leading-none text-ink">
          {money(deal.currentPrice)}
        </p>
        <p className="text-label text-ink3">
          {t('card.retail', { price: money(deal.retailPrice) })}
        </p>
      </div>

      <div className="flex w-full flex-col gap-2">
        <div className="flex w-full flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="text-label font-bold text-ink">
            {t('card.people', { joined: deal.joined, target: deal.target })}
          </span>
          <CountdownText
            closesAt={deal.closesAt}
            onElapsed={onElapsed}
            className="text-caption font-semibold text-ink2"
          />
        </div>
        <Progress
          value={deal.joined}
          max={deal.target}
          height={10}
          label={t('progress.value', { joined: deal.joined, target: deal.target })}
        />
      </div>

      <Button as="a" href={href(paths.groupBuyDeal(deal.id))} variant="soft" size="md" fullWidth>
        {t('card.details')}
      </Button>
    </Card>
  );
}
