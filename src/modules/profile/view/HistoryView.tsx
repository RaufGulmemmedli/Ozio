'use client';

/**
 * L8 "Tarixçə və çeklər" — `/history`.
 *
 * The design canvas ships no frame for this route (02-routing.md lists it, `web-handoff/html` has
 * no file), so it is assembled from the owning modules' own row components and the drawn empty
 * copy of the neighbouring transactions screen (`app-kart-emeliyyatlar-bos.html`).
 *
 * Flutter's `profile_remote_source` composes exactly four reads for this screen, and each one
 * belongs to another module — **no repository is duplicated here**:
 *
 *   `v2/orders`                                   → `useOrders()`              `@/modules/orders`
 *   `v2/bonus/transactions?source_type=`          → `useBonusTransactions()`   `@/modules/loyalty_card`
 *   `v1/lotteries/tickets?lottery_id=`            → `useActiveLottery()` + `useTickets()`  `@/modules/lottery`
 *   `v1/coupons/global`                           → `useCoupons()`             `@/modules/coupons`
 *
 * Only the active tab's query runs, so the two `bonus/transactions` calls (offline then online,
 * sequenced inside the loyalty repository) never race anything else on that path.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import type { Failure } from '@/core/network';
import { paths } from '@/core/routes';
import { Package, Ticket, Trophy, Wallet } from '@/shared/lucide';
import { PageHeader } from '@/shared/layout';
import { Button, SegmentedControl } from '@/shared/ui';
import { EmptyState, ErrorState } from '@/shared/states';
import { useFailureMessage } from '@/core/i18n/failure-message';
import { OrderRow, useOrders } from '@/modules/orders';
import { BonusTransactionRow, useBonusTransactions } from '@/modules/loyalty_card';
import { TicketRow, useActiveLottery, useTickets } from '@/modules/lottery';
import { CouponTicket, useCoupons } from '@/modules/coupons';

import { HistorySkeleton } from './HistorySkeleton';
import type { HistoryTab } from '../profile.query-keys';

/** The `surface` r28 card the compact rows sit in, divided by a 1px `line`. */
function RowCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col rounded-xl bg-surface py-2 [&>*+*]:border-t [&>*+*]:border-line">
      {children}
    </div>
  );
}

interface SectionProps {
  isPending: boolean;
  isError: boolean;
  error: Failure | null;
  isEmpty: boolean;
  skeleton: 'rows' | 'cards';
  emptyIcon: typeof Wallet;
  emptyTitle: string;
  emptyBody: string;
  emptyAction?: React.ReactNode;
  onRetry: () => void;
  children: React.ReactNode;
}

/** Loading → error → empty → content, identical for all four tabs. */
function Section({
  isPending,
  isError,
  error,
  isEmpty,
  skeleton,
  emptyIcon,
  emptyTitle,
  emptyBody,
  emptyAction,
  onRetry,
  children,
}: SectionProps) {
  const t = useTranslations('profile');
  const failureMessage = useFailureMessage();

  if (isPending) return <HistorySkeleton label={t('loading')} variant={skeleton} />;

  if (isError) {
    return (
      <ErrorState
        failure={error}
        title={t('error.title')}
        message={error ? failureMessage(error) : undefined}
        onRetry={onRetry}
        retryLabel={t('retry')}
      />
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        panel
        tone="brand"
        icon={emptyIcon}
        title={emptyTitle}
        body={emptyBody}
        action={emptyAction}
        titleAs="h3"
      />
    );
  }

  return <>{children}</>;
}

