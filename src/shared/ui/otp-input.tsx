'use client';

/**
 * <OtpInput> — N single-digit cells.
 *
 * Spec: components.md §4 ("OTP: 6 cells, digit 26/700, cells sized by form width").
 * Cells are `flex-1`, so the row fills whatever container it is dropped into.
 *
 * Auto-advance, Backspace steps back, arrow keys navigate, a full-value paste is
 * distributed across the cells, and `onComplete` fires once all cells are filled.
 * `autoComplete="one-time-code"` on every cell keeps iOS / WebOTP autofill working.
 */

import * as React from 'react';

import { cn } from '@/core/lib/cn';

import { useFieldControl } from './field';

export interface OtpInputProps {
  /** 4–6 cells; the design uses 6. */
  length?: 4 | 5 | 6;
  /** Controlled value (digits only, shorter than `length` while typing). */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Fires when the last cell is filled. */
  onComplete?: (value: string) => void;
  /** Tints every cell's border `brand`. */
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Group label for screen readers, e.g. "Təsdiq kodu". */
  'aria-label'?: string;
  /** Per-cell accessible name, `(index, length) => string`. */
  cellLabel?: (index: number, length: number) => string;
  className?: string;
  ref?: React.Ref<HTMLInputElement>;
}

export function OtpInput({
  length = 6,
  value,
  defaultValue = '',
  onChange,
  onComplete,
  error = false,
  disabled = false,
  autoFocus = false,
  cellLabel,
  className,
  ref,
  ...rest
}: OtpInputProps): React.ReactElement {
  const field = useFieldControl();
  const invalid = error || field?.state === 'error';
  const isDisabled = disabled || Boolean(field?.disabled);

  const controlled = value !== undefined;
  const [inner, setInner] = React.useState(() => sanitize(defaultValue, length));
  const digits = controlled ? sanitize(value, length) : inner;

  const cellRefs = React.useRef<Array<HTMLInputElement | null>>([]);
  const completedFor = React.useRef<string | null>(null);

  /**
   * The value as of the last keystroke, which is NOT what `digits` holds during an event.
   *
   * Auto-advance types a digit, commits it and focuses the next cell — all synchronously, inside
   * one handler, so React has not re-rendered yet and every closure still sees the value from
   * BEFORE the keystroke. `onFocus` compared the new cell's index against that stale value, read
   * it as "a cell past the first empty one", and bounced the caret back. The effect was that
   * typing never moved on: the first digit landed, focus snapped to cell 0, and every further
   * digit overwrote it unless the visitor clicked each box by hand.
   */
  const committed = React.useRef(digits);

  React.useEffect(() => {
    // Keeps the ref honest when the value changes from outside (a controlled parent, a reset).
    committed.current = digits;
  }, [digits]);

  const commit = (next: string) => {
    const clean = sanitize(next, length);
    committed.current = clean;
    if (!controlled) setInner(clean);
    onChange?.(clean);
    if (clean.length === length) {
      if (completedFor.current !== clean) {
        completedFor.current = clean;
        onComplete?.(clean);
      }
    } else {
      completedFor.current = null;
    }
  };

  const focusCell = (index: number) => {
    const target = cellRefs.current[Math.max(0, Math.min(length - 1, index))];
    target?.focus();
    target?.select();
  };

  const setAt = (index: number, digit: string): string => {
    const chars = digits.padEnd(length, ' ').split('');
    chars[index] = digit || ' ';
    return chars.join('').replace(/\s+$/u, '').replace(/\s/gu, '');
  };

  return (
    <div
      role="group"
      aria-label={rest['aria-label']}
      aria-describedby={field?.describedById}
      className={cn('flex w-full items-stretch gap-2.5', className)}
    >
      {Array.from({ length }, (_, index) => {
        const char = digits[index] ?? '';
        return (
          <input
            key={index}
            ref={(node) => {
              cellRefs.current[index] = node;
              if (index === 0) {
                if (typeof ref === 'function') ref(node);
                else if (ref) (ref as React.RefObject<HTMLInputElement | null>).current = node;
              }
            }}
            id={index === 0 ? field?.id : undefined}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            // `tel` keeps Android's numeric pad without a spinner
            pattern="[0-9]*"
            maxLength={1}
            value={char}
            disabled={isDisabled}
            autoFocus={autoFocus && index === 0}
            aria-label={cellLabel?.(index, length)}
            aria-invalid={invalid || undefined}
            className={cn(
              'h-16 min-w-0 flex-1 bg-surface text-center text-[26px] font-bold text-ink tabular-nums',
              'rounded-md border-[1.5px] outline-none',
              'transition-[border-color,background-color] duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
              // Border only — the ring that used to sit here drew a second pink frame around the
              // focused cell, on top of `focus:border-brand`. Same reasoning as the input shell
              // in `input.tsx`: components.md §4 makes the brand border the focus indicator.
              invalid ? 'border-brand' : 'border-line focus:border-brand',
              isDisabled && 'cursor-not-allowed bg-surface2 text-ink3 opacity-60',
            )}
            onChange={(event) => {
              const typed = event.target.value.replace(/\D+/gu, '');
              if (!typed) {
                commit(setAt(index, ''));
                return;
              }
              if (typed.length > 1) {
                // autofill / fast typing dropped several digits into one cell
                commit((digits.slice(0, index) + typed).slice(0, length));
                focusCell(Math.min(length - 1, index + typed.length));
                return;
              }
              commit(setAt(index, typed));
              if (index < length - 1) focusCell(index + 1);
            }}
            onKeyDown={(event) => {
              switch (event.key) {
                case 'Backspace':
                  event.preventDefault();
                  if (char) {
                    commit(setAt(index, ''));
                  } else if (index > 0) {
                    commit(setAt(index - 1, ''));
                    focusCell(index - 1);
                  }
                  return;
                case 'Delete':
                  event.preventDefault();
                  commit(setAt(index, ''));
                  return;
                case 'ArrowLeft':
                  event.preventDefault();
                  focusCell(index - 1);
                  return;
                case 'ArrowRight':
                  event.preventDefault();
                  focusCell(index + 1);
                  return;
                case 'Home':
                  event.preventDefault();
                  focusCell(0);
                  return;
                case 'End':
                  event.preventDefault();
                  focusCell(length - 1);
                  return;
                default:
                  return;
              }
            }}
            onPaste={(event) => {
              event.preventDefault();
              const pasted = event.clipboardData.getData('text').replace(/\D+/gu, '');
              if (!pasted) return;
              const next = (digits.slice(0, index) + pasted).slice(0, length);
              commit(next);
              focusCell(next.length >= length ? length - 1 : next.length);
            }}
            onFocus={(event) => {
              // Never leave a hole: clicking ahead of the first empty cell lands on it instead.
              // Read through `committed`, not `digits` — see the ref's note above.
              const filled = committed.current.length;
              if (index > filled) {
                focusCell(filled);
                return;
              }
              event.currentTarget.select();
            }}
          />
        );
      })}
    </div>
  );
}

function sanitize(input: string | undefined, length: number): string {
  return (input ?? '').replace(/\D+/gu, '').slice(0, length);
}
