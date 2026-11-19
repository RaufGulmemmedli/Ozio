/**
 * `track()` — provider-agnostic analytics. A **no-op until a provider is configured**, so nothing
 * leaves the browser before the provider is wired (and, on marketing pages, before consent).
 *
 * Wiring it up, once the provider is decided:
 *
 * ```ts
 * configureAnalytics({
 *   send: (event, payload) => amplitude.track(event, payload),
 *   identify: (hashedId) => amplitude.setUserId(hashedId),
 * });
 * ```
 */
import { PII_KEYS, type EventMap, type EventName } from './events';

export type EventPayload = Record<string, unknown>;

export interface AnalyticsProvider {
  send: (event: EventName, payload: EventPayload) => void;
  /** Receives an already-hashed id, or `null` on sign-out. Never the real user id. */
  identify?: (hashedUserId: string | null) => void;
  flush?: () => void;
}

let provider: AnalyticsProvider | null = null;
/** Events fired before the provider was configured, replayed on `configureAnalytics`. */
const queue: Array<[EventName, EventPayload]> = [];
const QUEUE_MAX = 40;

export const analyticsEnabled = (): boolean => provider !== null;

export function configureAnalytics(next: AnalyticsProvider | null): void {
  provider = next;
  if (!provider) {
    queue.length = 0;
    return;
  }
  const pending = queue.splice(0, queue.length);
  for (const [event, payload] of pending) safeSend(provider, event, payload);
}

function safeSend(p: AnalyticsProvider, event: EventName, payload: EventPayload): void {
  try {
    p.send(event, payload);
  } catch {
    // analytics must never break a screen
  }
}

/** Drops PII-looking keys and anything that is not a primitive. */
function sanitize(payload: unknown): EventPayload {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) return {};
  const out: EventPayload = {};
  for (const [k, v] of Object.entries(payload as EventPayload)) {
    if (PII_KEYS.includes(k)) continue;
    if (v === null) {
      out[k] = null;
    } else if (typeof v === 'string') {
      // a value that looks like a phone number or an e-mail never ships, whatever the key is called
      if (/@/.test(v) || /^\+?\d[\d\s()-]{7,}$/.test(v)) continue;
      out[k] = v.length > 120 ? v.slice(0, 120) : v;
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      out[k] = v;
    }
  }
  return out;
}

export const track = <K extends EventName>(event: K, payload: EventMap[K]): void => {
  const clean = sanitize(payload);
  if (!provider) {
    if (queue.length < QUEUE_MAX) queue.push([event, clean]);
    return;
  }
  safeSend(provider, event, clean);
};

/**
 * FNV-1a over the id, hex. One-way and stable across sessions, so funnels still work while the raw
 * id never leaves the device.
 */
export function hashUserId(userId: string | number): string {
  const s = String(userId);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function identify(userId: string | number | null): void {
  provider?.identify?.(userId === null ? null : hashUserId(userId));
}

export function flushAnalytics(): void {
  provider?.flush?.();
}
