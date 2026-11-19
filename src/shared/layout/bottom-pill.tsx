'use client';

/**
 * Floating mobile tab bar (<768px) — node `Bottom Tab Bar` in
 * `html/app-states/app-esas-mobil-390.html`.
 *
 * `position: fixed; left: 20px; right: 20px; bottom: calc(28px +
 * env(safe-area-inset-bottom))`, 68 high, pill, fill `block` (dark in BOTH
 * themes), padding 0/8, shadow `chip`, items space-between.
 * Active tab = 52 high pill, padding 0/16, `brand` fill, 20 px icon + 13/700
 * white label, gap 6. Inactive = 44x52, icon only, white.
 *
 * Content must carry 120 px bottom padding so nothing hides behind it
 * (layout.md §4) — `AppShell` does that.
 */

import { useTranslations } from 'next-intl';

import { Link, usePathname } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { bottomNav, isNavItemActive } from '@/core/routes';

import { badgeCountFor, type ShellBadges } from './sidebar';

export interface BottomPillProps {
  badges?: ShellBadges;
  className?: string;
}

export function BottomPill({ badges, className }: BottomPillProps) {
  const t = useTranslations('nav');
  const shell = useTranslations('shell');
  const pathname = usePathname();
  const items = bottomNav;

  return (
    <nav
      role="navigation"
      aria-label={shell('bottomNav.label')}
      className={cn(
        'fixed inset-x-5 z-40 flex h-[68px] items-center justify-between rounded-pill bg-block px-2 shadow-chip',
        'md:hidden',
        className,
      )}
      style={{ bottom: 'calc(28px + env(safe-area-inset-bottom))' }}
    >
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
              'relative flex h-[52px] shrink-0 items-center justify-center gap-1.5 rounded-pill',
              'transition-colors duration-[var(--oz-dur-fast)] active:scale-[.98]',
              active ? 'bg-brand px-4' : 'w-11 px-3',
            )}
          >
            <Icon
              size={20}
              className={cn('shrink-0 text-white', active ? undefined : 'opacity-60')}
              aria-hidden="true"
            />
            {active ? (
              <span className="text-caption font-bold text-white">{label}</span>
            ) : (
              <span className="sr-only">{label}</span>
            )}
            {count ? (
              <span className="absolute right-1 top-0 grid size-[18px] place-items-center rounded-pill bg-brand text-nano font-bold text-white">
                <span aria-hidden="true">{count}</span>
                <span className="sr-only">{count}</span>
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
