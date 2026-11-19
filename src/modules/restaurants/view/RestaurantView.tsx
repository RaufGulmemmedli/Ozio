'use client';

/**
 * `/market/restaurants/[id]` — one restaurant and its menu.
 *
 * Header (name, rating, delivery window, fee, minimum order, cashback), then the menu grouped into
 * its sections. The item cards are deliberately **not** addable to the cart: the cart is the real
 * `POST v2/carts/action`, which takes a live `store_products` row id, and these dishes have none —
 * an add button here would 422. The cards say so once, in `<DemoBanner>` and on the disabled
 * control, rather than failing when pressed.
 */

import { useTranslations } from 'next-intl';

import { useFailureMessage, useFormat } from '@/core/i18n';
import { useRouter } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { DemoBanner, EmptyState, ErrorState, StateButton } from '@/shared/states';
import { Bike, Clock, Plus, SearchX, Star, Utensils, Wallet } from '@/shared/lucide';
import { Badge, Breadcrumbs, Button, Card, Price, QuantityStepper } from '@/shared/ui';

import {
  CUISINE_ICON,
  SECTION_ART,
  SECTION_ICON,
  isOpenNow,
  type MenuItem,
  type Restaurant,
} from '../data/models/restaurant';
import { useRestaurantBasket, type RestaurantBasket } from '../hooks/use-restaurant-basket';
import { useRestaurant } from '../hooks/use-restaurants';
import { RESTAURANTS_PATH } from '../restaurants.routes';
import { RestaurantSkeleton } from './RestaurantSkeleton';

export interface RestaurantViewProps {
  /** `null` when the `[id]` segment was not a number. */
  restaurantId: number | null;
}

