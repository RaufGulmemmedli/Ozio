'use client';

/**
 * `/card` — "Kart və bonus" (KT1), node `x9Plo` in
 * `html/app-core/app-card-bonus.html`.
 *
 * Content gap 32. Header `VzvRN` (title 36/800/-1px + subtitle 16/400 `ink2`,
 * gap 6) over Body `XgyqW` (row, gap 24): a 560-wide left column (gap 20) with
 * the Ozio card, the Code 128 barcode plate and the two wallet buttons, beside
 * a flexible 528-wide right column (gap 20) with the level-progress block and
 * the "Bonus əməliyyatları" panel.
 *
 * States: guest -> `<GuestGate>` (never an error); loading -> `<CardSkeleton>`;
 * offline -> the cached card plus `<OfflineBanner>`; error -> `<ErrorState>`.
 * `?preview=loading|empty|error|offline` drives all of them through
 * `useScreenQuery`.
 */
import { useTranslations } from 'next-intl';

import { Link, useFailureMessage, useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { Flame, QrCode } from '@/shared/lucide';
import { EmptyState, ErrorState, GuestGate, OfflineBanner } from '@/shared/states';
import { Button } from '@/shared/ui';

import { CardBarcodePanel } from '../components/card-barcode-panel';
import { LevelProgressCard } from '../components/level-progress-card';
import { OzioCard } from '../components/ozio-card';
import { WalletButtons } from '../components/wallet-buttons';
import { useCard } from '../hooks/use-card';
import { useExpiringBonus, useTierLadder } from '../hooks/use-tier-ladder';

import { BonusActivityPanel } from './BonusActivityPanel';
import { CardSkeleton } from './CardSkeleton';

export function CardView() {
  const t = useTranslations('loyalty_card');
  const failureMessage = useFailureMessage();
  const { money } = useFormat();

  const { card, isPending, isError, error, refetch, isGuest, offline, fromCache, isFetching } =
    useCard();
  const { ladder, enabled: tiersOn } = useTierLadder();
  const { expiring } = useExpiringBonus();

  const header = (
    <PageHeader title={t('title')} subtitle={t('subtitle')} />
  );

  if (isGuest) {
    return (
      <>
        {header}
        <GuestGate
          icon={QrCode}
          title={t('guest.title')}
          body={t('guest.body')}
          actionLabel={t('guest.cta')}
          next={paths.card}
        />
      </>
    );
  }

  if (isPending) {
    return (
      <>
        {header}
        <CardSkeleton />
      </>
    );
  }

  if (isError || !card) {
    return (
      <>
        {header}
        <ErrorState
          failure={error}
          title={t('error.title')}
          message={error ? failureMessage(error) : undefined}
          onRetry={refetch}
          retryLabel={t('error.retry')}
          retrying={isFetching}
        />
      </>
    );
  }

  if (!card.hasCard) {
    return (
      <>
        {header}
        <EmptyState
          panel
          icon={QrCode}
          tone="brand"
          title={t('card.noCard.title')}
          body={t('card.noCard.body')}
          action={
            <Button as="a" href={paths.market} variant="primary" size="xl">
              {t('tx.empty.cta')}
            </Button>
          }
        />
      </>
    );
  }

  const currentTier = ladder?.tiers.find((tier) => tier.id === ladder.currentTierId);
  const expirySoon = tiersOn && expiring?.soonest ? expiring.soonest : null;

  return (
    <>
      {offline ? (
        <OfflineBanner
          message={t('offline.banner')}
          actionLabel={t('offline.retry')}
          onRetry={refetch}
          offline={offline}
        />
      ) : null}

      {header}

      <div className="flex w-full flex-col gap-6 xl:flex-row">
        <div className="flex w-full flex-col gap-5 xl:w-[560px] xl:shrink-0">
          <OzioCard
            card={card}
            size="fill"
            flippable
            tier={tiersOn ? currentTier?.name : undefined}
            className="hidden sm:block"
          />
          <OzioCard
            card={card}
            size="sm"
            flippable
            tier={tiersOn ? currentTier?.name : undefined}
            className="sm:hidden"
          />

          <CardBarcodePanel card={card} hint={fromCache ? t('offline.hint') : undefined} />

          {/* Both wallet links need the network (the Google save link is fetched
              per request), so they are hidden while offline rather than failing. */}
          {offline ? null : <WalletButtons />}

          {offline ? (
            <Link
              href={paths.cardOffline}
              className="w-fit rounded-sm text-body-sm font-semibold text-brand underline-offset-4 hover:underline"
            >
              {t('offline.open')}
            </Link>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          {tiersOn && ladder && !offline ? <LevelProgressCard ladder={ladder} /> : null}

          {expirySoon ? (
            <Link
              href={`${paths.cardLevels}#expiring`}
              className="flex w-full flex-row items-center gap-3 rounded-xl bg-yellow px-6 py-4 text-on-yellow transition-opacity hover:opacity-90"
            >
              <Flame size={20} aria-hidden="true" className="shrink-0" />
              <span className="text-body-sm font-bold">
                {t('expiry.chip', {
                  amount: money(expirySoon.amount),
                  days: expirySoon.daysLeft,
                })}
              </span>
            </Link>
          ) : null}

          {/* Bonus transactions are deliberately not cached offline — a stale
              list of money movements would be misleading at the till. */}
          {offline ? null : <BonusActivityPanel />}
        </div>
      </div>
    </>
  );
}
