'use client';

/**
 * The home-rail tile, built to match `<StoreTile>` box for box (56 logo, 18 padding, 14 gap, the
 * same hover lift) — the rail now mixes real stores with demo restaurants, and a visitor should
 * not be able to tell which tile came from which by its shape.
 *
 * The logo slot is an initial-letter tile rather than an image: no photography ships with demo
 * data, and this is exactly `<StoreLogo>`'s own fallback for a store with no `logoUrl`.
 */

import { useTranslations } from 'next-intl';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';

import { CUISINE_ICON, isOpenNow, type Restaurant } from '../data/models/restaurant';
import { restaurantPath } from '../restaurants.routes';

export interface RestaurantTileProps {
  restaurant: Restaurant;
  className?: string;
}

export function RestaurantTile({ restaurant, className }: RestaurantTileProps) {
  const t = useTranslations('restaurants');
  const open = isOpenNow(restaurant);
  const Icon = CUISINE_ICON[restaurant.cuisines[0] ?? 'burger'];

  const line = [
    t('deliveryTime', { min: restaurant.deliveryTimeMin, max: restaurant.deliveryTimeMax }),
    restaurant.isDeliveryFree ? t('freeDelivery') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      href={restaurantPath(restaurant.id)}
      className={cn(
        'flex min-w-0 flex-col items-start gap-[14px] rounded-card bg-surface p-[18px] text-left',
        'transition-transform duration-[var(--oz-dur-base)] ease-out hover:-translate-y-0.5 active:scale-[.99]',
        className,
      )}
    >
      <span className="relative shrink-0">
        <span
          aria-hidden="true"
          className="grid size-14 place-items-center rounded-[18px] bg-brand text-[24px] font-extrabold text-white"
        >
          {[...restaurant.name][0]?.toUpperCase()}
        </span>
        <span
          aria-hidden="true"
          className="absolute -bottom-1 -end-1 grid size-6 place-items-center rounded-pill bg-surface2 text-ink2 ring-2 ring-surface"
        >
          <Icon size={13} />
        </span>
      </span>

      <span className="flex min-w-0 flex-col gap-[2px]">
        <span className="truncate text-body-sm font-bold text-ink">{restaurant.name}</span>
        <span className="truncate text-caption font-normal text-ink2">
          {open ? line : t('closed')}
        </span>
      </span>
    </Link>
  );
}
