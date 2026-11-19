'use client';

/**
 * `/card/transactions` — "Kart · Əməliyyatlar" (KT4), node `q8NjJ` in
 * `html/app-profile/app-kart-emeliyyatlar.html`.
 *
 * Content gap 32. Heading `u0YzPP` (back link "Kart və bonus" + the title row
 * with "CSV yüklə") -> Summary `KFn6s` (3 tiles, the first `block`-filled) ->
 * Filters `xPpBj` -> Table `R47s65` (r28, header row 12/700 +1px `ink3`, month
 * group rows on `surface2`, data rows 67.5 with a 44 tile, merchant 16/600,
 * date and type 14/400, signed amount 16/700, chevron) -> Pagination
 * ("1–8 / 48 əməliyyat" + 40px page circles).
 *
 * What the endpoint can and cannot do:
 *  - `source_type` is a **server** parameter and the only list filter there is;
 *  - the direction chips and the period control are **client-side**, because
 *    `bonus/transactions` has no direction or date parameter;
 *  - month group sums, the summary tiles and the CSV file are client-side too
 *    (app-profile.md §10 says so) — they only ever add up amounts the server
 *    sent, never derive one from a price;
 *  - there is **no running balance** in the live rows, so the BALANS column is
 *    rendered only when at least one row actually carries one.
 */
import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { formatDate, Link, useFailureMessage, useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  Download,
  Wallet,
} from '@/shared/lucide';
import { EmptyState, ErrorState } from '@/shared/states';
import { Button, Pagination } from '@/shared/ui';

import { BonusTransactionRow, signedMoney } from '../components/bonus-transaction-row';
import {
  TransactionFilters,
  applyClientFilters,
  type TransactionPeriod,
} from '../components/transaction-filters';
import { monthKeyOf, monthlyBonusSummary, type BonusTransaction } from '../data/models/bonus-transaction';
import { useBonusTransactions } from '../hooks/use-bonus-transactions';
import { useCard } from '../hooks/use-card';
import type { BonusKindFilter, BonusSourceFilter } from '../loyalty_card.query-keys';

import { TransactionsSkeleton } from './TransactionsSkeleton';

const PAGE_SIZE = 8;

/**
 * `Noyabr 2026` — formatted, never a hardcoded month name.
 *
 * Goes through `formatDate`, not `new Intl.DateTimeFormat(locale, …)`: the browser resolves
 * `az-AZ` but formats it with CLDR root data, so the direct call printed "2026 M11" here.
 */
function monthLabel(key: string, locale: string): string {
  if (key === 'unknown') return '';
  const [year, month] = key.split('-').map(Number);
  const formatted = formatDate(
    locale,
    new Date(Date.UTC(year ?? 1970, (month || 1) - 1, 1, 12)),
    'monthYear',
  );
  return capitalizeFirst(formatted, locale);
}

/**
 * az uppercases a dotted `i` as `İ` ("iyun" → "İyun"). `toLocaleUpperCase('az')` knows that only
 * where the runtime carries az casing data — which, as above, it may not — so the one letter that
 * actually differs is handled here and everything else goes through the runtime.
 */
function capitalizeFirst(value: string, locale: string): string {
  const first = value.charAt(0);
  if (!first) return value;
  const upper = locale.startsWith('az') && first === 'i' ? 'İ' : first.toLocaleUpperCase(locale);
  return upper + value.slice(1);
}

