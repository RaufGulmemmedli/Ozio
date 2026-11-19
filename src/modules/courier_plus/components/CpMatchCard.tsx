'use client';

/**
 * `Match …` (`c9F0G2`): white card r28, padding 24, gap 20 — fee column (26/800 `brand` + 12/500
 * `ink3` "qazanc"), the pick-up / drop-off pair, the three chips and the primary "Götür".
 *
 * Every number on the card is server data: `pay`, `detourMinutes`, `weightKg` and `distanceKm`
 * come from the match the handler produced. Nothing is derived here.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { Badge, Button } from '@/shared/ui';
import { Circle, MapPin } from '@/shared/lucide';

import type { CpParcelOffer } from '../data/models/courier-plus';

import { CpPlaceBlock } from './CpPrimitives';

export interface CpMatchCardProps {
  offer: CpParcelOffer;
  onTake: (offerId: string) => void;
  /** `true` while this card's accept call is in flight (spinner inside the button). */
  taking?: boolean;
  /** `true` while another card's accept call is in flight. */
  disabled?: boolean;
}

export function CpMatchCard({ offer, onTake, taking = false, disabled = false }: CpMatchCardProps) {
  const t = useTranslations('courier_plus');
  const f = useFormat();
  const headingId = `cp-match-${offer.id}`;

  return (
    <article
      aria-labelledby={headingId}
      className="flex w-full flex-col items-stretch gap-5 rounded-xl bg-surface p-6 lg:flex-row lg:items-center"
    >
      <div className="flex shrink-0 flex-col items-start gap-0.5 lg:w-[104px]">
        <p id={headingId} className="m-0 text-[26px] font-extrabold leading-none text-brand">
          {f.money(offer.pay)}
        </p>
        <p className="m-0 text-micro font-medium text-ink3">{t('matches.pay')}</p>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <CpPlaceBlock icon={Circle} title={offer.pickup} label={t('matches.pickup')} />
          <CpPlaceBlock icon={MapPin} title={offer.dropoff} label={t('matches.dropoff')} />
        </div>

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
      </div>

      <Button
        variant="primary"
        size="lg"
        loading={taking}
        disabled={disabled && !taking}
        onClick={() => onTake(offer.id)}
        className="shrink-0"
      >
        {t('matches.take')}
      </Button>
    </article>
  );
}
