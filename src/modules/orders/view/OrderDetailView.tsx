'use client';

/**
 * OD9 · `/orders/[id]` — "Sifariş detalı" (`app-order-detail.html` `x32Akh`).
 *
 * Left: "Məhsullar" + "Sifarişin gedişatı" (the timeline).
 * Right (400): the dark totals card, the info rows (payment / address / delivery time / courier)
 * and the "Sifarişi qiymətləndir" CTA, which opens the rating **modal** (the rating is a state, not
 * a route).
 *
 * Affordances in the export that have **no endpoint** and are therefore not wired:
 *  - "Təkrar sifariş" — there is no reorder endpoint; it would be sequential `carts/action` adds,
 *    which belong to the cart module. Rendered disabled with an explanatory tooltip.
 *  - "Qaimə yüklə" / the invoice row — no receipt endpoint; `/orders/[id]/receipt` is flag-gated
 *    (`rewards`) and owned by another module, so nothing is rendered here.
 *  - A cancel action — no cancel endpoint exists; it is not drawn on this screen either.
 *
 * `GET v2/orders/{id}`'s success shape is unverified; the only verified behaviour is the 404
 * "Order not found", which sends the user back to `/orders` with a toast.
 */
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFailureMessage, useFormat, useRouter } from '@/core/i18n';
import { paths } from '@/core/routes';
import { Bike, CreditCard, MapPin, Package, Timer } from '@/shared/lucide';
import { Button, Card, Tooltip, toast } from '@/shared/ui';
import { ErrorState } from '@/shared/states';
import { PageHeader } from '@/shared/layout';
import { ActionLink } from '../components/action-link';
import { InfoRows, type InfoRow } from '../components/info-rows';
import { OrderItemsCard } from '../components/order-items-card';
import { OrderRatingModal } from '../components/order-rating-modal';
import { OrderStatusBadge } from '../components/order-status-badge';
import { OrderStepList } from '../components/order-step-list';
import { TotalsCard, type TotalsRow } from '../components/totals-card';
import { OrderDetailSkeleton } from './OrderDetailSkeleton';
import { isOrderNotFound, useOrder } from '../hooks/use-order';
import { orderSteps } from '../data/orders.repository';
import { isTerminalStatus } from '../data/models/order-status';
import { formatOrderNo } from '../orders.format';

export interface OrderDetailViewProps {
  orderId: string;
}

