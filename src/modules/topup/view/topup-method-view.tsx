'use client';

/**
 * `/topup` — "Balansı artır", the method chooser (`topup-method.html`, node `enafo`).
 *
 * Real / mock split on this screen:
 *  - the balance block and the card number are **real** (`GET v1/profile/me`);
 *  - the limits note under the methods is **mock** (`GET /api/mock/topup/limits`) and is omitted
 *    entirely when the server sends no range.
 *
 * States: loading → `TopupMethodSkeleton` (the drawn mirror), error → `<ErrorState>` with a retry,
 * and the two method rows are always real links, so the screen is never blank.
 */
import { useTranslations } from 'next-intl';

import { useFailureMessage, useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { CreditCard, Info, Store } from '@/shared/lucide';
import { PageHeader } from '@/shared/layout';
import { DemoBanner, ErrorState } from '@/shared/states';

import { TopupBalanceCard } from '../components/topup-balance-card';
import { TopupMethodRow } from '../components/topup-method-row';
import { useTopupAccount } from '../hooks/use-topup-account';
import { useTopupLimits } from '../hooks/use-topup-limits';
import { TopupMethodSkeleton } from './topup-method-skeleton';

export function TopupMethodView() {
  const t = useTranslations('topup');
  const { money } = useFormat();
  const failureMessage = useFailureMessage();

  const account = useTopupAccount();
  const limits = useTopupLimits();

  const header = (
    <PageHeader
      title={t('title')}
      subtitle={t('subtitle')}
      backHref={paths.card}
      backLabel={t('back')}
    />
  );

  if (account.isPending || limits.isPending) {
    return (
      <>
        {header}
        <TopupMethodSkeleton />
      </>
    );
  }

  // The balance is the point of this screen, so a failed profile read is a page-level error.
  if (account.isError) {
    return (
      <>
        {header}
        <DemoBanner module="topup" body={t('demo.method')} />
        <ErrorState
          failure={account.error}
          title={t('error.title')}
          message={failureMessage(account.error)}
          retryLabel={t('error.retry')}
          onRetry={() => account.refetch()}
          retrying={account.isRefetching}
        />
      </>
    );
  }

  const data = account.data;
  const limitRange = limits.data ?? null;
  const min = limitRange?.min ?? null;
  const max = limitRange?.max ?? null;

  const limitsNote =
    min !== null && max !== null
      ? t('limitsNote', { min: money(min), max: money(max) })
      : min !== null
        ? t('limitsNoteMin', { min: money(min) })
        : max !== null
          ? t('limitsNoteMax', { max: money(max) })
          : null;

  return (
    <>
      {header}
      <DemoBanner module="topup" body={t('demo.method')} />

      <div className="flex w-full flex-col items-start gap-6 lg:flex-row">
        <section
          aria-label={t('methods.title')}
          className="flex min-w-0 flex-1 flex-col items-start gap-4"
        >
          <h2 className="text-h4 font-bold text-ink">{t('methods.title')}</h2>

          <TopupMethodRow
            href={paths.topupCard}
            tone="brand"
            icon={<CreditCard size={28} aria-hidden="true" />}
            title={t('methods.card.title')}
            tag={t('methods.card.tag')}
            body={t('methods.card.body')}
          />

          <TopupMethodRow
            href={paths.topupCashier}
            tone="sky"
            icon={<Store size={28} aria-hidden="true" />}
            title={t('methods.cashier.title')}
            body={t('methods.cashier.body')}
          />

          {limitsNote ? (
            <p className="flex w-fit flex-row items-center gap-[10px] text-label text-ink3">
              <Info aria-hidden="true" size={16} className="shrink-0" />
              {limitsNote}
            </p>
          ) : null}
        </section>

        {data ? <TopupBalanceCard account={data} /> : null}
      </div>
    </>
  );
}
