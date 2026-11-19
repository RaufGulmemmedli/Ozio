'use client';

/**
 * The filter row — node `xPpBj` in `app-kart-emeliyyatlar.html`: pills 40 high,
 * padding-inline 18, gap 12, active pill `cta`-filled; a spacer, then the
 * period control on the right (`calendar` glyph + 14/500 label + chevron).
 *
 * Two independent groups, because only one of them is a server parameter:
 *
 *  - **source** (`Hamısı / Mağazada / Onlayn`) drives `source_type`, which the
 *    endpoint requires. `offline` and `online` are the *same path*, so the two
 *    are never requested at once: changing this chip changes the query key, the
 *    previous request is aborted, and `all` is handled as two sequential calls
 *    inside the repository.
 *  - **kind** (`Qazanılan / Xərclənən`) and **period** are client-side: the
 *    endpoint has no direction or date parameter at all.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Calendar, ChevronDown } from '@/shared/lucide';
import { Chip } from '@/shared/ui';

import type { BonusKindFilter, BonusSourceFilter } from '../loyalty_card.query-keys';

export type TransactionPeriod = 'm1' | 'm3' | 'm12' | 'all';

export const PERIOD_MONTHS: Record<TransactionPeriod, number | null> = {
  m1: 1,
  m3: 3,
  m12: 12,
  all: null,
};

export interface TransactionFiltersProps {
  source: BonusSourceFilter;
  onSourceChange: (source: BonusSourceFilter) => void;
  kind?: BonusKindFilter;
  onKindChange?: (kind: BonusKindFilter) => void;
  period?: TransactionPeriod;
  onPeriodChange?: (period: TransactionPeriod) => void;
  /** The compact row used inside the `/card` panel. */
  compact?: boolean;
  className?: string;
}

const SOURCES: readonly BonusSourceFilter[] = ['all', 'offline', 'online'];
const KINDS: readonly BonusKindFilter[] = ['earned', 'spent'];
const PERIODS: readonly TransactionPeriod[] = ['m1', 'm3', 'm12', 'all'];

export function TransactionFilters({
  source,
  onSourceChange,
  kind,
  onKindChange,
  period,
  onPeriodChange,
  compact = false,
  className,
}: TransactionFiltersProps) {
  const t = useTranslations('loyalty_card');

  return (
    <div
      className={cn(
        'flex w-full flex-row flex-wrap items-center gap-3',
        compact && 'gap-2',
        className,
      )}
    >
      <div
        role="radiogroup"
        aria-label={t('tx.sourceLabel')}
        className="flex flex-row flex-wrap items-center gap-3"
      >
        {SOURCES.map((value) => (
          <Chip
            key={value}
            role="radio"
            aria-checked={source === value}
            selected={source === value}
            onClick={() => onSourceChange(value)}
            className={compact ? 'h-9 px-4 text-[13px]' : undefined}
          >
            {t(`tx.source.${value}`)}
          </Chip>
        ))}
      </div>

      {onKindChange ? (
        <div
          role="radiogroup"
          aria-label={t('tx.kindLabel')}
          className="flex flex-row flex-wrap items-center gap-3"
        >
          {KINDS.map((value) => (
            <Chip
              key={value}
              role="radio"
              aria-checked={kind === value}
              selected={kind === value}
              // Clicking the active kind clears it, which is the "Hamısı" state.
              onClick={() => onKindChange(kind === value ? 'all' : value)}
              className={compact ? 'h-9 px-4 text-[13px]' : undefined}
            >
              {t(`tx.kind.${value}`)}
            </Chip>
          ))}
        </div>
      ) : null}

      {onPeriodChange && period ? (
        <>
          <span aria-hidden="true" className="hidden h-px flex-1 md:block" />
          <label
            className={cn(
              'flex shrink-0 flex-row items-center gap-2 rounded-pill border border-line bg-surface',
              'h-10 px-4 text-label font-medium text-ink',
            )}
          >
            <Calendar size={16} aria-hidden="true" className="shrink-0 text-ink2" />
            <span className="sr-only">{t('transactions.period.label')}</span>
            <select
              value={period}
              onChange={(event) => onPeriodChange(event.target.value as TransactionPeriod)}
              className="appearance-none bg-transparent pe-1 text-label font-medium text-ink outline-none"
            >
              {PERIODS.map((value) => (
                <option key={value} value={value}>
                  {t(`transactions.period.${value}`)}
                </option>
              ))}
            </select>
            <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-ink2" />
          </label>
        </>
      ) : null}
    </div>
  );
}

/** Applies the two client-side filters the endpoint cannot do. */
export function applyClientFilters<T extends { direction: string; createdAt: string | null }>(
  rows: readonly T[],
  kind: BonusKindFilter,
  period: TransactionPeriod,
  now: number = Date.now(),
): T[] {
  const months = PERIOD_MONTHS[period];
  const cutoff = months === null ? null : now - months * 30 * 86_400_000;

  return rows.filter((row) => {
    if (kind === 'earned' && row.direction !== 'earn') return false;
    if (kind === 'spent' && row.direction !== 'spend') return false;
    if (cutoff !== null) {
      if (!row.createdAt) return false;
      const at = Date.parse(row.createdAt);
      if (!Number.isFinite(at) || at < cutoff) return false;
    }
    return true;
  });
}
