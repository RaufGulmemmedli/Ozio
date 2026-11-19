/**
 * Query keys for the support chat.
 *
 * The thread is locale-scoped because the scripted agent answers in the active language — wrap with
 * `scoped(key, locale)` in the hook, like every other localized query.
 */
import { moduleKeys } from '@/core/query';

export const supportKeys = {
  ...moduleKeys('support'),
  /** `GET /api/mock/support/thread`. */
  thread: () => ['support', 'thread'] as const,
  /** `POST /api/mock/support/messages` — a mutation key. */
  send: () => ['support', 'send'] as const,
} as const;
