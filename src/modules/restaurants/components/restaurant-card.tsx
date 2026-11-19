'use client';

/**
 * One restaurant in the list.
 *
 * Built from the same parts as `<StoreTile>` / `<ProductCard>` — `<Card interactive>`, the
 * initial-letter tile fallback, `<Badge>` for status — so a restaurant row and a store row do not
 * look like they came from two different apps.
 *
 * No photograph: assets.md forbids shipping remote image URLs and this is demo data, so the cover
 * is the documented fallback (a `surface2` tile with the cuisine icon) and the brand's initial.
 */

import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { Link } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { Badge, Card } from '@/shared/ui';
import { Bike, Clock, Star } from '@/shared/lucide';

import {
  CUISINE_ART,
  cheapestItem,
  isOpenNow,
  menuItemCount,
  type Restaurant,
} from '../data/models/restaurant';
import { restaurantPath } from '../restaurants.routes';

export interface RestaurantCardProps {
  restaurant: Restaurant;
  className?: string;
}

export function RestaurantCard({ restaurant, className }: RestaurantCardProps) {
  const t = useTranslations('restaurants');
  const { money, number } = useFormat();

  const open = isOpenNow(restaurant);
  const from = cheapestItem(restaurant);

  return (
    <Card
      as={Link}
      href={restaurantPath(restaurant.id)}
      interactive
      tone="surface"
      radius="card"
      className={cn('flex w-full flex-col gap-4 p-4', className)}
    >
      {/* cover */}
      <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-lg bg-surface2">
        {/*
          A plain <img>, not `next/image`: these are first-party static SVGs from
          `public/restaurants/`, and the image optimizer refuses SVG unless `dangerouslyAllowSVG`
          is turned on for the whole app. There is nothing to optimize in a 2 kB vector anyway.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={CUISINE_ART[restaurant.cuisines[0] ?? 'burger']}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />

        <span
          aria-hidden="true"
          className="absolute start-3 top-3 grid size-11 place-items-center rounded-[14px] bg-brand text-[18px] font-extrabold text-white"
        >
          {[...restaurant.name][0]?.toUpperCase()}
        </span>

        {!open ? (
          <span className="absolute end-3 top-3">
            <Badge tone="neutral">{t('closed')}</Badge>
          </span>
        ) : restaurant.isDeliveryFree ? (
          <span className="absolute end-3 top-3">
            <Badge tone="success" icon={Bike}>
              {t('freeDelivery')}
            </Badge>
          </span>
        ) : null}
      </div>

      <div className="flex w-full flex-col gap-1.5">
        <div className="flex w-full flex-row items-center gap-2">
          <h3 className="min-w-0 flex-1 truncate text-body font-bold text-ink">
            {restaurant.name}
          </h3>
          <span className="flex shrink-0 flex-row items-center gap-1 text-caption font-bold text-ink">
            <Star size={14} aria-hidden="true" className="text-warn" />
            {number(restaurant.rating, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            <span className="font-normal text-ink3">
              {t('ratingCount', { count: restaurant.ratingCount })}
            </span>
          </span>
        </div>

        <p className="truncate text-caption font-normal text-ink2">{restaurant.tagline}</p>

        <div className="flex flex-row flex-wrap items-center gap-x-3 gap-y-1 text-caption font-normal text-ink2">
          <span className="inline-flex flex-row items-center gap-1">
            <Clock size={14} aria-hidden="true" className="text-ink3" />
            {t('deliveryTime', {
              min: restaurant.deliveryTimeMin,
              max: restaurant.deliveryTimeMax,
            })}
          </span>
          <span aria-hidden="true" className="text-ink3">
            ·
          </span>
          <span>{t('minOrder', { amount: money(restaurant.minOrder) })}</span>
          {from !== null ? (
            <>
              <span aria-hidden="true" className="text-ink3">
                ·
              </span>
              <span>{t('fromPrice', { price: money(from) })}</span>
            </>
          ) : null}
        </div>

        <div className="mt-1 flex flex-row flex-wrap items-center gap-1.5">
          {restaurant.cuisines.slice(0, 2).map((cuisine) => (
            <Badge key={cuisine} tone="neutral">
              {t(`cuisine.${cuisine}`)}
            </Badge>
          ))}
          <Badge tone="brand">{t('bonus', { percent: `${restaurant.bonusPercentage}%` })}</Badge>
          <span className="ms-auto text-caption font-normal text-ink3">
            {t('itemCount', { count: menuItemCount(restaurant) })}
          </span>
        </div>
      </div>
    </Card>
  );
}
