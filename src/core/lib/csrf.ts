/**
 * CSRF — SERVER ONLY (imports `node:crypto`).
 *
 * Double-submit pattern from architecture/03-auth-session.md: every state-changing BFF
 * call must send header `x-ozio-csrf` equal to the readable `ozio_csrf` cookie. The
 * cookie is readable by JS on purpose (the client has to echo it); it is not a secret,
 * it only proves the request was made by our own page and not by a cross-site form.
 * SameSite=Lax on the auth cookies covers top-level navigations.
 *
 * When `CSRF_SECRET` is set the token is `<nonce>.<hmac>` so a token cannot be forged
 * by an attacker who can set cookies on the origin but cannot read the secret.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const CSRF_COOKIE = 'ozio_csrf';
export const CSRF_HEADER = 'x-ozio-csrf';

function sign(nonce: string, secret: string): string {
  return createHmac('sha256', secret).update(nonce).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** A fresh CSRF token: 32 random bytes base64url, HMAC-signed when `CSRF_SECRET` is set. */
export function issueCsrf(): string {
  const nonce = randomBytes(32).toString('base64url');
  const secret = process.env.CSRF_SECRET;
  if (!secret) return nonce;
  return `${nonce}.${sign(nonce, secret)}`;
}

/**
 * True when a stored cookie value is still a well-formed (and, when signed, intact)
 * token — used to decide whether to reuse it or issue a new one at session hydrate.
 */
export function isValidCsrf(cookieValue: string | null | undefined): boolean {
  if (!cookieValue) return false;
  const secret = process.env.CSRF_SECRET;
  if (!secret) return cookieValue.length >= 16;

  const dot = cookieValue.lastIndexOf('.');
  if (dot <= 0) return cookieValue.length >= 16; // unsigned legacy token
  return safeEqual(cookieValue.slice(dot + 1), sign(cookieValue.slice(0, dot), secret));
}

/**
 * True when the header matches the cookie (and the signature holds, if present).
 *
 * A cookie issued before `CSRF_SECRET` existed carries no signature; it is still
 * accepted on equality so a deploy that adds the secret does not 403 live sessions.
 */
export function verifyCsrf(headerValue: string | null | undefined, cookieValue: string | null | undefined): boolean {
  if (!headerValue || !cookieValue) return false;
  if (!safeEqual(headerValue, cookieValue)) return false;

  const secret = process.env.CSRF_SECRET;
  if (!secret) return true;

  const dot = cookieValue.lastIndexOf('.');
  if (dot <= 0) return true; // unsigned legacy token
  const nonce = cookieValue.slice(0, dot);
  const signature = cookieValue.slice(dot + 1);
  return safeEqual(signature, sign(nonce, secret));
}
