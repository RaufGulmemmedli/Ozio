'use client';

/**
 * The "Bonus əməliyyatları" panel on `/card` — node `HKv7G` in
 * `app-card-bonus.html`: `surface`, `rounded-xl` (28), padding 24/28; a header
 * row (title 20/800 + the brand "Hamısı" link 15/600) with 12px bottom
 * padding, then the rows separated by 1px `line` borders.
 *
 * The chips switch `source_type` (the only list parameter the endpoint has),
 * and the list is capped at six rows — `/card/transactions` is the full table.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Link, useFailureMessage } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { Wallet } from '@/shared/lucide';
import { Shimmer, TransactionRowSkeleton } from '@/shared/skeleton';
import { EmptyState, ErrorState } from '@/shared/states';
import { Button } from '@/shared/ui';

import { BonusTransactionRow } from '../components/bonus-transaction-row';
import { TransactionFilters } from '../components/transaction-filters';
import { useBonusTransactions } from '../hooks/use-bonus-transactions';
import type { BonusSourceFilter } from '../loyalty_card.query-keys';

export interface BonusActivityPanelProps {
  /** How many rows the panel shows before deferring to the full table. */
  max?: number;
  className?: string;
}

export function BonusActivityPanel({ max = 6, className }: BonusActivityPanelProps) {
  const t = useTranslations('loyalty_card');
  const failureMessage = useFailureMessage();
  const [source, setSource] = useState<BonusSourceFilter>('all');

  const { rows, isPending, isError, isEmpty, error, refetch, isFetching } = useBonusTransactions({
    source,
    limit: max,
  });

  return (
    <section
      aria-labelledby="bonus-activity-heading"
      className={cn('flex w-full flex-col gap-4 rounded-xl border border-line bg-surface px-7 py-6', className)}
    >
      <div className="flex w-full flex-row items-start justify-between gap-3">
        <h2 id="bonus-activity-heading" className="m-0 text-h4 font-extrabold text-ink">
          {t('tx.title')}
        </h2>
        <Link
          href={paths.cardTransactions}
          className="shrink-0 rounded-sm text-body-sm font-semibold text-brand underline-offset-4 hover:underline"
        >
          {t('tx.seeAll')}
        </Link>
      </div>

      <TransactionFilters compact source={source} onSourceChange={setSource} />

      {isPending ? (
        <Shimmer label={t('loading')} className="flex w-full flex-col gap-[18px] pt-2">
          {Array.from({ length: 4 }, (_, index) => (
            <TransactionRowSkeleton key={index} index={index} />
          ))}
        </Shimmer>
      ) : isError ? (
        <ErrorState
          compact
          failure={error}
          title={t('error.txTitle')}
          message={error ? failureMessage(error) : undefined}
          onRetry={refetch}
          retryLabel={t('error.retry')}
          retrying={isFetching}
        />
      ) : isEmpty ? (
        <EmptyState
          compact
          icon={Wallet}
          tone="brand"
          titleAs="p"
          title={t('tx.empty.title')}
          body={t('tx.empty.body')}
          action={
            <Button as="a" href={paths.market} variant="primary" size="lg">
              {t('tx.empty.cta')}
            </Button>
          }
        />
      ) : (
        <ul className="m-0 flex list-none flex-col ps-0">
          {rows.slice(0, max).map((row) => (
            <li key={`${row.sourceType}-${row.id}`} className="w-full">
              <BonusTransactionRow transaction={row} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
