'use client';

/**
 * App top bar — node `LBP6d` (desktop), `Top Bar` in the tablet 768 and mobile
 * 390 exports.
 *
 * Desktop ≥1200: 88 high, padding 0/32, gap 16, no fill — Search (705x56,
 * radius 14, 1.5 px `line` outline) → City pill (199x48) → cart icon button 48
 * (+ count badge 22 `brand`) → bell 48 → Avatar 48 (`brand`, initial 18/700).
 * Tablet 768–1199: search 448x52 + three 44 circles.
 * Mobile <768: 72 high, padding 0/20, gap 10 — logo S + spacer + 44 icon
 * buttons (search → `/search`, bell) + 44 avatar.
 *
 * This component NEVER calls a module hook: the cart badge, the unread count
 * and the signed-in user all arrive as props and the `(app)` layout wires them.
 * TODO(core): that layout can feed `user`/`onSignOut` from `useSession()`.
 */

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';

import { Link, useRouter } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { OzioLogo } from '@/shared/brand/ozio-logo';
import {
  Bell,
  ChevronDown,
  Globe,
  LogOut,
  MapPin,
  Moon,
  Search,
  ShoppingCart,
  User,
} from '@/shared/lucide';

export type TopBarVariant = 'full' | 'reduced';

export interface TopBarUser {
  /** Display name — supplies the avatar initial and the menu's accessible name. */
  name?: string;
  /** Explicit initial, when the name is not the right source. */
  initial?: string;
}

export interface TopBarMenuWiring {
  profileHref?: string;
  addressesHref?: string;
  /** "Dil: Azərbaycan" — the current language, already translated. */
  languageLabel?: string;
  onLanguage?: () => void;
  onThemeToggle?: () => void;
  onSignOut?: () => void;
}

export interface TopBarProps {
  /** `reduced` drops the search field (checkout pages). */
  variant?: TopBarVariant;
  /** Sum of the cart items — a prop, never a hook. */
  cartCount?: number;
  /** Unread notifications — a prop, never a hook. */
  notificationCount?: number;
  cartHref?: string;
  notificationsHref?: string;
  searchHref?: string;
  /** Mobile logo link. */
  homeHref?: string;
  /** Selected city / address chip; `popover` is rendered in the city popover. */
  city?: { label: string; popover?: ReactNode; onClick?: () => void };
  user?: TopBarUser;
  menu?: TopBarMenuWiring;
  /** Prefill for the search field (e.g. `?q=` on `/search`). */
  defaultQuery?: string;
  /** Overrides the default "push `${searchHref}?q=`" behaviour. */
  onSearchSubmit?: (query: string) => void;
  className?: string;
}

