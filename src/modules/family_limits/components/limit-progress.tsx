'use client';

/**
 * The spend bar: a `surface2` track with an `ink` fill that turns `brand` once the limit is full
 * (`limits-list.html` → `Progress Track` / `Progress Fill`). 10px on the list cards, 14px on the
 * member detail.
 *
 * A real `role="progressbar"` with `aria-valuetext`, so the state is never colour-only: a screen
 * reader hears "25,00 ₼ / 25 ₼" rather than a bare percentage.
 *
 * TODO(core): `@/shared/ui`'s `<Progress>` has no `ink` tone (brand / success / yellow / violet /
 * sky only) and cannot express the drawn neutral bar, so this is a local 20-line stand-in. An
 * `ink` tone there would retire it.
 */
import { cn } from '@/core/lib/cn';

export interface LimitProgressProps {
  /** 0…1, already derived by the API. */
  value: number;
  /** Switches the fill to `brand`. */
  exhausted?: boolean;
  /** Track height in px — 10 on a card, 14 on the detail. */
  height?: 10 | 14;
  /** Accessible name, e.g. "Elvin · həftəlik limit". */
  label: string;
  /** Spoken value, e.g. "25,00 ₼ / 25 ₼". */
  valueText: string;
  className?: string;
}

export function LimitProgress({
  value,
  exhausted = false,
  height = 10,
  label,
  valueText,
  className,
}: LimitProgressProps) {
  const percent = Math.min(100, Math.max(0, Math.round(value * 1000) / 10));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={valueText}
      className={cn('w-full overflow-hidden bg-surface2', className)}
      style={{ height, borderRadius: height / 2 }}
    >
      <div
        className={cn('h-full transition-[width] duration-[var(--oz-dur-base)] ease-out', exhausted ? 'bg-brand' : 'bg-ink')}
        style={{ width: `${percent}%`, borderRadius: height / 2 }}
      />
    </div>
  );
}
