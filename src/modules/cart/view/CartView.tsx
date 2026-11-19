'use client';

/**
 * `/cart` — "Səbət və ödəniş" (D5, `app-core/app-cart.html` node `UONCe`).
 *
 * Layout from the export: header `gOcP2` ("Səbətim" 36/800 over "3 mağazadan 6 məhsul" 16/400
 * `ink2`), then body `bXYSs` at gap 24 — a flexible item column (`surface`, radius 28, padding
 * 8/28, rows 120 high separated by a 1px `line`) beside the 420-wide summary column. Below 1200 it
 * is one column and the summary becomes a sticky bottom bar
 * (`app-states/app-sebet-mobil-390.html`).
 *
 * **`GET v2/carts` returns one cart per store**, so the header counts every store and line while
 * the summary prices exactly one cart (`orders/checkout` takes a single `cart_id`). With more than
 * one store the item column heads each group with its store name and lets the customer pick which
 * one to check out — the design's "3 mağazadan 6 məhsul" header is the only hint the frames give
 * about multi-store carts.
 *
 * States: loading → `<CartSkeleton>` · empty → `<CartEmpty>` · error → `<ErrorState>` ·
 * store closed / out of zone / out of stock / purchasing disabled → inside `<SummaryCard>`.
 * `?preview=loading|empty|error|closed` drives all of them through `useScreenQuery`.
 */
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';

import { useFailureMessage } from '@/core/i18n';
import { usePathname, useRouter } from '@/core/i18n';
import { useIsMobile } from '@/core/lib/use-breakpoint';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { ErrorState } from '@/shared/states';
import { Button, confirmDialog } from '@/shared/ui';

import { useRestaurantBasketStore, type BasketLine } from '@/modules/restaurants';

import { CartEmpty } from '../components/CartEmpty';
import { RestaurantCartSection } from '../components/RestaurantCartSection';
import { CartLineRow } from '../components/CartLineRow';
import { DeliveryTimeSheet } from '../components/DeliveryTimeSheet';
import { PaymentMethodSheet } from '../components/PaymentMethodSheet';
import { PromoSheet } from '../components/PromoSheet';
import { SummaryCard } from '../components/SummaryCard';
import { orderedLines, type Cart } from '../data/models/cart';
import { useActiveCart, useCart } from '../hooks/use-cart';
import { useCartAction } from '../hooks/use-cart-action';
import { useCartSelection } from '../hooks/use-cart-selection';
import { useCheckoutCalc } from '../hooks/use-checkout-calc';
import { useDeliveryAddress } from '../hooks/use-delivery-address';
import { useDeliveryEstimates } from '../hooks/use-delivery-estimate';
import { CartSkeleton } from './CartSkeleton';

/** `?sheet=` — the promo and delivery-time sheets are URL states of `/cart` (ROUTES.md). */
type SheetName = 'promo' | 'time' | 'payment' | null;

