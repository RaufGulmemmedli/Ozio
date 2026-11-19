'use client';

/**
 * One row of "Bağlamalarım" (`Parcel Row PR-…`, 84 high, gap 16, rows separated by the card's
 * 1px `line` hairline): 48 icon tile, number + `pickup → dropoff`, status tag, price, created-at,
 * chevron. The whole row is the link to `/parcel/[id]`.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { Link } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';
import { ChevronRight, Package } from '@/shared/lucide';

import type { Parcel } from '../data/models/parcel';

import { ParcelStatusTag } from './parcel-status-tag';

export function ParcelRow({ parcel }: { parcel: Parcel }) {
  const t = useTranslations('parcel');
  const { money, date } = useFormat();
  const cancelled = parcel.status === 'cancelled';

  return (
    <Link
      href={paths.parcelDetail(parcel.id)}
      className="flex w-full flex-row items-center gap-4 border-b border-line py-4 last:border-b-0 hover:bg-surface2/50 max-md:flex-wrap md:min-h-[84px] md:gap-4"
    >
      <span
        aria-hidden="true"
        className="grid size-12 shrink-0 place-items-center rounded-md bg-surface2 text-ink2"
      >
        <Package size={22} />
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-label font-bold text-ink">{parcel.number}</span>
        <span className="truncate text-caption text-ink2">
          {parcel.draft.pickup.address} → {parcel.draft.dropoff.address}
        </span>
      </span>

      <ParcelStatusTag status={parcel.status} />

      <span className="w-[86px] shrink-0 text-right text-label font-bold tabular-nums text-ink">
        {cancelled ? t('status.noPrice') : money(parcel.quote.price)}
      </span>

      <span className="w-[112px] shrink-0 text-right text-caption text-ink3">
        {date(parcel.createdAt, 'dayMonth')}, {date(parcel.createdAt, 'time')}
      </span>

      <ChevronRight size={20} aria-hidden="true" className="shrink-0 text-ink3" />
    </Link>
  );
}
