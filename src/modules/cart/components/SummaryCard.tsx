'use client';

/**
 * The "Ödəniş" summary card (`app-core/app-cart.html` node `Summary`): `surface`, radius 28,
 * padding 28, gap 20, 420 wide beside the item column.
 *
 * It is the whole money surface of the screen, and it is driven **entirely** by
 * `POST v2/orders/checkout`:
 * - while the calculation is pending → `<SummaryCardSkeleton>` (never a guessed number);
 * - when it fails → an inline error with retry;
 * - `is_store_closed` → `<ClosedBanner>` and a disabled CTA;
 * - `delivery_details.out_of_zone` (or a `stores/search` row with no `delivery_fee`) →
 *   `<OutOfZoneNotice>`;
 * - `cart_updated` / `updated_items[]` → `<OutOfStockNotice>` per item, with a remove button;
 * - `purchasing_disabled` → the CTA is disabled and the **server's own reason text** is shown.
 *
 * Changing the address, payment method, bonus switch, promo code or tip re-runs the calculation —
 * serialised, see `hooks/use-checkout-calc.ts`.
 */
import { useTranslations } from 'next-intl';

import { useFailureMessage, useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import type { Failure } from '@/core/network';
import { paths } from '@/core/routes';
import { CreditCard, MapPin, Sparkles, Ticket, Timer } from '@/shared/lucide';
import { SummaryCardSkeleton } from '@/shared/skeleton';
import { ClosedBanner, ErrorState, OutOfStockNotice, OutOfZoneNotice, WarningNotice } from '@/shared/states';
import { Button, Switch } from '@/shared/ui';

import type { Cart } from '../data/models/cart';
import { canConfirm, outOfStockItems, type CheckoutCalc } from '../data/models/checkout';
import type { DeliveryAddress, StoreDeliveryEstimate } from '../data/models/delivery';
import { useCartSelection } from '../hooks/use-cart-selection';
import { useCartAction } from '../hooks/use-cart-action';
import { DeliveryTimeValue } from './DeliveryTimeSheet';
import { SelectorRow } from './SelectorRow';
import { SummaryTotals } from './SummaryTotals';

export interface SummaryCardProps {
  cart: Cart;
  /** Number of per-store carts — the card says which store it prices when there is more than one. */
  storeCount: number;
  itemCount: number;
  calc: CheckoutCalc | undefined;
  calcPending: boolean;
  calcFailure: Failure | null;
  onRetryCalc: () => void;
  address: DeliveryAddress | null;
  addressPending: boolean;
  estimate: StoreDeliveryEstimate | null;
  onOpenPromo: () => void;
  onOpenTime: () => void;
  onOpenPayment: () => void;
  variant?: 'panel' | 'mobile';
  className?: string;
}

export function SummaryCard({
  cart,
  storeCount,
  itemCount,
  calc,
  calcPending,
  calcFailure,
  onRetryCalc,
  address,
  addressPending,
  estimate,
  onOpenPromo,
  onOpenTime,
  onOpenPayment,
  variant = 'panel',
  className,
}: SummaryCardProps) {
  const t = useTranslations('cart');
  const tc = useTranslations('common');
  const failureMessage = useFailureMessage();
  const { money } = useFormat();
  const selection = useCartSelection();
  const action = useCartAction();

  const outOfZone = calc?.delivery.outOfZone === true || estimate?.outOfZone === true;
  const missingItems = outOfStockItems(calc);
  const confirmable = canConfirm(calc) && !outOfZone;

  const paymentValue =
    selection.paymentMethod === 'cash' ? t('summary.payment.cash') : t('summary.payment.card');

  const card = cn(
    'flex w-full flex-col gap-5',
    variant === 'panel' && 'rounded-xl bg-surface p-7',
    variant === 'mobile' && 'rounded-card bg-surface p-5',
    className,
  );

  return (
    <section className={card} aria-labelledby="cart-summary-title">
      <header className="flex flex-col gap-1">
        <h2 id="cart-summary-title" className="text-[22px] font-extrabold leading-tight text-ink">
          {t('summary.title')}
        </h2>
        {storeCount > 1 ? (
          <p className="text-micro font-semibold text-ink3">
            {t('summary.forStore', { store: cart.storeName })}
          </p>
        ) : null}
      </header>

      <SelectorRow
        icon={MapPin}
        label={t('summary.address.label')}
        value={
          addressPending ? '…' : (address?.line ?? t('summary.address.empty'))
        }
        tone={address ? 'default' : 'attention'}
        // TODO(address): agent M9 owns `/addresses`; this is the handoff to its picker.
        href={paths.addresses}
      />

      <SelectorRow
        icon={Timer}
        label={t('summary.time.label')}
        value={<DeliveryTimeValue choice={selection.deliveryTime} estimate={estimate} />}
        onClick={onOpenTime}
      />

      <SelectorRow
        icon={CreditCard}
        label={t('summary.payment.label')}
        value={paymentValue}
        onClick={onOpenPayment}
      />

      <button
        type="button"
        onClick={onOpenPromo}
        className={cn(
          'flex h-[52px] w-full flex-row items-center gap-[10px] rounded-md bg-bg px-[18px]',
          'outline outline-[1.5px] -outline-offset-[0.75px] outline-line',
          'transition-colors duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)] hover:bg-surface2',
        )}
      >
        <Ticket size={20} aria-hidden="true" className="shrink-0 text-ink3" />
        {selection.promoCode ? (
          <span className="truncate text-body-sm font-bold tracking-[1px] text-ink">
            {selection.promoCode}
          </span>
        ) : (
          <span className="truncate text-body-sm text-ink3">{t('summary.promo.placeholder')}</span>
        )}
      </button>

      <div className="flex w-full flex-row items-center gap-3 rounded-[16px] bg-brand-soft p-4">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-body-sm font-bold text-ink">{t('summary.bonus.title')}</p>
          <p className="text-caption text-ink2">
            {/* TODO(profile): the bonus balance lives in `GET v1/profile/me` (profile module);
                until that hook exists the line shows what the server actually applied. */}
            {calc?.breakdown.bonusPayment ? (
              t('summary.bonus.applied', { amount: money(calc.breakdown.bonusPayment) })
            ) : (
              t('summary.bonus.hint')
            )}
          </p>
        </div>
        <Switch
          checked={selection.useBonus}
          onCheckedChange={selection.setUseBonus}
          aria-label={t('summary.bonus.title')}
        />
      </div>

      {calc?.isStoreClosed ? (
        <ClosedBanner title={t('notice.closed.title')} body={t('notice.closed.body')} />
      ) : null}

      {outOfZone ? (
        <OutOfZoneNotice
          title={t('notice.outOfZone.title')}
          body={t('notice.outOfZone.body')}
          actionLabel={t('notice.outOfZone.action')}
          actionHref={paths.addresses}
        />
      ) : null}

      {calc?.cartUpdated && missingItems.length === 0 ? (
        <WarningNotice body={t('notice.cartUpdated')} />
      ) : null}

      {missingItems.map((item, index) => (
        <OutOfStockNotice
          key={item.id ?? index}
          multiline
          title={t('notice.outOfStock.title')}
          body={
            item.message ??
            t('notice.outOfStock.body', {
              name: item.name ?? cart.lines.find((line) => line.id === item.id)?.name ?? '',
            })
          }
          actionLabel={t('line.remove')}
          onAction={() => {
            const line = cart.lines.find((row) => row.id === item.id);
            if (!line) return;
            action.mutate({
              storeId: line.storeId,
              productId: line.id,
              quantity: line.quantity,
              action: 'remove',
            });
          }}
        />
      ))}

      {calcFailure ? (
        <ErrorState
          compact
          failure={calcFailure}
          title={t('error.summaryTitle')}
          message={failureMessage(calcFailure)}
          onRetry={onRetryCalc}
          retryLabel={tc('retry')}
        />
      ) : calcPending || !calc ? (
        <SummaryCardSkeleton rows={4} />
      ) : (
        <>
          <SummaryTotals
            calc={calc}
            itemCount={variant === 'mobile' ? itemCount : undefined}
            variant={variant === 'mobile' ? 'compact' : 'panel'}
          />

          {/* The server's own wording — never replaced with ours. */}
          {calc.purchasingDisabled && calc.purchasingDisabledReasons.length > 0 ? (
            <p role="alert" className="text-caption font-medium text-brand">
              {calc.purchasingDisabledReasons.join('\n')}
            </p>
          ) : null}

          {!address && !calc.purchasingDisabled ? (
            <p role="status" className="text-caption font-medium text-ink2">
              {t('notice.addressRequired')}
            </p>
          ) : null}

          <Button
            as="a"
            // TODO(orders): agent M6 owns placing the order (`POST v2/orders`, body unverified).
            // The cart hands over to the checkout page; it never places an order itself.
            // `<Button as="a" disabled>` drops the href and blocks pointer events for us.
            href={paths.checkoutPayment}
            variant={variant === 'mobile' ? 'brand' : 'primary'}
            size={variant === 'mobile' ? '2xl' : '3xl'}
            fullWidth
            disabled={!confirmable}
          >
            {variant === 'mobile' && calc.amount !== null
              ? t('cta.confirmWithAmount', { amount: money(calc.amount) })
              : t('cta.confirm')}
          </Button>

          {calc.earnedBonus !== null && calc.earnedBonus > 0 ? (
            <p className="flex w-full flex-row items-center justify-center gap-2 text-caption font-semibold text-ink2">
              <Sparkles size={16} aria-hidden="true" className="shrink-0 text-brand" />
              {t('cashback', { amount: money(calc.earnedBonus) })}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
