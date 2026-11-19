'use client';

/**
 * The summary card on `/topup/card` (`topup-card.html` → `Summary`).
 *
 * Measured: `surface` card, radius 28, padding 28, gap 16, 380 wide (full width below `lg`); title
 * 20/700; rows; a 1px `line` divider; the emphasised "Kartdan çıxılacaq" row; a 56-high pill CTA
 * reading "{amount} ödə"; then the 13/400 `ink3` note "Visa •••• 0092 kartından çıxılacaq".
 *
 * **Every number comes from the server** (`POST /api/mock/topup/quote`). This component does no
 * arithmetic: it prints `quote.amount`, `quote.fee`, `quote.newBalance` and `quote.total` through
 * `useFormat().money`. The fee row is omitted entirely when the server sent no fee, and only an
 * explicit zero reads "Pulsuz" (api/mock-modules.md §5).
 *
 * The CTA is disabled (`surface2`) until the amount validates and a card is selected, and shows
 * the in-button spinner while the simulated payment runs — the one place a spinner is allowed.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { Button } from '@/shared/ui';

import { quoteHasFeeRow, quoteIsFree, type TopupQuote } from '../data/models/topup-quote';
import { TopupSummaryRow } from './topup-summary-row';

export interface TopupSummaryProps {
  /** `null` until the first quote arrives (or while the amount is invalid). */
  quote: TopupQuote | null;
  /** The card label for the note under the CTA. */
  cardLabel: string;
  /** The amount validates, a usable card is selected and no quote is in flight. */
  canSubmit: boolean;
  /** The simulated charge is in flight. */
  paying: boolean;
  /** The quote request itself failed → "Komissiyanı hesablamaq olmadı". */
  quoteFailed: boolean;
  className?: string;
}

export function TopupSummary({
  quote,
  cardLabel,
  canSubmit,
  paying,
  quoteFailed,
  className,
}: TopupSummaryProps) {
  const t = useTranslations('topup');
  const { money } = useFormat();

  const dash = '—';

  return (
    <section
      aria-label={t('summary.title')}
      className={cn(
        'flex w-full shrink-0 flex-col items-start gap-4 rounded-xl bg-surface p-5 md:p-7',
        'lg:w-[380px]',
        className,
      )}
    >
      <h2 className="text-h4 font-bold text-ink">{t('summary.title')}</h2>

      <dl className="flex w-full flex-col gap-4">
        <TopupSummaryRow
          label={t('summary.amount')}
          value={quote ? money(quote.amount) : dash}
        />

        {/* No fee line at all when the server said nothing about a fee. */}
        {quote && quoteHasFeeRow(quote) ? (
          <TopupSummaryRow
            label={t('summary.fee')}
            value={quoteIsFree(quote) ? t('summary.free') : money(quote.fee ?? 0)}
            tone={quoteIsFree(quote) ? 'success' : 'default'}
          />
        ) : null}

        {quote && quote.newBalance !== null ? (
          <TopupSummaryRow label={t('summary.newBalance')} value={money(quote.newBalance)} />
        ) : null}

        <div aria-hidden="true" className="h-px w-full bg-line" />

        <TopupSummaryRow
          label={t('summary.charged')}
          value={quote ? money(quote.total) : dash}
          emphasis
        />
      </dl>

      {quoteFailed ? (
        <p role="alert" className="text-caption font-medium text-brand">
          {t('summary.quoteFailed')}
        </p>
      ) : null}

      <Button
        type="submit"
        size="2xl"
        fullWidth
        loading={paying}
        disabled={!canSubmit || paying}
        className="mt-1"
      >
        {quote ? t('summary.pay', { amount: money(quote.total) }) : t('summary.payEmpty')}
      </Button>

      {/* Announced while the charge runs; the design's "Ödəniş emal olunur / do not close". */}
      <p aria-live="polite" className="text-caption text-ink3">
        {paying ? (
          <>
            <span className="font-semibold text-ink">{t('summary.processing')}</span>{' '}
            {t('summary.doNotClose')}
          </>
        ) : cardLabel ? (
          t('summary.chargedFrom', { card: cardLabel })
        ) : null}
      </p>
    </section>
  );
}
