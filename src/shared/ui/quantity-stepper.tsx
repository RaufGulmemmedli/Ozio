'use client';

/**
 * <QuantityStepper> — components.md §10 (`E9E5a`).
 *
 * 48 high, padding-inline 4, gap 4, pill, fill `surface2`;
 * minus = 40 circle on `surface` with an `ink` icon, plus = 40 circle on `brand`
 * with a white icon, value 16/700 `ink` centred (min-width 36).
 * `compact` = 40 high (product card).
 *
 * `min: 0` turns the minus button into a `trash-2` once the value is at 1.
 * Weight products pass `step={0.5}` and `unit="kg"`.
 * Hold-to-repeat: 400ms, then every 80ms.
 */

import * as React from 'react';

import { cn } from '@/core/lib/cn';
import { Minus, Plus, Trash2 } from '@/shared/lucide';

import { Spinner } from './button';

const HOLD_DELAY_MS = 400;
const HOLD_INTERVAL_MS = 80;

export type QuantityStepperSize = 'default' | 'compact';
export type QuantityUnit = 'pcs' | 'kg';

export interface QuantityStepperProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'onChange' | 'children'> {
  value: number;
  /** `0` → the minus button becomes a remove (trash) button at `value === 1`. */
  min?: number;
  /** Usually the stock. */
  max?: number;
  /** `0.5` for weight products. */
  step?: number;
  /** Display unit; `kg` renders a comma decimal (`1,5`). */
  unit?: QuantityUnit;
  onChange: (next: number) => void;
  /** Mutates the whole control: both buttons disabled, a spinner over the value. */
  loading?: boolean;
  disabled?: boolean;
  size?: QuantityStepperSize;
  /** aria-label for the minus / remove button, e.g. "Azalt" / "Sil". */
  decreaseLabel: string;
  /** aria-label for the plus button, e.g. "Artır". */
  increaseLabel: string;
  /** Used when `min === 0` and `value === 1`; falls back to `decreaseLabel`. */
  removeLabel?: string;
  /** Override the printed value, e.g. `(v) => fmt.kg(v)`. */
  formatValue?: (value: number) => string;
  /** Spoken on every change, e.g. `(v) => t('quantity', { count: v })`. */
  valueAnnouncement?: (value: number) => string;
  ref?: React.Ref<HTMLDivElement>;
}

export function QuantityStepper({
  value,
  min = 1,
  max,
  step = 1,
  unit = 'pcs',
  onChange,
  loading = false,
  disabled = false,
  size = 'default',
  decreaseLabel,
  increaseLabel,
  removeLabel,
  formatValue,
  valueAnnouncement,
  className,
  ref,
  ...rest
}: QuantityStepperProps): React.ReactElement {
  const compact = size === 'compact';
  const inert = disabled || loading;

  const isRemove = min === 0 && value <= step;
  const canDecrease = !inert && (isRemove || value - step >= min);
  const canIncrease = !inert && (max === undefined || value + step <= max);

  // The repeat timer reads the value between renders, so mirror it in a ref
  // (written in the effect and, for back-to-back ticks, inside `bump`).
  const valueRef = React.useRef(value);
  React.useEffect(() => {
    valueRef.current = value;
  }, [value]);
  const timers = React.useRef<{ timeout?: number; interval?: number }>({});

  const clamp = React.useCallback(
    (next: number): number => {
      const lower = min;
      const upper = max ?? Number.POSITIVE_INFINITY;
      // keep float steps clean: 0.1 + 0.2 must not become 0.30000000000000004
      const rounded = Math.round(next * 1000) / 1000;
      return Math.min(upper, Math.max(lower, rounded));
    },
    [min, max],
  );

  const stopRepeat = React.useCallback(() => {
    if (timers.current.timeout !== undefined) window.clearTimeout(timers.current.timeout);
    if (timers.current.interval !== undefined) window.clearInterval(timers.current.interval);
    timers.current = {};
  }, []);

  React.useEffect(() => stopRepeat, [stopRepeat]);

  const bump = React.useCallback(
    (direction: 1 | -1) => {
      const next = clamp(valueRef.current + direction * step);
      if (next === valueRef.current) {
        stopRepeat();
        return;
      }
      valueRef.current = next;
      onChange(next);
    },
    [clamp, step, onChange, stopRepeat],
  );

  const startRepeat = (direction: 1 | -1) => {
    stopRepeat();
    timers.current.timeout = window.setTimeout(() => {
      timers.current.interval = window.setInterval(() => bump(direction), HOLD_INTERVAL_MS);
    }, HOLD_DELAY_MS);
  };

  const printed = formatValue
    ? formatValue(value)
    : unit === 'kg'
      ? // comma decimal for az/ru; callers with a locale formatter pass `formatValue`
        String(value).replace('.', ',')
      : String(value);

  const buttonBase = cn(
    'grid shrink-0 place-items-center rounded-pill',
    'transition-[background-color,color,transform,opacity] duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
    '[&_svg]:shrink-0',
    compact ? 'size-8 [&_svg]:size-4' : 'size-10 [&_svg]:size-5',
  );

  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 rounded-pill bg-surface2 px-1',
        compact ? 'h-10' : 'h-12',
        inert && 'opacity-60',
        className,
      )}
      {...rest}
    >
      <button
        type="button"
        aria-label={isRemove ? (removeLabel ?? decreaseLabel) : decreaseLabel}
        disabled={!canDecrease}
        onClick={() => bump(-1)}
        onPointerDown={() => canDecrease && !isRemove && startRepeat(-1)}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
        onPointerCancel={stopRepeat}
        onBlur={stopRepeat}
        className={cn(
          buttonBase,
          'bg-surface',
          isRemove ? 'text-brand' : 'text-ink',
          canDecrease ? 'hover:bg-line active:scale-[.97]' : 'cursor-not-allowed opacity-40',
        )}
      >
        {isRemove ? <Trash2 aria-hidden="true" /> : <Minus aria-hidden="true" />}
      </button>

      <span
        className={cn(
          'grid place-items-center text-center text-body font-bold text-ink tabular-nums',
          compact ? 'min-w-8' : 'min-w-9',
        )}
      >
        <span aria-hidden="true">
          {loading ? <Spinner size={compact ? 16 : 20} className="text-ink2" /> : printed}
        </span>
        <span className="sr-only" aria-live="polite">
          {valueAnnouncement ? valueAnnouncement(value) : printed}
        </span>
      </span>

      <button
        type="button"
        aria-label={increaseLabel}
        disabled={!canIncrease}
        onClick={() => bump(1)}
        onPointerDown={() => canIncrease && startRepeat(1)}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
        onPointerCancel={stopRepeat}
        onBlur={stopRepeat}
        className={cn(
          buttonBase,
          'bg-brand text-on-cta',
          canIncrease ? 'hover:bg-brand-dark active:scale-[.97]' : 'cursor-not-allowed opacity-40',
        )}
      >
        <Plus aria-hidden="true" />
      </button>
    </div>
  );
}
