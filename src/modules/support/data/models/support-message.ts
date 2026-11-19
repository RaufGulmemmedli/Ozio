/**
 * One chat message. `mock-contracts.ts` `SupportMessage{from, text}`, with the timestamp the
 * export's bubbles show ("14:20") and an id so React keys are stable across a reload.
 *
 * `parseSupportMessage` never throws, and it **re-applies the redaction** on read: anything that
 * reaches the client has already been masked by the mock, and masking again means a thread written
 * by an older build can never surface a phone or card number either.
 */
import { asList, asObj, num, str } from '@/core/network';

export type SupportAuthor = 'me' | 'agent';

export interface SupportMessage {
  id: string;
  from: SupportAuthor;
  text: string;
  /** Epoch ms. The bubble renders `HH:mm` from it through `useFormat().date`. */
  sentAt: number;
}

export interface SupportThread {
  messages: SupportMessage[];
  /** How long the client shows the typing indicator before revealing the last agent reply. */
  replyDelayMs: number;
  /**
   * The server's clock at the moment the thread was read, so the view can label the "Bu gün"
   * divider **without** calling `Date.now()` during render (a render must stay pure). `0` when the
   * payload carried nothing usable, and then the view falls back to the newest message's day.
   */
  now: number;
}

/**
 * The mask applied to anything that looks like a phone number, a card number or a one-time code.
 *
 * Deliberately not localized: it is a mask, not copy. Rules, widest first:
 *  - a run of 6+ digits with separators (`+994 50 123 45 67`, `4169 7388 1234 5678`)
 *  - a bare 4–8 digit group (an OTP, or one card block typed on its own)
 */
export const REDACTION = '•••';

const PATTERNS: readonly RegExp[] = [
  /\+?\d[\d\s().\-–]{4,}\d/g,
  /\b\d{4,8}\b/g,
];

/** Never echo back or store a phone number, card number or OTP. */
export function redactSensitive(text: string): string {
  let out = text;
  for (const pattern of PATTERNS) out = out.replace(pattern, REDACTION);
  return out;
}

const authorOf = (value: unknown): SupportAuthor => (value === 'me' ? 'me' : 'agent');

export function parseSupportMessage(raw: unknown, index = 0): SupportMessage | null {
  const o = asObj(raw);
  const text = redactSensitive(str(o.text, '').trim());
  if (!text) return null;
  const sentAt = num(o.sentAt);
  return {
    id: str(o.id, '') || `m${index}`,
    from: authorOf(o.from),
    text,
    sentAt: Number.isFinite(sentAt) && sentAt > 0 ? sentAt : Date.now(),
  };
}

export function parseSupportThread(raw: unknown): SupportThread {
  const o = asObj(raw);
  const messages = asList(o.messages)
    .map((m, i) => parseSupportMessage(m, i))
    .filter((m): m is SupportMessage => m !== null);
  const delay = num(o.replyDelayMs);
  const now = num(o.now);
  return {
    messages,
    replyDelayMs: Number.isFinite(delay) && delay > 0 ? Math.min(delay, 6_000) : 0,
    now: Number.isFinite(now) && now > 0 ? now : 0,
  };
}

/** `true` when the thread has never been written to — the "Yeni söhbət" state. */
export const isNewThread = (thread: SupportThread | null | undefined): boolean =>
  (thread?.messages.length ?? 0) === 0;
