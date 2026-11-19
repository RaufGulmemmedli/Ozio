'use client';

/**
 * <Input> — the one text field of the design system.
 *
 * Spec: components.md §4 (`Input/Default` `Yp9lU`). 56 high, radius 14, fill
 * `surface`, border 1.5 `line`, padding-inline 18, gap 10, leading icon 20 `ink3`,
 * text 16/400, placeholder `ink3`.
 *
 * Variants: `compact` 52 (tablet/mobile search) · `pill` 48 + 1px border
 * (toolbar search `AN4qe`) · `lg` 60 + 2px border (login phone field `n3ptW`).
 *
 * The shell classes are exported so <Textarea>, <Select>, <PhoneInput> and
 * <DateField> wear exactly the same skin.
 */

import * as React from 'react';

import { cn } from '@/core/lib/cn';

import { useFieldControl, type FieldState } from './field';

export type InputVariant = 'default' | 'compact' | 'pill' | 'lg';

/** height / radius / border width / padding-inline per variant. */
const SHELL_GEOMETRY: Record<InputVariant, string> = {
  default: 'h-14 rounded-md border-[1.5px] px-[18px]', // 56
  compact: 'h-13 rounded-md border-[1.5px] px-[18px]', // 52
  pill: 'h-12 rounded-pill border px-[18px]', // 48
  lg: 'h-15 rounded-md border-2 px-[18px]', // 60
};

/**
 * No focus ring here, on purpose.
 *
 * The shell used to carry `has-[:focus-visible]:outline-2 outline-offset-2 outline-brand` on top
 * of the brand border that `inputShellClasses` already applies on focus, so a focused field drew
 * TWO pink frames — an outer offset ring and the border inside it. Text fields match
 * `:focus-visible` on mouse focus as well as keyboard focus, so it showed up on every click.
 *
 * components.md §4 is explicit for inputs: focus is `brand` 1.5–2px and "no extra ring". The
 * border is the focus indicator, and it satisfies the 3:1 non-text contrast requirement in
 * 07-responsive-a11y-perf.md on its own (brand on surface is 3.9:1) — this is a replacement for
 * the default outline, not a removal of it. Every other control (buttons, links, chips, switches)
 * still uses the global `:focus-visible` outline from globals.css.
 */
const SHELL_BASE =
  'flex w-full items-center gap-2.5 bg-surface text-ink ' +
  'transition-[background-color,border-color] duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]';

export interface ShellOptions {
  variant?: InputVariant;
  state?: FieldState;
  disabled?: boolean;
  focused?: boolean;
  filled?: boolean;
  /** Vertical layout (textarea): items-start + padding-block instead of a fixed height. */
  multiline?: boolean;
}

/**
 * Resolve the bordered box. The border colour is computed in JS rather than via
 * CSS pseudo-classes so the precedence (disabled > error/success > focus > filled)
 * is deterministic and never depends on Tailwind's variant ordering.
 */
export function inputShellClasses({
  variant = 'default',
  state = 'default',
  disabled = false,
  focused = false,
  filled = false,
  multiline = false,
}: ShellOptions): string {
  const border = disabled
    ? 'border-line'
    : state === 'error'
      ? 'border-brand'
      : state === 'success'
        ? 'border-success'
        : focused
          ? 'border-brand'
          : filled
            ? 'border-ink'
            : 'border-line hover:border-ink3';

  return cn(
    SHELL_BASE,
    SHELL_GEOMETRY[variant],
    multiline && 'h-auto min-h-14 items-start py-4',
    border,
    disabled && 'cursor-not-allowed bg-surface2 text-ink3 opacity-60',
  );
}

/** The bare control inside the shell: no border, no ring, inherits the box. */
export const INPUT_CONTROL_CLASSES =
  'h-full w-full min-w-0 flex-1 border-0 bg-transparent p-0 text-body font-normal text-ink ' +
  'outline-none placeholder:text-ink3 disabled:cursor-not-allowed ' +
  '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

/** 20px leading icon in `ink3`. */
export const INPUT_ADORNMENT_CLASSES = 'flex shrink-0 items-center text-ink3 [&_svg]:size-5';

export interface InputProps extends Omit<React.ComponentPropsWithoutRef<'input'>, 'size'> {
  variant?: InputVariant;
  /** Overrides the surrounding <Field>'s state. */
  state?: FieldState;
  leadingIcon?: React.ReactNode;
  /** Trailing slot: a clear button, a unit, a chevron… */
  trailing?: React.ReactNode;
  /** Force the error border without a <Field>. */
  invalid?: boolean;
  /** Classes for the bordered shell (the `className` prop styles the `<input>`). */
  containerClassName?: string;
  ref?: React.Ref<HTMLInputElement>;
}

export function Input({
  variant = 'default',
  state,
  leadingIcon,
  trailing,
  invalid,
  className,
  containerClassName,
  disabled,
  id,
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  ref,
  ...rest
}: InputProps): React.ReactElement {
  const field = useFieldControl();
  const resolvedState: FieldState =
    state ?? (invalid === true ? 'error' : (field?.state ?? 'default'));

  const [focused, setFocused] = React.useState(false);
  const [uncontrolledFilled, setUncontrolledFilled] = React.useState(
    () => defaultValue !== undefined && String(defaultValue).length > 0,
  );
  const filled =
    value !== undefined ? String(value).length > 0 : uncontrolledFilled;

  return (
    <div
      className={cn(
        inputShellClasses({
          variant,
          state: resolvedState,
          disabled: Boolean(disabled),
          focused,
          filled,
        }),
        containerClassName,
      )}
    >
      {leadingIcon ? <span className={INPUT_ADORNMENT_CLASSES}>{leadingIcon}</span> : null}
      <input
        ref={ref}
        id={id ?? field?.id}
        disabled={disabled ?? field?.disabled}
        required={rest.required ?? field?.required}
        aria-invalid={resolvedState === 'error' || undefined}
        aria-describedby={field?.describedById}
        value={value}
        defaultValue={defaultValue}
        className={cn(INPUT_CONTROL_CLASSES, className)}
        onChange={(event) => {
          if (value === undefined) setUncontrolledFilled(event.target.value.length > 0);
          onChange?.(event);
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
      {trailing ? (
        <span className={cn(INPUT_ADORNMENT_CLASSES, 'text-ink2')}>{trailing}</span>
      ) : null}
    </div>
  );
}
