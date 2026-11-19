/**
 * Shell navigation config (02-routing.md "Tab/nav items", 07-responsive-a11y-perf.md shell rules).
 *
 * One source for the three shells:
 *   `sidebarNav`  — ≥1440 sidebar.
 *   `railNav`     — 768–1439 icon rail (Kart uses `QrCode`, Partnyorlar uses `Users`: a design
 *                   decision for the rail, kept deliberately).
 *   `bottomNav`   — <768 bottom pill, exactly 5 tabs.
 *   `utilityNav`  — header / profile-menu entries that are not part of the main shells.
 *
 * `labelKey` is a message key (`nav.*`), never a literal string: resolve it with
 * `useTranslations()` at the root namespace, e.g. `t(item.labelKey)`.
 * Every list is already filtered by feature flag (flags are build-time constants).
 */
import {
  CreditCard,
  House,
  MapPin,
  Package,
  QrCode,
  Search,
  ShoppingBasket,
  ShoppingCart,
  Store,
  Ticket,
  Trophy,
  User,
  Users,
  Bell,
  Gift,
  Headphones,
  History,
  LifeBuoy,
  Percent,
  SlidersHorizontal,
  type LucideIcon,
} from '@/shared/lucide';
import { FeatureFlags, type FeatureName } from '@/core/config/feature-flags';
import { paths } from './paths';

/** Which live counter the shell renders on this item, if any. */
export type NavBadge = 'cart' | 'orders' | 'coupons' | 'notifications';

export interface NavItem {
  /** Stable id — used for `aria-current` wiring, analytics and tests. Never renamed. */
  id: string;
  /** `nav.*` message key (messages/parts/nav.json). */
  labelKey: string;
  href: string;
  icon: LucideIcon;
  flag?: FeatureName;
  badge?: NavBadge;
}

const withFlags = (items: NavItem[]): NavItem[] =>
  items.filter((i) => i.flag === undefined || FeatureFlags[i.flag]);

const sidebarItems: NavItem[] = [
  { id: 'home', labelKey: 'nav.home', href: paths.home, icon: House },
  { id: 'market', labelKey: 'nav.market', href: paths.market, icon: ShoppingBasket },
  { id: 'orders', labelKey: 'nav.orders', href: paths.orders, icon: Package, badge: 'orders' },
  { id: 'card', labelKey: 'nav.card', href: paths.card, icon: CreditCard },
  { id: 'coupons', labelKey: 'nav.coupons', href: paths.coupons, icon: Ticket, badge: 'coupons' },
  { id: 'lottery', labelKey: 'nav.lottery', href: paths.lottery, icon: Trophy },
  { id: 'partners', labelKey: 'nav.partners', href: paths.marketPartners, icon: Store },
  { id: 'addresses', labelKey: 'nav.addresses', href: paths.addresses, icon: MapPin },
  { id: 'profile', labelKey: 'nav.profile', href: paths.profile, icon: User },
];

/** Sidebar (≥1440). */
export const sidebarNav: readonly NavItem[] = withFlags(sidebarItems);

/** Icon rail (768–1439): same items, Kart as `QrCode` and Partnyorlar as `Users`. */
export const railNav: readonly NavItem[] = withFlags(
  sidebarItems.map((item) =>
    item.id === 'card'
      ? { ...item, icon: QrCode }
      : item.id === 'partners'
        ? { ...item, icon: Users }
        : item,
  ),
);

/** Bottom pill (<768): exactly 5 tabs. */
export const bottomNav: readonly NavItem[] = withFlags([
  { id: 'home', labelKey: 'nav.home', href: paths.home, icon: House },
  { id: 'market', labelKey: 'nav.market', href: paths.market, icon: ShoppingBasket },
  { id: 'card', labelKey: 'nav.card', href: paths.card, icon: QrCode },
  { id: 'orders', labelKey: 'nav.orders', href: paths.orders, icon: Package, badge: 'orders' },
  { id: 'profile', labelKey: 'nav.profile', href: paths.profile, icon: User },
]);

/** Header icons, settings sheet and profile-menu entries (not part of the main shells). */
export const utilityNav: readonly NavItem[] = withFlags([
  { id: 'search', labelKey: 'nav.search', href: paths.search, icon: Search },
  { id: 'cart', labelKey: 'nav.cart', href: paths.cart, icon: ShoppingCart, badge: 'cart' },
  {
    id: 'notifications',
    labelKey: 'nav.notifications',
    href: paths.notifications,
    icon: Bell,
    badge: 'notifications',
  },
  { id: 'offers', labelKey: 'nav.offers', href: paths.offers, icon: Percent },
  { id: 'history', labelKey: 'nav.history', href: paths.history, icon: History },
  { id: 'settings', labelKey: 'nav.settings', href: paths.settings, icon: SlidersHorizontal },
  { id: 'help', labelKey: 'nav.help', href: paths.help, icon: LifeBuoy },
  {
    id: 'support',
    labelKey: 'nav.support',
    href: paths.support,
    icon: Headphones,
    flag: 'supportChat',
  },
  { id: 'invite', labelKey: 'nav.invite', href: paths.invite, icon: Gift, flag: 'referral' },
]);

/**
 * Is `item` the active nav entry for `pathname` (locale already stripped)?
 * `/home` matches only itself; every other item also matches its sub-paths, so
 * `/market/store/7` highlights Market and `/orders/9/track` highlights Sifarişlər.
 */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  const href = item.href.split('?')[0] ?? item.href;
  if (pathname === href) return true;
  if (href === paths.home) return false;
  return pathname.startsWith(`${href}/`);
}

/** The id of the active item in a list, or `undefined` — pick the longest matching href. */
export function activeNavId(items: readonly NavItem[], pathname: string): string | undefined {
  let best: NavItem | undefined;
  for (const item of items) {
    if (!isNavItemActive(item, pathname)) continue;
    if (!best || item.href.length > best.href.length) best = item;
  }
  return best?.id;
}
