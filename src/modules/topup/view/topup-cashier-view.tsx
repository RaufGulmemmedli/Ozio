'use client';

/**
 * `/topup/cashier` — "Kassada artır" (`topup-cashier.html`, node `kekfa`).
 *
 * Real / mock split:
 *  - **real**: the Ozio card number, the holder name and the balance (`GET v1/profile/me`);
 *  - **mock**: the four till steps and the nearby-market list (there is no till-locations endpoint;
 *    `GET /stores` is dead on live and `stores/search` returns shops, not tills).
 *
 * The barcode is a **real Code 128** symbol from `<Barcode>` (`@/shared/media`, encoder in
 * `@/core/lib/barcode`) over the real card number, and `<QrCodeView>` renders the same number as a
 * real QR for tills that scan 2-D codes. The export draws only the barcode; the QR is the one
 * addition, placed beside the number so the plate's proportions are unchanged.
 *
 * Missing card → the documented "Ozio kartı tapılmadı" empty state.
 */
import { useTranslations } from 'next-intl';

import { useFailureMessage, useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { CreditCard } from '@/shared/lucide';
import { Barcode, QrCodeView } from '@/shared/media';
import { DemoBanner, EmptyState, ErrorState } from '@/shared/states';
import { Button } from '@/shared/ui';

import { topupDisplayNumber } from '../data/models/topup-account';
import { useCashierInfo } from '../hooks/use-cashier-info';
import { useLocaleHref } from '../hooks/use-locale-href';
import { useTopupAccount } from '../hooks/use-topup-account';
import { TopupCashierSkeleton } from './topup-cashier-skeleton';

export function TopupCashierView() {
  const t = useTranslations('topup');
  const { money, number } = useFormat();
  const failureMessage = useFailureMessage();
  const localeHref = useLocaleHref();

  const account = useTopupAccount();
  const info = useCashierInfo();

  const header = (
    <PageHeader
      title={t('cashier.title')}
      subtitle={t('cashier.subtitle')}
      backHref={paths.topup}
      backLabel={t('cashier.back')}
    />
  );

  if (account.isPending || info.isPending) {
    return (
      <>
        {header}
        <TopupCashierSkeleton />
      </>
    );
  }

  if (account.isError) {
    return (
      <>
        {header}
        <DemoBanner module="topup" body={t('demo.cashier')} />
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

  if (!data || !data.hasCard) {
    return (
      <>
        {header}
        <DemoBanner module="topup" body={t('demo.cashier')} />
        <EmptyState
          panel
          tone="brand"
          icon={CreditCard}
          title={t('cashier.noCard.title')}
          body={t('cashier.noCard.body')}
          action={
            <Button as="a" href={localeHref(paths.card)} size="xl">
              {t('cashier.noCard.action')}
            </Button>
          }
        />
      </>
    );
  }

  const displayNumber = topupDisplayNumber(data.cardNumber);
  const steps = info.data?.steps ?? [];
  const nearby = info.data?.nearby ?? [];

  /** "350 m" / "1,2 km" — the unit switch and the formatting both live here, not in the fixture. */
  const distance = (meters: number): string =>
    meters < 1000
      ? t('cashier.distanceM', { value: number(meters) })
      : t('cashier.distanceKm', { value: number(meters / 1000, { maximumFractionDigits: 1 }) });

  return (
    <>
      {header}
      <DemoBanner module="topup" body={t('demo.cashier')} />

      <div className="flex w-full flex-col items-start gap-6 lg:flex-row">
        <section
          aria-label={t('cashier.cardLabel')}
          className="flex min-w-0 w-full flex-1 flex-col items-center gap-5 rounded-xl bg-surface p-5 md:p-8"
        >
          <div className="flex w-full flex-row items-center justify-between gap-4">
            <p className="text-label font-semibold text-ink2">{t('cashier.cardLabel')}</p>
            <p className="text-body font-extrabold text-ink tabular-nums">
              {t('cashier.balance', { balance: money(data.balance) })}
            </p>
          </div>

          {/* A real Code 128 symbol. `<Barcode>` already sets role="img" and the accessible name;
              the number is passed explicitly so the label reads as a card number, not raw digits. */}
          <Barcode
            value={data.cardNumber}
            display={false}
            height={152}
            label={t('cashier.barcodeAria', { number: displayNumber })}
            className="rounded-lg"
          />

          <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
            <div className="flex flex-col items-center gap-1">
              <p className="text-body-sm font-bold tracking-[2px] text-ink tabular-nums sm:text-h4 sm:tracking-[3px]">
                {displayNumber}
              </p>
              {data.holderName ? (
                <p className="text-label text-ink3">{data.holderName}</p>
              ) : null}
            </div>

            {/* Same number, as a real QR, for tills that scan 2-D codes. */}
            <QrCodeView
              value={data.cardNumber}
              label={t('cashier.qrAria')}
              size={132}
              caption={t('cashier.qrCaption')}
            />
          </div>
        </section>

        <div className="flex w-full flex-col gap-6 lg:w-[420px] lg:shrink-0">
          <section className="flex w-full flex-col items-start gap-[18px] rounded-xl bg-surface p-5 md:p-7">
            <h2 className="text-h4 font-bold text-ink">{t('cashier.steps')}</h2>
            <ol className="flex w-full flex-col gap-[18px]">
              {steps.map((step) => (
                <li key={step.index} className="flex w-full flex-row items-center gap-[14px]">
                  <span
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center rounded-pill bg-brand-soft text-label font-extrabold text-brand"
                  >
                    {step.index}
                  </span>
                  <span className="min-w-0 flex-1 text-body-sm leading-5 text-ink">
                    {step.text}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="flex w-full flex-col items-start gap-[14px] rounded-xl bg-surface p-5 md:p-7">
            <h2 className="text-h4 font-bold text-ink">{t('cashier.nearby')}</h2>
            {nearby.length === 0 ? (
              <p className="text-body-sm text-ink3">{t('cashier.nearbyEmpty')}</p>
            ) : (
              <ul className="flex w-full flex-col gap-[14px]">
                {nearby.map((market) => (
                  <li
                    key={market.id}
                    className="flex w-full flex-row items-center justify-between gap-3"
                  >
                    <span className="min-w-0 flex-1 text-body-sm font-semibold text-ink">
                      {market.name}
                    </span>
                    <span className="shrink-0 text-caption text-ink3 tabular-nums">
                      {distance(market.distanceMeters)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
