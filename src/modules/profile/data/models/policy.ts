/**
 * `GET v1/privacy-policies` (**verified**, `auth: none`) — a bare array of `{ content, locale }`
 * where `content` is an HTML string.
 *
 * The live markup is only `h1 h2 p ul/li strong` with named entities. Anything else is tolerated:
 * unknown tags are dropped and their text kept, and `<script>` / `<style>` / event handlers /
 * `javascript:` URLs are removed — the HTML comes from a server the client does not control, so it
 * is sanitized before it ever reaches `dangerouslySetInnerHTML`.
 */
import { asList, asObj, nullableStr, str } from '@/core/network';

export interface PrivacyPolicy {
  /** Lower-cased locale tag (`az` / `ru` / `en`), or `null` when the row carries none. */
  locale: string | null;
  title: string | null;
  /** Sanitized HTML, safe for `dangerouslySetInnerHTML`. */
  html: string;
}

/** Tags kept by the sanitizer. Everything else is unwrapped (its text survives). */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'a', 'blockquote', 'hr', 'span', 'div', 'table', 'thead',
  'tbody', 'tr', 'td', 'th',
]);

/** Attributes kept, per tag. Anything not listed (including every `on*`) is dropped. */
const ALLOWED_ATTRS: Record<string, ReadonlySet<string>> = {
  a: new Set(['href', 'title']),
};

const DANGEROUS_BLOCKS = /<(script|style|iframe|object|embed|noscript|template)\b[\s\S]*?<\/\1\s*>/gi;
const SELF_CLOSING_DANGEROUS = /<(script|style|iframe|object|embed|link|meta|base|form|input)\b[^>]*\/?>/gi;
const COMMENTS = /<!--[\s\S]*?-->/g;
const TAG = /<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
const ATTR = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
const SAFE_URL = /^(https?:|mailto:|tel:|#|\/)/i;

function safeAttrs(tag: string, rawAttrs: string): string {
  const allowed = ALLOWED_ATTRS[tag];
  if (!allowed) return '';
  const out: string[] = [];
  for (const match of rawAttrs.matchAll(ATTR)) {
    const name = match[1].toLowerCase();
    if (!allowed.has(name)) continue;
    const value = (match[3] ?? match[4] ?? match[5] ?? '').trim();
    if (name === 'href' && !SAFE_URL.test(value)) continue;
    out.push(`${name}="${value.replace(/"/g, '&quot;')}"`);
  }
  if (tag === 'a') {
    out.push('target="_blank"', 'rel="noopener noreferrer"');
  }
  return out.length > 0 ? ` ${out.join(' ')}` : '';
}

/**
 * Strips scripts, styles, event handlers and `javascript:` URLs, keeps a small tag list and
 * unwraps everything else. Never throws; a non-string input yields `''`.
 */
export function sanitizePolicyHtml(input: unknown): string {
  const raw = str(input);
  if (!raw.trim()) return '';
  const withoutBlocks = raw
    .replace(COMMENTS, '')
    .replace(DANGEROUS_BLOCKS, '')
    .replace(SELF_CLOSING_DANGEROUS, '');

  return withoutBlocks
    .replace(TAG, (full, rawName: string, rawAttrs: string) => {
      const tag = rawName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return '';
      const closing = full.startsWith('</');
      if (closing) return `</${tag}>`;
      if (tag === 'br' || tag === 'hr') return `<${tag} />`;
      return `<${tag}${safeAttrs(tag, rawAttrs)}>`;
    })
    .trim();
}

export function parsePolicy(raw: unknown): PrivacyPolicy {
  const o = asObj(raw);
  const locale = nullableStr(o.locale ?? o.lang);
  return {
    locale: locale ? locale.toLowerCase() : null,
    // Not sent by the live API — kept because the Flutter parser accepts it.
    title: nullableStr(o.title ?? o.name),
    html: sanitizePolicyHtml(o.content ?? o.body ?? o.text ?? o.description),
  };
}

export function parsePolicies(raw: unknown): PrivacyPolicy[] {
  const rows = Array.isArray(raw) ? raw : asList(asObj(raw).data);
  return rows.map(parsePolicy).filter((p) => p.html.length > 0);
}

/** The row for `locale`, else the `az` row, else the first one. */
export function pickPolicy(
  policies: readonly PrivacyPolicy[],
  locale: string,
): PrivacyPolicy | null {
  const byLocale = (want: string) =>
    policies.find((p) => (p.locale ?? '') === want.toLowerCase());
  return byLocale(locale) ?? byLocale('az') ?? policies[0] ?? null;
}
