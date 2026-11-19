import { defineRouting } from 'next-intl/routing';

/** Every locale the site ships. `az` is the primary copy, `ru` is the longest. */
export const locales = ['az', 'ru', 'en'] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = 'az';

/** Cookie the middleware writes on a language switch (06-i18n-theming.md). */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

/** Fixed display/calculation zone for order times and delivery slots. */
export const TIME_ZONE = 'Asia/Baku';

/**
 * `localePrefix: 'as-needed'` → `/…` is az, `/ru/…` and `/en/…` are prefixed.
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  localeCookie: { name: LOCALE_COOKIE },
});

/** Native language names for the switcher ("Dil: Azərbaycan"). */
export const localeLabels: Record<AppLocale, string> = {
  az: 'Azərbaycan',
  ru: 'Русский',
  en: 'English',
};

/** Short label for the header/footer switcher ("AZ"). */
export const localeShortLabels: Record<AppLocale, string> = {
  az: 'AZ',
  ru: 'RU',
  en: 'EN',
};

/** BCP-47 tags handed to `Intl.*`; keep `en-US` so money renders `₼12.50`. */
export const intlLocales: Record<AppLocale, string> = {
  az: 'az-AZ',
  ru: 'ru-RU',
  en: 'en-US',
};

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

/** Never throws: anything unknown (including `undefined`) resolves to `az`. */
export function resolveLocale(value: string | null | undefined): AppLocale {
  if (isAppLocale(value)) return value;
  const base = typeof value === 'string' ? value.split('-')[0]?.toLowerCase() : undefined;
  return isAppLocale(base) ? base : defaultLocale;
}
