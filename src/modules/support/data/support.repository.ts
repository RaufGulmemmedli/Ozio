/**
 * The only thing the hooks import. `Result` in / `Result` out, never a throw.
 *
 * `parseSupportThread` re-applies the redaction, so nothing that looks like a phone number, card
 * number or one-time code can reach a bubble even if an older build persisted it.
 */
import { mapResult, type Result } from '@/core/network';

import { parseSupportThread, type SupportThread } from './models/support-message';
import { supportRemote } from './support.remote';

export interface RepoOptions {
  signal?: AbortSignal;
}

export const supportRepository = {
  thread: (opts: RepoOptions = {}): Promise<Result<SupportThread>> =>
    supportRemote.thread(opts).then((r) => mapResult(r, (env) => parseSupportThread(env.data))),

  send: (
    text: string,
    locale: string,
    opts: RepoOptions = {},
  ): Promise<Result<SupportThread>> =>
    supportRemote
      .send(text, locale, opts)
      .then((r) => mapResult(r, (env) => parseSupportThread(env.data))),

  clear: (opts: RepoOptions = {}): Promise<Result<SupportThread>> =>
    supportRemote.clear(opts).then((r) => mapResult(r, (env) => parseSupportThread(env.data))),
} as const;
