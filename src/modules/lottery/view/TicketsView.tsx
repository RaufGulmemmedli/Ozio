'use client';

/**
 * `/lottery/tickets` — "Bütün biletlərim" (LT1).
 *
 * The export draws no dedicated frame for this list, so it follows the Kuponlar list
 * rules: real page header, then the 64-high ticket rows (`surface2`, radius 20) in a
 * single column, paged by `offset` with the footer spinner `<InfiniteList>` allows.
 *
 * `GET v1/lotteries/tickets` is `live: unverified` (no test account has a ticket), so a row
 * renders only the fields that actually parsed. The empty state is LT3: tickets are earned
 * from receipts, and `details.amount` is the receipt sum that earns one — there is no
 * purchase endpoint to offer.
 */
import { useTranslations } from 'next-intl';

import { useFailureMessage, useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { Ticket } from '@/shared/lucide';
import { EmptyState, ErrorState } from '@/shared/states';
import { PageHeader } from '@/shared/layout';
import { InfiniteList } from '@/shared/ui';

import { LinkButton } from '../components/link-button';
import { TicketRow } from '../components/lottery-ticket-card';
import { useActiveLottery, useLotteryDetails, useTickets } from '../hooks/use-lottery';
import { TicketsSkeleton } from './TicketsSkeleton';

export function TicketsView() {
  const t = useTranslations('lottery');
  const tc = useTranslations('common');
  const { money } = useFormat();
  const failureMessage = useFailureMessage();

  const active = useActiveLottery();
  const lottery = active.data?.lottery ?? null;
  const details = useLotteryDetails(lottery?.id);
  const tickets = useTickets(lottery?.id, 10);

  const header = (
    <PageHeader
      title={t('tickets.title')}
      subtitle={
        active.data
          ? t('tickets.subtitle', { count: active.data.myTickets })
          : t('tickets.subtitleIdle')
      }
      backHref={paths.lottery}
      backLabel={t('title')}
    />
  );

  if (active.isPending) {
    return (
      <>
        {header}
        <TicketsSkeleton label={tc('loading')} />
      </>
    );
  }

  if (active.isError) {
    return (
      <>
        {header}
        <ErrorState
          failure={active.error}
          title={tc('error.generic.title')}
          message={failureMessage(active.error)}
          retryLabel={tc('retry')}
          onRetry={() => active.refetch()}
        />
      </>
    );
  }

  if (!lottery) {
    return (
      <>
        {header}
        <EmptyState
          icon={Ticket}
          title={t('empty.title')}
          body={t('empty.body')}
          panel
          action={
            <LinkButton href={paths.lotteryRules} variant="primary" size="lg">
              {t('nav.rules')}
            </LinkButton>
          }
        />
      </>
    );
  }

  const amount = details.data?.amountPerTicket ?? null;

  return (
    <>
      {header}
      <InfiniteList
        as="ul"
        items={tickets.items}
        itemKey={(ticket, index) => ticket.id || String(index)}
        className="flex w-full list-none flex-col gap-3 p-0"
        isPending={tickets.isPending}
        renderSkeleton={() => <TicketsSkeleton label={tc('loading')} />}
        hasNextPage={tickets.hasMore}
        isFetchingNextPage={tickets.isFetchingNextPage}
        fetchNextPage={tickets.loadMore}
        loadingLabel={tc('loading')}
        error={tickets.isError ? tickets.error : undefined}
        errorMessage={tickets.error ? failureMessage(tickets.error) : undefined}
        retryLabel={tc('retry')}
        onRetry={tickets.refetch}
        empty={
          <EmptyState
            icon={Ticket}
            tone="brand"
            title={t('tickets.empty.title')}
            body={amount ? t('tickets.empty.bodyWithAmount', { amount: money(amount) }) : t('tickets.empty.body')}
            panel
            action={
              <LinkButton href={paths.market} variant="primary" size="lg">
                {t('earn.action')}
              </LinkButton>
            }
            secondaryAction={
              <LinkButton href={paths.lotteryRules} variant="soft" size="lg">
                {t('nav.rules')}
              </LinkButton>
            }
          />
        }
        renderItem={(ticket) => (
          <TicketRow
            ticket={ticket}
            drawName={lottery.name}
            href={paths.lotteryTicket(ticket.id)}
          />
        )}
      />
    </>
  );
}
