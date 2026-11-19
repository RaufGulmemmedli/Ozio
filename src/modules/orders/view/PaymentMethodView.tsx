'use client';

/**
 * OD1 · `/checkout/payment` — "Ödəniş üsulu" (`app-payment-method.html` `u8OJcl`).
 *
 * Left column (flex-1): "SAXLANILMIŞ KARTLAR" (13/700/+1 `ink3`) → saved-card rows → "Yeni kart
 * əlavə et" (72 high soft row) → "QAPIDA ÖDƏNİŞ" → Nağd / Kartla qapıda.
 * Right column (380): the dark summary card with the server's breakdown and the confirm CTA.
 *
 * **The pricing comes from the cart module (M5), not from here.** `useCheckoutCalc` /
 * `useCheckoutSelection` / `useCartSelection` / `useDeliveryAddress` own `POST v2/orders/checkout`
 * (verified), its 250 ms debounce, its one-lane queue (the 429 rule) and its `expires_at` refresh —
 * this screen only chooses a method and reads the result. The selection store is shared with the
 * cart screen, so what the customer picked there is what is priced and ordered here.
 *
 * Imported from `@/modules/cart/hooks` because M5's `index.ts` does not re-export them yet.
 * TODO(cart): switch to `from '@/modules/cart'` once those four names are on its public surface.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  useActiveCart,
  useCart,
  useCartSelection,
  useCheckoutCalc,
  useCheckoutSelection,
  useDeliveryAddress,
} from '@/modules/cart/hooks';
import { useFailureMessage, useFormat, useRouter } from '@/core/i18n';
import { paths } from '@/core/routes';
import { Banknote, CreditCard, Plus, Wallet } from '@/shared/lucide';
import { Button, RadioGroup, toast } from '@/shared/ui';
import { ErrorState, InlineNotice } from '@/shared/states';
import { PageHeader } from '@/shared/layout';
import { ActionLink } from '../components/action-link';
import { MethodTile, PaymentMethodRow } from '../components/payment-method-row';
import { TotalsCard, type TotalsRow } from '../components/totals-card';
import { PaymentMethodSkeleton } from './PaymentMethodSkeleton';
import { usePlaceOrder } from '../hooks/use-place-order';
import { useRefetchCardsOnReturn, useSavedCards } from '../hooks/use-saved-cards';
import { cardLast4Mask, isCardExpired, type SavedCard } from '../data/models/payment-card';
import { moneyState } from '../data/models/order-status';
import type { PlaceOrderInput } from '../data/models/place-order';

/**
 * The row values of the radio group. The design's third option, "Kartla qapıda", has **no known
 * wire value** (screens/app-orders.md "Design defects"), so it is kept as a UI-only variant of
 * `cash` — the money changes hands at the door either way. Confirm with the backend before
 * relying on it.
 */
type RowValue = 'cash' | 'cardAtDoor' | `card:${number}`;

