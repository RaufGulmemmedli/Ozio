'use client';

/**
 * `/courier/history` — "Kuryer · Tarixçə" (`o0SLa`), empty `xr8w7`.
 *
 * Rows of delivered orders: store, address, distance, tip (`+x ₼` in `success`), fee and the date.
 * Amounts come from the mock through `useFormat().money`.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { History, Store } from '@/shared/lucide';
import { PageHeader } from '@/shared/layout';
import { DemoBanner, EmptyState, ErrorState } from '@/shared/states';
import { Breadcrumbs, Button } from '@/shared/ui';

import { MetaChip } from '../components/courier-bits';
import type { CourierOrder } from '../data/models/courier';
import { useCourierHistory } from '../hooks/use-courier';

import { CourierHistorySkeleton } from './CourierHistorySkeleton';

export function CourierHistoryView() {
  const t = useTranslations('courier');

  const history = useCourierHistory();
  const rows = history.data ?? [];

  return (
    <>
      <DemoBanner module="courier" body={t('demo')} />

      <PageHeader
        title={t('history.title')}
        subtitle={t('history.subtitle')}
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: t('crumb.courier'), href: paths.courier },
              { label: t('history.crumb') },
            ]}
          />
        }
      />

      {history.isPending ? (
        <CourierHistorySkeleton label={t('history.loading')} />
      ) : history.isError ? (
        <ErrorState
          failure={history.error}
          title={t('history.errorTitle')}
          message={t('panel.errorBody')}
          retryLabel={t('panel.retry')}
          onRetry={() => void history.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={History}
          tone="brand"
          panel
          title={t('history.emptyTitle')}
          body={t('history.emptyBody')}
          action={
            <Button as="a" href={paths.courier} variant="brand" size="2xl">
              {t('history.emptyCta')}
            </Button>
          }
        />
      ) : (
        <div className="w-full rounded-xl bg-surface px-6 py-2">
          {rows.map((order) => (
            <HistoryRow key={order.id} order={order} />
          ))}
        </div>
      )}
    </>
  );
}

function HistoryRow({ order }: { order: CourierOrder }) {
  const t = useTranslations('courier');
  const { money, number, date } = useFormat();
  const when = order.deliveredAt ?? order.createdAt;

  return (
    <article className="flex w-full flex-row items-center gap-4 border-b border-line py-4 last:border-b-0 max-md:flex-wrap md:min-h-[84px]">
      <span
        aria-hidden="true"
        className="grid size-12 shrink-0 place-items-center rounded-md bg-surface2 text-ink2"
      >
        <Store size={22} />
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-label font-bold text-ink">{order.storeName}</span>
        <span className="truncate text-caption text-ink2">{order.customerAddress}</span>
      </span>

      <MetaChip>
        {t('history.km', { km: number(order.distanceKm, { maximumFractionDigits: 1 }) })}
      </MetaChip>

      <span className="w-[86px] shrink-0 text-right text-label font-bold tabular-nums text-success">
        {order.tip > 0 ? t('history.tip', { amount: money(order.tip) }) : t('history.noTip')}
      </span>

      <span className="w-[86px] shrink-0 text-right text-label font-bold tabular-nums text-ink">
        {money(order.fee)}
      </span>

      <span className="w-[120px] shrink-0 text-right text-caption text-ink3">
        {date(when, 'dayMonth')}, {date(when, 'time')}
      </span>
    </article>
  );
}
