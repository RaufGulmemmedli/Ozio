'use client';

/**
 * `/card/offline` — KT2, the card that works with the network off.
 *
 * It renders **only** from the `localStorage` snapshot written by the persister
 * in `../data/card-cache.ts`: the number, the real Code 128 barcode and the
 * balance as of the last sync, with an offline banner. No request is fired and
 * **no spinner or skeleton is shown** — if there is no snapshot yet, the screen
 * says so and offers a retry instead of spinning.
 *
 * It is also the automatic state of `/card` (`useOnline()` drives that), so
 * reaching the route directly is only one of two ways in.
 *
 * ROUTES.md lists this as layout `full`. `(app)/layout.tsx` is another agent's
 * file and always wraps its children in `<AppShell>`, so the screen renders as
 * a centred, chrome-free column inside the shell rather than replacing it.
 */
import { useTranslations } from 'next-intl';

import { Link, useFormat } from '@/core/i18n';
import { useOnline } from '@/core/lib/use-online';
import { paths } from '@/core/routes';
import { ArrowLeft, WifiOff } from '@/shared/lucide';
import { EmptyState, OfflineBanner } from '@/shared/states';
import { Button } from '@/shared/ui';

import { CardBarcodePanel } from '../components/card-barcode-panel';
import { OzioCard } from '../components/ozio-card';
import { useCard } from '../hooks/use-card';

export function CardOfflineView() {
  const t = useTranslations('loyalty_card');
  const { money, date } = useFormat();
  const online = useOnline();

  const { card, cachedAt, refetch } = useCard();

  return (
    <section className="mx-auto flex w-full max-w-[560px] flex-col items-stretch gap-6 py-6">
      <Link
        href={paths.card}
        className="flex w-fit items-center gap-2 rounded-sm text-label font-semibold text-ink2 hover:text-ink"
      >
        <ArrowLeft size={18} aria-hidden="true" />
        {t('title')}
      </Link>

      <div className="flex w-full flex-col gap-1.5">
        <h1 className="m-0 text-[28px] font-bold leading-[1.2] tracking-[-0.02em] text-ink md:text-h2">
          {t('offline.title')}
        </h1>
        <p className="m-0 text-body text-ink2">{t('offline.subtitle')}</p>
      </div>

      {/* `offline` is forced on, because this screen is *about* the cached copy
          even when the browser is back online. */}
      <OfflineBanner
        message={t('offline.banner')}
        actionLabel={online ? t('offline.retry') : undefined}
        onRetry={online ? refetch : undefined}
        offline
      />

      {card && card.hasCard ? (
        <>
          <OzioCard card={card} size="fill" />
          <CardBarcodePanel card={card} hint={t('offline.hint')} />
          <p className="m-0 text-caption text-ink2">
            {/* The balance is a server value, shown as of the snapshot. */}
            {money(card.balance)}
            {cachedAt ? ` · ${t('offline.balanceStale', { date: date(cachedAt, 'short') })}` : null}
          </p>
        </>
      ) : (
        <EmptyState
          panel
          icon={WifiOff}
          title={t('offline.empty.title')}
          body={t('offline.empty.body')}
          action={
            <Button variant="primary" size="xl" onClick={refetch} disabled={!online}>
              {t('offline.retry')}
            </Button>
          }
        />
      )}
    </section>
  );
}
