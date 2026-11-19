'use client';

/**
 * The three panels packed into `gb-states.html` (`GB · Vəziyyətlər`), rebuilt on
 * `<EmptyState panel>` / `<ErrorState>`:
 *
 * | export node                     | component                | treatment                            |
 * | `State · Hələ qrupun yoxdur`    | {@link GroupBuyEmpty}    | brand-soft chip + `Qrup yarat`        |
 * | `State · Qruplar yüklənmədi`    | {@link GroupBuyError}    | retry (`Yenidən cəhd et`)             |
 * | `State · Qrupun vaxtı bitdi`    | {@link GroupDealExpired} | muted chip + `Yeni qrup yarat`        |
 *
 * The fourth node in that frame, `Snackbar · Link kopyalandı`, is the share confirmation and
 * lives in `share-dialog.tsx`.
 *
 * The board only draws the **mine**-tab empty panel; the nearby tab needs its own copy, so
 * `emptyNearby.*` is this module's addition (see the hand-off note).
 */
import { useTranslations } from 'next-intl';

import { preferServerMessage } from '@/core/i18n';
import type { Failure } from '@/core/network';
import { paths } from '@/core/routes';
import { Timer, Users } from '@/shared/lucide';
import { EmptyState, ErrorState, StateButton } from '@/shared/states';

export function GroupBuyEmpty({ tab }: { tab: 'nearby' | 'mine' }) {
  const t = useTranslations('group_buy');
  const prefix = tab === 'mine' ? 'empty' : 'emptyNearby';

  return (
    <EmptyState
      panel
      tone="brand"
      icon={Users}
      title={t(`${prefix}.title`)}
      body={t(`${prefix}.body`)}
      action={
        <StateButton href={paths.groupBuyCreate} size={46}>
          {t('empty.cta')}
        </StateButton>
      }
    />
  );
}

export function GroupBuyError({
  failure,
  onRetry,
  retrying,
  title,
}: {
  failure?: Failure | null;
  onRetry?: () => void;
  retrying?: boolean;
  /** Overrides "Qruplar yüklənmədi" — the deal screen says "Qrup yüklənmədi". */
  title?: string;
}) {
  const t = useTranslations('group_buy');
  // The drawn copy is the default; a 400/422 business message from the source beats it.
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

/** `State · Qrupun vaxtı bitdi` — a first-class state, not an error. */
export function GroupDealExpired() {
  const t = useTranslations('group_buy');

  return (
    <EmptyState
      panel
      tone="muted"
      icon={Timer}
      title={t('expired.title')}
      body={t('expired.body')}
      action={
        <StateButton href={paths.groupBuyCreate} size={46}>
          {t('expired.cta')}
        </StateButton>
      }
    />
  );
}
