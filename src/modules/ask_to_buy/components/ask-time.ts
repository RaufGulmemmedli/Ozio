'use client';

/**
 * The three time shapes the export shows on a request row: `12 dəq əvvəl` (inside the hour),
 * `Dünən, 17:40` (yesterday) and `15 Noy` (older). Anything within today but over an hour old
 * reads as the clock time.
 *
 * Timestamps from the mock API are true UTC ISO strings, so `new Date()` is correct here; the
 * `Baku wall-clock` convention documented in `api/README.md` does not apply to this module.
 */
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

import { useFormat } from '@/core/i18n';

const MINUTE = 60_000;
const startOfDay = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export type AskTimeFormatter = (iso: string) => string;

export function useAskTime(): AskTimeFormatter {
  const t = useTranslations('ask_to_buy');
  const { date, relative } = useFormat();

  return useCallback(
    (iso: string) => {
      const when = new Date(iso);
      if (Number.isNaN(when.getTime())) return '';

      const now = new Date();
      const minutes = Math.round((now.getTime() - when.getTime()) / MINUTE);
      if (minutes < 60) return relative(when, now);

      const dayDiff = Math.round((startOfDay(now) - startOfDay(when)) / 86_400_000);
      if (dayDiff <= 0) return date(when, 'time');
      if (dayDiff === 1) return t('time.yesterday', { time: date(when, 'time') });
      return date(when, 'dayMonth');
    },
    [date, relative, t],
  );
}
