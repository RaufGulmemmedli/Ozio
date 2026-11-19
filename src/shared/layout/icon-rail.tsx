'use client';

/**
 * Tablet icon rail (768–1199px) — node `Rail` in
 * `html/app-states/app-esas-tablet-768.html`.
 *
 * 88 wide, fill `bg`, 1 px right border `line`, padding 28/16, gap 10, items
 * centred: logo S (84x37), a 16 px spacer, then 56x56 circle items with 22 px
 * icons (active `cta`, inactive `ink2`). Labels appear on hover **and focus**
 * (no hover-only affordances, architecture/07), and the rail expands into an
 * overlay on click.
 *
 * Items come from `railNav` (`@/core/routes/nav`): Kart = `qr-code`,
 * Partnyorlar = `users` here, unlike the sidebar.
 */

import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';

import { Link, usePathname } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { isNavItemActive, railNav } from '@/core/routes';
import { OzioLogo } from '@/shared/brand/ozio-logo';
import { Menu } from '@/shared/lucide';

import { badgeCountFor, type ShellBadges } from './sidebar';

export interface IconRailProps {
  badges?: ShellBadges;
  homeHref?: string;
  className?: string;
}

export function IconRail({ badges, homeHref, className }: IconRailProps) {
  const t = useTranslations('nav');
  const shell = useTranslations('shell');
  const pathname = usePathname();
  const items = railNav;
  const [expanded, setExpanded] = useState(false);
  const overlayId = useId();
  const railRef = useRef<HTMLDivElement>(null);
  const logoHref = homeHref ?? items[0]?.href ?? '/home';

  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false);
    };
    const onPointer = (event: MouseEvent) => {
      if (!railRef.current?.contains(event.target as Node)) setExpanded(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [expanded]);

  // Close the overlay when the route changes (back button included) — adjusted
  // during render rather than in an effect, so there is no cascading render.
  const [overlayPath, setOverlayPath] = useState(pathname);
  if (overlayPath !== pathname) {
    setOverlayPath(pathname);
    if (expanded) setExpanded(false);
  }

  return (
    <div ref={railRef} className={cn('relative shrink-0', className)}>
      <nav
        aria-label={shell('rail.label')}
        className="flex h-full w-rail shrink-0 flex-col items-center gap-2.5 border-r border-line bg-bg px-4 py-7"
      >
        <Link href={logoHref} aria-label="Ozio" className="rounded-md">
          <OzioLogo size="s" tone="ink" decorative />
        </Link>
        <div aria-hidden="true" className="h-4 shrink-0" />

        {items.map((item) => {
          const active = isNavItemActive(item, pathname);
          const Icon = item.icon;
          const count = badgeCountFor(item, badges);
          const label = t(item.labelKey);
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative grid size-14 shrink-0 place-items-center rounded-pill',
                'transition-colors duration-[var(--oz-dur-fast)] active:scale-[.98]',
                active ? 'bg-cta text-on-cta' : 'text-ink2 hover:bg-surface hover:text-ink',
              )}
            >
              <Icon size={22} aria-hidden="true" />
              <span className="sr-only">{label}</span>
              {count ? (
                <span
                  aria-hidden="true"
                  className="absolute right-0 top-0 grid size-5 place-items-center rounded-pill bg-brand text-nano font-bold text-white"
                >
                  {count}
                </span>
              ) : null}
              {/* label on hover AND focus */}
              <span
                aria-hidden="true"
                className={cn(
                  'pointer-events-none absolute left-full z-20 ms-2 hidden whitespace-nowrap rounded-sm bg-ink px-2 py-1',
                  'text-caption font-semibold text-bg group-hover:block group-focus-visible:block',
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}

        <div aria-hidden="true" className="grow" />

        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={overlayId}
          aria-label={shell('rail.expand')}
          onClick={() => setExpanded((open) => !open)}
          className="grid size-14 shrink-0 place-items-center rounded-pill text-ink2 transition-colors duration-[var(--oz-dur-fast)] hover:bg-surface hover:text-ink active:scale-[.98]"
        >
          <Menu size={22} aria-hidden="true" />
        </button>
      </nav>

      {expanded ? (
        <div
          id={overlayId}
          className="absolute left-full top-0 z-30 ms-2 mt-7 flex w-[264px] flex-col gap-1.5 rounded-card bg-surface p-3 shadow-menu"
        >
          {items.map((item) => {
            const active = isNavItemActive(item, pathname);
            const Icon = item.icon;
            return (
              <Link
                key={`expanded-${item.id}`}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                onClick={() => setExpanded(false)}
                className={cn(
                  'flex h-12 items-center gap-[14px] rounded-pill px-4',
                  active ? 'bg-cta text-on-cta' : 'text-ink2 hover:bg-surface2 hover:text-ink',
                )}
              >
                <Icon size={20} aria-hidden="true" />
                <span className={cn('text-body-sm', active ? 'font-bold' : 'font-medium')}>
                  {t(item.labelKey)}
                </span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
