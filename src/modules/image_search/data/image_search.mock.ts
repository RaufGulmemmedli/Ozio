/**
 * MSW handlers for the **recognition step only** (`/api/mock/image_search/…`).
 *
 * There is no recognition endpoint in the real API. `POST v1/file/upload` exists but
 * `api/mock-modules.md` §6 is explicit that it is a plain file upload, **not** an image-recognition
 * endpoint — so it is never called from here, and the captured image never leaves the browser.
 * The request body carries the frame's **metadata only** (bytes, dimensions, mime type): enough for
 * the mock's documented "the file must be non-empty" check, with no pixels on the wire.
 *
 * The products the screen then shows are **real** (`stores/search` + `stores/{storeId}/products`)
 * and go through the store module's own repository — nothing in this file touches them.
 *
 * Registered under the module name `image_search`, which **is** listed in
 * `src/core/mocks/modules.ts`, so `loadMockModules()` imports this file by itself.
 */
import { http } from 'msw';

import {
  delay,
  flagged,
  mockError,
  mockJson,
  mockPath,
  registerMockHandlers,
} from '@/core/mocks';
import { createMockDb } from '@/core/mocks/db';

import { IMAGE_SEARCH_FLAG, IMAGE_SEARCH_MOCK_MODULE } from '../image_search.flags';
import {
  RECOGNITION_SAMPLES,
  RECOGNIZE_LATENCY_MS,
  localizeLabel,
  type FixtureLabel,
} from './image_search.fixtures';

/**
 * `support` is **not** in `src/core/mocks/modules.ts`, so `loadMockModules()` never loads a mock
 * file for it. `image_search` *is* listed, so the support-chat handlers are registered from here —
 * as a **plain value import**, never a side-effect import of a `*.mock.ts` (that would be resolved
 * statically from the root layout, through `core/query/providers`, and a missing file would break
 * every route in the app).
 */
import { supportHandlers } from '@/modules/support/data/support.handlers';
import { SUPPORT_FLAG, SUPPORT_MOCK_MODULE } from '@/modules/support/support.flags';

interface ImageSearchDb {
  /** Which of the three sample sets the next call answers with (the documented rotation). */
  cursor: number;
  /** The queries this browser has recognised, newest first — the demo's "recent" list. */
  recent: string[];
}

const db = createMockDb<ImageSearchDb>('image_search', { cursor: 0, recent: [] });

const RECENT_LIMIT = 8;

function rememberQuery(query: string): void {
  const value = query.trim();
  if (!value) return;
  db.set((prev) => ({
    ...prev,
    recent: [value, ...prev.recent.filter((q) => q !== value)].slice(0, RECENT_LIMIT),
  }));
}

function nextSample(): readonly FixtureLabel[] {
  const { cursor } = db.get();
  const index = ((cursor % RECOGNITION_SAMPLES.length) + RECOGNITION_SAMPLES.length) %
    RECOGNITION_SAMPLES.length;
  db.patch({ cursor: index + 1 });
  return RECOGNITION_SAMPLES[index];
}

interface RecognizeBody {
  /** Byte length of the downscaled frame. `0` is the documented "empty file" failure. */
  byteSize?: unknown;
  width?: unknown;
  height?: unknown;
  mimeType?: unknown;
  locale?: unknown;
  /** Demo switch so every documented outcome is reachable without faking a photo. */
  outcome?: unknown;
}

async function readBody(request: Request): Promise<RecognizeBody> {
  try {
    return (await request.json()) as RecognizeBody;
  } catch {
    return {};
  }
}

const asLocale = (value: unknown): string =>
  value === 'ru' || value === 'en' ? value : 'az';

export const imageSearchHandlers = [
  /**
   * `POST /api/mock/image_search/recognize`
   *
   * Body: `{ byteSize, width, height, mimeType, locale, outcome? }` — metadata, never pixels.
   * Waits 2 200 ms (`MOCK_LATENCY_MS.imageRecognize`), then rotates through the three fixed sample
   * sets regardless of the image, exactly as the Flutter mock does. An empty frame is the one
   * documented failure.
   */
  http.post(mockPath(IMAGE_SEARCH_MOCK_MODULE, 'recognize'), async ({ request }) => {
    const body = await readBody(request);
    const bytes = Number(body.byteSize ?? 0);
    const outcome = typeof body.outcome === 'string' ? body.outcome : null;
    const locale = asLocale(body.locale);

    await delay(RECOGNIZE_LATENCY_MS);

    if (outcome === 'error') {
      return mockError(500, 'recognition failed');
    }
    if (!Number.isFinite(bytes) || bytes <= 0) {
      // The documented parse failure: the mock only ever checks the frame is non-empty.
      return mockError(422, 'image is empty');
    }
    if (outcome === 'none') {
      return mockJson({ labels: [] });
    }

    const sample = nextSample();
    const labels = sample.map((label) => ({
      name: localizeLabel(label, locale),
      confidence: label.confidence,
    }));
    if (labels[0]) rememberQuery(labels[0].name);

    return mockJson({ labels });
  }),

  /** `GET /api/mock/image_search/recent` — what this browser has recognised before. */
  http.get(mockPath(IMAGE_SEARCH_MOCK_MODULE, 'recent'), async () => {
    await delay(200);
    return mockJson({ items: db.get().recent, total: db.get().recent.length });
  }),
];

registerMockHandlers(IMAGE_SEARCH_MOCK_MODULE, flagged(imageSearchHandlers, IMAGE_SEARCH_FLAG));

/**
 * The support chat rides along: `/api/mock/support/…` is its own registry entry and its own flag
 * (`supportChat`), so turning one module off never touches the other. See the import note above for
 * why it is registered from here rather than from a `support/data/support.mock.ts`.
 */
registerMockHandlers(SUPPORT_MOCK_MODULE, flagged(supportHandlers, SUPPORT_FLAG));
