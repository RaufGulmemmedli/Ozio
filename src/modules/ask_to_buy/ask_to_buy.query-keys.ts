/**
 * Query keys for the ask_to_buy module. The first element is always the module name so sign-out
 * can drop everything user-bound in one invalidation (04-data-layer.md).
 */
import { moduleKeys } from '@/core/query';

import type { AskDirection } from './data/models/ask-request';

export const askToBuyKeys = {
  ...moduleKeys('ask_to_buy'),
  /** Who the demo is acting as + the static parent / card / draft lists. */
  context: () => ['ask_to_buy', 'context'] as const,
  /** One inbox side. `direction` is `incoming` (parent) or `outgoing` (child). */
  inbox: (direction: AskDirection) => ['ask_to_buy', 'inbox', direction] as const,
  /** One request. */
  request: (id: string) => ['ask_to_buy', 'request', id] as const,
} as const;