export function PaymentMethodView() {
  const t = useTranslations('payment');
  const tOrders = useTranslations('orders');
  const f = useFormat();
  const router = useRouter();
  const failureMessage = useFailureMessage();

  const cart = useCart();
  const activeCart = useActiveCart(cart.data);
  const cartId = activeCart?.id ?? null;

  const selection = useCartSelection();
  const checkoutSelection = useCheckoutSelection(cartId);
  const calcQuery = useCheckoutCalc({ cartId });
  const delivery = useDeliveryAddress();

  const cards = useSavedCards();
  useRefetchCardsOnReturn();
  const cardList = cards.data ?? [];

  const place = usePlaceOrder();

  const calc = calcQuery.data;
  const hasPoint = checkoutSelection.latitude !== null && checkoutSelection.longitude !== null;

  // "Kartla qapıda" is `cash` on the wire, so it is distinguished only by this local flag — a
  // sentinel card id would be sent to the verified checkout endpoint, which must never happen.
  const [atDoorCard, setAtDoorCard] = useState(false);
  const rowValue: RowValue =
    selection.paymentMethod === 'card' && selection.paymentCardId !== null
      ? `card:${selection.paymentCardId}`
      : atDoorCard
        ? 'cardAtDoor'
        : 'cash';

  const choose = (value: string) => {
    if (value.startsWith('card:')) {
      const id = Number.parseInt(value.slice(5), 10);
      setAtDoorCard(false);
      selection.setPaymentMethod('card', Number.isFinite(id) ? id : null);
      return;
    }
    setAtDoorCard(value === 'cardAtDoor');
    selection.setPaymentMethod('cash', null);
  };

  const placeInput: PlaceOrderInput | null =
    cartId === null || !hasPoint
      ? null
      : {
          cartId,
          checkoutId: calc?.id ?? null,
          delivery: {
            latitude: checkoutSelection.latitude as number,
            longitude: checkoutSelection.longitude as number,
            addressId: checkoutSelection.addressId,
          },
          method: selection.paymentMethod === 'card' ? 'card' : atDoorCard ? 'cardAtDoor' : 'cash',
          cardId: selection.paymentMethod === 'card' ? checkoutSelection.paymentCardId : null,
          promoCode: checkoutSelection.promoCode,
          useBonus: checkoutSelection.useBonus,
          tip: checkoutSelection.courierTip,
          note: null,
        };

  const rows: TotalsRow[] = calc
    ? [
        { id: 'items', label: t('summary.items'), value: calc.breakdown.itemTotalPrice },
        {
          id: 'delivery',
          label: t('summary.delivery'),
          value: calc.breakdown.deliveryFee,
          text: calc.delivery.isFree ? t('summary.free') : undefined,
        },
        { id: 'service', label: t('summary.service'), value: calc.breakdown.serviceFee },
        { id: 'packet', label: t('summary.packet'), value: calc.breakdown.packetFee },
        { id: 'minimum', label: t('summary.minimum'), value: calc.breakdown.minimumOrderFee },
        { id: 'tip', label: tOrders('totals.tip'), value: calc.breakdown.courierTip },
        {
          id: 'discount',
          label: t('summary.discount'),
          value: calc.breakdown.totalDiscount,
          negative: true,
        },
        {
          id: 'bonus',
          label: t('summary.bonus'),
          value: calc.breakdown.bonusPayment,
          negative: true,
        },
      ]
    : [];

  // The server priced it (`amount` present) and did not veto it. `0` is a legitimate amount when
  // bonus or a promo covers everything, so only `null` blocks the confirm.
  const confirmable =
    placeInput !== null &&
    !!calc &&
    calc.amount !== null &&
    !!calc.id &&
    !calc.purchasingDisabled &&
    !calc.isStoreClosed &&
    !calc.delivery.outOfZone &&
    !calcQuery.isFetching;

  const confirm = () => {
    if (!placeInput || !calc?.id) return;
    place.mutate(
      { ...placeInput, checkoutId: calc.id },
      {
        onSuccess: (result) => {
          if (result.kind === 'placed' && result.orderId !== null) {
            // A card payment may hand over to the bank page; the order is re-read on return.
            if (result.redirectUrl) {
              window.location.assign(result.redirectUrl);
              return;
            }
            if (moneyState(result.paymentStatus) === 'failed') {
              router.push(paths.orderFailed(result.orderId));
              return;
            }
            router.push(paths.orderSuccess(result.orderId));
            return;
          }
          // Outcome unknown: never claim success. The list is the only place that can show the
          // truth once the server catches up.
          toast.info({ title: t('place.unknownTitle'), body: t('place.unknownBody') });
          router.push(paths.orders);
        },
        onError: (failure) => {
          toast.error({ title: t('place.failedTitle'), body: failureMessage(failure) });
        },
      },
    );
  };

  const blocker: 'cart' | 'address' | null =
    cart.isPending || delivery.isPending ? null : cartId === null ? 'cart' : !hasPoint ? 'address' : null;

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        backHref={paths.cart}
        backLabel={t('backToCart')}
      />

      {blocker ? (
        <InlineNotice
          tone="warning"
          multiline
          title={t(`blocked.${blocker}.title`)}
          body={t(`blocked.${blocker}.body`)}
          actionLabel={t(`blocked.${blocker}.action`)}
          actionHref={blocker === 'cart' ? paths.cart : paths.addresses}
        />
      ) : null}

      {cards.isPending || cart.isPending ? (
        <PaymentMethodSkeleton />
      ) : (
        <div className="flex w-full flex-col gap-6 lg:flex-row">
          <RadioGroup
            value={rowValue}
            onValueChange={choose}
            aria-label={t('title')}
            className="flex min-w-0 flex-1 flex-col gap-3"
          >
            <h2 className="m-0 text-caption font-bold tracking-[0.077em] text-ink3">
              {t('savedCards')}
            </h2>

            {cards.isError ? (
              <ErrorState
                compact
                failure={cards.error}
                message={cards.error ? failureMessage(cards.error) : undefined}
                retryLabel={t('retry')}
                onRetry={() => cards.refetch()}
              />
            ) : null}

            {cardList.map((card) => (
              <SavedCardRow
                key={card.id}
                card={card}
                selected={rowValue === `card:${card.id}`}
              />
            ))}

            <ActionLink
              href={paths.checkoutAddCard}
              variant="soft"
              size="xl"
              fullWidth
              leadingIcon={<Plus size={20} aria-hidden="true" />}
              className="h-[72px] rounded-lg font-bold"
            >
              {t('addCard')}
            </ActionLink>

            <h2 className="m-0 mt-3 text-caption font-bold tracking-[0.077em] text-ink3">
              {t('atDoor')}
            </h2>

            <PaymentMethodRow
              value="cash"
              selected={rowValue === 'cash'}
              tile={
                <MethodTile>
                  <Banknote size={22} aria-hidden="true" />
                </MethodTile>
              }
              title={t('cash.title')}
              subtitle={t('cash.subtitle')}
            />
            <PaymentMethodRow
              value="cardAtDoor"
              selected={rowValue === 'cardAtDoor'}
              tile={
                <MethodTile>
                  <Wallet size={22} aria-hidden="true" />
                </MethodTile>
              }
              title={t('cardAtDoor.title')}
              subtitle={t('cardAtDoor.subtitle')}
            />
          </RadioGroup>

          <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[380px]">
            {calcQuery.isPending && cartId !== null ? (
              <PaymentMethodSkeleton />
            ) : (
              <>
                {calcQuery.isError && !calc ? (
                  <ErrorState
                    compact
                    failure={calcQuery.error}
                    message={calcQuery.error ? failureMessage(calcQuery.error) : undefined}
                    retryLabel={t('retry')}
                    onRetry={() => calcQuery.refetch()}
                  />
                ) : null}

                {calc ? (
                  <TotalsCard
                    caption={t('summary.title')}
                    amount={calc.amount}
                    rows={rows}
                    cashback={
                      calc.earnedBonus
                        ? { text: t('summary.cashback', { amount: f.money(calc.earnedBonus) }) }
                        : null
                    }
                  >
                    <Button
                      variant="white"
                      size="xl"
                      fullWidth
                      onClick={confirm}
                      disabled={!confirmable}
                      loading={place.isPending}
                    >
                      {t('confirm')}
                    </Button>
                  </TotalsCard>
                ) : null}

                {calcQuery.isError && calc ? (
                  <InlineNotice
                    tone="error"
                    multiline
                    title={t('recalcFailed.title')}
                    body={t('recalcFailed.body')}
                    actionLabel={t('retry')}
                    onAction={() => calcQuery.refetch()}
                  />
                ) : null}

                {calc?.purchasingDisabledReasons.length ? (
                  <InlineNotice
                    tone="warning"
                    multiline
                    title={t('blockedByServer')}
                    // Server wording, joined by newline — never reworded.
                    body={calc.purchasingDisabledReasons.join('\n')}
                  />
                ) : null}

                {calc?.isStoreClosed ? (
                  <InlineNotice tone="warning" multiline body={tOrders('storeClosed')} />
                ) : null}

                {calc?.delivery.outOfZone ? (
                  <InlineNotice tone="warning" multiline body={t('outOfZone')} />
                ) : null}
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

/** One saved-card row. Expired cards are disabled: MM/YY in the past cannot be charged. */
function SavedCardRow({ card, selected }: { card: SavedCard; selected: boolean }) {
  const t = useTranslations('payment');
  const expired = isCardExpired(card);

  const brandLabel =
    card.brand === 'unknown' ? (card.brandRaw ?? t('card.generic')) : t(`card.brand.${card.brand}`);

  const subtitle = expired
    ? t('card.expired')
    : [
        card.expiry ? t('card.expiry', { date: card.expiry }) : null,
        card.isDefault ? t('card.default') : null,
      ]
        .filter(Boolean)
        .join(' · ');

  return (
    <PaymentMethodRow
      value={`card:${card.id}`}
      selected={selected}
      disabled={expired}
      tile={
        card.brand === 'visa' || card.brand === 'mastercard' ? (
          <MethodTile tone={card.brand}>{card.brand === 'visa' ? 'VISA' : 'MC'}</MethodTile>
        ) : (
          <MethodTile>
            <CreditCard size={22} aria-hidden="true" />
          </MethodTile>
        )
      }
      title={`${brandLabel} ${cardLast4Mask(card.last4)}`}
      subtitle={subtitle || null}
    />
  );
}
