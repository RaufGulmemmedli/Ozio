/**
 * Order-number formatting — the single place the `№ OZ-xxxxx` format lives.
 *
 * The design is inconsistent (`#48213` on home/tracking vs `№ OZ-48215` on checkout/orders); the
 * handoff says to pick one, so the whole app renders `№ OZ-xxxxx`. If the server turns out to send
 * its own human-readable number in a different shape, this function is the only change needed.
 */

/** `48215` / `'48215'` / `'OZ-48215'` → `'№ OZ-48215'`. Empty input → `''`. */
export function formatOrderNo(id: string | number | null | undefined): string {
  if (id === null || id === undefined) return '';
  const raw = String(id).trim();
  if (!raw) return '';
  const digits = raw.replace(/\D+/g, '');
  // Nothing numeric in it (a UUID-ish id, say): show it as the server sent it.
  if (!digits) return `№ ${raw}`;
  return `№ OZ-${digits}`;
}

/** Just the `OZ-48215` part, for file names and `aria-label`s where the `№` sign is noise. */
export function orderNoPlain(id: string | number | null | undefined): string {
  return formatOrderNo(id).replace(/^№\s*/, '');
}
