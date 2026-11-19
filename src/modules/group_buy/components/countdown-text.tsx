'use client';

/**
 * "5 saat 12 dəq qalıb" — the countdown copy, and the only place it is formatted.
 *
 * The instant comes from the source (`deal.closesAt`); the text is `closesAt − now`, re-read on a
 * timer that is coarse until the last minute (see `hooks/use-countdown.ts`).
 *
 * Accessibility: the visible text is `aria-hidden` on the one screen that announces, and the
 * sibling `aria-live="polite"` region carries a **coarse** sentence — days and hours only, then
 * "bir saatdan az qalıb", then "vaxt bitdi". It therefore changes at most once an hour instead of
 * once a tick, so a screen reader is never interrupted by a ticking clock.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';

import { useCountdown, type Countdown } from '../hooks/use-countdown';

/** The visible sentence: minute precision, as drawn. */
export function useCountdownText(cd: Countdown): string {
  const t = useTranslations('group_buy');
  if (cd.unknown) return '';
  if (cd.elapsed) return t('countdown.ended');
  if (cd.days > 0) {
    return cd.hours > 0
      ? t('countdown.daysHours', { days: cd.days, hours: cd.hours })
      : t('countdown.days', { days: cd.days });
  }
  if (cd.hours > 0) return t('countdown.hoursMinutes', { hours: cd.hours, minutes: cd.minutes });
  return t('countdown.minutes', { minutes: cd.minutes });
}

/** The announced sentence: hour precision, so the live region is not re-read every minute. */
function useCountdownAnnouncement(cd: Countdown): string {
  const t = useTranslations('group_buy');
  if (cd.unknown) return '';
  if (cd.elapsed) return t('countdown.ended');
  if (cd.days > 0) {
    return cd.hours > 0
      ? t('countdown.daysHours', { days: cd.days, hours: cd.hours })
      : t('countdown.days', { days: cd.days });
  }
  if (cd.hours > 0) return t('countdown.hours', { hours: cd.hours });
  return t('countdown.lastHour');
}

/**
 * The bare duration, with no "qalıb" suffix — GB5b says "vaxt bitənədək 5 saat 12 dəq".
 */
export function useDurationText(cd: Countdown): string {
  const t = useTranslations('group_buy');
  if (cd.unknown) return '';
  if (cd.elapsed) return t('countdown.ended');
  if (cd.days > 0) {
    return cd.hours > 0
      ? t('duration.daysHours', { days: cd.days, hours: cd.hours })
      : t('duration.days', { days: cd.days });
  }
  if (cd.hours > 0) return t('duration.hoursMinutes', { hours: cd.hours, minutes: cd.minutes });
  return t('duration.minutes', { minutes: cd.minutes });
}

export interface CountdownTextProps {
  /** ISO instant from the source. */
  closesAt: string;
  /** Fired once when the window elapses with the screen open — the caller refetches. */
  onElapsed?: () => void;
  /**
   * Add the polite live region. **One per screen** (the deal detail hero): a grid of deal cards
   * would otherwise announce four countdowns over each other, so the cards render the text
   * statically and carry it in their own accessible name instead.
   */
  announce?: boolean;
  className?: string;
}

export function CountdownText({
  closesAt,
  onElapsed,
  announce = false,
  className,
}: CountdownTextProps) {
  const t = useTranslations('group_buy');
  const cd = useCountdown(closesAt, onElapsed);
  const text = useCountdownText(cd);
  const announcement = useCountdownAnnouncement(cd);

  return (
    <>
      <span
        aria-hidden={announce ? 'true' : undefined}
        className={cn('whitespace-nowrap', className)}
      >
        {text}
      </span>
      {announce ? (
        <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {t('countdown.label')}: {announcement}
        </span>
      ) : null}
    </>
  );
}
