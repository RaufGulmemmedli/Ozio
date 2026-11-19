'use client';

/**
 * The big active-order card (`app-orders.html` `KEF85` / `Au1sE`, r32, padding 32, gap 24).
 *
 * Also the home page's order tracker — **agent M2 imports it as `<OrderTrackerCard>` from
 * `@/modules/orders`**, so the name and the props are part of the module's public surface: it takes
 * an `OrderSummary` (what `useOrders()` hands out) plus a `size`.
 *
 * Regions: status pill + order no · "Təxmini çatdırılma" + ETA + amount · the 4-step strip ·
 * a courier/store strip with the track CTA.
 */
import { useTranslations } from 'next-intl';
import { cn } from '@/core/lib/cn';
import { useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { Bike, Store } from '@/shared/lucide';
import { Card } from '@/shared/ui';
import { formatOrderNo } from '../orders.format';
import { orderSteps } from '../data/orders.repository';
import type { OrderStatus } from '../data/models/order-status';
import type { OrderSummary } from '../data/models/order';
import { ActionLink } from './action-link';
import { OrderProgressStrip } from './order-progress-strip';
import { OrderStatusBadge } from './order-status-badge';

interface OrderTrackerCardBase {
  /**
   * `lg` — the `/orders` card: padding 32, ETA 44/800 (the export's `KEF85`).
   * `sm` — the home-page tracker: padding 24, ETA 32/800, so it fits a bento cell.
   */
  size?: 'lg' | 'sm';
  /** `block` is the primary (dark) card; `surface` the secondary one. */
  tone?: 'block' | 'surface';
  /** Timestamped history, when the caller already has the detail, so steps show as done. */
  history?: ReadonlyArray<{ status: OrderStatus; at: string | null }>;
  className?: string;
}

/**
 * Two accepted shapes, so both callers stay honest about what they actually have:
 *  - `order` — the whole row from `useOrders()` (what `/orders` passes);
 *  - the individual fields — for a caller that only holds a few of them (the home page).
 */
export type OrderTrackerCardProps = OrderTrackerCardBase &
  (
    | { order: OrderSummary }
    | {
        order?: undefined;
        orderId: number;
        status: OrderStatus;
        etaMinutes?: number | null;
        amount?: number | null;
        storeName?: string | null;
        itemCount?: number | null;
        courierName?: string | null;
        /** "2 km məsafədə" — already-localized, overrides the item-count sub-line. */
        courierDetail?: string | null;
      }
  );

export function OrderTrackerCard(props: OrderTrackerCardProps) {
  const { size = 'lg', tone = 'block', history = [], className } = props;

  // One shape inside, whichever shape came in.
  const order = props.order ?? {
    id: props.orderId,
    status: props.status,
    etaMinutes: props.etaMinutes ?? null,
    amount: props.amount ?? null,
    storeName: props.storeName ?? null,
    itemCount: props.itemCount ?? null,
    courierName: props.courierName ?? null,
  };
  const courierDetail = props.order ? null : (props.courierDetail ?? null);

  const t = useTranslations('orders');
  const f = useFormat();
  const onBlock = tone === 'block';
  const large = size === 'lg';
  const steps = orderSteps(order.status, history);

  const courierName = order.courierName?.trim() || null;
  const Icon = courierName ? Bike : Store;
  const title = courierName
    ? t('tracker.courierIs', { name: courierName })
    : (order.storeName ?? t('tracker.storeFallback'));
  const subtitle =
    courierDetail ??
    (order.itemCount !== null ? t('tracker.collecting', { count: order.itemCount }) : null);

  return (
    <Card
      tone={tone}
      radius="modal"
      className={cn(
        'flex flex-col',
        large ? 'gap-6 p-8' : 'gap-5 p-6',
        onBlock && 'border-transparent',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <OrderStatusBadge status={order.status} onBlock={onBlock} />
        <span className={cn('text-label font-semibold', onBlock ? 'text-on-block2' : 'text-ink2')}>
          {formatOrderNo(order.id)}
        </span>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className={cn('text-label', onBlock ? 'text-on-block2' : 'text-ink2')}>
            {t('tracker.eta')}
          </span>
          <span
            className={cn(
              'font-extrabold leading-none tracking-[-0.035em]',
              large ? 'text-[44px]' : 'text-h2',
              onBlock ? 'text-on-block' : 'text-ink',
            )}
          >
            {order.etaMinutes
              ? t('tracker.minutes', { count: order.etaMinutes })
              : t('tracker.asap')}
          </span>
        </div>
        {order.amount !== null ? (
          <span
            className={cn(
              'font-bold',
              large ? 'text-[22px]' : 'text-body-l',
              onBlock ? 'text-on-block' : 'text-ink',
            )}
          >
            {f.money(order.amount)}
          </span>
        ) : null}
      </div>

      <OrderProgressStrip steps={steps} onBlock={onBlock} />

      <div className={cn('flex flex-wrap items-center gap-[14px]', large && 'pt-5')}>
        <span
          aria-hidden="true"
          className={cn(
            'flex shrink-0 items-center justify-center rounded-pill',
            large ? 'size-12' : 'size-11',
            courierName
              ? 'bg-brand text-white'
              : onBlock
                ? 'bg-white/12 text-on-block'
                : 'bg-surface2 text-ink',
          )}
        >
          <Icon size={large ? 22 : 20} />
        </span>
        <div className="flex min-w-[120px] flex-1 flex-col gap-0.5">
          <span className={cn('text-body font-bold', onBlock ? 'text-on-block' : 'text-ink')}>
            {title}
          </span>
          {subtitle ? (
            <span className={cn('text-label', onBlock ? 'text-on-block2' : 'text-ink2')}>
              {subtitle}
            </span>
          ) : null}
        </div>
        <ActionLink
          href={paths.orderTrack(order.id)}
          variant={onBlock ? 'white' : 'primary'}
          size="md"
        >
          {t('tracker.track')}
        </ActionLink>
      </div>
    </Card>
  );
}
