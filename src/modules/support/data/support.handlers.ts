/**
 * MSW handlers for the support chat (`/api/mock/support/…`).
 *
 * There is no chat endpoint upstream (`api/mock-modules.md` §9 lists `GET|POST
 * v1/support/messages` as PROPOSED), so this is the whole "backend": a scripted agent with a
 * greeting, keyword-matched replies and the documented catch-all, persisted in
 * `createMockDb('support', …)` so a reload keeps the conversation.
 *
 * **Registration:** `support` is **not** one of the names in `src/core/mocks/modules.ts`, so
 * `loadMockModules()` never imports a `support/data/support.mock.ts` — and nothing may statically
 * import another module's `*.mock.ts` for its side effects, because `core/mocks` is pulled into the
 * root layout and a missing file would break every route.
 *
 * So this file is deliberately **not** a `*.mock.ts` and registers nothing: it exports
 * `supportHandlers` as a plain value. `src/modules/image_search/data/image_search.mock.ts` — whose
 * module name *is* in the registry list — imports that value and calls `registerMockHandlers`.
 * `registerMockHandlers` takes any key, so the namespace is still `/api/mock/support/…`.
 *
 * **Privacy:** every message is run through `redactSensitive()` **before** it is stored, so a phone
 * number, card number or one-time code the user types is never echoed back and never reaches
 * `localStorage`.
 */
import { http } from 'msw';

import { delay, mockError, mockJson, mockPath } from '@/core/mocks';
import { createMockDb } from '@/core/mocks/db';

import { SUPPORT_MOCK_MODULE } from '../support.flags';
import {
  MAX_MESSAGE_LENGTH,
  SUPPORT_GREETING,
  TYPING_DELAY_MS,
  localized,
  pickLocale,
  scriptedReply,
} from './support.fixtures';
import { redactSensitive } from './models/support-message';

interface StoredMessage {
  id: string;
  from: 'me' | 'agent';
  text: string;
  sentAt: number;
}

interface SupportDb {
  messages: StoredMessage[];
  /** The greeting is sent once per conversation. */
  greeted: boolean;
  seq: number;
}

const db = createMockDb<SupportDb>('support', { messages: [], greeted: false, seq: 0 });

/** Keep the demo thread bounded — a chat that grows forever would fill `localStorage`. */
const THREAD_LIMIT = 60;

function nextId(): string {
  const { seq } = db.get();
  db.patch({ seq: seq + 1 });
  return `m${seq + 1}`;
}

function append(rows: StoredMessage[]): void {
  db.set((prev) => ({
    ...prev,
    messages: [...prev.messages, ...rows].slice(-THREAD_LIMIT),
  }));
}

interface SendBody {
  text?: unknown;
  locale?: unknown;
}

export const supportHandlers = [
  /** `GET /api/mock/support/thread` — the persisted conversation. Empty = the "Yeni söhbət" state. */
  http.get(mockPath(SUPPORT_MOCK_MODULE, 'thread'), async () => {
    await delay(450);
    return mockJson({ messages: db.get().messages, replyDelayMs: 0, now: Date.now() });
  }),

  /**
   * `POST /api/mock/support/messages` `{ text, locale }`
   *
   * Appends the user's message (masked) and the agent's scripted answer in one go, so a reload
   * shows the finished exchange, and returns `replyDelayMs` so the client can run the typing
   * indicator before revealing that answer.
   */
  http.post(mockPath(SUPPORT_MOCK_MODULE, 'messages'), async ({ request }) => {
    let body: SendBody = {};
    try {
      body = (await request.json()) as SendBody;
    } catch {
      body = {};
    }

    const locale = pickLocale(body.locale);
    const raw = typeof body.text === 'string' ? body.text : '';
    const text = redactSensitive(raw.trim()).slice(0, MAX_MESSAGE_LENGTH);

    if (!text) return mockError(422, 'message is empty');

    await delay(260);

    const now = Date.now();
    const rows: StoredMessage[] = [];

    if (!db.get().greeted) {
      db.patch({ greeted: true });
      rows.push({ id: nextId(), from: 'agent', text: localized(SUPPORT_GREETING, locale), sentAt: now });
    }

    rows.push({ id: nextId(), from: 'me', text, sentAt: now + 1 });
    rows.push({
      id: nextId(),
      from: 'agent',
      text: scriptedReply(text, locale),
      sentAt: now + 2 + TYPING_DELAY_MS,
    });

    append(rows);

    return mockJson({ messages: db.get().messages, replyDelayMs: TYPING_DELAY_MS, now: Date.now() });
  }),

  /** `DELETE /api/mock/support/thread` — "Söhbəti təmizlə", back to the empty state. */
  http.delete(mockPath(SUPPORT_MOCK_MODULE, 'thread'), async () => {
    await delay(200);
    db.reset();
    return mockJson({ messages: [], replyDelayMs: 0, now: Date.now() });
  }),
];
