'use client';

/**
 * `/card/transactions/[id]` — "Bonus əməliyyatı detalı" (KT4b), node `ekpKY` in
 * `html/app-profile/app-bonus-emeliyyati-detali.html`.
 *
 * Body `D1ADtW` (row, gap 24): the receipt card (`flex: 1`, r28, padding 36,
 * gap 28) with the summary row (64 icon tile r20, merchant 20/700, date 14/400,
 * amount 44/800/-1.5px and the status chip) over the fact rows (1px `line`
 * dividers, label 15/400 `ink2`, value 15/600 — the balance rows 15/800);
 * beside a 360-wide column with the `block`-filled "BAĞLI SİFARİŞ" card and the
 * "Keşbek səhvdir?" help card.
 *
 * The endpoint has **no by-id operation**, so the row is found in the list
 * (see `useTransaction`). It also sends no cashback percentage, payment method
 * or running balance, so those fact rows only appear when a payload actually
 * carries them — exactly what api/loyalty.md means by "hidden when empty".
 */
import { useTranslations } from 'next-intl';

import { Link, useFailureMessage, useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Check,
  SearchX,
} from '@/shared/lucide';
import { Bone, Shimmer } from '@/shared/skeleton';
import { EmptyState, ErrorState } from '@/shared/states';
import { Button } from '@/shared/ui';

import { signedMoney } from '../components/bonus-transaction-row';
import { useTransaction } from '../hooks/use-transaction';

export interface TransactionDetailViewProps {
  id: string;
  /** `true` inside the intercepted `@modal` slot: no page heading, no side rail. */
  modal?: boolean;
}

