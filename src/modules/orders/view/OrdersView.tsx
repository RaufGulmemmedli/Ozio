'use client';

/**
 * OD7/OD8 · `/orders` — "Sifarişlərim" (`app-orders.html` `ec2MA`, empty state
 * `app-orders-empty.html` `J7MKYM`, loading `app-sifarislerim-loading.html`).
 *
 * Header: the page title + "N aktiv sifariş" and the Aktiv / Keçmiş segmented control with counts.
 * Body: a flex-1 list beside the 380 side panel (visible from 1440, per the layout rule).
 *  - Aktiv → the big tracker cards from the export (`KEF85` / `Au1sE`);
 *  - Keçmiş → the 104-high order rows, loaded through `<InfiniteList>`.
 * Side panel: the newest active order's live summary, or the "nothing to track" note.
 *
 * `GET v2/orders` paging is verified; the **row shape is not**, so a row without an id is dropped in
 * the repository and a row renders only what the server actually sent.
 */
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFailureMessage, useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { Package, ShoppingBasket, Ticket } from '@/shared/lucide';
import { Card, InfiniteList, SegmentedControl } from '@/shared/ui';
import { EmptyState, ErrorState } from '@/shared/states';
import { MapPlaceholder } from '@/shared/media';
import { OrderRowSkeleton } from '@/shared/skeleton';
import { PageHeader } from '@/shared/layout';
import { ActionLink } from '../components/action-link';
import { OrderRow } from '../components/order-row';
import { OrderStepList } from '../components/order-step-list';
import { OrderTrackerCard } from '../components/order-tracker-card';
import { ThumbStack } from '../components/thumb-stack';
import { OrdersSkeleton } from './OrdersSkeleton';
import { useOrders } from '../hooks/use-orders';
import { orderSteps } from '../data/orders.repository';
import { formatOrderNo } from '../orders.format';
import type { OrderSummary } from '../data/models/order';

type Tab = 'active' | 'past';

