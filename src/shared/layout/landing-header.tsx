'use client';

/**
 * Marketing header — node `HLpCF` in `html/landing/landing-desktop.html`.
 *
 * Nav 88 high (tablet 76, mobile 72), padding 0/120 (→ `px-page`), Logo M,
 * links 16/500 `ink` gap 36 (hover `brand`), an AZ language pill (69x44,
 * `surface2`, "AZ" 14/700 + chevron-down 16), a Login ghost button 44 high and
 * a Download primary button 44 high. Sticky: solid `bg` + 1 px `line` after
 * 8 px of scroll. Below 768 it collapses to logo + menu button opening a sheet
 * (architecture/07).
 */

import { useTranslations } from 'next-intl';
import { useEffect, useId, useState, type ReactNode } from 'react';

import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';
import { OzioLogo } from '@/shared/brand/ozio-logo';
import { ChevronDown, Menu, X } from '@/shared/lucide';

export interface LandingNavLink {
  id: string;
  href: string;
  label: string;
}

export interface LandingHeaderProps {
  /** Defaults to the five canvas links (Keşbek, Market, 10-lar, Partnyorlar, Sual-cavab). */
  links?: LandingNavLink[];
  loginHref?: string;
  downloadHref?: string;
  appHref?: string;
  /** `true` → the CTA becomes "Tətbiqə keç" (architecture/02 Marketing rules). */
  authed?: boolean;
  /** Short locale label for the pill ("AZ"). */
  localeLabel?: string;
  /** Rendered inside the language popover; omitted → the pill just calls `onLocale`. */
  localeMenu?: ReactNode;
  onLocale?: () => void;
  className?: string;
}

export function LandingHeader({
  links,
  loginHref = paths.login,
  downloadHref = '/#download',
  appHref = paths.home,
  authed = false,
  localeLabel = 'AZ',
  localeMenu,
  onLocale,
  className,
}: LandingHeaderProps) {
  const t = useTranslations('shell');
  const [scrolled, setScrolled] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);
  const sheetId = useId();

  const navLinks: LandingNavLink[] =
    links ??
    [
      { id: 'cashback', href: paths.cashback, label: t('landing.links.cashback') },
      { id: 'market', href: paths.delivery, label: t('landing.links.market') },
      { id: 'ten', href: paths.ten, label: t('landing.links.ten') },
      { id: 'partners', href: paths.partners, label: t('landing.links.partners') },
      { id: 'faq', href: `${paths.landing}#faq`, label: t('landing.links.faq') },
    ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSheetOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  /*
   * The filled CTA is the app DOWNLOAD, signed in or not.
   *
   * It used to switch to "Tətbiqə keç" once the session resolved — but so does the outlined
   * button next to it (that one is the auth slot: "Daxil ol" → "Tətbiqə keç", 02-routing.md), so
   * a signed-in visitor saw the same words twice, side by side, both pointing at `/home`.
   *
   * Only one of the two can carry that label, and it has to be the outlined one, because that is
   * the slot whose whole job is the auth state. Which leaves the filled CTA with the job it has
   * on a marketing page anyway: send people to the app stores. It no longer depends on `authed`.
   */
  const ctaHref = downloadHref;
  const ctaLabel = t('landing.download');

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-colors duration-[var(--oz-dur-fast)]',
        scrolled ? 'border-b border-line bg-bg' : 'border-b border-transparent',
        className,
      )}
    >
      <nav
        aria-label={t('nav.label')}
        className="flex h-[72px] w-full items-center justify-between px-page md:h-[76px] lg:h-[88px]"
      >
        <Link href={paths.landing} aria-label="Ozio" className="shrink-0 rounded-md">
          <OzioLogo size="m" tone="ink" decorative />
        </Link>

        {/* links — ≥768 */}
        <ul className="m-0 hidden list-none items-center gap-9 p-0 md:flex">
          {navLinks.map((link) => (
            <li key={link.id}>
              <Link
                href={link.href}
                className="text-body font-medium text-ink transition-colors duration-[var(--oz-dur-fast)] hover:text-brand"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* actions — ≥768 */}
        <div className="hidden shrink-0 items-center gap-3 md:flex">
          <div className="relative">
            <button
              type="button"
              onClick={() => (localeMenu ? setLocaleOpen((open) => !open) : onLocale?.())}
              aria-expanded={localeMenu ? localeOpen : undefined}
              aria-label={t('landing.language')}
              className="flex h-11 items-center gap-1.5 rounded-pill bg-surface2 px-[14px] text-label font-bold text-ink"
            >
              {localeLabel}
              <ChevronDown size={16} aria-hidden="true" />
            </button>
            {localeMenu && localeOpen ? (
              <div className="absolute end-0 top-[calc(100%+8px)] z-50 w-[200px] rounded-lg border border-line bg-surface p-2 shadow-menu">
                {localeMenu}
              </div>
            ) : null}
          </div>

          <Link
            href={authed ? appHref : loginHref}
            className="flex h-11 items-center rounded-pill border-[1.5px] border-ink px-[22px] text-body font-semibold text-ink"
          >
            {authed ? t('landing.toApp') : t('landing.login')}
          </Link>

          <Link
            href={ctaHref}
            className="flex h-11 items-center rounded-pill bg-cta px-[22px] text-body font-semibold text-on-cta"
          >
            {ctaLabel}
          </Link>
        </div>

        {/* mobile — login pill 40 + menu button 40 */}
        <div className="flex shrink-0 items-center gap-2.5 md:hidden">
          <Link
            href={authed ? appHref : loginHref}
            className="flex h-10 items-center rounded-pill bg-cta px-4 text-label font-semibold text-on-cta"
          >
            {authed ? t('landing.toApp') : t('landing.login')}
          </Link>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-expanded={sheetOpen}
            aria-controls={sheetId}
            aria-label={t('landing.menu')}
            className="grid size-10 place-items-center rounded-pill bg-surface2 text-ink"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        </div>
      </nav>

      {/* mobile sheet — TODO(shared): swap for <Sheet> from @/shared/ui */}
      {sheetOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label={t('landing.closeMenu')}
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-overlay"
          />
          <div
            id={sheetId}
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.label')}
            className="absolute inset-x-0 top-0 flex flex-col gap-5 rounded-b-modal bg-surface p-5 pt-6"
          >
            <div className="flex items-center justify-between">
              <OzioLogo size="m" tone="ink" />
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label={t('landing.closeMenu')}
                className="grid size-10 place-items-center rounded-pill bg-surface2 text-ink"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {navLinks.map((link) => (
                <li key={`sheet-${link.id}`}>
                  <Link
                    href={link.href}
                    onClick={() => setSheetOpen(false)}
                    className="flex h-12 items-center rounded-pill px-4 text-body font-medium text-ink hover:bg-surface2"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href={ctaHref}
              onClick={() => setSheetOpen(false)}
              className="flex h-14 items-center justify-center rounded-pill bg-cta text-body font-semibold text-on-cta"
            >
              {ctaLabel}
            </Link>
            <button
              type="button"
              onClick={() => {
                setSheetOpen(false);
                onLocale?.();
              }}
              className="flex h-11 items-center justify-center gap-1.5 rounded-pill bg-surface2 text-label font-bold text-ink"
            >
              {localeLabel}
              <ChevronDown size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
