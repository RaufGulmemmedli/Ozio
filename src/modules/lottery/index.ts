/**
 * `@/modules/lottery` — the module's only public surface. It owns the lottery screens plus
 * the two loyalty screens that share its data layer: "Ozio 10-lar" (`/market/tens`) and the
 * Ozio Plus discounts catalogue (`/offers/discounts`).
 *
 * Endpoints behind it:
 *   `GET  v1/lotteries/active`             verified   — `{ticketsCount, activeLottery}` only
 *   `GET  v1/lotteries/active/details`     verified   — `lottery_id` REQUIRED (500 without)
 *   `GET  v1/lotteries/policy`             verified   — one HTML string, no locale field
 *   `GET  v1/lotteries/tickets`            unverified — `lottery_id` REQUIRED; row shape unobserved
 *   `GET  v1/ten-carts`                    verified   — stamp cards, not priced bundles
 *   `POST v1/ten-carts/add`                unverified — body key is a guess
 *   `GET  v1/ozio-plus/categories`         verified   — the store CHAINS
 *   `GET  v1/ozio-plus/campaigns`          verified   — the period + its end date
 *   `GET  v1/ozio-plus/products`           verified   — offset paging only; no server search/sort
 *
 * There is **no ticket-purchase endpoint and no winners/results endpoint**. Tickets are
 * earned from receipts (`details.amount` = the receipt sum that earns one), and the winner
 * list is never sent — both screens say so instead of inventing data.
 */

/* data */
export {
  isDrawDone,
  parseActiveLottery,
  parseLotteryDetails,
  parseLotteryPolicy,
  parseLotteryPrize,
  parseLotteryTicket,
  totalPrizeCount,
  type ActiveLottery,
  type ActiveLotterySummary,
  type LotteryDetails,
  type LotteryPolicy,
  type LotteryPrize,
  type LotteryTicket,
  type LotteryTicketStatus,
} from './data/models/lottery';
export { daysUntil, hasPassed, wallMoment, type WallMoment } from './data/models/wall-moment';
export {
  parseTenCart,
  pickActiveCard,
  stampsLeft,
  type TenCart,
} from './data/models/ten-cart';
export {
  filterPlusProducts,
  parsePlusCampaign,
  parsePlusChain,
  parsePlusProduct,
  sortPlusProducts,
  type PlusCampaign,
  type PlusChain,
  type PlusProduct,
  type PlusSort,
} from './data/models/plus';
export { lotteryRepository, type TenCartSelectResult } from './data/lottery.repository';
export { PLUS_MAX_LIMIT, TICKETS_DEFAULT_LIMIT } from './data/lottery.remote';
export { lotteryKeys, plusKeys, tenCartKeys } from './lottery.query-keys';
export { lotteryRoutes, type ModuleRoute } from './lottery.routes';
export { isPolicyEmpty, sanitizePolicyHtml } from './lib/sanitize-policy-html';

/* hooks */
export {
  useActiveLottery,
  useLotteryDetails,
  useLotteryPolicy,
  useTicket,
  useTickets,
} from './hooks/use-lottery';
export { useSelectTenCart, useTenCarts } from './hooks/use-ten-carts';
export { usePlusCampaigns, usePlusChains, usePlusProducts } from './hooks/use-plus';

/* components */
export { StampCard, MiniStamps, type StampCardProps } from './components/stamp-card';
export {
  LotteryTicketCard,
  TicketRow,
  type LotteryTicketCardProps,
} from './components/lottery-ticket-card';
export { Countdown, type CountdownProps } from './components/countdown';
export { PolicyHtml, type PolicyHtmlProps } from './components/policy-html';
export { PrizeCard, PrizeRow, type PrizeCardProps } from './components/prize-card';
export { RulesStrip, type RuleItem, type RulesStripProps } from './components/rules-strip';
export { PlusProductCard, type PlusProductCardProps } from './components/plus-product-card';

/* views (route-level) */
export { LotteryView } from './view/LotteryView';
export { LotterySkeleton } from './view/LotterySkeleton';
export { TicketsView } from './view/TicketsView';
export { TicketsSkeleton } from './view/TicketsSkeleton';
export { TicketDetailView, type TicketDetailViewProps } from './view/TicketDetailView';
export { TicketDetailSkeleton } from './view/TicketDetailSkeleton';
export { RulesView } from './view/RulesView';
export { ResultsView } from './view/ResultsView';
export { PrizesView } from './view/PrizesView';
export { TensView } from './view/TensView';
export { TensSkeleton } from './view/TensSkeleton';
export { DiscountsView, type DiscountsViewProps } from './view/DiscountsView';
