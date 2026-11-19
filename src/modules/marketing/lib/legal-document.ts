// SERVER ONLY — imported by `/terms` and `/privacy`, never by a client component.
/**
 * Fetches the one `auth: none`, `live: verified` endpoint the marketing site is
 * allowed to call: `GET v1/privacy-policies` (`ProfilePrivacyPolicies`).
 *
 * Two things matter here:
 *
 * 1. **The page must stay ISR.** `serverApi` reads `cookies()` to attach a bearer
 *    token, and a `cookies()` read inside a page opts that page out of static
 *    rendering. Wrapping the call in `unstable_cache` puts it in a cache scope
 *    where `cookies()` throws — `serverApi` already swallows that and sends the
 *    request anonymously, which is exactly right for an `auth: none` endpoint.
 *    So the page keeps `revalidate = 86400` and the upstream answer is cached for
 *    the same window.
 * 2. **It must never throw.** A failure returns `null` and the page renders the
 *    static fallback document from `content/legal.ts` plus a `legal.offline` note.
 */
import { unstable_cache } from 'next/cache';

import type { ProfilePrivacyPoliciesData } from '@/core/api/contracts/types';
import { serverApi } from '@/core/network/server-api';

import { hasContent, sanitizeHtml } from './sanitize-html';

/** One day, matching `export const revalidate = 86400` on both legal pages. */
export const LEGAL_REVALIDATE = 86_400;

export interface LegalDocument {
  /** Sanitized HTML, guaranteed non-empty. */
  html: string;
  /** The locale the upstream row was tagged with, when it said. */
  locale: string | null;
}

function pickRow(data: unknown, locale: string): { content?: string; locale?: string } | null {
  const rows = Array.isArray(data) ? (data as ProfilePrivacyPoliciesData) : [];
  if (rows.length === 0) return null;
  const exact = rows.find((row) => typeof row?.locale === 'string' && row.locale === locale);
  const base = rows.find(
    (row) => typeof row?.locale === 'string' && row.locale.split('-')[0] === locale,
  );
  return exact ?? base ?? rows[0] ?? null;
}

const loadPolicies = unstable_cache(
  async (locale: string): Promise<unknown> => {
    const result = await serverApi<ProfilePrivacyPoliciesData>('GET', 'privacy-policies', {
      version: 'v1',
      locale,
      revalidate: LEGAL_REVALIDATE,
      tags: ['privacy-policies'],
    });
    return result.ok ? result.value.data : null;
  },
  ['marketing', 'privacy-policies'],
  { revalidate: LEGAL_REVALIDATE, tags: ['privacy-policies'] },
);

/**
 * `null` → render the static fallback. Never throws, never logs the request body
 * and never carries anything user-specific (the call is anonymous by design).
 */
export async function getLegalDocument(locale: string): Promise<LegalDocument | null> {
  let data: unknown = null;
  try {
    data = await loadPolicies(locale);
  } catch {
    return null;
  }

  const row = pickRow(data, locale);
  const raw = typeof row?.content === 'string' ? row.content : '';
  if (!raw.trim()) return null;

  const html = sanitizeHtml(raw);
  if (!hasContent(html)) return null;

  return { html, locale: typeof row?.locale === 'string' ? row.locale : null };
}
