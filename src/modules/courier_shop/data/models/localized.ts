/**
 * Product and service names arrive from the (mock) API as a per-locale object, exactly as a real
 * catalogue endpoint would send them — they are data, not UI copy, so they do not live in
 * `messages/parts/courier_shop.json`.
 *
 * Tolerant like every other parser here: a missing locale falls back to az, then to anything
 * non-empty, then to `''`. Never throws.
 */
import { str } from '@/core/network';

export interface LocalizedText {
  az: string;
  ru: string;
  en: string;
}

export const EMPTY_TEXT: LocalizedText = { az: '', ru: '', en: '' };

export function parseLocalized(raw: unknown): LocalizedText {
  if (typeof raw === 'string') return { az: raw, ru: raw, en: raw };
  if (raw === null || typeof raw !== 'object') return EMPTY_TEXT;
  const row = raw as Record<string, unknown>;
  const az = str(row.az);
  const ru = str(row.ru);
  const en = str(row.en);
  const fallback = az || ru || en;
  return { az: az || fallback, ru: ru || fallback, en: en || fallback };
}

/** `pick(item.name, locale)` — the one place a locale is resolved against fixture text. */
export function pick(text: LocalizedText | undefined, locale: string): string {
  if (!text) return '';
  const key = locale.slice(0, 2).toLowerCase();
  if (key === 'ru') return text.ru || text.az || text.en;
  if (key === 'en') return text.en || text.az || text.ru;
  return text.az || text.ru || text.en;
}
