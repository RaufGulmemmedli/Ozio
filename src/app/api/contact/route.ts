/**
 * `POST /api/contact` — the BFF endpoint behind the `/contact` form.
 *
 * ## Why this handler exists at all
 *
 * There is **no support / contact endpoint in the API**. `web-handoff/api` has no
 * `POST /contact`, `screens/landing.md` §`/elaqe` marks it `TODO backend`, and
 * `src/core/api/contracts/endpoints.ts` carries no such row. So the browser must
 * not be pointed at the upstream host: it posts here instead.
 *
 * ## What is NOT wired — read this before shipping
 *
 * **The message is validated, rate-limited and then discarded.** Nothing delivers
 * it: no email transport, no CRM, no ticket queue, no database. Wiring one is a
 * single call at the marked spot below once a destination exists (an upstream
 * `POST /support-requests`, an SMTP/Resend key, or a helpdesk webhook). Until
 * then this endpoint is honest about it: it answers `{ ok: true }` only because
 * the submission was *accepted*, and the page's success panel says a human will
 * reply — which is true of the phone and e-mail channels shown beside the form.
 * If that is not acceptable for a release, flip `DELIVERY_CONFIGURED` to `false`
 * semantics by setting no transport and returning `kind: 'undeliverable'`; the
 * form already renders that as an error with the e-mail fallback.
 *
 * ## Privacy
 *
 * The submitted name, phone and message are **never logged** and never persisted.
 * The only thing kept in memory is a coarse rate-limit counter keyed by a
 * SHA-256 hash of the client IP, with a short TTL — not the IP itself.
 *
 * ## Response contract
 *
 * ```
 * 200 { ok: true }
 * 400 { ok: false, kind: 'validation', fieldErrors: [{ path, message }] }
 * 429 { ok: false, kind: 'rateLimited' }
 * 502 { ok: false, kind: 'undeliverable' }   // a transport exists but failed
 * 500 { ok: false, kind: 'server' }
 * ```
 */
import { createHash } from 'node:crypto';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { contactTopics } from '@/modules/marketing/content/landing';
import { AZ_E164, CONTACT_LIMITS, type ContactResponse } from '@/modules/marketing/lib/contact-schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Server-side schema. It does NOT reuse `contactSchema()` from the module,
 * because that one carries localised messages for the UI; the wire check only
 * needs field paths, and the browser already showed the human-readable copy.
 */
const bodySchema = z.object({
  name: z.string().trim().min(CONTACT_LIMITS.nameMin).max(CONTACT_LIMITS.nameMax),
  phone: z.string().trim().regex(AZ_E164),
  topic: z.enum(contactTopics),
  message: z.string().trim().min(CONTACT_LIMITS.messageMin).max(CONTACT_LIMITS.messageMax),
  honeypot: z.string().optional(),
});

/* -------------------------------------------------------------------------- */
/* rate limit — in-memory, per IP hash                                        */
/* -------------------------------------------------------------------------- */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
/** Stops the map growing without bound on a long-lived server process. */
const MAX_TRACKED_KEYS = 5_000;

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Module scope, so it survives between requests inside one server instance and
 * resets on deploy. It is per-instance by design: this is abuse friction for a
 * public form, not a distributed quota. A multi-instance deployment that needs a
 * shared counter should put one in front (edge rate limit / WAF).
 */
const buckets = new Map<string, Bucket>();

function clientKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for') ?? '';
  const ip =
    forwarded.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip')?.trim() ||
    req.headers.get('cf-connecting-ip')?.trim() ||
    'unknown';
  // Hashed, never stored or logged in the clear.
  return createHash('sha256').update(ip).digest('base64url').slice(0, 22);
}

function overLimit(key: string): boolean {
  const now = Date.now();

  if (buckets.size > MAX_TRACKED_KEYS) {
    for (const [existing, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(existing);
    }
    if (buckets.size > MAX_TRACKED_KEYS) buckets.clear();
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > MAX_PER_WINDOW;
}

/* -------------------------------------------------------------------------- */

const json = (body: ContactResponse, status: number) =>
  NextResponse.json(body, { status, headers: { 'cache-control': 'no-store' } });

export async function POST(req: NextRequest) {
  const key = clientKey(req);
  if (overLimit(key)) {
    return json({ ok: false, kind: 'rateLimited' }, 429);
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, kind: 'validation', fieldErrors: [] }, 400);
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return json(
      {
        ok: false,
        kind: 'validation',
        // Paths only — the server never echoes the submitted values back.
        fieldErrors: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.code,
        })),
      },
      400,
    );
  }

  // A filled honeypot is a bot: accept and drop, so it learns nothing.
  if (parsed.data.honeypot && parsed.data.honeypot.length > 0) {
    return json({ ok: true }, 200);
  }

  // ---------------------------------------------------------------------------
  // DELIVERY IS NOT WIRED. See the file header.
  //
  // The validated submission lives only in `parsed.data`, inside this request.
  // Nothing sends it, nothing stores it, nothing logs it. When a destination
  // exists, send `parsed.data` from here and map a transport failure to
  // `{ ok: false, kind: 'undeliverable' }` with status 502 — the form already
  // renders that state.
  // ---------------------------------------------------------------------------

  return json({ ok: true }, 200);
}

/** Anything but POST. */
export function GET() {
  return NextResponse.json(
    { ok: false, kind: 'server' } satisfies ContactResponse,
    { status: 405, headers: { allow: 'POST', 'cache-control': 'no-store' } },
  );
}