export function CartView() {
  const t = useTranslations('cart');
  const tr = useTranslations('restaurants');
  const tc = useTranslations('common');
  const failureMessage = useFailureMessage();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const isMobile = useIsMobile();

  const cart = useCart();
  const bundle = cart.data;

  /*
   * The demo restaurant lines, grouped per restaurant so each one reads like a store group.
   *
   * They live in a local store rather than `GET v2/carts` because the dishes have no
   * `store_products` row id to send — but the customer sees one cart, which is what was asked for.
   */
  const restaurantLines = useRestaurantBasketStore((state) => state.lines);
  const restaurantGroups = useMemo(() => {
    const byRestaurant = new Map<number, { id: number; name: string; lines: BasketLine[] }>();
    for (const line of restaurantLines) {
      const group = byRestaurant.get(line.restaurantId) ?? {
        id: line.restaurantId,
        name: line.restaurantName,
        lines: [],
      };
      group.lines.push(line);
      byRestaurant.set(line.restaurantId, group);
    }
    return [...byRestaurant.values()];
  }, [restaurantLines]);

  const clearRestaurant = useRestaurantBasketStore((state) => state.clearRestaurant);

  /**
   * The demo checkout: empty that restaurant's lines and go to the confirmation with the figures
   * it should print. Nothing is posted — see `<OrderSuccessView>`.
   */
  const checkoutRestaurant = useCallback(
    (restaurantId: number) => {
      const group = restaurantGroups.find((entry) => entry.id === restaurantId);
      if (!group) return;

      const total = group.lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
      // 2% of the basket, the rate the demo restaurants advertise, rounded to the cent.
      const bonus = Math.round(total * 0.02 * 100) / 100;
      // A plausible order number, stable for the length of this confirmation.
      const orderNo = String(60_000 + Math.floor(Math.random() * 9_000));

      clearRestaurant(restaurantId);
      // `paths.orderSuccess(id)` already carries `?order=`, so the rest is appended with `&`.
      router.push(
        `${paths.orderSuccess(orderNo)}&total=${total.toFixed(2)}&bonus=${bonus.toFixed(2)}&payment=cash&streak=4`,
      );
    },
    [clearRestaurant, restaurantGroups, router],
  );
  const active = useActiveCart(bundle);
  const setActiveCart = useCartSelection((state) => state.setActiveCart);

  const calc = useCheckoutCalc({ cartId: active?.id ?? null });
  const { address, isPending: addressPending } = useDeliveryAddress();
  const estimates = useDeliveryEstimates();
  const action = useCartAction();

  const sheet = (params?.get('sheet') ?? null) as SheetName;

  const openSheet = useCallback(
    (name: Exclude<SheetName, null>) => {
      const next = new URLSearchParams(params?.toString() ?? '');
      next.set('sheet', name);
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const closeSheet = useCallback(() => {
    const next = new URLSearchParams(params?.toString() ?? '');
    next.delete('sheet');
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  /** "Təmizlə" (mobile header): removes every line of the cart being priced, one call at a time. */
  async function clearActiveCart(target: Cart) {
    const confirmed = await confirmDialog({
      title: t('clear.title'),
      body: t('clear.body'),
      confirmLabel: t('clear.confirm'),
      cancelLabel: tc('cancel'),
      destructive: true,
    });
    if (!confirmed) return;

    // Serialised on purpose: two writes to `carts/action` at once answer 429.
    for (const line of orderedLines(target)) {
      try {
        await action.mutateAsync({
          storeId: line.storeId,
          productId: line.id,
          quantity: line.quantity,
          action: 'remove',
          silent: true,
        });
      } catch {
        return;
      }
    }
  }

  if (cart.isPending) return <CartSkeleton />;

  if (cart.isError) {
    return (
      <div className="flex w-full flex-col gap-8">
        <Header title={t('title')} />
        <ErrorState
          failure={cart.error}
          title={t('error.title')}
          message={failureMessage(cart.error)}
          onRetry={() => void cart.refetch()}
          retryLabel={tc('retry')}
          secondaryAction={
            <Button as="a" href={paths.market} variant="soft" size="lg">
              {t('empty.cta')}
            </Button>
          }
        />
      </div>
    );
  }

  // Nothing at all — neither a server cart nor a demo restaurant line.
  if ((!bundle || bundle.itemCount === 0) && restaurantGroups.length === 0) {
    return (
      <div className="flex w-full flex-col gap-8">
        {/* The empty frame heads the page "Səbət", not "Səbətim" (app-bos-sebet.html). */}
        <Header title={t('titleShort')} subtitle={t('empty.heading')} />
        <CartEmpty />
      </div>
    );
  }

  const restaurantSections = restaurantGroups.map((group) => (
    <RestaurantCartSection
      key={`restaurant-${group.id}`}
      restaurantId={group.id}
      restaurantName={group.name}
      lines={group.lines}
      mobile={isMobile}
      onCheckout={checkoutRestaurant}
    />
  ));

  // A cart holding ONLY restaurant lines still has to render: the server bundle is empty, so
  // everything below that depends on `bundle` would be skipped.
  if (!bundle || bundle.itemCount === 0) {
    return (
      <div className="flex w-full flex-col gap-8">
        <Header
          title={isMobile ? t('titleShort') : t('title')}
          subtitle={tr('subtitle', { count: restaurantGroups.length })}
        />
        <div className="flex w-full flex-col gap-4">{restaurantSections}</div>
      </div>
    );
  }

  const estimate = active ? estimates.forStore(active.storeId) : null;
  const multiStore = bundle.storeCount > 1;

  const summary = active ? (
    <SummaryCard
      cart={active}
      storeCount={bundle.storeCount}
      itemCount={orderedLines(active).length}
      calc={calc.data}
      calcPending={calc.isPending}
      calcFailure={calc.isError ? calc.error : null}
      onRetryCalc={() => void calc.refetch()}
      address={address}
      addressPending={addressPending}
      estimate={estimate}
      onOpenPromo={() => openSheet('promo')}
      onOpenTime={() => openSheet('time')}
      onOpenPayment={() => openSheet('payment')}
      variant={isMobile ? 'mobile' : 'panel'}
    />
  ) : null;

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex w-full flex-row items-end justify-between gap-4">
        <Header
          // The mobile frame heads the page "Səbət"; the desktop one "Səbətim".
          title={isMobile ? t('titleShort') : t('title')}
          subtitle={t('header.summary', {
            storeCount: bundle.storeCount,
            itemCount: bundle.itemCount,
          })}
        />
        {active ? (
          <button
            type="button"
            onClick={() => void clearActiveCart(active)}
            className="shrink-0 pb-1 text-label font-semibold text-brand hover:underline"
          >
            {t('header.clear')}
          </button>
        ) : null}
      </div>

      <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
          {bundle.carts.map((row) => {
            const lines = orderedLines(row);
            if (lines.length === 0) return null;
            const isActive = row.id === active?.id;

            return (
              <section
                key={row.id}
                aria-label={row.storeName}
                className={cn(
                  'flex w-full flex-col',
                  !isMobile && 'rounded-xl bg-surface px-7 py-2',
                  !isMobile && multiStore && isActive && 'outline outline-2 -outline-offset-2 outline-brand',
                )}
              >
                {multiStore ? (
                  <div className="flex flex-row items-center justify-between gap-3 px-0 pb-1 pt-4">
                    <h2 className="truncate text-body font-bold text-ink">{row.storeName}</h2>
                    {isActive ? (
                      <span className="shrink-0 rounded-pill bg-brand-soft px-3 py-1 text-micro font-bold text-brand">
                        {t('summary.title')}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveCart(row.id)}
                        className="shrink-0 text-label font-semibold text-brand hover:underline"
                      >
                        {t('cta.checkout')}
                      </button>
                    )}
                  </div>
                ) : null}

                <ul className={cn('flex w-full flex-col', isMobile && 'gap-4')}>
                  {lines.map((line, index) => (
                    <CartLineRow
                      key={line.id}
                      line={line}
                      storeName={row.storeName}
                      variant={isMobile ? 'card' : 'row'}
                      divided={!isMobile && index > 0}
                      locked={isActive && calc.data?.isStoreClosed === true}
                    />
                  ))}
                </ul>
              </section>
            );
          })}

          {/* The demo restaurant groups sit in the same column as the store groups. */}
          {restaurantSections}
        </div>

        {isMobile ? null : <div className="w-full lg:w-[420px] lg:shrink-0">{summary}</div>}
      </div>

      {/* Mobile: the summary is the sticky bottom bar (the export's `Summary` + `Checkout CTA`). */}
      {isMobile ? (
        <div className="sticky bottom-0 z-10 -mx-5 border-t border-line bg-bg px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4">
          {summary}
        </div>
      ) : null}

      <PromoSheet
        open={sheet === 'promo'}
        onClose={closeSheet}
        calc={calc.data}
        calcPending={calc.isFetching}
      />
      <DeliveryTimeSheet open={sheet === 'time'} onClose={closeSheet} estimate={estimate} />
      <PaymentMethodSheet open={sheet === 'payment'} onClose={closeSheet} />
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex min-w-0 flex-col gap-1.5">
      <h1 className="text-h1-app font-extrabold text-ink">{title}</h1>
      {subtitle ? <p className="text-body text-ink2">{subtitle}</p> : null}
    </header>
  );
}
