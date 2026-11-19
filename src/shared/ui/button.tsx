'use client';

/**
 * <Button> — the one button of the design system.
 *
 * Spec: design-system/components.md §2 + the "Global interaction rules" block.
 * Base: pill, Geologica 600, icon gap 10, padding-inline 28 (per-size override),
 * fixed height per size, transition `--oz-dur-fast` / `--oz-ease-out`.
 *
 * Icon-only buttons are NOT this component — use <IconButton>.
 */

import * as React from 'react';

import { cn } from '@/core/lib/cn';

export type ButtonVariant = 'primary' | 'brand' | 'white' | 'ghost' | 'soft';
export type ButtonSize = 'md' | 'lg' | 'xl' | '2xl' | '3xl';

/**
 * 20px, 2px stroke, `stroke: currentColor`, 600ms linear (`.oz-spinner` in globals.css).
 * Exported because the stepper reuses it; spinners are allowed ONLY inside buttons,
 * pull-to-refresh and pagination footers.
 */
export function Spinner({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}): React.ReactElement {
  return (
    <svg
      className={cn('oz-spinner shrink-0', className)}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
      <path
        d="M18 10a8 8 0 0 0-8-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const BASE =
  'relative inline-flex shrink-0 select-none items-center justify-center gap-2.5 whitespace-nowrap ' +
  'rounded-pill border-[1.5px] border-transparent font-semibold leading-none ' +
  'transition-[background-color,border-color,color,transform,opacity] ' +
  'duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)] ' +
  '[&_svg]:shrink-0 [&_svg]:size-5';

/** height / padding-inline / label size — measured from the canvas. */
const SIZES: Record<ButtonSize, string> = {
  md: 'h-11 px-[22px] text-body-sm', // 44 / 22 / 15
  lg: 'h-12 px-6 text-body-sm', // 48 / 24 / 15
  xl: 'h-13 px-7 text-body', // 52 / 28 / 16  (default)
  '2xl': 'h-14 px-7 text-body', // 56 / 28 / 16
  '3xl': 'h-15 px-8 text-[17px]', // 60 / 32 / 17
};

/** Resting fill / label / stroke. */
const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-cta text-on-cta',
  brand: 'bg-brand text-on-cta',
  // `white` sits on brand/ink/block panels, so the fill and label are the
  // theme-constant tokens (--oz-white / --oz-on-yellow are both #fff / #111 in
  // light AND dark) rather than surface/ink which flip.
  white: 'bg-white text-on-yellow',
  ghost: 'border-ink bg-transparent text-ink',
  soft: 'bg-surface2 text-ink',
};

/**
 * Hover is pointer-only: Tailwind v4 already wraps every `hover:` utility in
 * `@media (hover: hover)`, so touch devices never get a stuck hover fill.
 */
const HOVERS: Record<ButtonVariant, string> = {
  // cta +8% toward white in light; brand-dark in dark.
  primary:
    'hover:bg-[color-mix(in_srgb,var(--oz-cta)_92%,var(--oz-white))] dark:hover:bg-brand-dark',
  brand: 'hover:bg-brand-dark',
  // surface2 (#EAE5DE) expressed theme-independently: this button lives on dark panels.
  white: 'hover:bg-[color-mix(in_srgb,var(--oz-white)_92%,var(--oz-on-yellow))]',
  ghost: 'hover:bg-ink/8',
  soft: 'hover:bg-line',
};

export interface ButtonProps extends Omit<React.ComponentPropsWithoutRef<'button'>, 'type'> {
  variant?: ButtonVariant;
  /** md 44 · lg 48 · xl 52 (default) · 2xl 56 · 3xl 60 */
  size?: ButtonSize;
  /** Replaces the label with a 20px spinner and locks the current width. */
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  /** Render a real `<a>` (then pass `href`). */
  as?: 'button' | 'a';
  href?: string;
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
  download?: boolean | string;
  type?: 'button' | 'submit' | 'reset';
  ref?: React.Ref<HTMLButtonElement & HTMLAnchorElement>;
}

export function Button({
  variant = 'primary',
  size = 'xl',
  loading = false,
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  as = 'button',
  href,
  className,
  children,
  disabled,
  type = 'button',
  ref,
  ...rest
}: ButtonProps): React.ReactElement {
  const inert = Boolean(disabled) || loading;

  const classes = cn(
    BASE,
    SIZES[size],
    VARIANTS[variant],
    !inert && HOVERS[variant],
    !inert && 'active:scale-[.97]',
    inert && 'cursor-not-allowed',
    Boolean(disabled) && 'opacity-40',
    fullWidth && 'w-full',
    className,
  );

  const content = (
    <>
      {/* While loading the label stays in the DOM (visibility:hidden keeps the
          box) so the button never changes width. */}
      <span
        className={cn(
          'inline-flex items-center justify-center gap-2.5',
          loading && 'invisible',
        )}
      >
        {leadingIcon}
        {children}
        {trailingIcon}
      </span>
      {loading ? (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner />
        </span>
      ) : null}
    </>
  );

  if (as === 'a') {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={inert ? undefined : href}
        aria-busy={loading || undefined}
        aria-disabled={inert || undefined}
        className={cn(classes, inert && 'pointer-events-none')}
        {...(rest as React.ComponentPropsWithoutRef<'a'>)}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      disabled={inert}
      aria-busy={loading || undefined}
      className={classes}
      {...rest}
    >
      {content}
    </button>
  );
}