export function TopBar({
  variant = 'full',
  cartCount = 0,
  notificationCount = 0,
  cartHref = paths.cart,
  notificationsHref = paths.notifications,
  searchHref = paths.search,
  homeHref = paths.home,
  city,
  user,
  menu,
  defaultQuery = '',
  onSearchSubmit,
  className,
}: TopBarProps) {
  const t = useTranslations('shell');
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const showSearch = variant === 'full';

  const submit = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      if (onSearchSubmit) {
        onSearchSubmit(trimmed);
        return;
      }
      const separator = searchHref.includes('?') ? '&' : '?';
      router.push(`${searchHref}${separator}q=${encodeURIComponent(trimmed)}`);
    },
    [onSearchSubmit, router, searchHref],
  );

  return (
    <header
      className={cn(
        'flex h-topbar w-full shrink-0 items-center gap-2.5 px-5 md:gap-3 md:px-8 lg:gap-4',
        className,
      )}
    >
      {/* mobile: logo + spacer */}
      <Link href={homeHref} aria-label="Ozio" className="shrink-0 rounded-md md:hidden">
        <OzioLogo size="s" tone="brand" decorative />
      </Link>
      <span aria-hidden="true" className="grow md:hidden" />

      {/* tablet + desktop: the search field */}
      {showSearch ? (
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            submit(query);
          }}
          className="hidden h-[52px] w-full max-w-[448px] items-center gap-2.5 rounded-md bg-surface px-[18px] outline outline-[1.5px] -outline-offset-[0.75px] outline-line md:flex lg:h-14 lg:max-w-[705px]"
        >
          <Search size={20} className="shrink-0 text-ink3" aria-hidden="true" />
          <input
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('search.placeholder')}
            aria-label={t('search.label')}
            className="h-full w-full border-0 bg-transparent text-body text-ink outline-none placeholder:text-ink3"
          />
        </form>
      ) : (
        <span aria-hidden="true" className="hidden grow md:block" />
      )}

      {/*
        Pushes the trailing cluster (city pill, cart, bell, avatar) to the right edge.

        The search field is capped at 705, so without this the icons sat immediately after it and
        the rest of the row was empty — the wider the screen, the bigger the gap to their right.
        `grow` gives that slack to the spacer instead, which is what puts the three icons where
        the design has them: hard against the content's right edge, lined up with everything
        below. Only from `md`, because the mobile row has its own spacer after the logo.
      */}
      {showSearch ? <span aria-hidden="true" className="hidden grow md:block" /> : null}

      {/* mobile: search opens the search page */}
      {showSearch ? (
        <Link
          href={searchHref}
          aria-label={t('search.label')}
          className="grid size-11 shrink-0 place-items-center rounded-pill bg-surface text-ink md:hidden"
        >
          <Search size={20} aria-hidden="true" />
        </Link>
      ) : null}

      {/* desktop: the city pill */}
      {city ? <CityPill city={city} /> : null}

      {/* cart */}
      <Link
        href={cartHref}
        aria-label={
          cartCount > 0 ? t('topBar.cartWithCount', { count: cartCount }) : t('topBar.cart')
        }
        className="relative hidden size-11 shrink-0 place-items-center rounded-pill bg-surface text-ink md:grid lg:size-12"
      >
        <ShoppingCart size={22} aria-hidden="true" />
        {cartCount > 0 ? <CountBadge count={cartCount} /> : null}
      </Link>

      {/* notifications */}
      <Link
        href={notificationsHref}
        aria-label={
          notificationCount > 0
            ? t('topBar.notificationsWithCount', { count: notificationCount })
            : t('topBar.notifications')
        }
        className="relative grid size-11 shrink-0 place-items-center rounded-pill bg-surface text-ink lg:size-12"
      >
        <Bell size={22} aria-hidden="true" />
        {notificationCount > 0 ? <CountBadge count={notificationCount} /> : null}
      </Link>

      <UserMenu user={user} menu={menu} />
    </header>
  );
}

/** 22 px `brand` circle, 11/700 white, pinned to the icon button's top-right. */
function CountBadge({ count }: { count: number }) {
  return (
    <span className="absolute -top-0.5 end-0 grid size-[22px] translate-x-1 place-items-center rounded-pill bg-brand text-nano font-bold text-white">
      <span aria-hidden="true">{count > 99 ? '99+' : count}</span>
    </span>
  );
}

