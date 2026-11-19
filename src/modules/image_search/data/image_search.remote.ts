/**
 * Paths + params for the recognition mock. The only layer allowed to call `api()`.
 *
 * Every call goes to `/api/mock/image_search/…` (`version: 'mock'`), never the real host — there is
 * no recognition endpoint upstream. See `image_search.mock.ts` for why the body is metadata only.
 */
import { api, type ApiEnvelope, type Result } from '@/core/network';

import { IMAGE_SEARCH_MOCK_MODULE } from '../image_search.flags';

/** What the recogniser is told about the frame. No pixels: see the module note. */
export interface RecognizeFrameMeta {
  byteSize: number;
  width: number;
  height: number;
  mimeType: string;
  locale: string;
  /** Demo-only switch (`'none' | 'error'`) so every documented outcome is reachable. */
  outcome?: 'none' | 'error';
}

export interface RecognizeOptions {
  signal?: AbortSignal;
}

export const imageSearchRemote = {
  recognize: (
    meta: RecognizeFrameMeta,
    opts: RecognizeOptions = {},
  ): Promise<Result<ApiEnvelope<unknown>>> =>
    api<unknown>('POST', 'recognize', {
      version: 'mock',
      module: IMAGE_SEARCH_MOCK_MODULE,
      body: meta,
      signal: opts.signal,
    }),

  recent: (opts: RecognizeOptions = {}): Promise<Result<ApiEnvelope<unknown>>> =>
    api<unknown>('GET', 'recent', {
      version: 'mock',
      module: IMAGE_SEARCH_MOCK_MODULE,
      signal: opts.signal,
    }),
} as const;
