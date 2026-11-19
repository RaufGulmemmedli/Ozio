'use client';

/**
 * `Pay Card` (`TWInN`): the dark 400-wide side panel — "Qazanc" 14/700 at 70 %, the fee at
 * 48/800, then the same three chips the match card carries.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { Badge } from '@/shared/ui';

import type { CpParcelOffer } from '../data/models/courier-plus';

export interface CpPayCardProps {
  offer: CpParcelOffer;
  titleId?: string;
}

export function CpPayCard({ offer, titleId = 'cp-pay' }: CpPayCardProps) {
  const t = useTranslations('courier_plus');
  const f = useFormat();

  return (
    <section
      aria-labelledby={titleId}
      className="flex w-full flex-col items-start gap-3 rounded-bento bg-block p-7 md:p-8"
    >
      <p id={titleId} className="m-0 text-label font-bold text-on-block/70">
        {t('track.pay')}
      </p>
      <p className="m-0 text-h1 font-extrabold leading-none text-on-block">{f.money(offer.pay)}</p>

      <ul className="m-0 flex list-none flex-row flex-wrap items-center gap-2 p-0">
        <li>
          <Badge tone="yellow">{t('matches.detour', { minutes: offer.detourMinutes })}</Badge>
        </li>
        <li>
          <Badge tone="neutral">
            {t('matches.weight', {
              value: f.number(offer.weightKg, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              }),
            })}
          </Badge>
        </li>
        <li>
          <Badge tone="neutral">
            {t('matches.distance', {
              value: f.number(offer.distanceKm, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              }),
            })}
          </Badge>
        </li>
      </ul>
    </section>
  );
}