export function OrdersView() {
  const t = useTranslations('orders');
  const f = useFormat();
  const failureMessage = useFailureMessage();
  const orders = useOrders();
  const [tab, setTab] = useState<Tab>('active');

  const list = tab === 'active' ? orders.active : orders.past;
  const leadActive = orders.active[0];

  const options = useMemo(
    () => [
      { value: 'active', label: t('tabs.active'), count: orders.active.length },
      { value: 'past', label: t('tabs.past'), count: orders.past.length },
    ],
    [t, orders.active.length, orders.past.length],
  );

  if (orders.isPending) {
    return (
      <>
        <PageHeader title={t('title')} />
        <OrdersSkeleton />
      </>
    );
  }

  if (orders.isError && orders.items.length === 0) {
    return (
      <>
        <PageHeader title={t('title')} />
        <ErrorState
          failure={orders.error}
          title={t('error.title')}
          message={orders.error ? failureMessage(orders.error) : undefined}
          retryLabel={t('error.retry')}
          onRetry={orders.refetch}
        />
      </>
    );
  }

  if (orders.isEmpty) {
    return (
      <>
        <PageHeader title={t('title')} subtitle={t('empty.subtitle')} />
        <EmptyState
          panel
          tone="brand"
          icon={Package}
          title={t('empty.title')}
          body={t('empty.body')}
          action={<ActionLink href={paths.market}>{t('empty.cta')}</ActionLink>}
          secondaryAction={
            <ActionLink href={paths.coupons} variant="soft" leadingIcon={<Ticket size={18} />}>
              {t('empty.secondary')}
            </ActionLink>
          }
        />
      </>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title={t('title')}
        subtitle={t('activeCount', { count: orders.active.length })}
        actions={
          <SegmentedControl
            value={tab}
            onValueChange={(value) => setTab(value === 'past' ? 'past' : 'active')}
            options={options}
            label={t('tabs.label')}
          />
        }
      />

      <div className="flex w-full flex-col gap-6 2xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {tab === 'active' ? (
            orders.active.length === 0 ? (
              <EmptyState
                panel
                compact
                icon={Package}
                title={t('noActive.title')}
                body={t('noActive.body')}
                action={<ActionLink href={paths.market}>{t('empty.cta')}</ActionLink>}
              />
            ) : (
              orders.active.map((order, index) => (
                <OrderTrackerCard
                  key={order.id}
                  order={order}
                  size="lg"
                  tone={index === 0 ? 'block' : 'surface'}
                />
              ))
            )
          ) : (
            <InfiniteList<OrderSummary>
              items={list}
              itemKey={(order) => String(order.id)}
              renderItem={(order) => <OrderRow order={order} />}
              hasNextPage={orders.hasMore}
              isFetchingNextPage={orders.isFetchingNextPage}
              fetchNextPage={orders.loadMore}
              isPending={false}
              renderSkeleton={() => <OrderRowSkeleton />}
              loadingLabel={t('loadingMore')}
              error={orders.isError ? orders.error : undefined}
              onRetry={orders.refetch}
              errorMessage={orders.error ? failureMessage(orders.error) : undefined}
              retryLabel={t('error.retry')}
              className="flex flex-col gap-4"
              as="ul"
              empty={
                <EmptyState
                  panel
                  compact
                  icon={Package}
                  title={t('noPast.title')}
                  body={t('noPast.body')}
                />
              }
            />
          )}
        </div>

        <aside className="w-full shrink-0 2xl:w-[380px]">
          {leadActive ? (
            <Card tone="surface" radius="xl" className="flex w-full flex-col gap-5 p-7">
              <div className="flex flex-col gap-1">
                <span className="text-label font-semibold text-ink2">{t('panel.title')}</span>
                <span className="text-h3 font-extrabold text-ink">
                  {formatOrderNo(leadActive.id)}
                </span>
              </div>

              <MapPlaceholder
                label={t('panel.mapLabel')}
                height={200}
                points={[
                  {
                    id: 'home',
                    label: leadActive.deliveryAddress ?? t('panel.home'),
                    kind: 'home',
                    x: 68,
                    y: 30,
                  },
                  {
                    id: 'courier',
                    label: t('panel.courier'),
                    detail: leadActive.etaMinutes
                      ? t('tracker.minutes', { count: leadActive.etaMinutes })
                      : undefined,
                    kind: 'courier',
                    x: 34,
                    y: 62,
                  },
                ]}
                pointListLabel={t('panel.mapAlt')}
              />

              <OrderStepList steps={orderSteps(leadActive.status)} />

              {leadActive.thumbnails.length > 0 ? (
                <ThumbStack
                  urls={leadActive.thumbnails}
                  size={48}
                  max={4}
                  label={t('panel.items')}
                />
              ) : null}

              {leadActive.amount !== null ? (
                <div className="flex items-baseline justify-between border-t border-line pt-4">
                  <span className="text-body-sm text-ink2">{t('panel.total')}</span>
                  <span className="text-[18px] font-bold text-ink">
                    {f.money(leadActive.amount)}
                  </span>
                </div>
              ) : null}

              <ActionLink href={paths.orderTrack(leadActive.id)} fullWidth>
                {t('tracker.track')}
              </ActionLink>
            </Card>
          ) : (
            <Card tone="soft" radius="xl" className="flex w-full flex-col gap-4 p-7">
              <span
                aria-hidden="true"
                className="flex size-12 items-center justify-center rounded-pill bg-surface text-ink"
              >
                <ShoppingBasket size={22} />
              </span>
              <span className="text-h4 font-bold text-ink">{t('panel.idleTitle')}</span>
              <span className="text-body-sm text-ink2">{t('panel.idleBody')}</span>
              <ActionLink href={paths.market} variant="primary" size="md">
                {t('empty.cta')}
              </ActionLink>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
