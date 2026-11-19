'use client';

/**
 * The draw countdown from `app-lotereya.html`: four `yellow` tiles, 104x104, radius 24,
 * value 44/800 `on-yellow` over a 13/600 label, at gap 12.
 *
 * The target is `details.end_date` — the **only** date the API sends for a draw — read as
 * Baku wall-clock. There is no "status" field, so a passed target simply renders the
 * "draw finished" line instead of negative numbers.
 *
 * a11y: the tiles are `aria-hidden` and the whole strip carries one `aria-label` with the
 * full text, so a screen reader is not told the seconds every second (`aria-live="off"`).
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';

import { useNow } from './use-now';

export interface CountdownProps {
  /** The draw moment. `null` → nothing is rendered (the API sent no end date). */
  target: Date | null;
  className?: string;
}

interface Parts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

function split(target: Date | null, now: number): Parts {
  if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  const diff = target.getTime() - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  const total = Math.floor(diff / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    done: false,
  };
}

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

export function Countdown({ target, className }: CountdownProps) {
  const t = useTranslations('lottery');
  // The shared 1 s clock. Before it has been read (`0`: the server and the hydrating render) the
  // target itself stands in, so the markup is the same on both sides; the real reading lands in
  // the commit right after hydration and the strip starts ticking.
  const ticked = useNow();
  const now = ticked === 0 ? (target?.getTime() ?? 0) : ticked;

  if (!target) return null;

  const parts = split(target, now);
  if (parts.done) {
    return (
      <p className={cn('text-body-sm text-on-block2', className)}>{t('draw.finished')}</p>
    );
  }

  const tiles: { value: string; label: string }[] = [
    { value: String(parts.days), label: t('countdown.days') },
    { value: pad(parts.hours), label: t('countdown.hours') },
    { value: pad(parts.minutes), label: t('countdown.minutes') },
    { value: pad(parts.seconds), label: t('countdown.seconds') },
  ];

  const spoken = t('countdown.label', {
    days: parts.days,
    hours: parts.hours,
    minutes: parts.minutes,
  });

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={spoken}
      className={cn('flex flex-row flex-wrap gap-3', className)}
    >
      {tiles.map((tile) => (
        <div
          key={tile.label}
          aria-hidden="true"
          className="flex size-[88px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-card bg-yellow md:size-[104px]"
        >
          <span className="text-h2 leading-none font-extrabold text-on-yellow md:text-[44px]">
            {tile.value}
          </span>
          <span className="text-caption font-semibold text-on-yellow">{tile.label}</span>
        </div>
      ))}
    </div>
  );
}