export function TransactionsView() {
  const t = useTranslations('loyalty_card');
  const locale = useLocale();
  const failureMessage = useFailureMessage();
  const { money, date } = useFormat();

  const [source, setSource] = useState<BonusSourceFilter>('all');
  const [kind, setKind] = useState<BonusKindFilter>('all');
  const [period, setPeriod] = useState<TransactionPeriod>('m3');
  const [page, setPage] = useState(1);

  const { card } = useCard();
  const { rows, total, isPending, isError, error, refetch, isFetching } = useBonusTransactions({
    source,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const visible = useMemo(() => applyClientFilters(rows, kind, period), [rows, kind, period]);
  const summary = useMemo(() => monthlyBonusSummary(rows), [rows]);
  const showBalance = useMemo(() => visible.some((row) => row.balanceAfter !== null), [visible]);

  const groups = useMemo(() => {
    const out: Array<{ key: string; rows: BonusTransaction[]; earned: number; spent: number }> = [];
    for (const row of visible) {
      const key = monthKeyOf(row);
      let group = out.find((candidate) => candidate.key === key);
      if (!group) {
        group = { key, rows: [], earned: 0, spent: 0 };
        out.push(group);
      }
      group.rows.push(row);
      group.earned = Math.round((group.earned + row.earnedBonus) * 100) / 100;
      group.spent = Math.round((group.spent + row.spentBonus) * 100) / 100;
    }
    return out;
  }, [visible]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = kind !== 'all' || period !== 'all';

  const resetFilters = () => {
    setKind('all');
    setPeriod('all');
    setSource('all');
    setPage(1);
  };

  /** CSV of the rows currently on screen. No server export exists. */
  const downloadCsv = () => {
    if (typeof window === 'undefined' || visible.length === 0) return;
    const header = [
      t('transactions.col.operation'),
      t('transactions.col.date'),
      t('transactions.col.type'),
      t('transactions.col.amount'),
    ];
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const body = visible.map((row) =>
      [
        row.storeName || t('tx.storeFallback'),
        row.createdAt ? `${date(row.createdAt, 'short')} ${date(row.createdAt, 'time')}` : '',
        typeLabel(row),
        signedMoney(row.signedAmount, money),
      ]
        .map(escape)
        .join(','),
    );
    const csv = `﻿${[header.map(escape).join(','), ...body].join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${t('transactions.exportName')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  function typeLabel(row: BonusTransaction): string {
    if (row.direction === 'spend') return t('tx.type.spent');
    if (row.lotteryTicket) return t('tx.type.lottery');
    if (row.couponCode) return t('tx.type.gift');
    return row.sourceType === 'offline' ? t('tx.type.cashback') : t('tx.type.partner');
  }

  const heading = (
    <div className="flex w-full flex-col gap-2.5">
      <Link
        href={paths.card}
        className="flex w-fit items-center gap-2 rounded-sm text-label font-semibold text-ink2 hover:text-ink"
      >
        <ArrowLeft size={18} aria-hidden="true" />
        {t('transactions.back')}
      </Link>
      <div className="flex w-full flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
        <h1 className="m-0 text-[28px] font-bold leading-[1.2] tracking-[-0.02em] text-ink md:text-h2 lg:text-h1-app lg:font-extrabold">
          {t('transactions.title')}
        </h1>
        <Button
          variant="ghost"
          size="md"
          onClick={downloadCsv}
          disabled={visible.length === 0}
          leadingIcon={<Download size={18} aria-hidden="true" />}
        >
          {t('transactions.export')}
        </Button>
      </div>
    </div>
  );

  if (isPending) {
    return (
      <>
        {heading}
        <TransactionsSkeleton rows={PAGE_SIZE} />
      </>
    );
  }

  if (isError) {
    return (
      <>
        {heading}
        <ErrorState
          failure={error}
          title={t('error.txTitle')}
          message={error ? failureMessage(error) : undefined}
          onRetry={refetch}
          retryLabel={t('error.retry')}
          retrying={isFetching}
        />
      </>
    );
  }

  const monthName = t('transactions.monthLocative', { month: String(summary.month) });

  return (
    <>
      {heading}

      <div className="flex w-full flex-col gap-4 md:flex-row">
        <StatTile tone="dark" label={t('transactions.stat.balance')} value={money(card?.balance ?? 0)} />
        <StatTile
          tone="light"
          label={t('transactions.stat.earned', { month: monthName })}
          value={`+${money(summary.earned)}`}
          valueClassName="text-success"
        />
        <StatTile
          tone="light"
          label={t('transactions.stat.spent', { month: monthName })}
          value={`−${money(summary.spent)}`}
          valueClassName="text-brand"
        />
      </div>

      <TransactionFilters
        source={source}
        onSourceChange={(next) => {
          setSource(next);
          setPage(1);
        }}
        kind={kind}
        onKindChange={(next) => {
          setKind(next);
          setPage(1);
        }}
        period={period}
        onPeriodChange={(next) => {
          setPeriod(next);
          setPage(1);
        }}
      />

      {visible.length === 0 ? (
        <EmptyState
          panel
          icon={Wallet}
          tone="brand"
          title={filtered ? t('transactions.empty.title') : t('tx.empty.title')}
          body={filtered ? t('transactions.empty.body') : t('tx.empty.body')}
          action={
            <Button as="a" href={paths.market} variant="primary" size="xl">
              {t('transactions.empty.shop')}
            </Button>
          }
          secondaryAction={
            filtered ? (
              <Button variant="ghost" size="xl" onClick={resetFilters}>
                {t('transactions.empty.reset')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex w-full flex-col overflow-hidden rounded-xl border border-line bg-surface">
          {/* Real table from md up; a row list below, where five columns cannot fit. */}
          <table className="hidden w-full border-collapse md:table">
            <caption className="sr-only">{t('transactions.tableLabel')}</caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="px-7 py-4 text-start text-micro font-bold tracking-[1px] text-ink3"
                >
                  {t('transactions.col.operation')}
                </th>
                <th
                  scope="col"
                  className="w-[150px] px-0 py-4 text-start text-micro font-bold tracking-[1px] text-ink3"
                >
                  {t('transactions.col.date')}
                </th>
                <th
                  scope="col"
                  className="w-[130px] px-0 py-4 text-start text-micro font-bold tracking-[1px] text-ink3"
                >
                  {t('transactions.col.type')}
                </th>
                <th
                  scope="col"
                  className="w-[110px] px-0 py-4 text-end text-micro font-bold tracking-[1px] text-ink3"
                >
                  {t('transactions.col.amount')}
                </th>
                {showBalance ? (
                  <th
                    scope="col"
                    className="w-[110px] px-0 py-4 text-end text-micro font-bold tracking-[1px] text-ink3"
                  >
                    {t('transactions.col.balance')}
                  </th>
                ) : null}
                <th scope="col" className="w-12 px-7">
                  <span className="sr-only">{t('detail.title')}</span>
                </th>
              </tr>
            </thead>

            {groups.map((group) => (
              <tbody key={group.key}>
                <tr className="bg-surface2">
                  <th
                    scope="colgroup"
                    colSpan={showBalance ? 6 : 5}
                    className="px-7 py-2.5 text-start text-caption font-extrabold text-ink"
                  >
                    <span className="flex flex-row items-center justify-between gap-4">
                      {monthLabel(group.key, locale)}
                      <span className="oz-num text-caption font-semibold text-ink2">
                        {`+${money(group.earned)} · −${money(group.spent)}`}
                      </span>
                    </span>
                  </th>
                </tr>
                {group.rows.map((row) => {
                  const isSpend = row.direction === 'spend';
                  const Glyph = isSpend ? ArrowUpRight : ArrowDownLeft;
                  return (
                    <tr key={`${row.sourceType}-${row.id}`} className="border-t border-line">
                      <td className="px-7 py-0">
                        <Link
                          href={paths.cardTransaction(row.id)}
                          className="flex h-[67px] flex-row items-center gap-[14px] rounded-sm"
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              'flex size-11 shrink-0 items-center justify-center rounded-md',
                              isSpend
                                ? 'bg-brand-soft text-brand'
                                : 'bg-success-soft text-success',
                            )}
                          >
                            <Glyph size={20} />
                          </span>
                          <span className="truncate text-body font-semibold text-ink">
                            {row.storeName || t('tx.storeFallback')}
                          </span>
                        </Link>
                      </td>
                      <td className="text-label text-ink2">
                        {row.createdAt
                          ? `${date(row.createdAt, 'dayMonth')}, ${date(row.createdAt, 'time')}`
                          : ''}
                      </td>
                      <td className="text-label text-ink2">{typeLabel(row)}</td>
                      <td
                        className={cn(
                          'oz-num text-end text-body font-bold',
                          isSpend ? 'text-brand' : 'text-success',
                        )}
                      >
                        {signedMoney(row.signedAmount, money)}
                      </td>
                      {showBalance ? (
                        <td className="oz-num text-end text-label text-ink2">
                          {row.balanceAfter === null ? '—' : money(row.balanceAfter)}
                        </td>
                      ) : null}
                      <td className="px-7">
                        <ChevronRight size={20} aria-hidden="true" className="text-ink3" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>

          <ul className="m-0 flex list-none flex-col px-5 md:hidden">
            {visible.map((row) => (
              <li key={`m-${row.sourceType}-${row.id}`} className="w-full">
                <BonusTransactionRow transaction={row} chevron />
              </li>
            ))}
          </ul>

          <div className="flex w-full flex-col items-center gap-4 border-t border-line px-7 py-[18px] md:flex-row md:justify-between">
            <p className="m-0 text-label text-ink2">
              {t('transactions.range', {
                from: (page - 1) * PAGE_SIZE + 1,
                to: (page - 1) * PAGE_SIZE + visible.length,
                total,
              })}
            </p>
            <Pagination
              page={page}
              pageCount={pageCount}
              onPageChange={setPage}
              label={t('transactions.pagination')}
              prevLabel={t('transactions.prevPage')}
              nextLabel={t('transactions.nextPage')}
            />
          </div>
        </div>
      )}
    </>
  );
}

function StatTile({
  tone,
  label,
  value,
  valueClassName,
}: {
  tone: 'dark' | 'light';
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-1.5 rounded-xl px-7 py-6',
        tone === 'dark' ? 'bg-block' : 'border border-line bg-surface',
      )}
    >
      <span className={cn('text-label', tone === 'dark' ? 'text-on-block2' : 'text-ink2')}>
        {label}
      </span>
      <span
        className={cn(
          'oz-num text-h2 font-extrabold tracking-[-1px]',
          tone === 'dark' ? 'text-on-block' : 'text-ink',
          valueClassName,
        )}
      >
        {value}
      </span>
    </div>
  );
}
