'use client';

/**
 * `/topup/result?ref=<reference>` — both drawn result states
 * (`topup-success.html` node `tksU5`, `topup-failed.html` node `TaNE5`).
 *
 * The outcome is re-read from the demo store by its reference, so a reload or a copied link still
 * shows the right receipt.
 *
 * Measured (success): a centred column, 24 gap, 24 top padding; a 96 `success-soft` disc; 36/800
 * title; 17/400 `ink2` line; a 560-wide `surface` receipt at radius 28 / padding 32 / gap 16 with
 * the rows, a `line` divider and the 16/700 + 24/800 "Yeni balans" pair; then the two 52-high
 * pills and the demo notice. Failure: a 96 `brand-soft` disc, a 520-wide centred 17/400/24 body, a
 * 560 details card, the "Ozio balansın dəyişmədi." note and three 52 pills.
 *
 * **Nothing was charged.** The success copy says so explicitly (`result.success.simulated`), and
 * the real balance shown everywhere else still comes from `GET v1/profile/me`.
 *
 * The state change is announced through `aria-live` on the result region, because the user arrives
 * here from a button press on the previous screen.
 */
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

import { useFailureMessage, useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { Check, Info, X } from '@/shared/lucide';
import { DemoBanner, EmptyState, ErrorState } from '@/shared/states';
import { Button } from '@/shared/ui';
import { Bone, BoneCard, Shimmer } from '@/shared/skeleton';

import { TopupSummaryRow } from '../components/topup-summary-row';
import { useLocaleHref } from '../hooks/use-locale-href';
import { useTopupResult } from '../hooks/use-topup-result';

export function TopupResultView() {
  const t = useTranslations('topup');
  const { money, date } = useFormat();
  const failureMessage = useFailureMessage();
  const localeHref = useLocaleHref();

  const reference = useSearchParams().get('ref') ?? '';
  const result = useTopupResult(reference);

  // No reference at all: nothing to show, and no request to make.
  if (reference.length === 0) {
    return (
      <>
        <PageHeader title={t('title')} backHref={paths.topup} backLabel={t('result.back')} />
        <DemoBanner module="topup" body={t('demo.result')} />
        <EmptyState
          panel
          icon={Info}
          title={t('result.missing.title')}
          body={t('result.missing.body')}
          action={
            <Button as="a" href={localeHref(paths.topup)} size="xl">
              {t('result.missing.action')}
            </Button>
          }
        />
      </>
    );
  }

  if (result.isPending) {
    return (
      <Shimmer label={t('loading')} className="flex w-full flex-col items-center gap-6 pt-6">
        <Bone w={96} h={96} r="pill" />
        <Bone w={280} h={36} r="md" />
        <Bone w={320} h={18} r="md" />
        <BoneCard r="xl" pad={32} gap={16} bordered={false} className="max-w-[560px]" w="100%">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex w-full flex-row items-center justify-between">
              <Bone w={140} h={16} r="md" />
              <Bone w={80} h={16} r="md" />
            </div>
          ))}
        </BoneCard>
        <Bone w={240} h={52} r="pill" />
      </Shimmer>
    );
  }

  if (result.isError || result.data === undefined) {
    return (
      <>
        <PageHeader title={t('title')} backHref={paths.topup} backLabel={t('result.back')} />
        <DemoBanner module="topup" body={t('demo.result')} />
        <ErrorState
          failure={result.error}
          title={t('result.missing.title')}
          message={result.error ? failureMessage(result.error) : t('result.missing.body')}
          retryLabel={t('error.retry')}
          onRetry={() => result.refetch()}
          retrying={result.isRefetching}
          secondaryAction={
            <Button as="a" href={localeHref(paths.topup)} variant="white" size="xl">
              {t('result.missing.action')}
            </Button>
          }
        />
      </>
    );
  }

  const outcome = result.data;

  /* ----------------------------------------------------------------- failure */

  if (outcome.status === 'failed') {
    const { failure } = outcome;
    return (
      <>
        <div
          role="status"
          aria-live="polite"
          className="flex w-full flex-col items-center gap-6 pt-6 text-center"
        >
          <span
            aria-hidden="true"
            className="flex size-24 items-center justify-center rounded-pill bg-brand-soft text-brand"
          >
            <X size={44} strokeWidth={2.5} />
          </span>

          <h1 className="text-h2 font-extrabold text-ink md:text-h1-app">
            {t('result.failed.title')}
          </h1>
          <p className="max-w-[520px] text-body-l leading-6 text-ink2">
            {failure.message.trim() ? failure.message : t('result.failed.body')}
          </p>

          <dl className="flex w-full max-w-[560px] flex-col gap-4 rounded-xl bg-surface p-5 text-start md:p-8">
            <TopupSummaryRow label={t('result.row.amount')} value={money(failure.amount)} />
            {failure.cardLabel ? (
              <TopupSummaryRow label={t('result.row.card')} value={failure.cardLabel} />
            ) : null}
            <TopupSummaryRow
              label={t('result.row.errorCode')}
              value={<span className="font-mono">{failure.errorCode}</span>}
            />
            {failure.reference ? (
              <TopupSummaryRow label={t('result.row.reference')} value={failure.reference} />
            ) : null}
          </dl>

          <p className="flex w-fit flex-row items-center gap-[10px] text-label text-ink2">
            <Info aria-hidden="true" size={16} className="shrink-0" />
            {t('result.failed.balanceNote')}
          </p>

          <div className="flex w-full flex-col items-stretch gap-3 sm:w-fit sm:flex-row sm:items-start">
            <Button as="a" href={localeHref(paths.topupCard)} size="xl">
              {t('result.failed.retry')}
            </Button>
            <Button as="a" href={localeHref(paths.topupCashier)} variant="white" size="xl">
              {t('result.failed.cashier')}
            </Button>
            <Button as="a" href={localeHref(paths.support)} variant="white" size="xl">
              {t('result.failed.support')}
            </Button>
          </div>
        </div>

        <DemoBanner module="topup" body={t('demo.result')} />
      </>
    );
  }

  /* ----------------------------------------------------------------- success */

  const { receipt } = outcome;

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        className="flex w-full flex-col items-center gap-6 pt-6 text-center"
      >
        <span
          aria-hidden="true"
          className="flex size-24 items-center justify-center rounded-pill bg-success-soft text-success"
        >
          <Check size={44} strokeWidth={2.5} />
        </span>

        <h1 className="text-h2 font-extrabold text-ink md:text-h1-app">
          {t('result.success.title')}
        </h1>
        <p className="text-body-l text-ink2">
          {t('result.success.body', { amount: money(receipt.amount) })}
        </p>

        <dl className="flex w-full max-w-[560px] flex-col gap-4 rounded-xl bg-surface p-5 text-start md:p-8">
          <TopupSummaryRow label={t('result.row.amount')} value={money(receipt.amount)} />

          {receipt.fee !== null ? (
            <TopupSummaryRow
              label={t('result.row.fee')}
              value={receipt.fee <= 0 ? t('summary.free') : money(receipt.fee)}
              tone={receipt.fee <= 0 ? 'success' : 'default'}
            />
          ) : null}

          {receipt.cardLabel ? (
            <TopupSummaryRow label={t('result.row.card')} value={receipt.cardLabel} />
          ) : null}

          <TopupSummaryRow label={t('result.row.charged')} value={money(receipt.total)} />

          {receipt.createdAt ? (
            <TopupSummaryRow
              label={t('result.row.date')}
              value={`${date(receipt.createdAt, 'dayMonth')}, ${date(receipt.createdAt, 'time')}`}
            />
          ) : null}

          <TopupSummaryRow label={t('result.row.reference')} value={receipt.reference} />

          {receipt.newBalance !== null ? (
            <>
              <div aria-hidden="true" className="h-px w-full bg-line" />
              <TopupSummaryRow
                label={t('result.row.newBalance')}
                value={money(receipt.newBalance)}
                emphasis
                valueClassName="text-h3"
              />
            </>
          ) : null}
        </dl>

        {/* The honest line: the demo credited nothing and the server balance has not moved. */}
        {receipt.simulated ? (
          <p className="flex w-full max-w-[560px] flex-row items-start gap-[10px] text-start text-label text-ink2">
            <Info aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
            {t('result.success.simulated')}
          </p>
        ) : null}

        <div className="flex w-full flex-col items-stretch gap-3 sm:w-fit sm:flex-row sm:items-start">
          <Button as="a" href={localeHref(paths.card)} size="xl">
            {t('result.success.backToCard')}
          </Button>
          <Button as="a" href={localeHref(paths.cardTransactions)} variant="white" size="xl">
            {t('result.success.transactions')}
          </Button>
        </div>
      </div>

      <DemoBanner module="topup" body={t('demo.result')} />
    </>
  );
}
