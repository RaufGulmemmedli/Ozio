'use client';

/**
 * The four state panels packed into `pl2-pl3-history-states-freeze-dialog.html`
 * (frame `XXpH0`), plus the guarantee's own expired state:
 *
 * | export node                   | component                     | treatment                                  |
 * | `State · Aktiv kilid yoxdur`  | {@link PriceLocksEmpty}       | `Qiyməti dondur` CTA                        |
 * | `State · Kilidlər yüklənmədi` | {@link PriceLockError}        | retry (`Yenidən cəhd et`)                   |
 * | `State · Kart bağlanır…`      | {@link CardLinkingPanel}      | spinner panel, no actions                   |
 * | `State · Kart bağlanmadı`     | {@link CardLinkFailedPanel}   | retry (`Yenidən cəhd et`)                   |
 *
 * `GuaranteeExpiredPanel` is this module's addition: the six-month window can elapse and the
 * board draws no panel for it (see the hand-off note).
 */
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { preferServerMessage } from '@/core/i18n';
import type { Failure } from '@/core/network';
import { CreditCard, Loader, Lock, Timer } from '@/shared/lucide';
import { EmptyState, ErrorState, StateButton } from '@/shared/states';

export function PriceLocksEmpty({
  tab,
  action,
}: {
  tab: 'active' | 'history';
  action?: ReactNode;
}) {
  const t = useTranslations('price_lock');
  const prefix = tab === 'active' ? 'empty' : 'emptyHistory';

  return (
    <EmptyState
      panel
      tone="brand"
      icon={Lock}
      title={t(`${prefix}.title`)}
      body={t(`${prefix}.body`)}
      action={tab === 'active' ? action : undefined}
    />
  );
}

export function PriceLockError({
  failure,
  onRetry,
  retrying,
  title,
}: {
  failure?: Failure | null;
  onRetry?: () => void;
  retrying?: boolean;
  /** Overrides "Kilidlər yüklənmədi" — PL1 says "Zəmanət yüklənmədi". */
  title?: string;
}) {
  const t = useTranslations('price_lock');
  const message =
    failure && preferServerMessage(failure) ? failure.message.trim() : t('error.body');

  return (
    <ErrorState
      failure={failure ?? null}
      title={title ?? t('error.title')}
      message={message}
      onRetry={onRetry}
      retrying={retrying}
      retryLabel={t('error.retry')}
    />
  );
}

/** `State · Kart bağlanır…` — the `linking` status, shown while `POST guarantee/link` is open. */
export function CardLinkingPanel() {
  const t = useTranslations('price_lock');

  return (
    <EmptyState
      panel
      tone="brand"
      title={t('linking.title')}
      body={t('linking.body')}
      titleAs="h2"
    >
      <Loader aria-hidden="true" size={28} className="oz-spinner text-brand" />
      <span role="status" aria-live="polite" className="sr-only">
        {t('linking.title')}
      </span>
    </EmptyState>
  );
}

/** `State · Kart bağlanmadı` — a wrong card number (422 from the source). */
export function CardLinkFailedPanel({
  failure,
  onRetry,
}: {
  failure?: Failure | null;
  onRetry: () => void;
}) {
  const t = useTranslations('price_lock');
  const message =
    failure && preferServerMessage(failure) ? failure.message.trim() : t('linkError.body');

  return (
    <ErrorState
      failure={failure ?? null}
      icon={CreditCard}
      title={t('linkError.title')}
      message={message}
      onRetry={onRetry}
      retryLabel={t('error.retry')}
    />
  );
}

/**
 * The guarantee's six months ran out. Not drawn in the exports — added because the window is real
 * and `expired` is a state the source can report.
 */
export function GuaranteeExpiredPanel({ onRelink }: { onRelink: () => void }) {
  const t = useTranslations('price_lock');

  return (
    <EmptyState
      panel
      tone="muted"
      icon={Timer}
      title={t('guaranteeExpired.title')}
      body={t('guaranteeExpired.body')}
      action={
        <StateButton size={46} onClick={onRelink}>
          {t('guaranteeExpired.cta')}
        </StateButton>
      }
    />
  );
}
