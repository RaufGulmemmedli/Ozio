/**
 * Mock fixtures carry az/ru/en text (BUILD-CONTRACT "Mock modules"), so the wire shape for every
 * human-readable field in this module is either a plain string or `{az, ru, en}`.
 *
 * The repository resolves it once, for the locale the hook passes in, so views never see a triplet
 * and the query key is locale-scoped. Tolerant: an unknown shape becomes `''`, never throws.
 */
import { asObj, str } from '@/core/network';

export type LocaleCode = 'az' | 'ru' | 'en';

export type Localized = string | { az?: string; ru?: string; en?: string };

const FALLBACK_ORDER: readonly LocaleCode[] = ['az', 'en', 'ru'];

/** Normalizes anything next-intl may hand us (`az`, `az-AZ`, `AZ`) to a known code. */
export function localeCode(locale: string | undefined): LocaleCode {
  const head = (locale ?? '').slice(0, 2).toLowerCase();
  return head === 'ru' || head === 'en' ? head : 'az';
}

/** Picks `locale`, then az → en → ru, then any non-empty value. */
export function pickText(value: unknown, locale: string): string {
  if (typeof value === 'string') return value;
  const o = asObj(value);
  const wanted = str(o[localeCode(locale)]);
  if (wanted) return wanted;
  for (const code of FALLBACK_ORDER) {
    const fallback = str(o[code]);
    if (fallback) return fallback;
  }
  return '';
}
