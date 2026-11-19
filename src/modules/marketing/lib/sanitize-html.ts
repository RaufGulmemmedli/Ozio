/**
 * A deliberately tiny allow-list sanitizer for the one HTML string the marketing
 * site renders from the API (`GET v1/privacy-policies` → `data[].content`).
 *
 * The rule from the brief: never hand that string to `dangerouslySetInnerHTML`
 * raw. This strips every element that is not on `ALLOWED_TAGS`, drops
 * `<script>` / `<style>` / `<iframe>` / `<object>` bodies entirely, removes every
 * attribute except `href` on `<a>` (and only `http(s)` / `mailto:` / `tel:` /
 * same-origin targets), and therefore removes all `on*` handlers,
 * `style`, `srcset`, `data-*` and `javascript:` URLs.
 *
 * It is not a general-purpose sanitizer and is not meant to be: it runs on the
 * server, on one trusted-ish first-party endpoint, as defence in depth. Anything
 * it does not understand is dropped rather than passed through.
 */

const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'h2',
  'h3',
  'h4',
  'blockquote',
  'a',
  'hr',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
]);

/** Elements whose entire content is discarded, not just their tags. */
const STRIPPED_WITH_BODY = ['script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template'];

const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/|#)/i;

function safeHref(raw: string): string | null {
  const value = raw.trim().replace(/\s+/g, '');
  if (!SAFE_HREF.test(value)) return null;
  // Belt and braces: a "https:/\/\evil" style bypass still has to match above,
  // but an explicit scheme check keeps `javascript:` and `data:` out for good.
  if (/^(javascript|data|vbscript):/i.test(value)) return null;
  return value;
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/**
 * Returns HTML containing only `ALLOWED_TAGS` with no attributes other than a
 * vetted `href`. Text content is preserved as-is (it is already HTML-escaped by
 * the source, and we never un-escape it).
 */
export function sanitizeHtml(input: string): string {
  let html = input;

  // 1. Drop dangerous elements together with their content.
  for (const tag of STRIPPED_WITH_BODY) {
    html = html.replace(new RegExp(`<${tag}\\b[\\s\\S]*?</${tag}\\s*>`, 'gi'), '');
    // ...and any unclosed/self-closing leftovers.
    html = html.replace(new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi'), '');
  }

  // 2. Drop comments and processing instructions (can hide conditional markup).
  html = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<\?[\s\S]*?\?>/g, '');

  // 3. Rewrite every remaining tag through the allow-list.
  html = html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (_match, rawName, rawAttrs) => {
    const name = String(rawName).toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return '';

    const closing = /^<\//.test(_match as string);
    if (closing) return `</${name}>`;

    if (name === 'a') {
      const href = /href\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(String(rawAttrs));
      const value = href ? (href[2] ?? href[3] ?? href[4] ?? '') : '';
      const safe = value ? safeHref(value) : null;
      if (!safe) return '<a>';
      const external = /^https?:\/\//i.test(safe);
      return external
        ? `<a href="${escapeAttribute(safe)}" rel="noopener noreferrer nofollow" target="_blank">`
        : `<a href="${escapeAttribute(safe)}">`;
    }

    const selfClosing = name === 'br' || name === 'hr';
    return selfClosing ? `<${name} />` : `<${name}>`;
  });

  return html.trim();
}

/** `true` when the sanitized string still carries real text. */
export function hasContent(html: string): boolean {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim().length > 0;
}
