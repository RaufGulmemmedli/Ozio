'use client';

/**
 * The amount card on `/topup/card` (`topup-card.html` → `Amount`).
 *
 * Measured: `surface` card, radius 28, padding 28, gap 18. Label 14/600 `ink2`; the field is an
 * 84-high `bg`-filled box, radius 20, padding-inline 24, with a 2px `brand` focus ring
 * (`outline: 2px solid #EE3768; outline-offset: -1px` in the export) — reproduced with
 * `focus-within:outline`. The amount itself is 44/800 `ink` and the ₼ suffix 32/700 `ink3`.
 * Quick-amount chips are 44 high, radius 999, padding-inline 22, 15/700; the selected one is
 * `cta`/`on-cta`. The limits line under them is 13/400 `ink3`.
 *
 * **Validation is server-driven.** The zod schema is rebuilt from the `limits` prop — the mock
 * `GET /api/mock/topup/limits` response — so no bound is ever typed in a component, and when the
 * server sends no range none is shown or enforced (api/mock-modules.md §5).
 *
 * A native `<input>` with `inputmode="decimal"` keeps the mobile keypad numeric while still
 * allowing the comma az/ru use.
 */
import { useTranslations } from 'next-intl';
import { useId } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { MANAT, useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';

import type { TopupLimits } from '../data/models/topup-limits';
import type { TopupFormValues } from '../hooks/use-topup-form';

export interface TopupAmountCardProps {
  form: UseFormReturn<TopupFormValues>;
  limits: TopupLimits;
  /** Sets the field from a quick-amount chip. */
  onPickQuickAmount: (amount: number) => void;
  /** The currently parsed amount, so the active chip can be highlighted. */
  amount: number | null;
  disabled?: boolean;
  className?: string;
}

export function TopupAmountCard({
  form,
  limits,
  onPickQuickAmount,
  amount,
  disabled = false,
  className,
}: TopupAmountCardProps) {
  const t = useTranslations('topup');
  const { money } = useFormat();
  const inputId = useId();
  const helperId = `${inputId}-helper`;

  const error = form.formState.errors.amount?.message;
  const { min, max } = limits;

  const rangeNote =
    min !== null && max !== null
      ? t('amount.range', { min: money(min), max: money(max) })
      : min !== null
        ? t('amount.rangeMin', { min: money(min) })
        : max !== null
          ? t('amount.rangeMax', { max: money(max) })
          : null;

  return (
    <section
      className={cn(
        'flex w-full shrink-0 flex-col items-start gap-[18px] rounded-xl bg-surface p-5 md:p-7',
        className,
      )}
    >
      <label htmlFor={inputId} className="text-label font-semibold text-ink2">
        {t('amount.label')}
      </label>

      <div
        className={cn(
          'flex h-[84px] w-full flex-row items-center gap-[10px] rounded-lg bg-bg px-6',
          'outline-2 -outline-offset-1',
          error ? 'outline-brand' : 'outline-transparent',
          'focus-within:outline-brand',
        )}
      >
        <input
          {...form.register('amount')}
          id={inputId}
          type="text"
          // The decimal keypad, as required: a `number` input would reject the az/ru comma.
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          disabled={disabled}
          placeholder="0,00"
          aria-label={t('amount.aria')}
          aria-invalid={error ? true : undefined}
          aria-describedby={helperId}
          className={cn(
            'min-w-0 flex-1 bg-transparent text-h1-app font-extrabold text-ink tabular-nums',
            'outline-none placeholder:text-ink3 md:text-[44px]',
            'disabled:cursor-not-allowed disabled:opacity-60',
          )}
        />
        <span aria-hidden="true" className="shrink-0 text-h2 font-bold text-ink3">
          {MANAT}
        </span>
      </div>

      {limits.quickAmounts.length > 0 ? (
        <div
          role="group"
          aria-label={t('amount.quickAria')}
          className="flex w-full flex-row flex-wrap items-start gap-[10px]"
        >
          {limits.quickAmounts.map((value) => {
            const selected = amount !== null && Math.abs(amount - value) < 0.005;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onPickQuickAmount(value)}
                disabled={disabled}
                aria-pressed={selected}
                className={cn(
                  'h-11 shrink-0 rounded-pill px-[22px] text-body-sm font-bold',
                  'transition-[background-color,color,transform] duration-[var(--oz-dur-fast)] ease-out',
                  'active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-40',
                  selected ? 'bg-cta text-on-cta' : 'bg-bg text-ink hover:bg-surface2',
                )}
              >
                {money(value)}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* One live region for both the range hint and the validation message, so a screen reader
          hears the error without a second announcement racing it. */}
      <p
        id={helperId}
        role={error ? 'alert' : undefined}
        aria-live="polite"
        className={cn('text-caption', error ? 'font-medium text-brand' : 'text-ink3')}
      >
        {error ?? rangeNote}
      </p>
    </section>
  );
}
