/**
 * Token-styled prose block for the `privacy-policies` HTML.
 *
 * The API returns HTML strings (live markup: `h1 h2 p ul/li strong` with named entities). The
 * string arriving here has already been through `sanitizePolicyHtml()` in
 * `data/models/policy.ts` — scripts, styles, event handlers and `javascript:` URLs are gone and
 * only a small tag list survives — which is the only reason `dangerouslySetInnerHTML` is used.
 *
 * Styling is applied with descendant selectors so the server's markup needs no classes; every
 * value is a design token, so the block reads correctly in both themes.
 */
import { cn } from '@/core/lib/cn';

const PROSE = cn(
  'text-body-sm font-normal leading-[1.6] text-ink2',
  '[&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-h4 [&_h1]:font-extrabold [&_h1]:text-ink',
  '[&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-body-l [&_h2]:font-bold [&_h2]:text-ink',
  '[&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-body [&_h3]:font-bold [&_h3]:text-ink',
  '[&_h4]:mb-2 [&_h4]:mt-4 [&_h4]:text-body-sm [&_h4]:font-bold [&_h4]:text-ink',
  '[&_p]:my-3',
  '[&_strong]:font-semibold [&_strong]:text-ink [&_b]:font-semibold [&_b]:text-ink',
  '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5',
  '[&_li]:my-1.5 [&_li]:pl-1',
  '[&_a]:font-semibold [&_a]:text-brand [&_a]:underline [&_a]:decoration-brand/40 [&_a]:underline-offset-2',
  '[&_hr]:my-6 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-line',
  '[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-line [&_blockquote]:pl-4',
  '[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse',
  '[&_th]:border [&_th]:border-line [&_th]:p-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-ink',
  '[&_td]:border [&_td]:border-line [&_td]:p-2',
  '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
);

export function PolicyProse({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn(PROSE, className)}
      // Sanitized in data/models/policy.ts — see the note above.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
