'use client';

/**
 * The store hero (`nFksw`, closed variant `BHGTq`).
 *
 * Measured: `block` fill, radius 36, 260 high; left info column `flex-1` padding 36
 * `justify-between` — identity row gap 20 with an 88 px logo at radius 28, name 40/800, status row
 * gap 10 (status pill height 30 / padding-inline 14 / gap 8 with an 8 px dot and a 13/700 label,
 * then the hours line 14/500); meta row gap 12 of `#FFFFFF1F` pills height 40 / padding-inline 16
 * / gap 8 with a 16 px icon and a 14/600 label. The cover photo is the 420-wide right half, at 50 %
 * opacity while the store is closed.
 *
 * Two fields the design asks for do not exist on live and are therefore **not rendered**:
 * "Min. sifariş 10 ₼" (no minimum-order field is sent) and the "2 140 rəy" review count
 * (`rating` is a bare string, there is no `rating_count`).
 */
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { Bike, Heart, Star, Store as StoreIcon, Timer } from '@/shared/lucide';
import { ProductImage } from '@/shared/media';
import { IconButton } from '@/shared/ui';

import { addMinutesToClock, type StoreDetail } from '../data/models/store';

export interface StoreHeaderProps {
  store: StoreDetail;
  isOpen: boolean;
  favorite?: boolean;
  onToggleFavorite?: () => void;
  favoritePending?: boolean;
  className?: string;
}

function MetaPill({
  icon: Icon,
  children,
}: {
  icon: typeof Timer;
  children: ReactNode;
}) {
  return (
    <li className="flex h-10 flex-row items-center gap-2 rounded-pill bg-white/[0.12] px-4">
      <Icon size={16} aria-hidden="true" className="text-white" />
      <span className="text-label font-semibold whitespace-nowrap text-white">{children}</span>
    </li>
  );
}

export function StoreHeader({
  store,
  isOpen,
  favorite = false,
  onToggleFavorite,
  favoritePending = false,
  className,
}: StoreHeaderProps) {
  const t = useTranslations('store');
  const { money, number } = useFormat();

  const hours = store.hours;
  const eta =
    store.deliveryTimeMin !== null && store.deliveryTimeMax !== null
      ? t('tile.eta', { min: store.deliveryTimeMin, max: store.deliveryTimeMax })
      : null;
  const firstDelivery =
    hours && store.deliveryTimeMax !== null
      ? addMinutesToClock(hours.open, store.deliveryTimeMax)
      : null;

  return (
    <section
      aria-labelledby="store-name"
      className={cn(
        'relative flex w-full flex-col overflow-hidden rounded-bento bg-block lg:flex-row',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-8 p-6 md:p-9">
        <div className="flex flex-row items-center gap-5">
          <div className="grid size-[88px] shrink-0 place-items-center rounded-xl bg-brand">
            <StoreIcon size={40} aria-hidden="true" className="text-white" />
          </div>

          <div className="flex min-w-0 flex-col gap-[10px]">
            <h1
              id="store-name"
              className="truncate text-h2 font-extrabold text-white md:text-[40px]"
            >
              {store.name}
            </h1>

            <div className="flex flex-row flex-wrap items-center gap-[10px]">
              <span
                className={cn(
                  'flex h-[30px] flex-row items-center gap-2 rounded-pill px-[14px]',
                  isOpen ? 'bg-success' : 'bg-ink3',
                )}
              >
                <span aria-hidden="true" className="size-2 rounded-pill bg-white" />
                <span className="text-caption font-bold text-white">
                  {isOpen ? t('header.open') : t('header.closed')}
                </span>
              </span>

              {hours ? (
                <span className="text-label font-medium text-white">
                  {isOpen
                    ? t('header.hoursToday', { open: hours.open, close: hours.close })
                    : t('header.opensAt', { time: hours.open })}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <ul className="flex flex-row flex-wrap items-center gap-3">
          {!isOpen && firstDelivery ? (
            <MetaPill icon={Timer}>{t('header.firstDelivery', { time: firstDelivery })}</MetaPill>
          ) : eta ? (
            <MetaPill icon={Timer}>{eta}</MetaPill>
          ) : null}

          {store.isDeliveryFree ? (
            <MetaPill icon={Bike}>{t('tile.freeDelivery')}</MetaPill>
          ) : store.deliveryFee !== null ? (
            <MetaPill icon={Bike}>
              {t('header.deliveryFee', { fee: money(store.deliveryFee) })}
            </MetaPill>
          ) : null}

          {store.rating !== null ? (
            <MetaPill icon={Star}>
              {number(store.rating, { maximumFractionDigits: 1 })}
            </MetaPill>
          ) : null}
        </ul>
      </div>

      {/*
        The design draws a cover PHOTO here (`nFksw`, the 420-wide right half). Live sends no such
        field — `store.logoUrl` is the only image on a store, and it is a wide wordmark. Filled in
        as a cover photo it was scaled to fill 420x260 and cropped, so "bolmart" rendered as
        "bolma" with the brand name running off the edge.
        So the panel is a LOGO panel: `contain`, padded, centred, on a light surface the way a
        wordmark is meant to sit. Nothing is cut, and it still fills the drawn half.
      */}
      <div
        className={cn(
          'hidden w-[420px] shrink-0 self-stretch bg-surface p-10 lg:grid lg:place-items-center',
          !isOpen && 'opacity-50',
        )}
      >
        <ProductImage
          src={store.logoUrl}
          alt=""
          category={store.storeCategoryName}
          ratio="340/180"
          radius="none"
          fit="contain"
          sizes="340px"
          fallbackIconSize={64}
          className="bg-transparent"
        />
      </div>

      {onToggleFavorite ? (
        <IconButton
          aria-label={favorite ? t('card.favoriteRemove') : t('card.favoriteAdd')}
          aria-pressed={favorite}
          size={44}
          tone="surface"
          loading={favoritePending}
          onClick={onToggleFavorite}
          className="absolute right-5 top-5"
        >
          <Heart aria-hidden="true" className={favorite ? 'fill-brand text-brand' : 'text-ink'} />
        </IconButton>
      ) : null}
    </section>
  );
}
