'use client';

/**
 * OD6 · `/orders/failed?order=ID` — "Ödəniş alınmadı" (`app-payment-failed.html` `kIvW0`).
 *
 * Left (surface, r36, padding 48): the 88 `brand-soft` alert tile, the 44/800 headline, the lead
 * paragraph, the reason strip (`brand-soft`, r20) with the bank's own wording, "NƏ ETMƏK OLAR?" and
 * the three actions — retry (back to `/checkout/payment`), another card, pay cash.
 * Right (400, block, r36): "Səbətin saxlanıldı" with the amount, item thumbs, address, delivery and
 * item count, plus the support line.
 *
 * The reason text comes from the order's payment fields, which are **unverified**: when the server
 * sends no wording, the generic sentence is shown rather than an invented bank message. The money
 * state itself is read through `moneyState()` (substring matching; never assume paid).
 */
import { useTranslations } from 'next-intl';
import { useFailureMessage, useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { CircleAlert, LifeBuoy, TriangleAlert } from '@/shared/lucide';
import { Card } from '@/shared/ui';
import { EmptyState, ErrorState } from '@/shared/states';
import { ActionLink } from '../components/action-link';
import { ThumbStack } from '../components/thumb-stack';
import { OrderDetailSkeleton } from './OrderDetailSkeleton';
import { useOrder } from '../hooks/use-order';
import { itemCounts } from '../data/models/order-detail';
import { moneyState } from '../data/models/order-status';

export interface OrderFailedViewProps {
  orderId: string | null;
}

/** The support number drawn on the screen (`app-payment-failed.html` `ijsBe`). */
const SUPPORT_PHONE = '1230';

export function OrderFailedView({ orderId }: OrderFailedViewProps) {
  const t = useTranslations('orders');
  const tp = useTranslations('payment');
  const f = useFormat();
  const failureMessage = useFailureMessage();
  const query = useOrder(orderId);

  const order = query.data ?? null;

  if (orderId && query.isPending) return <OrderDetailSkeleton />;

  if (orderId && query.isError && !order) {
    return (
      <ErrorState
        failure={query.error}
        title={t('error.title')}
        message={query.error ? failureMessage(query.error) : undefined}
        retryLabel={t('error.retry')}
        onRetry={() => query.refetch()}
        secondaryAction={
          <ActionLink href={paths.checkoutPayment} variant="soft">
            {tp('failed.changeMethod')}
          </ActionLink>
        }
      />
    );
  }

  if (!orderId && !order) {
    // No order to talk about — the payment never produced one.
    return (
      <EmptyState
        panel
        icon={CircleAlert}
        title={tp('failed.title')}
        body={tp('failed.genericBody')}
        action={<ActionLink href={paths.checkoutPayment}>{tp('failed.retry')}</ActionLink>}
        secondaryAction={
          <ActionLink href={paths.cart} variant="soft">
            {tp('backToCart')}
          </ActionLink>
        }
      />
    );
  }

  const counts = order ? itemCounts(order.items) : { kinds: 0, pieces: 0 };
  const serverReason = order?.payment.failureReason ?? null;
  const bankLine = [
    tp('failed.bankAnswer'),
    order?.payment.cardBrand && order?.payment.maskedCardNumber
      ? `${order.payment.cardBrand} ${order.payment.maskedCardNumber}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  // `paid` here would mean the page was opened for an order that did go through.
  const state = moneyState(order?.payment.status);

  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row">
      <Card
        tone="surface"
        radius="bento"
        className="flex min-w-0 flex-1 flex-col gap-7 p-8 md:p-12"
      >
        <span
          aria-hidden="true"
          className="flex size-[88px] items-center justify-center rounded-pill bg-brand-soft text-brand"
        >
          <TriangleAlert size={44} />
        </span>

        <div className="flex flex-col gap-2.5">
          <h1 className="m-0 text-h2 font-extrabold tracking-[-0.035em] text-ink md:text-[44px]">
            {tp('failed.title')}
          </h1>
          <p className="m-0 max-w-[560px] text-[17px] leading-[1.45] text-ink2">
            {tp('failed.body')}
          </p>
        </div>

        <div
          role="alert"
          className="flex w-full items-start gap-[14px] rounded-lg bg-brand-soft p-5"
        >
          <CircleAlert size={24} aria-hidden="true" className="shrink-0 text-brand" />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-body font-bold text-ink">
              {serverReason
                ? tp('failed.reason', { reason: serverReason })
                : tp('failed.reasonUnknown')}
            </span>
            {bankLine ? <span className="text-label text-ink2">{bankLine}</span> : null}
          </span>
        </div>

        {state === 'paid' ? (
          <p className="m-0 text-body-sm font-semibold text-success">{tp('failed.maybePaid')}</p>
        ) : null}

        <h2 className="m-0 text-label font-bold tracking-[0.077em] text-ink3">
          {tp('failed.whatNow')}
        </h2>

        <div className="flex flex-wrap gap-3">
          <ActionLink href={paths.checkoutPayment}>{tp('failed.retry')}</ActionLink>
          <ActionLink href={paths.checkoutAddCard} variant="ghost">
            {tp('failed.otherCard')}
          </ActionLink>
          <ActionLink href={paths.checkoutPayment} variant="soft">
            {tp('failed.payCash')}
          </ActionLink>
        </div>
      </Card>

      <aside className="w-full shrink-0 lg:w-[400px]">
        <Card
          tone="block"
          radius="bento"
          className="flex h-full flex-col gap-[18px] border-transparent p-8"
        >
          <span className="text-label font-semibold text-on-block">{tp('failed.cartKept')}</span>
          {order?.totals.payable !== null && order?.totals.payable !== undefined ? (
            <span className="text-[48px] font-extrabold leading-none tracking-[-0.035em] text-on-block">
              {f.money(order.totals.payable)}
            </span>
          ) : null}

          {order && order.thumbnails.length > 0 ? (
            <ThumbStack urls={order.thumbnails} size={56} max={3} onBlock label={t('panel.items')} />
          ) : null}

          <dl className="m-0 flex flex-col gap-[14px] border-t border-white/14 pt-4">
            {order?.delivery.address ? (
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-body-sm text-on-block2">{t('info.address')}</dt>
                <dd className="m-0 max-w-[55%] truncate text-body-sm font-semibold text-on-block">
                  {order.delivery.address}
                </dd>
              </div>
            ) : null}
            {order?.etaMinutes ? (
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-body-sm text-on-block2">{t('totals.delivery')}</dt>
                <dd className="m-0 text-body-sm font-semibold text-on-block">
                  {t('tracker.minutes', { count: order.etaMinutes })}
                </dd>
              </div>
            ) : null}
            {counts.pieces > 0 ? (
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-body-sm text-on-block2">{t('totals.items')}</dt>
                <dd className="m-0 text-body-sm font-semibold text-on-block">
                  {t('items.pieces', { count: counts.pieces })}
                </dd>
              </div>
            ) : null}
          </dl>

          <a
            href={`tel:${SUPPORT_PHONE}`}
            className="mt-auto flex items-center gap-2.5 text-label font-semibold text-yellow hover:underline"
          >
            <LifeBuoy size={18} aria-hidden="true" />
            {tp('failed.support', { phone: SUPPORT_PHONE })}
          </a>
        </Card>
      </aside>
    </div>
  );
}
