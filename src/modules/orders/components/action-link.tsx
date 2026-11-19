'use client';

/**
 * A button-looking **locale-aware link**.
 *
 * TODO(core): `<Button as="a">` from `@/shared/ui` renders a plain `<a>`, which drops the `/ru`
 * `/en` prefix that `@/core/i18n`'s `<Link>` adds — and wrapping a `<Button>` in a `<Link>` would
 * nest an anchor inside an anchor. A locale-aware link variant belongs in `@/shared/ui`; until it
 * exists, this is the module's one local fallback and every in-app CTA link goes through it, so
 * swapping it for the shared component later is a single-file change.
 *
 * Geometry and tones follow components.md / the exports: pill, 52 high (`xl`, the page CTA) or
 * 44 high (`md`, the in-card CTA), label 16/600.
 */
import type { ReactNode } from 'react';
import { Link } from '@/core/i18n';
import { cn } from '@/core/lib/cn';

export type ActionLinkVariant = 'primary' | 'brand' | 'white' | 'soft' | 'ghost';
export type ActionLinkSize = 'md' | 'xl';

const BASE =
  'relative inline-flex shrink-0 select-none items-center justify-center gap-2.5 whitespace-nowrap rounded-pill font-semibold ' +
  'transition-[background-color,color,transform] duration-[var(--oz-dur-fast)] ease-out active:scale-[.97]';

const SIZES: Record<ActionLinkSize, string> = {
  md: 'h-11 px-7 text-body',
  xl: 'h-13 px-7 text-body',
};

const VARIANTS: Record<ActionLinkVariant, string> = {
  primary: 'bg-cta text-on-cta hover:opacity-90',
  brand: 'bg-brand text-on-cta hover:bg-brand-dark',
  white: 'bg-white text-on-yellow hover:opacity-90',
  soft: 'bg-surface2 text-ink hover:bg-line',
  ghost: 'border border-ink bg-transparent text-ink hover:bg-ink/8',
};

export interface ActionLinkProps {
  href: string;
  variant?: ActionLinkVariant;
  size?: ActionLinkSize;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ActionLink({
  href,
  variant = 'primary',
  size = 'xl',
  fullWidth = false,
  leadingIcon,
  children,
  className,
}: ActionLinkProps) {
  return (
    <Link
      href={href}
      className={cn(BASE, SIZES[size], VARIANTS[variant], fullWidth && 'w-full', className)}
    >
      {leadingIcon}
      {children}
    </Link>
  );
}