export function TransactionDetailView({ id, modal = false }: TransactionDetailViewProps) {
  const t = useTranslations('loyalty_card');
  const failureMessage = useFailureMessage();
  const { money, date, percentPoints } = useFormat();

  const { transaction, isPending, isError, isMissing, error, refetch } = useTransaction(id);

  const heading = modal ? null : (
    <div className="flex w-full flex-col gap-2.5">
      <Link
        href={paths.cardTransactions}
        className="flex w-fit items-center gap-2 rounded-sm text-label font-semibold text-ink2 hover:text-ink"
      >
        <ArrowLeft size={18} aria-hidden="true" />
        {t('detail.back')}
      </Link>
      <h1 className="m-0 text-[28px] font-bold leading-[1.2] tracking-[-0.02em] text-ink md:text-h2 lg:text-h1-app lg:font-extrabold">
        {t('detail.title')}
      </h1>
    </div>
  );

  if (isPending) {
    return (
      <>
        {heading}
        <Shimmer label={t('loading')} className="flex w-full flex-col gap-6 xl:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-7 rounded-xl border border-line bg-surface p-9">
            <div className="flex w-full flex-row items-center gap-5">
              <Bone w={64} h={64} r="lg" />
              <div className="flex flex-1 flex-col gap-2">
                <Bone w={240} h={20} r="sm" />
                <Bone w={160} h={14} r="xs" />
              </div>
              <Bone w={140} h={44} r="sm" />
            </div>
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex w-full flex-row justify-between border-t border-line pt-4">
                <Bone w={130} h={15} r="xs" />
                <Bone w={100} h={15} r="xs" />
              </div>
            ))}
          </div>
          {modal ? null : (
            <div className="flex w-full flex-col gap-5 xl:w-[360px] xl:shrink-0">
              <Bone w="100%" h={220} r="xl" />
              <Bone w="100%" h={200} r="xl" />
            </div>
          )}
        </Shimmer>
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
        />
      </>
    );
  }

  if (isMissing || !transaction) {
    return (
      <>
        {heading}
        <EmptyState
          panel
          icon={SearchX}
          title={t('detail.notFound.title')}
          body={t('detail.notFound.body')}
          action={
            <Button as="a" href={paths.cardTransactions} variant="primary" size="xl">
              {t('detail.back')}
            </Button>
          }
        />
      </>
    );
  }

  const isSpend = transaction.direction === 'spend';
  const Glyph = isSpend ? ArrowUpRight : ArrowDownLeft;
  const store = transaction.storeName || t('tx.storeFallback');

  const facts: Array<{ label: string; value: string; strong?: boolean }> = [
    { label: t('detail.row.type'), value: isSpend ? t('detail.kind.spend') : t('detail.kind.earn') },
    { label: t('detail.row.source'), value: t(`tx.source.${transaction.sourceType}`) },
  ];
  if (transaction.totalAmount > 0) {
    facts.push({ label: t('detail.row.orderAmount'), value: money(transaction.totalAmount) });
  }
  if (transaction.isMixed) {
    facts.push({ label: t('detail.row.earned'), value: `+${money(transaction.earnedBonus)}` });
    facts.push({
      label: t('detail.row.spent'),
      value: `−${money(transaction.spentBonus)}`,
    });
  }
  // Not sent by the live API — shown only when a payload actually carries it.
  if (transaction.bonusPercentage > 0) {
    facts.push({
      label: t('detail.row.cashbackRate'),
      value: percentPoints(transaction.bonusPercentage),
    });
  }
  if (transaction.sourceId) {
    facts.push({ label: t('detail.row.number'), value: `#${transaction.sourceId}` });
  }
  if (transaction.cardNo) {
    facts.push({ label: t('detail.row.card'), value: transaction.cardNo });
  }
  if (transaction.cashDesk) {
    facts.push({ label: t('detail.row.store'), value: transaction.cashDesk });
  }
  if (transaction.paymentMethod) {
    facts.push({ label: t('detail.row.payment'), value: transaction.paymentMethod });
  }
  if (transaction.balanceBefore !== null) {
    facts.push({
      label: t('detail.row.balanceBefore'),
      value: money(transaction.balanceBefore),
      strong: true,
    });
  }
  if (transaction.balanceAfter !== null) {
    facts.push({
      label: t('detail.row.balanceAfter'),
      value: money(transaction.balanceAfter),
      strong: true,
    });
  }

  // Only a delivery order has an order to link to; an in-store receipt does not.
  const orderId = transaction.sourceType === 'online' ? transaction.sourceId : '';

  return (
    <>
      {heading}

      <div className={cn('flex w-full gap-6', modal ? 'flex-col' : 'flex-col xl:flex-row')}>
        <div className="flex min-w-0 flex-1 flex-col gap-7 rounded-xl border border-line bg-surface p-7 md:p-9">
          <div className="flex w-full flex-col items-start gap-5 sm:flex-row sm:items-center">
            <span
              aria-hidden="true"
              className={cn(
                'flex size-16 shrink-0 items-center justify-center rounded-lg',
                isSpend ? 'bg-brand-soft text-brand' : 'bg-success-soft text-success',
              )}
            >
              <Glyph size={28} />
            </span>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="m-0 truncate text-h4 font-bold text-ink">{store}</p>
              <p className="m-0 text-label text-ink2">
                {transaction.createdAt
                  ? `${date(transaction.createdAt, 'long')}, ${date(transaction.createdAt, 'time')}`
                  : ''}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
              <p
                className={cn(
                  'oz-num m-0 text-[44px] font-extrabold leading-none tracking-[-1.5px]',
                  isSpend ? 'text-brand' : 'text-success',
                )}
              >
                {signedMoney(transaction.signedAmount, money)}
              </p>
              <span
                className={cn(
                  'flex h-7 items-center gap-1.5 rounded-pill px-3 text-caption font-bold',
                  isSpend ? 'bg-brand-soft text-brand' : 'bg-success-soft text-success',
                )}
              >
                <Check size={14} aria-hidden="true" />
                {isSpend ? t('detail.status.debited') : t('detail.status.credited')}
              </span>
            </div>
          </div>

          <dl className="m-0 flex w-full flex-col">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="flex w-full flex-row items-center justify-between gap-4 border-t border-line py-4"
              >
                <dt className="text-body-sm text-ink2">{fact.label}</dt>
                <dd
                  className={cn(
                    'oz-num m-0 text-end text-body-sm text-ink',
                    fact.strong ? 'font-extrabold' : 'font-semibold',
                  )}
                >
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <aside
          className={cn(
            'flex w-full flex-col gap-5',
            modal ? '' : 'xl:w-[360px] xl:shrink-0',
          )}
        >
          {orderId ? (
            <div className="flex w-full flex-col gap-4 rounded-xl bg-block p-7">
              <span className="text-micro font-bold tracking-[1.5px] text-on-block2">
                {t('detail.order.eyebrow')}
              </span>
              <p className="m-0 text-h3 font-extrabold text-on-block">
                {t('detail.order.title', { id: orderId })}
              </p>
              <Button as="a" href={paths.order(orderId)} variant="white" size="xl" fullWidth>
                {t('detail.order.cta')}
              </Button>
            </div>
          ) : null}

          <div className="flex w-full flex-col gap-3 rounded-xl border border-line bg-surface p-7">
            <p className="m-0 text-body-l font-extrabold text-ink">{t('detail.help.title')}</p>
            <p className="m-0 text-label text-ink2">{t('detail.help.body')}</p>
            <Button as="a" href={paths.help} variant="soft" size="xl" fullWidth>
              {t('detail.help.cta')}
            </Button>
          </div>
        </aside>
      </div>
    </>
  );
}
