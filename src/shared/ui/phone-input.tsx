'use client';

/**
 * <PhoneInput> — dial-code trigger + masked national field `XX XXX XX XX`.
 *
 * Spec: components.md §4 (login phone field `n3ptW`: 60 high, border 2px).
 * The country sheet/popover is owned by the caller — this component only reports
 * the click through `onOpenCountry`.
 *
 * Mask + normalisation come from `@/core/lib/phone` (isomorphic, no deps).
 */

import * as React from 'react';

import { cn } from '@/core/lib/cn';
import {
  AZ_DIAL_CODE,
  AZ_NATIONAL_LENGTH,
  digitsOnly,
  formatAzNational,
  normalizeToE164,
} from '@/core/lib/phone';
import { ChevronDown } from '@/shared/lucide';

import { useFieldControl, type FieldState } from './field';
import { INPUT_CONTROL_CLASSES, inputShellClasses, type InputVariant } from './input';

export interface PhoneValue {
  /** The 9 national digits, unformatted (`501234567`). */
  digits: string;
  /** `+994501234567`, or `null` while the number is incomplete. */
  e164: string | null;
}

export interface PhoneInputProps
  extends Omit<
    React.ComponentPropsWithoutRef<'input'>,
    'value' | 'defaultValue' | 'onChange' | 'type' | 'size'
  > {
  /** Controlled: the national digits (anything else is stripped). */
  value?: string;
  defaultValue?: string;
  onChange?: (next: PhoneValue) => void;
  /** Shown in the trigger pill. Defaults to `+994`. */
  dialCode?: string;
  /** Click/Enter on the dial-code pill — open your own country sheet here. */
  onOpenCountry?: () => void;
  /** Required when `onOpenCountry` is given, e.g. "Ölkə kodunu seç". */
  countryLabel?: string;
  /** 60-high login field = `lg` (the default here); forms elsewhere use `default`. */
  variant?: InputVariant;
  state?: FieldState;
  invalid?: boolean;
  containerClassName?: string;
  ref?: React.Ref<HTMLInputElement>;
}

export function PhoneInput({
  value,
  defaultValue,
  onChange,
  dialCode = AZ_DIAL_CODE,
  onOpenCountry,
  countryLabel,
  variant = 'lg',
  state,
  invalid,
  className,
  containerClassName,
  disabled,
  id,
  onFocus,
  onBlur,
  ref,
  ...rest
}: PhoneInputProps): React.ReactElement {
  const field = useFieldControl();
  const resolvedState: FieldState =
    state ?? (invalid === true ? 'error' : (field?.state ?? 'default'));

  const controlled = value !== undefined;
  const [inner, setInner] = React.useState(() =>
    digitsOnly(defaultValue).slice(0, AZ_NATIONAL_LENGTH),
  );
  const digits = controlled ? digitsOnly(value).slice(0, AZ_NATIONAL_LENGTH) : inner;

  const [focused, setFocused] = React.useState(false);

  const emit = (nextDigits: string) => {
    const capped = nextDigits.slice(0, AZ_NATIONAL_LENGTH);
    if (!controlled) setInner(capped);
    onChange?.({ digits: capped, e164: normalizeToE164(`${dialCode}${capped}`) });
  };

  return (
    <div
      className={cn(
        inputShellClasses({
          variant,
          state: resolvedState,
          disabled: Boolean(disabled),
          focused,
          filled: digits.length > 0,
        }),
        containerClassName,
      )}
    >
      <button
        type="button"
        onClick={onOpenCountry}
        disabled={(disabled ?? field?.disabled) || !onOpenCountry}
        aria-label={countryLabel}
        aria-haspopup={onOpenCountry ? 'dialog' : undefined}
        className={cn(
          'inline-flex h-9 shrink-0 items-center gap-1 rounded-pill bg-surface2 px-3',
          'text-body font-semibold text-ink tabular-nums',
          'transition-[background-color,transform] duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
          onOpenCountry && 'hover:bg-line active:scale-[.97]',
          !onOpenCountry && 'pointer-events-none',
        )}
      >
        {dialCode}
        {onOpenCountry ? (
          <ChevronDown aria-hidden="true" className="size-4 text-ink2" />
        ) : null}
      </button>

      <input
        ref={ref}
        id={id ?? field?.id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="XX XXX XX XX"
        maxLength={12 /* 9 digits + 3 mask spaces */}
        disabled={disabled ?? field?.disabled}
        required={rest.required ?? field?.required}
        aria-invalid={resolvedState === 'error' || undefined}
        aria-describedby={field?.describedById}
        value={formatAzNational(digits)}
        className={cn(INPUT_CONTROL_CLASSES, 'tabular-nums', className)}
        onChange={(event) => emit(digitsOnly(event.target.value))}
        onPaste={(event) => {
          const pasted = event.clipboardData.getData('text');
          if (!pasted) return;
          event.preventDefault();
          // Accept +994…, 0…, 994… — the helper reduces them all to 9 digits.
          let next = digitsOnly(pasted);
          if (next.startsWith('00')) next = next.slice(2);
          if (next.length > AZ_NATIONAL_LENGTH && next.startsWith('994')) next = next.slice(3);
          if (next.length === AZ_NATIONAL_LENGTH + 1 && next.startsWith('0')) next = next.slice(1);
          emit(next);
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...rest}
      />
    </div>
  );
}