export function OrderDetailView({ orderId }: OrderDetailViewProps) {
  const t = useTranslations('orders');
  const f = useFormat();
  const router = useRouter();
  const failureMessage = useFailureMessage();
  const query = useOrder(orderId);
  const [rating, setRating] = useState(false);

  const notFound = isOrderNotFound(query.error);

  useEffect(() => {
    if (!notFound) return;
    toast.error({ title: t('notFound.title'), body: t('notFound.body') });
    router.replace(paths.orders);
  }, [notFound, router, t]);

  if (query.isPending) {
    return (
      <>
        <PageHeader title={t('detail.title')} backHref={paths.orders} backLabel={t('title')} />
        <OrderDetailSkeleton />
      </>
    );
  }

  if (query.isError || !query.data) {
    return (
      <>
        <PageHeader title={t('detail.title')} backHref={paths.orders} backLabel={t('title')} />
        <ErrorState
          failure={query.error}
          title={notFound ? t('notFound.title') : t('error.title')}
          message={notFound ? t('notFound.body') : query.error ? failureMessage(query.error) : undefined}
          retryLabel={t('error.retry')}
          onRetry={notFound ? undefined : () => query.refetch()}
          secondaryAction={
            <ActionLink href={paths.orders} variant="soft">
              {t('title')}
            </ActionLink>
          }
        />
      </>
    );
  }

  const order = query.data;
  const subtitleParts = [
    order.createdAt ? `${f.date(order.createdAt, 'long')}, ${f.date(order.createdAt, 'time')}` : null,
    order.storeName,
  ].filter(Boolean) as string[];

  const totalsRows: TotalsRow[] = [
    { id: 'items', label: t('totals.items'), value: order.totals.itemsTotal },
    {
      id: 'delivery',
      label: t('totals.delivery'),
      value: order.totals.deliveryFee,
      text: order.delivery.isFree ? t('totals.free') : undefined,
    },
    { id: 'service', label: t('totals.service'), value: order.totals.serviceFee },
    { id: 'packet', label: t('totals.packet'), value: order.totals.packetFee },
    { id: 'tip', label: t('totals.tip'), value: order.totals.tip },
    { id: 'discount', label: t('totals.discount'), value: order.totals.discount, negative: true },
    { id: 'bonus', label: t('totals.bonus'), value: order.totals.bonusPayment, negative: true },
  ];

  const infoRows: InfoRow[] = [
    {
      id: 'payment',
      icon: CreditCard,
      label: t('info.payment'),
      value: paymentLabel(order.payment.cardBrand, order.payment.maskedCardNumber, order.payment.method),
    },
    { id: 'address', icon: MapPin, label: t('info.address'), value: order.delivery.address },
    {
      id: 'time',
      icon: Timer,
      label: t('info.deliveryTime'),
      value: order.delivery.time
        ? `${f.date(order.delivery.time, 'dayMonth')}, ${f.date(order.delivery.time, 'time')}`
        : null,
    },
    {
      id: 'courier',
      icon: Bike,
      label: t('info.courier'),
      value: order.courier.name
        ? [order.courier.name, order.courier.rating !== null ? `${order.courier.rating} ★` : null]
            .filter(Boolean)
            .join(' · ')
        : null,
    },
  ];

  const canRate = isTerminalStatus(order.status) && order.status === 'delivered';

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title={`${t('detail.titlePrefix')} ${formatOrderNo(order.id)}`}
        subtitle={
          <span className="flex flex-wrap items-center gap-3">
            <OrderStatusBadge status={order.status} />
            {subtitleParts.length > 0 ? <span>{subtitleParts.join(' · ')}</span> : null}
          </span>
        }
        backHref={paths.orders}
        backLabel={t('title')}
        actions={
          // No reorder endpoint exists (api/orders.md). Kept visible but disabled, with the reason.
          // TODO(cart): once `@/modules/cart` exposes its add-to-cart action, reorder can be built
          // as sequential `POST v2/carts/action` calls — there is still no single reorder endpoint.
          <Tooltip label={t('actions.reorderUnavailable')}>
            <span>
              <Button variant="soft" size="xl" disabled>
                {t('actions.reorder')}
              </Button>
            </span>
          </Tooltip>
        }
      />

      <div className="flex w-full flex-col gap-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {order.items.length > 0 ? (
            <OrderItemsCard items={order.items} />
          ) : (
            <Card tone="surface" radius="xl" className="flex items-center gap-4 p-7">
              <span
                aria-hidden="true"
                className="flex size-11 items-center justify-center rounded-pill bg-surface2 text-ink"
              >
                <Package size={20} />
              </span>
              <span className="text-body-sm text-ink2">{t('items.none')}</span>
            </Card>
          )}

          <Card tone="surface" radius="xl" className="flex w-full flex-col gap-5 p-7">
            <h2 className="m-0 text-[22px] font-extrabold text-ink">{t('timeline.title')}</h2>
            <OrderStepList steps={orderSteps(order.status, order.history)} variant="history" />
            {order.cancelingReason ? (
              <p className="m-0 text-body-sm text-ink2">{order.cancelingReason}</p>
            ) : null}
          </Card>
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[400px]">
          <TotalsCard
            caption={t('totals.paid')}
            amount={order.totals.payable}
            rows={totalsRows}
            amountClassName="text-[48px]"
            cashback={
              order.totals.bonusEarned
                ? { text: t('totals.cashbackAdded', { amount: f.money(order.totals.bonusEarned) }) }
                : null
            }
          />

          <InfoRows rows={infoRows} />

          {canRate ? (
            <Button variant="brand" size="xl" fullWidth onClick={() => setRating(true)}>
              {order.rating ? t('rating.editCta') : t('rating.cta')}
            </Button>
          ) : null}

          {!isTerminalStatus(order.status) ? (
            <ActionLink href={paths.orderTrack(order.id)} fullWidth>
              {t('tracker.track')}
            </ActionLink>
          ) : null}
        </aside>
      </div>

      {rating ? (
        <OrderRatingModal open={rating} onOpenChange={setRating} order={order} />
      ) : null}
    </div>
  );
}

/** "Visa •••• 4821", or the raw method when the card fields are missing. */
function paymentLabel(
  brand: string | null,
  masked: string | null,
  method: string | null,
): string | null {
  const digits = masked?.replace(/\D/g, '') ?? '';
  const last4 = digits.length >= 4 ? digits.slice(-4) : null;
  if (brand && last4) return `${brand} •••• ${last4}`;
  if (last4) return `•••• ${last4}`;
  return brand ?? method;
}
