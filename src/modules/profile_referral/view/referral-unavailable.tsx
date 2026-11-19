'use client';

/**
 * `referral-unavailable.html` (node `y4HYy`) — **a first-class state, not an edge case.**
 *
 * `GET v1/profile/me.ref_code` is **null on the live account** and there is no referral endpoint,
 * so this is what a real account shows whenever the demo's sample code is unavailable too
 * (`?preview=empty`, or mocks switched off with `NEXT_PUBLIC_MSW=off`).
 *
 * Measured: `surface` panel, radius 28, padding 64, gap 16, centred; an 88 `brand-soft` disc with
 * a gift glyph; a 24/800 title; 16/400 `ink2` body; the 52-high dark "Yenilə" pill.
 *
 * The export draws the retry icon as lucide `rotate-cw`, which `@/shared/lucide` does not export,
 * so the button ships without a leading icon rather than with a different glyph.
 */
import { useTranslations } from 'next-intl';

import { Gift } from '@/shared/lucide';
import { Button } from '@/shared/ui';

export interface ReferralUnavailableProps {
  onRetry: () => void;
  retrying?: boolean;
}

export function ReferralUnavailable({ onRetry, retrying = false }: ReferralUnavailableProps) {
  const t = useTranslations('referral');

  return (
    <section
      role="status"
      className="flex w-full flex-col items-center gap-4 rounded-xl bg-surface px-5 py-12 text-center md:px-16 md:py-16"
    >
      <span
        aria-hidden="true"
        className="flex size-[88px] items-center justify-center rounded-pill bg-brand-soft text-brand"
      >
        <Gift size={40} />
      </span>

      <h2 className="text-h3 font-extrabold text-ink">{t('unavailable.title')}</h2>
      <p className="max-w-[46ch] text-body text-ink2">{t('unavailable.body')}</p>

      <Button type="button" size="xl" onClick={onRetry} loading={retrying} className="mt-1">
        {t('unavailable.action')}
      </Button>
    </section>
  );
}
