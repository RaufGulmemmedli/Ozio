/**
 * Paths + params for the chat mock. The only layer that calls `api()`.
 *
 * Everything is under `/api/mock/support/…` (`version: 'mock'`) — there is no support endpoint on
 * the real host, and the PROPOSED `v1/support/messages` is not called.
 */
import { api, type ApiEnvelope, type Result } from '@/core/network';

import { SUPPORT_MOCK_MODULE } from '../support.flags';

export interface SupportCallOptions {
  signal?: AbortSignal;
}

export const supportRemote = {
  thread: (opts: SupportCallOptions = {}): Promise<Result<ApiEnvelope<unknown>>> =>
    api<unknown>('GET', 'thread', {
      version: 'mock',
      module: SUPPORT_MOCK_MODULE,
      signal: opts.signal,
    }),

  send: (
    text: string,
    locale: string,
    opts: SupportCallOptions = {},
  ): Promise<Result<ApiEnvelope<unknown>>> =>
    api<unknown>('POST', 'messages', {
      version: 'mock',
      module: SUPPORT_MOCK_MODULE,
      body: { text, locale },
      signal: opts.signal,
    }),

  clear: (opts: SupportCallOptions = {}): Promise<Result<ApiEnvelope<unknown>>> =>
    api<unknown>('DELETE', 'thread', {
      version: 'mock',
      module: SUPPORT_MOCK_MODULE,
      signal: opts.signal,
    }),
} as const;
