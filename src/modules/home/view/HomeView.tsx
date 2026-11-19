'use client';

/**
 * `/home` (App · Əsas, `ErgFc`) — the regions of `app-core.md` §1, in order:
 * Greeting (`KiN0y`) · Hero Row (`G7wwQ`) · Stats (`Phh2w`) · Stores (`MJAu4`) · Products
 * (`l50w3q`). Dark is the same markup: every colour is a token, so `app-home-dark.html` (`j4dzc`)
 * needs no second page.
 *
 * Each region is its own query, so a failing endpoint degrades one card (`<ErrorState compact>`)
 * instead of blanking the page, and `?preview=loading|empty|error|offline` drives all of them
 * through `useScreenQuery`.
 *
 * Cross-module pieces (one owner per endpoint, so there is never a second call to one path):
 * - `useCard()` + `<OzioCard>` — `@/modules/loyalty_card` (`GET v1/profile/me`);
 * - `useOrders()` + `<OrderTrackerCard>` — `@/modules/orders` (`GET v2/orders?offset=0&limit=5`);
 * - `useBonusTransactions()` + `monthlyBonusSummary()` — `@/modules/loyalty_card`
 *   (`GET v2/bonus/transactions?source_type=online`);
 * - `useStores()` / `useStoreCategories()` + `<StoreTile>` — `@/modules/store`
 *   (`GET v1/stores/search?lat&lng`, `GET v1/categories/stores`);
 * - the add button — `<AddToCartButton>` from `@/modules/cart` (`POST v2/carts/action`).
 *
 * Export order note: in `app-home.html` the Hero Row is `[Ozio Card 480][Order Tracker flex]`, so
 * the card sits on the left and the tracker fills the remaining 608 — that is what is built here.
 */
import { useTranslations } from 'next-intl';

