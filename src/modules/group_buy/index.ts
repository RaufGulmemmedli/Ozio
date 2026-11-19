/**
 * `@/modules/group_buy` — the module's public surface. Nothing else may reach inside it.
 *
 * What other modules need from here:
 * - **`<OpenGroupDealTile>`** — the entry-point tile for the home / market screens (group_buy has
 *   no nav item of its own; `api/mock-modules.md` puts its entry on a banner). It fetches its own
 *   data and renders `null` while loading, on failure and when no deal is open, so it can be
 *   dropped into a host screen without a guard.
 * - the hooks, for a host screen that wants the data rather than the tile;
 * - the flag helpers, so a host can hide its entry point when `groupBuy` is off.
 *
 * The route-level views are exported for the `src/app/[locale]/(app)/group-buy/**` pages.
 */

/* ---------------------------------------------------------------- entry points */
export { OpenGroupDealTile } from './components/open-group-deal-tile';

/* ---------------------------------------------------------------- screens */
export { GroupBuyHomeView } from './view/GroupBuyHomeView';
export { GroupBuyCreateView } from './view/GroupBuyCreateView';
export { GroupDealDetailView } from './view/GroupDealDetailView';

/* ---------------------------------------------------------------- hooks */
export {
  useCountdown,
  useCreateGroupDeal,
  useGroupBuyCatalog,
  useGroupBuyOverview,
  useGroupDeal,
  useJoinGroupDeal,
  useJoinQuote,
  type Countdown,
} from './hooks';

/* ---------------------------------------------------------------- types */
export type {
  GroupBuyOverview,
  GroupDeal,
  GroupParticipant,
  PriceTier,
} from './data/models/group-deal';
export type { GroupBuyCatalog, GroupProduct, GroupProductTier } from './data/models/group-product';
export type { JoinQuote, JoinResult } from './data/models/join-result';

/* ---------------------------------------------------------------- module metadata */
export {
  GROUP_BUY_FLAG,
  GROUP_BUY_MOCK_MODULE,
  assertGroupBuyEnabled,
  groupBuyEnabled,
} from './group_buy.flags';
export { groupBuyRoutes, type GroupBuyRoute } from './group_buy.routes';
export { groupBuyKeys } from './group_buy.query-keys';
