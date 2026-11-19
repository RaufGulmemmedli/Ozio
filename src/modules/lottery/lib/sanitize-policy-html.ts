/**
 * Sanitizer for `GET v1/lotteries/policy` → `data.content`.
 *
 * The endpoint returns one ~4 KB CKEditor HTML string — nested `<div>` / `<p>` / `<strong>`
 * / `<u>` / `<ul><li>` / `<h2>` / `<h3>` with named entities — and there is no structured
 * form of it, no locale field and no section list. It is server-authored text, so it is
 * rendered as HTML rather than flattened to one paragraph; but it is also **remote input**,
 * so it goes through this function first and never reaches `dangerouslySetInnerHTML` raw.
 *
 * What it does, in order:
 *  1. drops HTML comments (and anything hiding in them);
 *  2. deletes `<script>`, `<style>`, `<iframe>`, `<svg>`, form controls and friends
 *     **together with their content**, so nothing executable or focusable survives;
 *  3. re-emits the remaining markup tag by tag against a small allow-list — a tag that is
 *     not on the list is dropped while its text is kept, so no copy is ever lost;
 *  4. **drops every attribute**, which is what removes `on*` handlers, inline `style`,
 *     `class`, `id` and `srcset` in one move. The single exception is `href` on `<a>`,
 *     which is re-emitted only for `http`, `https`, `mailto`, `tel` and same-page `#`
 *     targets (so no `javascript:` / `data:` URL can get through), always with
 *     `rel="noopener noreferrer"`;
 *  5. normalises the heading level: an `<h1>` inside the content becomes an `<h2>` so the
 *     page keeps exactly one `h1` and its heading order stays valid;
 *  6. closes whatever the source left open, so a truncated string cannot break the page.
 *
 * It is pure string work (no `DOMParser`), so it runs identically on the server and in the
 * browser, and it never throws: unparseable input degrades to its own text.
 */

/** Tags that survive. Everything else is unwrapped (its text is kept). */
const ALLOWED = new Set([
  'p',
  'br',
  'div',
  'span',
  'strong',
  'em',
  'u',
  's',
  'ul',
  'ol',
  'li',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'a',
  'blockquote',
]);

/** Deleted with everything inside them. */
const DROP_WITH_CONTENT = [
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'noscript',
  'template',
  'svg',
  'math',
  'form',
  'input',
  'button',
  'select',
  'textarea',
  'link',
  'meta',
  'base',
  'title',
  'audio',
  'video',
  'canvas',
];

const VOID_TAGS = new Set(['br']);

/** `b`/`i` are the editor's old spelling; `h1` is demoted to keep one `h1` per page. */
const TAG_ALIASES: Record<string, string> = {
  b: 'strong',
  i: 'em',
  strike: 's',
  del: 's',
  h1: 'h2',
};

const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|#|\/)/i;

const escapeAttribute = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Only `href` on `<a>` survives, and only with a protocol we allow. */
function safeAttributes(tag: string, rawAttributes: string): string {
  if (tag !== 'a') return '';
  const match = /href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(rawAttributes);
  const href = (match?.[1] ?? match?.[2] ?? match?.[3] ?? '').trim();
  // Collapse whitespace and control characters first: `java\nscript:` is a real bypass.
  const cleaned = href.replace(/[\s\u0000-\u001f]/g, '');
  if (!cleaned || !SAFE_HREF.test(cleaned)) return '';
  const external = /^https?:/i.test(cleaned);
  return ` href="${escapeAttribute(cleaned)}" rel="noopener noreferrer"${
    external ? ' target="_blank"' : ''
  }`;
}

function dropDangerousElements(html: string): string {
  let out = html;
  for (const tag of DROP_WITH_CONTENT) {
    out = out.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}\\s*>`, 'gi'), '');
    out = out.replace(new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi'), '');
  }
  return out;
}

const TAG = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;

export function sanitizePolicyHtml(input: string): string {
  if (!input) return '';

  let html = input.replace(/<!--[\s\S]*?-->/g, '');
  html = dropDangerousElements(html);

  const out: string[] = [];
  const open: string[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  TAG.lastIndex = 0;
  while ((match = TAG.exec(html)) !== null) {
    out.push(html.slice(cursor, match.index));
    cursor = match.index + match[0].length;

    const raw = match[1].toLowerCase();
    const tag = TAG_ALIASES[raw] ?? raw;
    if (!ALLOWED.has(tag)) continue; // unwrap: the tag goes, the text stays

    if (match[0].startsWith('</')) {
      const index = open.lastIndexOf(tag);
      if (index < 0) continue; // stray close tag
      while (open.length > index) out.push(`</${open.pop() as string}>`);
      continue;
    }

    if (VOID_TAGS.has(tag)) {
      out.push('<br/>');
      continue;
    }

    // A self-closing `<p/>` from the editor: emit it closed straight away.
    if (/\/\s*$/.test(match[2])) {
      out.push(`<${tag}${safeAttributes(tag, match[2])}></${tag}>`);
      continue;
    }

    open.push(tag);
    out.push(`<${tag}${safeAttributes(tag, match[2])}>`);
  }

  out.push(html.slice(cursor));
  while (open.length > 0) out.push(`</${open.pop() as string}>`);

  return out.join('').trim();
}

/** `true` when the sanitized string has no visible text left — the page's empty state. */
export function isPolicyEmpty(sanitized: string): boolean {
  return sanitized.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim().length === 0;
}
