/**
 * The only thing the hooks import. `Result` in / `Result` out, never a throw.
 *
 * `recognize()` takes the already-prepared (validated + downscaled) frame and sends its
 * **metadata** to the mock. The frame's bytes stay in the page: see `image-frame.ts`.
 */
import { mapResult, type Result } from '@/core/network';

import { parseImageRecognition, type ImageRecognition } from './models/recognition';
import { imageSearchRemote, type RecognizeFrameMeta } from './image_search.remote';

export interface RepoOptions {
  signal?: AbortSignal;
}

export const imageSearchRepository = {
  recognize: (
    meta: RecognizeFrameMeta,
    opts: RepoOptions = {},
  ): Promise<Result<ImageRecognition>> =>
    imageSearchRemote
      .recognize(meta, opts)
      .then((r) => mapResult(r, (env) => parseImageRecognition(env.data))),

  recent: (opts: RepoOptions = {}): Promise<Result<string[]>> =>
    imageSearchRemote.recent(opts).then((r) =>
      mapResult(r, (env) => {
        const data = env.data;
        const items =
          data !== null && typeof data === 'object' && 'items' in data
            ? (data as { items?: unknown }).items
            : data;
        return Array.isArray(items)
          ? items.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
          : [];
      }),
    ),
} as const;
