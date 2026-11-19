/**
 * The three-mode app shell (layout.md §4, architecture/07 "App shell collapse").
 *
 *  ≥1200px  `Sidebar` 264 (no fill, on `bg`, padding 28/20, gap 6) + Main with
 *           TopBar 88 and Content (padding 8/32/48, gap 32, content 1112,
 *           fills the main column at every width)
 *  768–1199 `IconRail` 88 (fill `bg`, 1 px right border `line`) + top bar 88
 *           (search 448x52 + three 44 circles)
 *  <768     top bar 72 (padding 0/20, gap 10) + content (padding 0/20, gap 24,
 *           **bottom padding 120** so nothing hides behind the pill) + the
 *           floating `BottomPill`
 *
 * The switch is pure CSS — no `useBreakpoint()`, no UA sniffing — so the server
 * render is already correct (architecture/07).
 *
 * Landmarks: `<header>` (TopBar), `<nav aria-label>` (each nav), `<main id="main">`
 * with the skip-link target, and `<footer>` when a page supplies one.
 */
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';
import { OfflineBanner } from '@/shared/states';

import { BottomPill } from './bottom-pill';
import { IconRail } from './icon-rail';
import { Sidebar } from './sidebar';
import { TopBar, type TopBarProps, type TopBarVariant } from './top-bar';

export interface AppShellProps {
  children: ReactNode;
  /** Cart summary / order tracker panel — visible from 1440 up. */
  rightPanel?: ReactNode;
  /** `reduced` drops the search field (checkout pages). */
  topBarVariant?: TopBarVariant;
  /** Everything the top bar shows; counts arrive as data, never via a hook. */
  topBar?: Omit<TopBarProps, 'variant' | 'className'>;
  /** Nav badge counts, keyed by nav item id or badge bucket. */
  badges?: Record<string, number | undefined>;
  /** Replaces the sidebar App Promo card (`null` removes it). */
  promo?: ReactNode;
  /** Banner row above the content (store closed, demo mode, …). */
  banner?: ReactNode;
  /** Rendered as `<footer>` under the content when a page needs one. */
  footer?: ReactNode;
  /** Product pages with a sticky CTA replace the pill (architecture/07). */
  hideBottomPill?: boolean;
  homeHref?: string;
  /**
   * `<OfflineBanner>` localizes nothing, so the shell feeds it `shell.offline.*`.
   * Override the copy, force the state (`?preview=offline`) or wire a retry here.
   */
  offline?: {
    message?: ReactNode;
    actionLabel?: ReactNode;
    onRetry?: () => void;
    forced?: boolean;
  };
  className?: string;
  contentClassName?: string;
}

export function AppShell({
  children,
  rightPanel,
  topBarVariant = 'full',
  topBar,
  badges,
  promo,
  banner,
  footer,
  hideBottomPill = false,
  homeHref,
  offline,
  className,
  contentClassName,
}: AppShellProps) {
  const t = useTranslations('shell');

  return (
    <div className={cn('flex min-h-dvh w-full bg-bg', className)}>
      {/* No skip link here: `src/app/[locale]/layout.tsx` renders the one and
          only "Məzmuna keç" at <body> level, as the first focusable element on
          every route group. A second one pointing at the same #main just makes
          keyboard users tab past a duplicate. */}

      {/* one DOM, CSS-switched: the hidden navs are display:none, so they leave
          the a11y tree too. Both stay in view while the content scrolls. */}
      <Sidebar
        badges={badges}
        promo={promo}
        homeHref={homeHref}
        className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh"
      />
      <IconRail
        badges={badges}
        homeHref={homeHref}
        className="hidden md:sticky md:top-0 md:block md:h-dvh lg:hidden"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar {...topBar} variant={topBarVariant} homeHref={homeHref ?? topBar?.homeHref} />

        {/* offline state sits above the content, last cached data stays visible */}
        <OfflineBanner
          message={offline?.message ?? t('offline.message')}
          // the action only appears when a page wires a retry
          actionLabel={offline?.onRetry ? (offline.actionLabel ?? t('offline.retry')) : undefined}
          onRetry={offline?.onRetry}
          offline={offline?.forced}
        />

        <div className="flex w-full min-w-0 justify-center gap-6 2xl:gap-8">
          <main
            id="main"
            tabIndex={-1}
            className={cn(
              'w-full min-w-0 px-5 pb-[120px] md:px-8 md:pb-12 lg:pt-2',
              contentClassName,
            )}
          >
            {banner ? <div className="mb-6 w-full">{banner}</div> : null}
            {/*
              No width cap: the content fills the main column at every width.

              This used to be `max-w-[1280px] mx-auto`, which came from
              design-system/layout.md §4 ("the canvas does not define behaviour
              above 1440. Proposal: cap Content at 1280px, centred. Flag to
              design."). Flagged and answered: at 1920 that proposal left ~148px
              of dead space on each side of every app screen, and more the wider
              the monitor. The sidebar plus the 32px page padding already give
              the content its structure.
            */}
            <div className="flex w-full flex-col gap-6 lg:gap-8">{children}</div>
            {footer ? <footer className="mt-12 w-full">{footer}</footer> : null}
          </main>

          {rightPanel ? (
            <aside className="hidden w-[380px] shrink-0 pe-8 pt-2 2xl:block">{rightPanel}</aside>
          ) : null}
        </div>
      </div>

      {hideBottomPill ? null : <BottomPill badges={badges} />}
    </div>
  );
}
