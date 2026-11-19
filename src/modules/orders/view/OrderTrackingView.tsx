'use client';

/**
 * D6 · `/orders/[id]/track` — "Sifariş izləmə" (`app-core/app-order-tracking.html`, node `SDbBL`;
 * dark variant `app-states/app-sifaris-izleme-dark.html`).
 *
 * There is **no tracking endpoint** — this screen polls `GET v2/orders/{id}` (see
 * `useOrderTracking`): every 5 s while visible, 30 s while hidden, and not at all once the status is
 * terminal.
 *
 * Regions: the header ("Sifariş #…", "Bu gün, 14:32 · 6 məhsul · 42,70 ₼", the Aktiv/Keçmiş
 * segmented control), the live map (flex-1, 640, with the ETA pill overlay) and the 440 column —
 * "Sifariş vəziyyəti" (the vertical stepper with timestamps), the courier card and
 * "Sifariş tərkibi" with item thumbnails.
 *
 * a11y: the ETA is an `aria-live="polite"` region, the stepper is an `<ol>` with
 * `aria-current="step"`, and the map carries a text alternative (the courier's distance), since a
 * decorative map tells a screen reader nothing.
 *
 * Offline: the stepper freezes and says "Bağlantı yoxdur" instead of pretending to advance
 * (`<OfflineBanner>` itself is global shell chrome).
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFailureMessage, useFormat, useRouter } from '@/core/i18n';
import { paths } from '@/core/routes';
import { Timer } from '@/shared/lucide';
import { Card, SegmentedControl, toast } from '@/shared/ui';
import { ErrorState, InlineNotice } from '@/shared/states';
import { MapPlaceholder } from '@/shared/media';
import { PageHeader } from '@/shared/layout';
import { ActionLink } from '../components/action-link';
import { CourierCard } from '../components/courier-card';
import { OrderStepList } from '../components/order-step-list';
import { ThumbStack } from '../components/thumb-stack';
import { OrderTrackingSkeleton } from './OrderTrackingSkeleton';
import { isOrderNotFound } from '../hooks/use-order';
import { useOrderTracking } from '../hooks/use-order-tracking';
import { orderSteps } from '../data/orders.repository';
import { itemCounts } from '../data/models/order-detail';
import { isTerminalStatus } from '../data/models/order-status';
import { formatOrderNo } from '../orders.format';

export interface OrderTrackingViewProps {
  orderId: string;
}

/** `navigator.onLine` as state — the inline frozen treatment needs it, the banner is global. */
function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const read = () => setOnline(navigator.onLine);
    read();
    window.addEventListener('online', read);
    window.addEventListener('offline', read);
    return () => {
      window.removeEventListener('online', read);
      window.removeEventListener('offline', read);
    };
  }, []);
  return online;
}

/**
 * The courier pin drifts from its previous polled position to the newest one over the poll
 * interval, so the map does not jump once every 5 s. Pure presentation — no position is invented,
 * it only eases between two server values.
 */
function useInterpolated(x: number, y: number, durationMs: number): { x: number; y: number } {
  const [point, setPoint] = useState({ x, y });
  const from = useRef({ x, y });
  const raf = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const origin = from.current;
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / Math.max(1, durationMs));
      // ease-out, close enough to the shell's motion curve for a drifting dot
      const eased = 1 - (1 - progress) ** 3;
      setPoint({ x: origin.x + (x - origin.x) * eased, y: origin.y + (y - origin.y) * eased });
      if (progress < 1) raf.current = requestAnimationFrame(step);
      else from.current = { x, y };
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [x, y, durationMs]);

  return point;
}

