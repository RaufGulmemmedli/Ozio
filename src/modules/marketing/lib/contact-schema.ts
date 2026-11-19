/**
 * The one shape `/api/contact` accepts, shared by the form and the route handler
 * so the two can never drift.
 *
 * Validation mirrors `screens/landing.md` §`/elaqe`: name ≥ 2 chars, phone
 * `+994` + 9 digits (the same rule as login), message ≥ 10 chars, plus a subject
 * from the five chips drawn in the export. `honeypot` is the hidden field a bot
 * fills in; a non-empty value is accepted with `{ ok: true }` and dropped.
 */
import { z } from 'zod';

import { contactTopics } from '../content/landing';

export const CONTACT_LIMITS = {
  nameMin: 2,
  nameMax: 80,
  messageMin: 10,
  messageMax: 1500,
} as const;

/** `+994XXXXXXXXX` — the `normalizeToE164` output of `@/core/lib/phone`. */
export const AZ_E164 = /^\+994\d{9}$/;

export interface ContactMessages {
  name: string;
  phone: string;
  message: string;
  required: string;
}

/** Built with the caller's localised copy so no string is hardcoded here. */
export function contactSchema(m: ContactMessages) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(CONTACT_LIMITS.nameMin, m.name)
      .max(CONTACT_LIMITS.nameMax, m.name),
    phone: z.string().trim().regex(AZ_E164, m.phone),
    topic: z.enum(contactTopics),
    message: z
      .string()
      .trim()
      .min(CONTACT_LIMITS.messageMin, m.message)
      .max(CONTACT_LIMITS.messageMax, m.message),
    /** Accepted, then dropped by the route handler — never validated as empty. */
    honeypot: z.string().optional(),
  });
}

export type ContactValues = z.infer<ReturnType<typeof contactSchema>>;

/** What the route handler answers. Documented in `src/app/api/contact/route.ts`. */
export type ContactFailureKind = 'validation' | 'rateLimited' | 'undeliverable' | 'server';

export type ContactResponse =
  | { ok: true }
  | {
      ok: false;
      kind: ContactFailureKind;
      fieldErrors?: { path: string; message: string }[];
    };
