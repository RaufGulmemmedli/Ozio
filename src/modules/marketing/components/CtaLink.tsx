/**
 * The marketing CTA, as a real link.
 *
 * `<Button>` from `@/shared/ui` is a client component and its `as="a"` form
 * renders a plain `<a>`, which would lose next-intl's locale prefix. The
 * marketing routes have a hard 90 KB gz first-load budget
 * (architecture/07 §JS budget), so internal CTAs render as a server-side
 * `<Link>` with the Button's own measured geometry instead of pulling the button
 * into the client bundle.
 * TODO(shared): `<Button>` has no polymorphic slot that accepts next-intl's
 * `<Link>`; with one, this file goes away.
 *
 * Sizes are the canvas's: 60 high / 32 inline / 17–600 for hero + download CTAs
 * (`QpH2b`, `stYG3`), 52 / 28 / 16 for the in-panel CTA (`DKz2n` → `CTA`),
 * 56 full-width stacked on mobile (layout.md §3 mobile landing).
 */
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n/navigation';

export type CtaVariant = 'brand' | 'ghost' | 'primary' | 'white' | 'ghostOnDark';
export type CtaSize = 'md' | 'lg' | 'xl';

const BASE =
  'inline-flex shrink-0 select-none items-center justify-center gap-2.5 whitespace-nowrap ' +
  'rounded-pill border-[1.5px] border-transparent font-semibold leading-none ' +
  'transition-[background-color,border-color,color,transform] ' +
  'duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)] active:scale-[.97] ' +
  '[&_svg]:shrink-0';

const SIZES: Record<CtaSize, string> = {
  /** 44 / 22 / 15 — inline links. */
  md: 'h-11 px-[22px] text-body-sm',
  /** 52 / 28 / 16 — the Ten panel CTA. */
  lg: 'h-13 px-7 text-body',
  /** 60 / 32 / 17 — hero + download CTAs; 56 and full-width below 768. */
  xl: 'h-14 w-full px-8 text-[17px] md:h-15 md:w-fit',
};

const VARIANTS: Record<CtaVariant, string> = {
  brand: 'bg-brand text-white hover:bg-brand-dark',
  primary: 'bg-cta text-on-cta hover:bg-brand-dark',
  ghost: 'border-ink bg-transparent text-ink hover:bg-ink/8',
  /** Sits on a brand / ink / block panel — the theme-constant white. */
  white: 'bg-white text-on-yellow hover:bg-[color-mix(in_srgb,var(--oz-white)_92%,var(--oz-on-yellow))]',
  ghostOnDark: 'border-white/40 bg-transparent text-white hover:bg-white/10',
};

export interface CtaLinkProps {
  href: string;
  children: ReactNode;
  variant?: CtaVariant;
  size?: CtaSize;
  /** `true` for `tel:` / `mailto:` / store URLs — renders a plain `<a>`. */
  external?: boolean;
  /** Marketing links do not need the router cache warmed; `false` trims requests. */
  prefetch?: boolean;
  'aria-label'?: string;
  className?: string;
}

export function CtaLink({
  href,
  children,
  variant = 'brand',
  size = 'xl',
  external = false,
  prefetch = false,
  className,
  ...rest
}: CtaLinkProps) {
  const classes = cn(BASE, SIZES[size], VARIANTS[variant], className);

  if (external) {
    const offsite = /^https?:\/\//i.test(href);
    return (
      <a
        href={href}
        className={classes}
        {...(offsite ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} prefetch={prefetch} className={classes} {...rest}>
      {children}
    </Link>
  );
}
