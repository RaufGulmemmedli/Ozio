'use client';

/**
 * <Field> — the label / control / helper wrapper.
 *
 * Spec: components.md §4 — label 13/600 `ink2` above (gap 8), the control, then a
 * helper row 16px high (gap 6) with an optional 16px icon + 13px text.
 * success → `circle-check` + `success`; error → `circle-alert` + `brand`.
 *
 * The control reads `id` / `aria-invalid` / `aria-describedby` out of
 * <FieldContext> (see `useFieldControl`), so the usual call site is simply:
 *
 *   <Field label={t('phone')} state="error" helper={t('phone.tooShort')}>
 *     <PhoneInput />
 *   </Field>
 */

import * as React from 'react';

import { cn } from '@/core/lib/cn';
import { CircleAlert, CircleCheck } from '@/shared/lucide';

export type FieldState = 'default' | 'success' | 'error';

export interface FieldControlAria {
  id: string;
  /** `aria-describedby` target — the helper row. */
  describedById: string;
  invalid: boolean;
  state: FieldState;
  required: boolean;
  disabled: boolean;
}

const FieldContext = React.createContext<FieldControlAria | null>(null);

/**
 * Read the wiring a surrounding <Field> provides. Returns `null` when the control
 * is used standalone, so every control must tolerate that.
 */
export function useFieldControl(): FieldControlAria | null {
  return React.useContext(FieldContext);
}

export interface FieldProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> {
  label?: React.ReactNode;
  /** Helper / validation text. Announced politely when it changes. */
  helper?: React.ReactNode;
  state?: FieldState;
  /** Explicit id for the control; generated when omitted. */
  htmlFor?: string;
  required?: boolean;
  disabled?: boolean;
  /** Keep the 16px helper row even when there is no helper text (no layout shift). */
  reserveHelper?: boolean;
  /** Hide the icon in the helper row (text-only helper). */
  hideHelperIcon?: boolean;
  children: React.ReactNode | ((aria: FieldControlAria) => React.ReactNode);
}

export function Field({
  label,
  helper,
  state = 'default',
  htmlFor,
  required = false,
  disabled = false,
  reserveHelper = false,
  hideHelperIcon = false,
  className,
  children,
  ...rest
}: FieldProps): React.ReactElement {
  const autoId = React.useId();
  const id = htmlFor ?? `${autoId}-control`;
  const describedById = `${id}-helper`;

  const aria = React.useMemo<FieldControlAria>(
    () => ({
      id,
      describedById,
      invalid: state === 'error',
      state,
      required,
      disabled,
    }),
    [id, describedById, state, required, disabled],
  );

  const hasHelper = helper !== undefined && helper !== null && helper !== false;
  const showRow = hasHelper || reserveHelper;

  const HelperIcon = state === 'success' ? CircleCheck : state === 'error' ? CircleAlert : null;
  const helperTone =
    state === 'success' ? 'text-success' : state === 'error' ? 'text-brand' : 'text-ink2';

  return (
    <div className={cn('flex w-full flex-col gap-2', className)} {...rest}>
      {label ? (
        <label htmlFor={id} className="text-caption font-semibold text-ink2">
          {label}
          {required ? (
            <span aria-hidden="true" className="text-brand">
              {' *'}
            </span>
          ) : null}
        </label>
      ) : null}

      <FieldContext.Provider value={aria}>
        {typeof children === 'function' ? children(aria) : children}
      </FieldContext.Provider>

      <div
        id={describedById}
        aria-live="polite"
        className={cn(
          'flex items-center gap-1.5 text-caption font-normal',
          helperTone,
          showRow ? 'h-4' : 'h-0 overflow-hidden',
        )}
      >
        {hasHelper && HelperIcon && !hideHelperIcon ? (
          <HelperIcon aria-hidden="true" className="size-4 shrink-0" />
        ) : null}
        {hasHelper ? <span className="truncate">{helper}</span> : null}
      </div>
    </div>
  );
}
