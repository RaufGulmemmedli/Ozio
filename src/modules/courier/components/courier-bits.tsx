'use client';

/**
 * Module-private widgets shared across the courier screens, all measured from
 * `html/mock-parcel-courier/kuryer-*.html`.
 *
 * - `<SummaryTile>` — the 4-up row on the panel (radius 28, padding 24, gap 8; the first one is
 *   the dark `block` tile).
 * - `<CourierCard>` — the plain white card shell these screens repeat (radius 28, padding 24).
 * - `<MetaChip>` — the `surface2` distance / ETA pills (28 high, pill, padding-inline 12).
 * - `<KeyValue>` — one row of the "Müraciət məlumatları" / payment `<dl>`s.
 * - `<ItemsList>` — the "Sifariş tərkibi" rows.
 * - `<VehicleIcon>` — the vehicle glyph, mapped onto the icons `@/shared/lucide` actually exports.
 */
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';
import { Bike, Truck, User, Zap, type LucideIcon } from '@/shared/lucide';

import type { CourierOrderItem, CourierVehicle } from '../data/models/courier';

/**
 * `@/shared/lucide` is the only allowed icon source and exports no `Footprints` / `Car` /
 * `Scooter`, so the four vehicles map onto the closest glyphs it does export.
 * // TODO(core): add Footprints + Car to `@/shared/lucide` for an exact match.
 */
export const VEHICLE_ICON: Record<CourierVehicle, LucideIcon> = {
  foot: User,
  bicycle: Bike,
  scooter: Zap,
  car: Truck,
};

export function VehicleIcon({
  vehicle,
  size = 22,
  className,
}: {
  vehicle: CourierVehicle;
  size?: number;
  className?: string;
}) {
  const Icon = VEHICLE_ICON[vehicle];
  return <Icon size={size} aria-hidden="true" className={className} />;
}

export function CourierCard({
  children,
  className,
  as: Tag = 'section',
}: {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'aside';
}) {
  return (
    <Tag className={cn('flex w-full flex-col gap-4 rounded-xl bg-surface p-6', className)}>
      {children}
    </Tag>
  );
}

export function SummaryTile({
  label,
  value,
  dark = false,
}: {
  label: string;
  value: string;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-2 rounded-xl p-6',
        dark ? 'bg-block' : 'bg-surface',
      )}
    >
      <span className={cn('text-caption font-medium', dark ? 'text-on-block/70' : 'text-ink2')}>
        {label}
      </span>
      <span
        className={cn(
          'text-h3 font-extrabold tabular-nums',
          dark ? 'text-on-block' : 'text-ink',
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function MetaChip({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'sky' | 'yellow' | 'brand';
}) {
  const TONE = {
    neutral: 'bg-surface2 text-ink2',
    sky: 'bg-sky-soft text-sky',
    yellow: 'bg-yellow text-on-yellow',
    brand: 'bg-brand-soft text-brand',
  } as const;
  return (
    <span
      className={cn(
        'inline-flex h-7 shrink-0 items-center whitespace-nowrap rounded-pill px-3 text-micro font-bold tabular-nums',
        TONE[tone],
      )}
    >
      {children}
    </span>
  );
}

export function KeyValue({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex w-full flex-row items-start justify-between gap-4">
      <dt className="shrink-0 text-label text-ink2">{label}</dt>
      <dd
        className={cn(
          'm-0 min-w-0 text-right text-label tabular-nums text-ink',
          strong ? 'font-extrabold' : 'font-semibold',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/** "Sifariş tərkibi": name, unit, × qty. */
export function ItemsList({ items }: { items: readonly CourierOrderItem[] }) {
  const t = useTranslations('courier');
  return (
    <ul className="m-0 flex w-full list-none flex-col p-0">
      {items.map((item, index) => (
        <li
          key={`${item.name}-${index}`}
          className="flex w-full flex-row items-center gap-4 border-b border-line py-3 last:border-b-0"
        >
          <span className="min-w-0 flex-1 truncate text-label font-semibold text-ink">
            {item.name}
          </span>
          <span className="shrink-0 text-caption text-ink3">
            {item.unit || t('offer.noUnit')}
          </span>
          <span className="w-12 shrink-0 text-right text-label font-bold tabular-nums text-ink">
            {t('offer.quantity', { count: item.quantity })}
          </span>
        </li>
      ))}
    </ul>
  );
}