/** 199x48 `surface` pill: brand map-pin + 14/600 label + chevron-down. */
function CityPill({ city }: { city: NonNullable<TopBarProps['city']> }) {
  const { open, setOpen, triggerRef, panelRef } = useDisclosure();
  const panelId = useId();
  const hasPopover = Boolean(city.popover);

  return (
    <div className="relative hidden shrink-0 lg:block">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (hasPopover ? setOpen(!open) : city.onClick?.())}
        aria-expanded={hasPopover ? open : undefined}
        aria-controls={hasPopover ? panelId : undefined}
        className="flex h-12 items-center gap-2 rounded-pill bg-surface px-[18px] transition-transform duration-[var(--oz-dur-fast)] active:scale-[.98]"
      >
        <MapPin size={18} className="shrink-0 text-brand" aria-hidden="true" />
        <span className="text-label font-semibold text-ink">{city.label}</span>
        <ChevronDown size={16} className="shrink-0 text-ink2" aria-hidden="true" />
      </button>
      {hasPopover && open ? (
        <div
          ref={panelRef}
          id={panelId}
          className="absolute end-0 top-[calc(100%+8px)] z-40 w-[280px] rounded-lg border border-line bg-surface p-2 shadow-menu"
        >
          {city.popover}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Avatar + dropdown menu (components.md §6 Dropdown menu): 260 wide, `surface`,
 * 1 px `line`, radius 20, padding 8, gap 2, shadow `menu`; items 44 high,
 * padding 0/12, gap 12, radius 12, icon 18 `ink2` + label 14/500; "Çıxış" is
 * destructive (`brand`).
 *
 * TODO(shared): swap for `<Popover>`/`<DropdownMenu>` from `@/shared/ui` once
 * that package lands; the markup and a11y contract are the same.
 */
function UserMenu({ user, menu }: { user?: TopBarUser; menu?: TopBarMenuWiring }) {
  const t = useTranslations('shell');
  const { open, setOpen, triggerRef, panelRef } = useDisclosure();
  const panelId = useId();
  const initial = (user?.initial ?? [...(user?.name ?? '')][0] ?? '')?.toUpperCase();

  const itemClass =
    'flex h-11 w-full items-center gap-3 rounded-[12px] px-3 text-left text-label font-medium text-ink hover:bg-surface2';

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="menu"
        aria-label={user?.name ? t('topBar.accountOf', { name: user.name }) : t('topBar.account')}
        className="grid size-11 place-items-center rounded-pill bg-brand transition-transform duration-[var(--oz-dur-fast)] active:scale-[.98] lg:size-12"
      >
        {initial ? (
          // 16/700 on mobile (44 circle), 18/700 on desktop (48 circle)
          <span className="text-body font-bold text-white lg:text-[18px]" aria-hidden="true">
            {initial}
          </span>
        ) : (
          <User size={22} className="text-white" aria-hidden="true" />
        )}
      </button>

      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="menu"
          aria-label={t('topBar.account')}
          className="absolute end-0 top-[calc(100%+8px)] z-40 flex w-[260px] flex-col gap-0.5 rounded-lg border border-line bg-surface p-2 shadow-menu"
        >
          <Link
            role="menuitem"
            href={menu?.profileHref ?? paths.profile}
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            <User size={18} className="shrink-0 text-ink2" aria-hidden="true" />
            {t('menu.profile')}
          </Link>
          <Link
            role="menuitem"
            href={menu?.addressesHref ?? paths.addresses}
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            <MapPin size={18} className="shrink-0 text-ink2" aria-hidden="true" />
            {t('menu.addresses')}
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              menu?.onLanguage?.();
            }}
            className={itemClass}
          >
            <Globe size={18} className="shrink-0 text-ink2" aria-hidden="true" />
            {menu?.languageLabel ?? t('menu.language')}
          </button>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              menu?.onThemeToggle?.();
            }}
            className={itemClass}
          >
            <Moon size={18} className="shrink-0 text-ink2" aria-hidden="true" />
            {t('menu.darkMode')}
          </button>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              menu?.onSignOut?.();
            }}
            className={cn(itemClass, 'text-brand')}
          >
            <LogOut size={18} className="shrink-0 text-brand" aria-hidden="true" />
            {t('menu.signOut')}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Escape closes and returns focus, outside click closes (components.md §6). */
function useDisclosure() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const first = panelRef.current?.querySelector<HTMLElement>(
      '[role="menuitem"], a, button, input',
    );
    first?.focus();
  }, [open]);

  return { open, setOpen, triggerRef, panelRef };
}
