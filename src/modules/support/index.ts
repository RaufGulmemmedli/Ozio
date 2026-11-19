/**
 * Public surface of the support-chat module. Other modules import from **here only**.
 *
 * The entry point other agents place:
 *   `import { SupportEntry } from '@/modules/support';`
 * The profile menu renders it. With `supportChat` on it opens `/support`; with the flag off it
 * renders the documented fallback (`/help` + the contact number) instead of disappearing.
 *
 * The MSW handlers are **not** exported as a side effect: `data/support.handlers.ts` exports the
 * array as a plain value and `src/modules/image_search/data/image_search.mock.ts` registers it,
 * because `support` is not one of the names `src/core/mocks/modules.ts` loads.
 */

/* ---- entry point other modules place ----------------------------------------------------- */
export { SupportEntry } from './components/SupportEntry';
export type { SupportEntryProps } from './components/SupportEntry';

/* ---- views (route-level) ----------------------------------------------------------------- */
export { SupportView } from './view/SupportView';
export { SupportChatSkeleton } from './view/SupportChatSkeleton';
export type { SupportChatSkeletonProps } from './view/SupportChatSkeleton';

/* ---- components -------------------------------------------------------------------------- */
export { TopicsPanel } from './components/TopicsPanel';
export type { TopicsPanelProps, SupportTopic } from './components/TopicsPanel';

export { CallButton } from './components/CallButton';
export type { CallButtonProps } from './components/CallButton';

/* ---- hooks ------------------------------------------------------------------------------- */
export { useSupportChat } from './hooks/use-support-chat';
export type { UseSupportChatResult } from './hooks/use-support-chat';

/* ---- data ------------------------------------------------------------------------------- */
export { supportRepository } from './data/support.repository';
export { supportHandlers } from './data/support.handlers';
export {
  parseSupportThread,
  parseSupportMessage,
  redactSensitive,
  isNewThread,
  REDACTION,
} from './data/models/support-message';
export type {
  SupportAuthor,
  SupportMessage,
  SupportThread,
} from './data/models/support-message';

export { MAX_MESSAGE_LENGTH, TYPING_DELAY_MS } from './data/support.fixtures';

export { supportKeys } from './support.query-keys';
export { supportRoutes } from './support.routes';
export type { SupportRoute } from './support.routes';
export { SUPPORT_FLAG, SUPPORT_MOCK_MODULE, supportChatEnabled } from './support.flags';
