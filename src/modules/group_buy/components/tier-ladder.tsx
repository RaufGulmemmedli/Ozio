'use client';

/**
 * GB2's `Qiymət pillələri` — the 3 / 5 / 10 ladder.
 *
 * A real ordered list (`<ol>` / `<li>`), as the brief requires: the reached rungs carry a check,
 * the rung everyone is paying today is the `cta` row with the `Cari` tag. Every `people`, `price`
 * and `percent_off` comes from the source; nothing is multiplied here.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { Check } from '@/shared/lucide';
import { Badge, Card } from '@/shared/ui';

import type { PriceTier } from '../data/models/group-deal';

export interface TierLadderProps {
  tiers: PriceTier[];
}

export function TierLadder({ tiers }: TierLadderProps) {
  const t = useTranslations('group_buy');
  const { money } = useFormat();

  return (
    <Card tone="surface" radius="xl" className="flex w-full flex-col gap-4 p-6">
      <h2 className="text-h4 font-extrabold text-ink">{t('tiers.title')}</h2>
      <ol className="flex w-full flex-col gap-[10px]">
        {tiers.map((tier) => (
          <li
            key={tier.people}
            aria-current={tier.current ? 'true' : undefined}
            className={cn(
              'flex min-h-16 w-full flex-wrap items-center gap-4 rounded-lg px-5 py-3',
              tier.current ? 'bg-cta text-on-cta' : 'bg-surface2 text-ink',
            )}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2 text-[17px] font-bold">
              {tier.reached ? (
                <>
                  <Check size={18} aria-hidden="true" className="shrink-0" />
                  <span className="sr-only">{t('tiers.reached')}</span>
                </>
              ) : null}
              {t('tiers.people', { count: tier.people })}
            </span>
            <span
              className={cn(
                'text-label font-bold',
                tier.current ? 'text-yellow' : 'text-brand',
              )}
            >
              {t('tag.discount', { percent: tier.percentOff })}
            </span>
            <span className="text-[22px] font-extrabold">{money(tier.price)}</span>
            {tier.current ? <Badge tone="yellow">{t('tiers.current')}</Badge> : null}
          </li>
        ))}
      </ol>
    </Card>
  );
}