export function OrderTrackingView({ orderId }: OrderTrackingViewProps) {
  const t = useTranslations('orders');
  const f = useFormat();
  const router = useRouter();
  const failureMessage = useFailureMessage();
  const online = useOnline();
  const { query, polling, intervalMs } = useOrderTracking(orderId);

  const notFound = isOrderNotFound(query.error);
  useEffect(() => {
    if (!notFound) return;
    toast.error({ title: t('notFound.title'), body: t('notFound.body') });
    router.replace(paths.orders);
  }, [notFound, router, t]);

  const order = query.data;
  // The placeholder map has no projection, so the courier pin is positioned along the drawn route
  // by how far it still has to go: `distance_meters` → 0 = at the door, 3 km or more = the start of
  // the route. No distance → the pin sits at the route's midpoint and only the text alternative
  // (the courier's distance / the ETA) carries the real information.
  const progress =
    order?.courier.distanceMeters != null
      ? Math.min(1, Math.max(0, 1 - order.courier.distanceMeters / 3000))
      : 0.5;
  const courierPoint = useInterpolated(20 + progress * 50, 72 - progress * 46, intervalMs);

  if (query.isPending) {
    return (
      <>
        <PageHeader title={t('track.title')} backHref={paths.orders} backLabel={t('title')} />
        <OrderTrackingSkeleton />
      </>
    );
  }

  if (query.isError || !order) {
    return (
      <>
        <PageHeader title={t('track.title')} backHref={paths.orders} backLabel={t('title')} />
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

  const counts = itemCounts(order.items);
  const subtitle = [
    order.createdAt
      ? `${f.date(order.createdAt, 'dayMonth')}, ${f.date(order.createdAt, 'time')}`
      : null,
    counts.kinds > 0 ? t('row.items', { count: counts.kinds }) : null,
    order.totals.payable !== null ? f.money(order.totals.payable) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const distanceText =
    order.courier.distanceMeters !== null
      ? t('track.distance', { km: (order.courier.distanceMeters / 1000).toFixed(1) })
      : null;

  const etaText = order.etaMinutes
    ? t('track.eta', { count: order.etaMinutes })
    : t('track.etaUnknown');

  const frozen = !online;

  return (
    <div className="flex w-full flex-col gap-8">
      <PageHeader
        title={`${t('detail.titlePrefix')} ${formatOrderNo(order.id)}`}
        subtitle={subtitle || undefined}
        backHref={paths.orders}
        backLabel={t('title')}
        actions={
          <SegmentedControl
            value="active"
            onValueChange={() => router.push(paths.orders)}
            options={[
              { value: 'active', label: t('tabs.active') },
              { value: 'past', label: t('tabs.past') },
            ]}
            label={t('tabs.label')}
          />
        }
      />

      {frozen ? (
        <InlineNotice tone="warning" multiline title={t('track.offline')} body={t('track.offlineBody')} />
      ) : null}

      {isTerminalStatus(order.status) ? (
        <InlineNotice
          tone={order.status === 'delivered' ? 'success' : 'info'}
          multiline
          title={t(`track.finished.${order.status}`)}
          body={t('track.finishedBody')}
          actionLabel={t('track.toDetail')}
          actionHref={paths.order(order.id)}
        />
      ) : null}

      <div className="flex w-full flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <MapPlaceholder
            label={t('track.mapLabel')}
            height={640}
            points={[
              {
                id: 'home',
                label: order.delivery.address ?? t('panel.home'),
                kind: 'home',
                x: 70,
                y: 26,
              },
              {
                id: 'courier',
                label: order.courier.name ?? t('panel.courier'),
                detail: distanceText ?? etaText,
                kind: 'courier',
                x: Math.round(courierPoint.x),
                y: Math.round(courierPoint.y),
              },
            ]}
            pointListLabel={t('track.mapAlt')}
            // The text alternative is not optional here: the map is the screen's main region.
            showPointList
          >
            <p
              aria-live="polite"
              className="pointer-events-none absolute left-6 top-6 m-0 flex items-center gap-3 rounded-pill bg-surface px-[22px] py-[14px] text-body-sm font-bold text-ink shadow-chip"
            >
              <Timer size={20} aria-hidden="true" />
              {etaText}
            </p>
          </MapPlaceholder>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-5 lg:w-[440px]">
          <Card tone="surface" radius="xl" className="flex w-full flex-col gap-4 p-7">
            <h2 className="m-0 text-h4 font-extrabold text-ink">{t('track.statusTitle')}</h2>
            <OrderStepList steps={orderSteps(order.status, order.history)} frozen={frozen} />
            {!polling && !isTerminalStatus(order.status) ? (
              <p className="m-0 text-caption text-ink3">{t('track.paused')}</p>
            ) : null}
          </Card>

          <CourierCard courier={order.courier} />

          <Card tone="surface" radius="xl" className="flex w-full flex-col gap-[14px] p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="m-0 text-[17px] font-extrabold text-ink">{t('track.itemsTitle')}</h2>
              {order.totals.payable !== null ? (
                <span className="text-[17px] font-extrabold text-ink">
                  {f.money(order.totals.payable)}
                </span>
              ) : null}
            </div>
            {order.thumbnails.length > 0 ? (
              <ThumbStack urls={order.thumbnails} size={56} max={4} label={t('panel.items')} />
            ) : (
              <p className="m-0 text-body-sm text-ink2">
                {counts.kinds > 0 ? t('items.counts', counts) : t('items.none')}
              </p>
            )}
            <ActionLink href={paths.order(order.id)} variant="soft" size="md">
              {t('track.toDetail')}
            </ActionLink>
          </Card>
        </div>
      </div>
    </div>
  );
}
