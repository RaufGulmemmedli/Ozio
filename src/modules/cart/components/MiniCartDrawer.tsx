'use client';

/**
 * `<MiniCartDrawer>` — the header cart drawer (`app-catalog/app-market-mini-cart.html`, node
 * `bbMm5`). **Not a route**: the app shell mounts it once and the cart icon opens it through
 * `useCartDrawer()`.
 *
 * Export values: panel 460 wide, `bg` fill, radius 36 on the leading corners, padding 32/28,
 * gap 20; header "Səbət" 28/800 with a `brand-soft` count pill; the free-delivery progress card
 * (`surface`, radius 24, padding 18, 8px bar); item rows separated by a 1px `line`, thumb 72
 * radius 20, name 15/700, a 36-high stepper and the line price 16/800; then the summary rows and
 * the `brand` "Sifarişi rəsmiləşdir" CTA (58 high) over a ghost "Alış-verişə davam et".
 *
 * Money rule: the item total is the cart's own `totals.price`; delivery, the earned bonus and the
 * total come from `orders/checkout` for the cart being priced, and while that is pending the
 * summary is a skeleton — never a guess. `v2/carts` carries no payable amount at all.
 */
import { useTranslations } from 'next-intl';

import { Link } from '@/core/i18n';
import { paths } from '@/core/routes';
import { ArrowRight, ShoppingCart, X } from '@/shared/lucide';
import { ProductImage } from '@/shared/media';
import { CartRowSkeleton, Shimmer, SummaryCardSkeleton } from '@/shared/skeleton';
import { EmptyState, ErrorState } from '@/shared/states';
import { Button, Drawer, IconButton, Price } from '@/shared/ui';
import { useFailureMessage, useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';

import { fromCartQty } from '../data/cart.repository';
import { orderedLines, type Cart, type CartLine } from '../data/models/cart';
import { useActiveCart, useCart } from '../hooks/use-cart';
import { useCartDrawer } from '../hooks/use-cart-drawer';
import { useCheckoutCalc } from '../hooks/use-checkout-calc';
import { useQuantityCommit } from '../hooks/use-quantity-commit';
import { CartQuantityStepper } from './CartQuantityStepper';
import { MiniCartTotals } from './SummaryTotals';

function MiniCartRow({ line, divided }: { line: CartLine; divided: boolean }) {
  const t = useTranslations('cart');
  const { kg, number } = useFormat();
  const commit = useQuantityCommit({
    storeId: line.storeId,
    productId: line.id,
    serverQty: line.quantity,
  });

  return (
    <li
      className={cn('flex w-full flex-row items-center gap-[14px] py-4', divided && 'border-t border-line')}
    >
      <div className="size-[72px] shrink-0">
        <ProductImage
          src={line.imageUrl}
          alt={line.name}
          ratio="1/1"
          radius="lg"
          sizes="72px"
          fallbackIconSize={28}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
        <p className="w-full truncate text-body-sm font-bold text-ink">{line.name}</p>
        <CartQuantityStepper
          product={line}
          value={commit.value}
          onChange={commit.setQuantity}
          loading={commit.isPending}
          size="compact"
        />
        <span className="sr-only">
          {t('line.quantityAnnouncement', {
            value: line.soldByGram ? kg(fromCartQty(line, commit.value)) : number(commit.value),
          })}
        </span>
      </div>

      <Price value={line.linePrice} size="row" className="text-body font-extrabold" />
    </li>
  );
}

function StoreGroup({ cart, first }: { cart: Cart; first: boolean }) {
  const lines = orderedLines(cart);
  if (lines.length === 0) return null;

  return (
    <li className={cn('w-full', !first && 'pt-2')}>
      <p className="pb-1 text-micro font-bold uppercase tracking-[0.08em] text-ink3">
        {cart.storeName}
      </p>
      <ul className="flex w-full flex-col">
        {lines.map((line, index) => (
          <MiniCartRow key={line.id} line={line} divided={index > 0} />
        ))}
      </ul>
    </li>
  );
}

export function MiniCartDrawer() {
  const t = useTranslations('cart');
  const tc = useTranslations('common');
  const failureMessage = useFailureMessage();
  const isOpen = useCartDrawer((state) => state.isOpen);
  const setOpen = useCartDrawer((state) => state.setOpen);
  const close = useCartDrawer((state) => state.close);

  const cart = useCart();
  const bundle = cart.data;
  const active = useActiveCart(bundle);
  // The drawer is mounted by the shell on every page, so the calculation is asked for only while
  // it is open — otherwise every page view with a cart would POST `orders/checkout`.
  const calc = useCheckoutCalc({ cartId: isOpen ? (active?.id ?? null) : null });

  const isEmpty = !!bundle && bundle.itemCount === 0;

  return (
    <Drawer
      open={isOpen}
      onOpenChange={setOpen}
      title={t('drawer.title')}
      titleHidden
      width={460}
      closeLabel={tc('close')}
      // `bg` fill (the cards inside are `surface`) and the export's 36px leading corners.
      className="bg-bg md:rounded-l-bento"
      bodyClassName="px-7 py-0"
      footerClassName="bg-bg px-7"
      header={
        <div className="flex flex-row items-center justify-between gap-3 px-7 pb-5 pt-6">
          <div className="flex min-w-0 flex-row items-center gap-3">
            <h2 className="truncate text-[28px] font-extrabold leading-tight text-ink">
              {t('drawer.title')}
            </h2>
            {bundle && bundle.itemCount > 0 ? (
              <span className="flex h-7 shrink-0 items-center rounded-pill bg-brand-soft px-3 text-caption font-bold text-brand">
                {t('count', { count: bundle.itemCount })}
              </span>
            ) : null}
          </div>
          <IconButton aria-label={tc('close')} tone="surface" onClick={close}>
            <X aria-hidden="true" />
          </IconButton>
        </div>
      }
      footer={
        isEmpty ? null : (
          <div className="flex w-full flex-col gap-3">
            {calc.isError ? (
              <p role="alert" className="text-caption font-medium text-ink2">
                {failureMessage(calc.error)}
              </p>
            ) : calc.data ? (
              <MiniCartTotals calc={calc.data} />
            ) : (
              <Shimmer className="w-full">
                <SummaryCardSkeleton rows={3} cta={false} />
              </Shimmer>
            )}

            <Button
              as="a"
              href={paths.cart}
              variant="brand"
              size="2xl"
              fullWidth
              trailingIcon={<ArrowRight aria-hidden="true" />}
              onClick={close}
            >
              {t('cta.checkout')}
            </Button>

            <Button variant="ghost" size="lg" fullWidth className="border-transparent" onClick={close}>
              {t('cta.continueShopping')}
            </Button>
          </div>
        )
      }
    >
      {cart.isError ? (
        <ErrorState
          compact
          failure={cart.error}
          title={t('error.title')}
          message={failureMessage(cart.error)}
          onRetry={() => void cart.refetch()}
          retryLabel={tc('retry')}
          className="py-10"
        />
      ) : cart.isPending ? (
        <Shimmer className="flex w-full flex-col py-4" label={tc('loading')}>
          {[0, 1, 2].map((index) => (
            <CartRowSkeleton key={index} index={index} />
          ))}
        </Shimmer>
      ) : isEmpty ? (
        <EmptyState
          compact
          tone="brand"
          icon={ShoppingCart}
          title={t('empty.title')}
          body={t('empty.body')}
          action={
            <Link
              href={paths.market}
              onClick={close}
              className="inline-flex h-12 items-center rounded-pill bg-brand px-7 text-body font-semibold text-on-cta"
            >
              {t('empty.cta')}
            </Link>
          }
          className="py-10"
        />
      ) : (
        <ul className="flex w-full flex-col pb-2">
          {(bundle?.carts ?? []).map((row, index) => (
            <StoreGroup key={row.id} cart={row} first={index === 0} />
          ))}
        </ul>
      )}
    </Drawer>
  );
}