import { Link, useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { Sparkles, ShoppingBasket, Store, Ticket, TrendingUp, Trophy, Wallet } from '@/shared/lucide';
import { EmptyState } from '@/shared/states';
import { OzioCard, monthlyBonusSummary, useBonusTransactions, useCard } from '@/modules/loyalty_card';
import { OrderTrackerCard, useOrders } from '@/modules/orders';
import { RestaurantTile, useFeaturedRestaurants } from '@/modules/restaurants';
import { StoreTile, useStoreCategories, useStores } from '@/modules/store';

import {
  Greeting,
  LinkButton,
  ProductGrid,
  PromoSlider,
  SectionBlock,
  SectionError,
  SectionHead,
  StatTile,
  StatTileRow,
} from '../components';
import {
  useFeaturedProducts,
  useGlobalCoupons,
  useHomeDeliveryPoint,
  useHomeSliders,
  useSectionAccess,
  useTenCarts,
} from '../hooks';
import {
  GreetingSkeleton,
  OzioCardOnlySkeleton,
  ProductsSkeleton,
  StatsSkeleton,
  StoreRailSkeleton,
  TrackerSkeleton,
} from './HomeSkeleton';
import { GuestHomeView } from './GuestHomeView';

/** Minimal shape of the next-intl translator the helpers below need. */
type Translate = (key: string, values?: Record<string, string | number>) => string;

export function HomeView() {
  const t = useTranslations('home');
  const { guest } = useSectionAccess();

  if (guest) return <GuestHomeView />;

  return (
    <div className="flex w-full flex-col gap-8">
      <GreetingRegion />
      <HeroRegion />
      <StatsRegion />
      <StoresRegion />
      <ProductsRegion />
      <p className="sr-only">{t('a11y.pageDescription')}</p>
    </div>
  );
}

/* ------------------------------------------------------------- 1. greeting */

function GreetingRegion() {
  const t = useTranslations('home');
  const { card, isPending } = useCard();

  if (isPending) return <GreetingSkeleton />;

  // `profile/me.name` is one string (no first/last split) — the greeting uses the first word.
  const firstName = (card?.holderName ?? '').trim().split(/\s+/)[0] ?? '';

  return (
    <Greeting
      headingId="home-title"
      title={firstName ? t('greeting.title', { name: firstName }) : t('greeting.titleNoName')}
      subtitle={t('greeting.teaser')}
      ctaLabel={t('greeting.cta')}
    />
  );
}

/* ------------------------------------------------------------- 2. hero row */

function HeroRegion() {
  const t = useTranslations('home');
  const cardState = useCard();
  const orders = useOrders({ limit: 5 });
  const sliders = useHomeSliders();

  const activeOrder = orders.active[0] ?? null;

  return (
    <div className="flex w-full flex-col gap-5 lg:flex-row lg:gap-6">
      {cardState.isPending ? (
        <OzioCardOnlySkeleton />
      ) : cardState.isError && cardState.error ? (
        <div className="w-full lg:w-[480px] lg:shrink-0">
          <SectionError error={cardState.error} onRetry={cardState.refetch} retryLabel={t('retry')} />
        </div>
      ) : cardState.card ? (
        <div className="w-full lg:w-[480px] lg:shrink-0">
          <OzioCard card={cardState.card} size="lg" tier={t('card.tier')} />
        </div>
      ) : null}

      {orders.isPending ? (
        <TrackerSkeleton />
      ) : orders.isError && orders.error ? (
        <div className="w-full lg:flex-1">
          <SectionError error={orders.error} onRetry={orders.refetch} retryLabel={t('retry')} />
        </div>
      ) : activeOrder ? (
        <div className="w-full lg:flex-1">
          {/* `size="sm"` is the home variant (padding 24, ETA 32/800) per that component's doc. */}
          <OrderTrackerCard order={activeOrder} size="sm" tone="surface" />
        </div>
      ) : sliders.isPending ? (
        <TrackerSkeleton />
      ) : (
        <PromoSlider
          slides={sliders.isError ? [] : (sliders.data ?? [])}
          emptyTitle={t('slider.emptyTitle')}
          emptyBody={t('slider.emptyBody')}
          ctaLabel={t('slider.cta')}
          previousLabel={t('slider.previous')}
          nextLabel={t('slider.next')}
          regionLabel={t('slider.regionLabel')}
        />
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- 3. stats */

function StatsRegion() {
  const t = useTranslations('home');
  const { money, number } = useFormat();
  const cardState = useCard();
  // `source_type` is required by the server; the month window is applied to the loaded page.
  const bonus = useBonusTransactions({ source: 'online', limit: 50 });
  const coupons = useGlobalCoupons();
  const tens = useTenCarts();

  const pending = cardState.isPending || bonus.isPending || coupons.isPending || tens.isPending;
  if (pending) return <StatsSkeleton />;

  const firstError = cardState.error ?? bonus.error ?? coupons.error ?? tens.error;
  const allFailed = cardState.isError && bonus.isError && coupons.isError && tens.isError;
  if (allFailed && firstError) {
    return (
      <SectionError
        error={firstError}
        onRetry={() => {
          cardState.refetch();
          bonus.refetch();
          coupons.refetch();
          tens.refetch();
        }}
        retryLabel={t('retry')}
      />
    );
  }

  const ten = tens.data?.best ?? null;
  const earnedThisMonth = monthlyBonusSummary(bonus.rows).earned;

  return (
    <StatTileRow>
      <StatTile
        icon={Wallet}
        tone="brand"
        label={t('stats.balance')}
        value={cardState.isError || !cardState.card ? null : money(cardState.card.balance)}
        href={paths.card}
      />
      <StatTile
        icon={TrendingUp}
        tone="success"
        label={t('stats.cashback')}
        value={bonus.isError ? null : `+${money(earnedThisMonth)}`}
        href={paths.cardTransactions}
      />
      <StatTile
        icon={Ticket}
        tone="violet"
        label={t('stats.coupons')}
        value={coupons.isError ? null : number(coupons.data?.total ?? 0)}
        href={paths.coupons}
      />
      <StatTile
        icon={Trophy}
        tone="yellow"
        label={t('stats.tens')}
        value={
          tens.isError || !ten ? null : t('stats.tensValue', { current: ten.currentStep, steps: ten.steps })
        }
        href={paths.tens}
      />
    </StatTileRow>
  );
}

/* ---------------------------------------------------------------- 4. stores */

function StoresRegion() {
  const t = useTranslations('home');
  const tRestaurants = useTranslations('restaurants');
  const { point, isPending: pointPending } = useHomeDeliveryPoint();
  const { stores, query: storesQuery } = useStores({ point });
  const { categories, query: categoriesQuery } = useStoreCategories();
  // Demo data, local, so it never delays the section: the rail renders as soon as the API's
  // stores land and the restaurants drop in beside them.
  const restaurantsQuery = useFeaturedRestaurants(4);
  const restaurants = restaurantsQuery.data ?? [];

  const pending = pointPending || storesQuery.isPending;

  return (
    <section aria-labelledby="home-stores" className="flex w-full flex-col gap-5">
      <SectionHead
        titleId="home-stores"
        title={t('stores.title')}
        actionLabel={t('stores.seeAll')}
        actionHref={paths.market}
      >
        {/* The section covers both now, and "Hamısına bax" goes to the market, so the restaurant
            list needs its own way in. */}
        <Link
          href={paths.restaurants}
          className="ms-auto shrink-0 rounded-sm text-label font-semibold text-ink2 hover:text-ink md:text-body-sm"
        >
          {tRestaurants('title')}
        </Link>
      </SectionHead>
      <SectionBlock
        pending={pending}
        skeleton={<StoreRailSkeleton />}
        error={storesQuery.isError ? storesQuery.error : null}
        onRetry={storesQuery.refetch}
        retryLabel={t('retry')}
        empty={stores.length === 0 && categories.length === 0 && restaurants.length === 0}
        emptyIcon={Store}
        emptyTitle={t('stores.emptyTitle')}
        emptyBody={t('stores.emptyBody')}
        emptyAction={
          <LinkButton href={paths.addresses} variant="primary" size="lg">
            {t('stores.emptyCta')}
          </LinkButton>
        }
        loginPrompt={<SignInPanel t={t} next={paths.home} titleKey="stores.guestTitle" bodyKey="stores.guestBody" />}
      >
        {stores.length > 0 ? (
          /* Below lg this is the drawn scrolling rail of fixed 128/172px tiles.
             From lg it becomes an auto-fit grid: in the export six 172px tiles
             plus their gaps fill the content row exactly, so "the row fills the
             width" is the designer's invariant — but the API returns four
             stores, which left ~1170px of the row empty once the content stopped
             being capped at 1280. `minmax(172px, 1fr)` keeps the drawn minimum
             and lets however many stores there are share the row. */
          <ul className="flex w-full flex-row gap-3 overflow-x-auto pb-1 [scrollbar-width:none] lg:grid lg:grid-cols-[repeat(auto-fit,minmax(172px,1fr))] lg:gap-4 lg:overflow-visible [&::-webkit-scrollbar]:hidden">
            {stores.slice(0, 8).map((store) => (
              <li key={store.id} className="w-32 shrink-0 lg:w-auto">
                <StoreTile store={store} />
              </li>
            ))}
            {/* Restaurants ride in the same rail, in a tile built to match `<StoreTile>` box for
                box — the section is "Mağaza və restoranlar", so it should read as one shelf. */}
            {restaurants.map((restaurant) => (
              <li key={`restaurant-${restaurant.id}`} className="w-32 shrink-0 lg:w-auto">
                <RestaurantTile restaurant={restaurant} />
              </li>
            ))}
          </ul>
        ) : (
          /* `GET v1/categories/stores` returns 4 store CATEGORIES, not stores — the only rows the
             API can offer when the search finds nothing for this point. */
          <ul className="flex w-full flex-row gap-3 overflow-x-auto pb-1 [scrollbar-width:none] lg:grid lg:grid-cols-[repeat(auto-fit,minmax(172px,1fr))] lg:gap-4 lg:overflow-visible [&::-webkit-scrollbar]:hidden">
            {(categoriesQuery.isError ? [] : categories).map((category) => (
              <li key={category.id} className="w-32 shrink-0 lg:w-auto">
                <LinkButton
                  href={paths.category(category.id)}
                  variant="soft"
                  size="lg"
                  fullWidth
                  className="justify-start"
                >
                  {category.name}
                </LinkButton>
              </li>
            ))}
          </ul>
        )}
      </SectionBlock>
    </section>
  );
}

/* -------------------------------------------------------------- 5. products */

function ProductsRegion() {
  const t = useTranslations('home');
  const products = useFeaturedProducts();

  return (
    <section aria-labelledby="home-products" className="flex w-full flex-col gap-5">
      <SectionHead
        titleId="home-products"
        title={t('products.title')}
        actionLabel={t('products.seeAll')}
        actionHref={paths.market}
      />
      <SectionBlock
        pending={products.isPending}
        skeleton={<ProductsSkeleton />}
        error={products.isError ? products.error : null}
        onRetry={products.refetch}
        retryLabel={t('retry')}
        empty={(products.data ?? []).length === 0}
        emptyIcon={Sparkles}
        emptyTitle={t('products.emptyTitle')}
        emptyBody={t('products.emptyBody')}
        emptyAction={
          <LinkButton href={paths.market} variant="primary" size="lg">
            {t('products.emptyCta')}
          </LinkButton>
        }
        loginPrompt={
          <SignInPanel t={t} next={paths.home} titleKey="products.guestTitle" bodyKey="products.guestBody" />
        }
      >
        <ProductGrid products={products.data ?? []} cols={4} />
      </SectionBlock>
    </section>
  );
}

/**
 * Browse endpoints are called by guests in the UI, but server-side guest acceptance is
 * **unverified** — so a 401 on a browse section shows the sign-in panel, never an error card.
 */
function SignInPanel({
  t,
  next,
  titleKey,
  bodyKey,
}: {
  t: Translate;
  next: string;
  titleKey: string;
  bodyKey: string;
}) {
  return (
    <EmptyState
      compact
      panel
      icon={ShoppingBasket}
      title={t(titleKey)}
      body={t(bodyKey)}
      titleAs="p"
      action={
        <LinkButton href={`${paths.login}?next=${encodeURIComponent(next)}`} variant="primary" size="lg">
          {t('guest.signIn')}
        </LinkButton>
      }
    />
  );
}
