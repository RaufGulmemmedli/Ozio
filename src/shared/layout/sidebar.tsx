'use client';

/**
 * Desktop sidebar (≥1200px) — node `SClvo` in `html/app-core/app-home.html`.
 *
 * 264 wide, no fill (sits on `bg`), padding 28/20, gap 6: Logo M, a 20 px
 * spacer, the nav items (224x48, pill, padding 0/16, gap 14, icon 20 + label
 * 15), a flexible grow spacer, then the App Promo card (224x142, radius 24,
 * `yellow`, padding 20, gap 12).
 *
 * Active: fill `cta`, icon + text `on-cta`, label 700, `aria-current="page"`.
 * Inactive: transparent, icon + text `ink2`, label 500. Hover: `surface` fill +
 * `ink` text. Pressed: `scale(.98)`.
 *
 * The item list is NEVER hardcoded here: it comes from `@/core/routes/nav`
 * (agent F4) and the labels from its `labelKey` via `useTranslations('nav')`.
 */

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { Link, usePathname } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { isNavItemActive, sidebarNav, type NavItem } from '@/core/routes';
import { OzioLogo } from '@/shared/brand/ozio-logo';

/** What the shell renders for one nav entry (the config's own item type). */
export type ShellNavItem = NavItem;

/** Live counters the shell may put on a nav item, keyed by badge bucket or id. */
export type ShellBadges = Record<string, number | undefined>;

export function badgeCountFor(item: NavItem, badges?: ShellBadges): number | undefined {
  if (!badges) return undefined;
  return badges[item.badge ?? item.id];
}

export interface SidebarProps {
  /** Counts for Kuponlar / Sifarişlər etc., keyed by `badge` bucket or item id. */
  badges?: ShellBadges;
  /** Where the logo links. Defaults to the first nav item (`/home`). */
  homeHref?: string;
  /** Replaces the App Promo card (`null` removes it). */
  promo?: ReactNode;
  /** Download link behind the promo CTA. */
  promoHref?: string;
  className?: string;
}

export function Sidebar({ badges, homeHref, promo, promoHref, className }: SidebarProps) {
  const t = useTranslations('nav');
  const shell = useTranslations('shell');
  const pathname = usePathname();
  const items = sidebarNav;
  const logoHref = homeHref ?? items[0]?.href ?? '/home';

  return (
    <nav
      aria-label={shell('sidebar.label')}
      className={cn('flex h-full w-sidebar shrink-0 flex-col gap-1.5 px-5 py-7', className)}
    >
      <Link href={logoHref} aria-label="Ozio" className="w-fit rounded-md">
        <OzioLogo size="m" tone="brand" decorative />
      </Link>
      <div aria-hidden="true" className="h-5 shrink-0" />

      {items.map((item) => {
        const active = isNavItemActive(item, pathname);
        const Icon = item.icon;
        const count = badgeCountFor(item, badges);
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex h-12 w-full shrink-0 items-center gap-[14px] rounded-pill px-4',
              'transition-colors duration-[var(--oz-dur-fast)] ease-[var(--ease-out)] active:scale-[.98]',
              active ? 'bg-cta text-on-cta' : 'text-ink2 hover:bg-surface hover:text-ink',
            )}
          >
            <Icon size={20} className="shrink-0" aria-hidden="true" />
            <span className={cn('text-body-sm', active ? 'font-bold' : 'font-medium')}>
              {t(item.labelKey)}
            </span>
            {count ? (
              <span className="ms-auto grid size-5 shrink-0 place-items-center rounded-pill bg-brand text-nano font-bold text-white">
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}

      <div aria-hidden="true" className="grow" />

      {promo === undefined ? <AppPromoCard href={promoHref} /> : promo}
    </nav>
  );
}

/**
 * "Ozio tətbiqi / Kartın həmişə cibində olsun / Endir" — node `jZ2xQ`.
 * The card is `yellow` in both themes, so its text uses the constant
 * `on-yellow` token and the CTA pill is `on-yellow` with white 14/600.
 */
export function AppPromoCard({ href = '/#download' }: { href?: string }) {
  const shell = useTranslations('shell');

  return (
    <div className="flex w-full shrink-0 flex-col gap-3 rounded-card bg-yellow p-5">
      <p className="m-0 text-body font-extrabold text-on-yellow">{shell('promo.title')}</p>
      <p className="m-0 text-caption leading-[18px] text-on-yellow/70">{shell('promo.body')}</p>
      <Link
        href={href}
        className="flex h-10 w-fit items-center rounded-pill bg-on-yellow px-[18px] text-label font-semibold text-white"
      >
        {shell('promo.cta')}
      </Link>
    </div>
  );
}
