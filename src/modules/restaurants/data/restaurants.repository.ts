/**
 * The restaurants "repository" — fixtures, not a network call.
 *
 * Every other module reads an endpoint; this one has none to read (see `models/restaurant.ts`).
 * It is deliberately NOT an MSW mock module either, even though that is the documented pattern for
 * a backend-less feature: MSW needs its service worker to register, which cannot be verified in
 * every environment this app is opened in, and a restaurant list that silently shows nothing is
 * worse than one that is honestly local. The seam is the same either way — these three functions
 * return `Result<T, Failure>` exactly like `storeRepository`, so swapping in a real endpoint is a
 * change to this file alone.
 *
 * The short delay is on purpose: it lets the screens show the same skeleton-first loading the rest
 * of the app does, instead of popping in fully formed and hiding a state that will exist later.
 */

import { fail, ok, Failure, type Result } from '@/core/network';

import { RESTAURANTS } from './restaurants.fixtures';
import type { Restaurant } from './models/restaurant';

/** Enough to render one skeleton frame, short enough not to feel broken. */
const FAKE_LATENCY_MS = 260;

function sleep(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, FAKE_LATENCY_MS);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

export const restaurantsRepository = {
  /** Every restaurant, in the order the fixture file lists them. */
  list: async (signal?: AbortSignal): Promise<Result<Restaurant[]>> => {
    await sleep(signal);
    return ok([...RESTAURANTS]);
  },

  /** One restaurant with its full menu, or a `notFound` Failure for an unknown id. */
  detail: async (id: number, signal?: AbortSignal): Promise<Result<Restaurant>> => {
    await sleep(signal);
    const found = RESTAURANTS.find((restaurant) => restaurant.id === id);
    // 404 is what a real endpoint would answer, so the view's not-found branch is the same one it
    // will use against the live API.
    return found ? ok(found) : fail(Failure.fromStatus(404, null));
  },

  /** The handful shown in the home rail beside the API's stores. */
  featured: async (limit: number, signal?: AbortSignal): Promise<Result<Restaurant[]>> => {
    await sleep(signal);
    return ok(
      [...RESTAURANTS].sort((a, b) => b.rating - a.rating).slice(0, Math.max(0, limit)),
    );
  },
};