export function HistoryView() {
  const t = useTranslations('profile');
  const [tab, setTab] = useState<HistoryTab>('orders');

  const orders = useOrders({ enabled: tab === 'orders' });
  const bonus = useBonusTransactions({ source: 'all', limit: 25, enabled: tab === 'bonus' });
  // `lotteries/tickets` answers 500 without `lottery_id`, so the active draw is resolved first.
  const active = useActiveLottery();
  const lotteryId = active.data?.lottery?.id ?? null;
  const tickets = useTickets(tab === 'tickets' ? lotteryId : null);
  const coupons = useCoupons({ enabled: tab === 'coupons' });

  return (
    <>
      <PageHeader title={t('history.title')} subtitle={t('history.subtitle')} />

      <SegmentedControl
        value={tab}
        onValueChange={(next) => setTab(next as HistoryTab)}
        label={t('history.tabs.label')}
        options={[
          { value: 'orders', label: t('history.tab.orders') },
          { value: 'bonus', label: t('history.tab.bonus') },
          { value: 'tickets', label: t('history.tab.tickets') },
          { value: 'coupons', label: t('history.tab.coupons') },
        ]}
      />

      {tab === 'orders' ? (
        <Section
          isPending={orders.isPending}
          isError={orders.isError}
          error={orders.error}
          isEmpty={orders.isEmpty}
          skeleton="cards"
          emptyIcon={Package}
          emptyTitle={t('history.orders.empty')}
          emptyBody={t('history.orders.emptyBody')}
          emptyAction={
            <Button as="a" href={paths.market} variant="primary">
              {t('history.orders.cta')}
            </Button>
          }
          onRetry={orders.refetch}
        >
          <div className="flex w-full flex-col gap-3">
            {orders.items.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
            {orders.hasMore ? (
              <Button
                variant="soft"
                onClick={orders.loadMore}
                loading={orders.isFetchingNextPage}
                className="self-center"
              >
                {t('history.loadMore')}
              </Button>
            ) : null}
          </div>
        </Section>
      ) : null}

      {tab === 'bonus' ? (
        <Section
          isPending={bonus.isPending}
          isError={bonus.isError}
          error={bonus.error}
          isEmpty={bonus.isEmpty}
          skeleton="rows"
          emptyIcon={Wallet}
          emptyTitle={t('history.bonus.empty')}
          emptyBody={t('history.bonus.emptyBody')}
          onRetry={bonus.refetch}
        >
          <RowCard>
            {bonus.rows.map((transaction) => (
              <div key={transaction.id} className="px-2 md:px-4">
                <BonusTransactionRow transaction={transaction} />
              </div>
            ))}
          </RowCard>
        </Section>
      ) : null}

      {tab === 'tickets' ? (
        <Section
          isPending={active.isPending || tickets.isPending}
          isError={active.isError || tickets.isError}
          error={active.error ?? tickets.error}
          isEmpty={lotteryId === null || tickets.isEmpty}
          skeleton="rows"
          emptyIcon={Trophy}
          emptyTitle={
            lotteryId === null ? t('history.tickets.unavailable') : t('history.tickets.empty')
          }
          emptyBody={t('history.tickets.emptyBody')}
          onRetry={lotteryId === null ? active.refetch : tickets.refetch}
        >
          <RowCard>
            {tickets.items.map((ticket) => (
              <div key={ticket.id || ticket.number || ticket.code} className="px-5 py-2 md:px-7">
                <TicketRow ticket={ticket} drawName={active.data?.lottery?.name} />
              </div>
            ))}
            {tickets.hasMore ? (
              <div className="flex justify-center py-3">
                <Button
                  variant="soft"
                  onClick={tickets.loadMore}
                  loading={tickets.isFetchingNextPage}
                >
                  {t('history.loadMore')}
                </Button>
              </div>
            ) : null}
          </RowCard>
        </Section>
      ) : null}

      {tab === 'coupons' ? (
        <Section
          isPending={coupons.isPending}
          isError={coupons.isError}
          error={coupons.error}
          isEmpty={(coupons.data?.items.length ?? 0) === 0}
          skeleton="rows"
          emptyIcon={Ticket}
          emptyTitle={t('history.coupons.empty')}
          emptyBody={t('history.coupons.emptyBody')}
          onRetry={() => void coupons.refetch()}
        >
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
            {(coupons.data?.items ?? []).map((coupon) => (
              <CouponTicket key={coupon.id} coupon={coupon} />
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}
