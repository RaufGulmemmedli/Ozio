/**
 * The rules prose block.
 *
 * `useMemo` is deliberate: the input is one ~4 KB HTML string, and it is sanitized once per
 * value rather than on every render. The markup handed to `dangerouslySetInnerHTML` is the
 * **output of `sanitizePolicyHtml`** — never the server string (see that file for what is
 * stripped).
 *
 * Styling is token-only, applied from the wrapper with descendant selectors, because the
 * sanitizer removes every `class` and `style` attribute from the content itself.
 */
'use client';

import { useMemo } from 'react';

import { cn } from '@/core/lib/cn';

import { sanitizePolicyHtml } from '../lib/sanitize-policy-html';

export interface PolicyHtmlProps {
  /** Raw `data.content` from `GET v1/lotteries/policy`. */
  html: string;
  className?: string;
}

/**
 * Heading order is preserved (`h1` is demoted to `h2` by the sanitizer), so this block can
 * sit under the page's single `h1`.
 */
const PROSE = [
  'flex w-full flex-col text-body text-ink2',
  '[&_p]:my-3 [&_p]:leading-relaxed',
  '[&_div]:my-0',
  '[&_h2]:mt-7 [&_h2]:mb-3 [&_h2]:text-h4 [&_h2]:font-bold [&_h2]:text-ink',
  '[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-body-l [&_h3]:font-bold [&_h3]:text-ink',
  '[&_h4]:mt-5 [&_h4]:mb-2 [&_h4]:text-body [&_h4]:font-bold [&_h4]:text-ink',
  '[&_h5]:mt-5 [&_h5]:mb-2 [&_h5]:text-body [&_h5]:font-semibold [&_h5]:text-ink',
  '[&_h6]:mt-5 [&_h6]:mb-2 [&_h6]:text-body-sm [&_h6]:font-semibold [&_h6]:text-ink',
  '[&_strong]:font-bold [&_strong]:text-ink',
  '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:ps-6',
  '[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:ps-6',
  '[&_li]:my-1.5',
  '[&_a]:font-semibold [&_a]:text-brand [&_a]:underline',
  '[&_blockquote]:my-4 [&_blockquote]:border-s-2 [&_blockquote]:border-line [&_blockquote]:ps-4',
  '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
].join(' ');

export function PolicyHtml({ html, className }: PolicyHtmlProps) {
  const safe = useMemo(() => sanitizePolicyHtml(html), [html]);

  return (
    <div
      className={cn(PROSE, className)}
      // Sanitized above: allow-listed tags only, every attribute dropped except a vetted
      // `href` on `<a>`. See lib/sanitize-policy-html.ts.
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