export function RestaurantView({ restaurantId }: RestaurantViewProps) {
  const t = useTranslations('restaurants');
  const failureMessage = useFailureMessage();

  const { money } = useFormat();
  const router = useRouter();
  const query = useRestaurant(restaurantId);
  const restaurant = query.data ?? null;
  const basket = useRestaurantBasket(restaurantId);

  if (restaurantId === null || (query.isError && query.error.kind === 'notFound')) {
    return <NotFound />;
  }

  if (query.isPending) return <RestaurantSkeleton />;

  if (query.isError) {
    return (
      <div className="flex w-full flex-col gap-8">
        <PageHeader title={t('title')} />
        <ErrorState
          failure={query.error}
          title={t('error.title')}
          message={failureMessage(query.error)}
          onRetry={() => query.refetch()}
          retryLabel={t('error.retry')}
        />
      </div>
    );
  }

  if (!restaurant) return <NotFound />;

  const open = isOpenNow(restaurant);

  return (
    <div className="flex w-full flex-col gap-8">
      <PageHeader
        title={restaurant.name}
        subtitle={restaurant.tagline}
        breadcrumbs={
          <Breadcrumbs
            label={t('breadcrumb.label')}
            items={[
              { label: t('breadcrumb.market'), href: paths.market },
              { label: t('title'), href: RESTAURANTS_PATH },
              { label: restaurant.name },
            ]}
          />
        }
      />

      <DemoBanner title={t('demo.title')} body={t('demo.body')} />

      <RestaurantHero restaurant={restaurant} open={open} />

      <section aria-label={t('menu.title')} className="flex w-full flex-col gap-8">
        <h2 className="text-h3 font-bold text-ink">{t('menu.title')}</h2>

        {restaurant.menu.map((section) => {
          const SectionIcon = SECTION_ICON[section.id] ?? SECTION_ICON.default ?? Utensils;
          return (
            <div key={section.id} className="flex w-full flex-col gap-4">
              <h3 className="flex flex-row items-center gap-2.5 text-h4 font-bold text-ink">
                <SectionIcon size={20} aria-hidden="true" className="text-ink3" />
                {section.title}
              </h3>
              <ul className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {section.items.map((item) => (
                  <li key={item.id} className="flex">
                    <MenuItemCard
                      item={item}
                      sectionId={section.id}
                      restaurant={restaurant}
                      basket={basket}
                    />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      {/*
        The basket bar. Sticky at the bottom of the content rather than fixed to the viewport, so
        it never covers the app shell's own bottom pill on mobile.
      */}
      {basket.itemCount > 0 ? (
        <div className="sticky bottom-4 z-20 flex w-full flex-row items-center gap-4 rounded-pill bg-ink px-5 py-3 shadow-menu">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-label font-bold text-bg">
              {t('basket.summary', { count: basket.itemCount })}
            </span>
            <span className="truncate text-caption font-normal text-bg/70">
              {t('basket.inCart')}
            </span>
          </span>
          <span className="shrink-0 text-body font-extrabold text-bg">{money(basket.total)}</span>
          <Button variant="white" size="md" onClick={() => router.push(paths.cart)}>
            {t('basket.goToCart')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/* ----------------------------------------------------------------------- hero */

function RestaurantHero({ restaurant, open }: { restaurant: Restaurant; open: boolean }) {
  const t = useTranslations('restaurants');
  const { money, number } = useFormat();
  const Icon = CUISINE_ICON[restaurant.cuisines[0] ?? 'burger'];

  return (
    <Card tone="surface" radius="card" className="flex w-full flex-col gap-5 p-5 lg:p-6">
      <div className="flex w-full flex-row items-center gap-4">
        <span
          aria-hidden="true"
          className="grid size-16 shrink-0 place-items-center rounded-[20px] bg-brand text-[24px] font-extrabold text-white"
        >
          {[...restaurant.name][0]?.toUpperCase()}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-row flex-wrap items-center gap-2">
            <Badge tone={open ? 'success' : 'neutral'}>{open ? t('open') : t('closed')}</Badge>
            {!open ? (
              <span className="text-caption font-normal text-ink2">
                {t('opensAt', { time: restaurant.opensAt })}
              </span>
            ) : null}
          </div>
          <span className="flex flex-row flex-wrap items-center gap-2 text-caption font-normal text-ink2">
            <Icon size={16} aria-hidden="true" className="text-ink3" />
            {restaurant.cuisines.map((cuisine) => t(`cuisine.${cuisine}`)).join(' · ')}
          </span>
        </div>
      </div>

      <ul className="grid w-full grid-cols-2 gap-3 lg:grid-cols-4">
        <Fact
          icon={<Star size={18} aria-hidden="true" className="text-warn" />}
          label={`${number(restaurant.rating, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${t('ratingCount', { count: restaurant.ratingCount })}`}
        />
        <Fact
          icon={<Clock size={18} aria-hidden="true" className="text-ink3" />}
          label={t('deliveryTime', {
            min: restaurant.deliveryTimeMin,
            max: restaurant.deliveryTimeMax,
          })}
        />
        <Fact
          icon={<Bike size={18} aria-hidden="true" className="text-ink3" />}
          label={
            restaurant.isDeliveryFree
              ? t('freeDelivery')
              : t('deliveryFee', { fee: money(restaurant.deliveryFee) })
          }
        />
        <Fact
          icon={<Wallet size={18} aria-hidden="true" className="text-ink3" />}
          label={t('minOrder', { amount: money(restaurant.minOrder) })}
        />
      </ul>
    </Card>
  );
}

function Fact({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li className="flex flex-row items-center gap-2.5 rounded-lg bg-surface2 px-4 py-3">
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 truncate text-caption font-semibold text-ink">{label}</span>
    </li>
  );
}

/* ------------------------------------------------------------------ menu item */

function MenuItemCard({
  item,
  sectionId,
  restaurant,
  basket,
}: {
  item: MenuItem;
  sectionId: string;
  restaurant: Restaurant;
  basket: RestaurantBasket;
}) {
  const t = useTranslations('restaurants');
  const quantity = basket.quantityOf(item.id);

  return (
    <Card tone="surface" radius="card" className="flex w-full flex-row gap-4 p-4">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-surface2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SECTION_ART[sectionId] ?? SECTION_ART.default}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-row items-start gap-2">
          <h4 className="min-w-0 flex-1 text-body-sm font-bold text-ink">{item.name}</h4>
          {item.tag ? (
            <Badge tone={TAG_TONE[item.tag]} className="shrink-0">
              {t(`tag.${item.tag}`)}
            </Badge>
          ) : null}
        </div>

        <p className="line-clamp-2 text-caption font-normal text-ink2">{item.description}</p>

        <div className="mt-auto flex flex-row flex-wrap items-baseline gap-2 pt-1">
          <Price value={item.price} size="card" />
          {item.oldPrice !== null ? <Price value={item.oldPrice} size="card" strike /> : null}
          {item.portion ? (
            <span className="text-caption font-normal text-ink3">{item.portion}</span>
          ) : null}
        </div>

        <div className="mt-1 flex flex-row items-center">
          {quantity > 0 ? (
            <QuantityStepper
              value={quantity}
              min={0}
              max={99}
              size="compact"
              onChange={(next) => basket.setQuantity(item.id, next)}
              decreaseLabel={t('menu.decrease')}
              increaseLabel={t('menu.increase')}
              removeLabel={t('menu.remove')}
            />
          ) : (
            <Button
              variant="soft"
              size="md"
              onClick={() => basket.add(restaurant, item)}
              aria-label={t('menu.addNamed', { name: item.name })}
            >
              <Plus size={18} aria-hidden="true" />
              {t('menu.add')}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

const TAG_TONE = {
  popular: 'yellow',
  new: 'sky',
  spicy: 'brand',
  vegetarian: 'success',
} as const;

/* -------------------------------------------------------------------- shared */

function NotFound() {
  const t = useTranslations('restaurants');
  return (
    <div className="flex w-full flex-col gap-8">
      <PageHeader title={t('title')} />
      <EmptyState
        icon={SearchX}
        tone="brand"
        panel
        title={t('notFound.title')}
        body={t('notFound.body')}
        action={<StateButton href={RESTAURANTS_PATH}>{t('notFound.back')}</StateButton>}
      />
    </div>
  );
}
