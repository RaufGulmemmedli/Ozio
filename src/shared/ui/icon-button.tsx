'use client';

/**
 * <IconButton> — circular icon-only button.
 *
 * Spec: components.md §2 ("Icon button") — 48 desktop top bar (`surface` fill,
 * 22px icon `ink`), 44 tablet/mobile, 36 dialog close (`surface2`, 16px icon).
 * Hover `surface2`. Optional 22px count badge in `brand`.
 */

import * as React from 'react';

import { cn } from '@/core/lib/cn';

/** Diameter in px, straight from the canvas. */
export type IconButtonSize = 48 | 44 | 36;
export type IconButtonTone = 'surface' | 'surface2' | 'ghost';

const SIZES: Record<IconButtonSize, string> = {
  48: 'size-12 [&_svg]:size-[22px]',
  44: 'size-11 [&_svg]:size-5',
  36: 'size-9 [&_svg]:size-4',
};

const TONES: Record<IconButtonTone, string> = {
  surface: 'bg-surface text-ink',
  surface2: 'bg-surface2 text-ink',
  ghost: 'bg-transparent text-ink',
};

const HOVERS: Record<IconButtonTone, string> = {
  surface: 'hover:bg-surface2',
  surface2: 'hover:bg-line',
  ghost: 'hover:bg-ink/8',
};

export interface IconButtonProps
  extends Omit<React.ComponentPropsWithoutRef<'button'>, 'type' | 'aria-label' | 'children'> {
  /** Required: this control has no visible label. */
  'aria-label': string;
  /** 48 (desktop top bar) · 44 (tablet/mobile, default) · 36 (dialog close) */
  size?: IconButtonSize;
  /** Defaults to `surface2` at 36, `surface` otherwise. */
  tone?: IconButtonTone;
  /** The icon element, e.g. `<Bell />`. */
  children: React.ReactNode;
  /** Count badge; `0` / `undefined` renders nothing. */
  count?: number;
  /** Visually-hidden alternative for the badge, e.g. "3 yeni bildiriş". */
  countLabel?: string;
  loading?: boolean;
  as?: 'button' | 'a';
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  ref?: React.Ref<HTMLButtonElement & HTMLAnchorElement>;
}

export function IconButton({
  size = 44,
  tone,
  children,
  count,
  countLabel,
  loading = false,
  as = 'button',
  href,
  className,
  disabled,
  type = 'button',
  ref,
  ...rest
}: IconButtonProps): React.ReactElement {
  const resolvedTone: IconButtonTone = tone ?? (size === 36 ? 'surface2' : 'surface');
  const inert = Boolean(disabled) || loading;

  const classes = cn(
    'relative inline-grid shrink-0 place-items-center rounded-pill',
    'transition-[background-color,color,transform] duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
    '[&_svg]:shrink-0',
    SIZES[size],
    TONES[resolvedTone],
    !inert && HOVERS[resolvedTone],
    !inert && 'active:scale-[.97]',
    inert && 'cursor-not-allowed',
    Boolean(disabled) && 'opacity-40',
    className,
  );

  const badge =
    typeof count === 'number' && count > 0 ? (
      <span className="pointer-events-none absolute -top-0.5 -right-0.5 grid size-[22px] place-items-center rounded-pill bg-brand text-nano font-bold text-on-cta tabular-nums">
        <span aria-hidden="true">{count > 99 ? '99+' : count}</span>
        {countLabel ? <span className="sr-only">{countLabel}</span> : null}
      </span>
    ) : null;

  const content = (
    <>
      {children}
      {badge}
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
