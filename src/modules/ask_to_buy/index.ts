/**
 * Public surface of `@/modules/ask_to_buy` — other modules import **only** from here.
 *
 * `<AskToBuyTile>` is the entry point another screen places (the home quick action, the cart's
 * "Al deyim" row); it hides itself when the `askToBuy` flag is off.
 */
export { ASK_TO_BUY_FLAG, ASK_TO_BUY_MOCK_MODULE, askToBuyEnabled, assertAskToBuyEnabled } from './ask_to_buy.flags';
export { askToBuyRoutes, type ModuleRoute } from './ask_to_buy.routes';
export { askToBuyKeys } from './ask_to_buy.query-keys';

export { AskToBuyTile, type AskToBuyTileProps } from './components/ask-to-buy-tile';

export {
  useApproveAsk,
  useAskContext,
  useAskInbox,
  useAskRequest,
  useAskRole,
  useDeclineAsk,
  useResendAsk,
  useSendAsk,
  defaultDirection,
  type AskRoleState,
  type DecideAskInput,
  type SendAskInput,
} from './hooks/use-ask-to-buy';

export type {
  AskCard,
  AskContext,
  AskDirection,
  AskItem,
  AskParent,
  AskRequest,
  AskRole,
  AskStatus,
  ParentRelation,
} from './data/models/ask-request';

export { AskInboxView } from './view/AskInboxView';
export { AskInboxSkeleton } from './view/AskInboxSkeleton';
export { AskSendView } from './view/AskSendView';
export { AskSendSkeleton } from './view/AskSendSkeleton';
export { AskRequestView, type AskRequestViewProps } from './view/AskRequestView';
export { AskRequestSkeleton } from './view/AskRequestSkeleton';
