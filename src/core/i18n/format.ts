// No 'use client' on purpose: the non-hook helpers below must stay callable from
// server components and repositories, and `useLocale()` works in both runtimes.
import { useLocale } from 'next-intl';

import { intlLocales, resolveLocale, TIME_ZONE, type AppLocale } from './routing';

/**
 * The only place in the app that touches `Intl.*`. Components, repositories and
 * server components all format through here so az/ru/en stay consistent.
 */

/** U+20BC. Kept as a constant so no file has to type the glyph. */
export const MANAT = '₼';

/** Non-breaking space — the amount and the ₼ must never wrap apart. */
const NBSP = ' ';

const KG_UNIT = { az: 'kq', ru: 'кг', en: 'kg' } as const;

export type DateStyle = 'short' | 'long' | 'time' | 'dayMonth' | 'monthYear';

const DATE_PRESETS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  // 18.11.2026 (az/ru) — forms and tables
  short: { day: '2-digit', month: '2-digit', year: 'numeric' },
  // 18 noyabr 2026 — delivery dates, legal pages
  long: { day: 'numeric', month: 'long', year: 'numeric' },
  // 14:32 — 24h everywhere, Baku is a 24h market
  time: { hour: '2-digit', minute: '2-digit', hour12: false },
  // 18 noy — order rows, transaction rows
  dayMonth: { day: 'numeric', month: 'short' },
  // noyabr 2026 — transaction month headers
  monthYear: { month: 'long', year: 'numeric' },
};

const numberFormatters = new Map<string, Intl.NumberFormat>();
const dateFormatters = new Map<string, Intl.DateTimeFormat>();
const relativeFormatters = new Map<string, Intl.RelativeTimeFormat>();

/**
 * Separator-compatible stand-ins, used for NUMBERS ONLY.
 *
 * `az-AZ` is a valid CLDR locale, but some runtimes ship a trimmed ICU without
 * it and `Intl` then silently falls back to the default locale — which renders
 * money as `24.60 ₼` instead of the `24,60 ₼` the design requires (observed in
 * an embedded Chrome while Node formatted it correctly). `de-DE` has exactly
 * az's separators (`.` grouping, `,` decimal), so the digits come out right.
 *
 * This is safe here precisely because we never let `Intl` render the currency:
 * `money()` filters the currency parts out and attaches `₼` itself, so nothing
 * German can leak into the output — only the grouping and decimal marks.
 *
 * Deliberately NOT applied to dates: a stand-in would substitute German month
 * names. Dates solve the same gap differently — see the az calendar block below.
 */
const NUMBER_TAG_FALLBACK: Record<AppLocale, string> = {
  az: 'de-DE',
  ru: 'ru-RU',
  en: 'en-US',
};

/** The decimal mark each locale must actually produce. */
const EXPECTED_DECIMAL: Record<AppLocale, string> = { az: ',', ru: ',', en: '.' };

/**
 * Does this tag really format like the locale, or is the runtime only pretending?
 *
 * `Intl.NumberFormat.supportedLocalesOf('az-AZ')` is **not** a reliable test: a
 * Chrome build was observed returning `['az-AZ']` and then formatting 1234.5 as
 * `1,234.50` — en-US separators — because it accepts the tag but carries no az
 * data. Prices came out `0.70 ₼` where the design requires `0,70 ₼`.
 *
 * So the check is the output itself, which cannot lie.
 */
function producesExpectedSeparators(tag: string, app: AppLocale): boolean {
  try {
    const parts = new Intl.NumberFormat(tag, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).formatToParts(1234.5);
    return parts.find((p) => p.type === 'decimal')?.value === EXPECTED_DECIMAL[app];
  } catch {
    return false;
  }
}

const numberTags = new Map<AppLocale, string>();

function numberTag(locale: string): string {
  const app = resolveLocale(locale);
  const cached = numberTags.get(app);
  if (cached !== undefined) return cached;

  const preferred = intlLocales[app];
  const resolved = producesExpectedSeparators(preferred, app)
    ? preferred
    : NUMBER_TAG_FALLBACK[app];
  numberTags.set(app, resolved);
  return resolved;
}

function numberFormatter(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const resolved = numberTag(locale);
  const key = `${resolved}|${JSON.stringify(options)}`;
  let formatter = numberFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(resolved, options);
    numberFormatters.set(key, formatter);
  }
  return formatter;
}

/* ---------------------------------------------------------------------------------------------
 * az dates are written out here instead of being read from `Intl`.
 *
 * `new Intl.DateTimeFormat('az-AZ')` RESOLVES to `az-AZ` in the browser this app runs in and then
 * formats with CLDR **root** data. 18 November 2026 came out as "2026 M11 18" (long), "M11 18"
 * (dayMonth) and "2026-11-18" (short), so screens read "M11 19 · 3 aktiv təklif" and
 * "Son tarix: M12 27". `supportedLocalesOf` claims success, exactly as it does for numbers, so the
 * only test that cannot lie is the output. The same runtime formats ru as "18 ноября 2026 г." and
 * en as "November 18, 2026" — this is an az-data gap, not a broken `Intl`.
 *
 * Numbers solve their version of this with a separator-compatible stand-in locale, but there is no
 * stand-in for month names, so az assembles its own strings from the tables below.
 *
 * Doing that unconditionally — rather than only when the runtime lacks az — is the important part:
 * Node ships full ICU and DOES have az, so a runtime-dependent choice would render "18 noyabr" on
 * the server and "M11 18" in the browser and tear every date on hydration. Written out, the two
 * runtimes always agree.
 *
 * `Intl` still does the work that needs a time-zone database: `bakuParts` converts the instant to
 * Asia/Baku wall-clock numbers. Only the words are ours. Values follow CLDR az.
 * ------------------------------------------------------------------------------------------- */

const AZ_MONTHS_LONG = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr',
] as const;

const AZ_MONTHS_SHORT = [
  'yan', 'fev', 'mar', 'apr', 'may', 'iyn',
  'iyl', 'avq', 'sen', 'okt', 'noy', 'dek',
] as const;

/** Monday first — the order `<DatePicker>` lays its columns out in. */
const AZ_WEEKDAYS_SHORT = ['B.e.', 'Ç.a.', 'Ç.', 'C.a.', 'C.', 'Ş.', 'B.'] as const;

/**
 * Baku wall-clock numbers for an instant.
 *
 * Formatted through `en-GB`, which every ICU build carries and which is natively 24-hour, so the
 * parts come back as ASCII digits whatever locale data the runtime is missing. `hourCycle: 'h23'`
 * rather than `hour12: false` because the latter renders midnight as "24" on some ICU versions.
 */
const BAKU_PART_FORMAT = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

interface BakuParts {
  year: number;
  month: number;
  day: number;
  hour: string;
  minute: string;
}

function bakuParts(date: Date): BakuParts {
  const parts = BAKU_PART_FORMAT.formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';

  return {
    year: Number(value('year')),
    month: Number(value('month')),
    day: Number(value('day')),
    hour: value('hour').padStart(2, '0'),
    minute: value('minute').padStart(2, '0'),
  };
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function formatAzDate(date: Date, style: DateStyle): string {
  const { year, month, day, hour, minute } = bakuParts(date);
  // `month` is 1-based from Intl; the tables are 0-based.
  const index = Math.min(11, Math.max(0, month - 1));

  switch (style) {
    case 'short':
      return `${pad2(day)}.${pad2(month)}.${year}`;
    case 'long':
      return `${day} ${AZ_MONTHS_LONG[index]} ${year}`;
    case 'dayMonth':
      return `${day} ${AZ_MONTHS_SHORT[index]}`;
    case 'monthYear':
      return `${AZ_MONTHS_LONG[index]} ${year}`;
    case 'time':
      return `${hour}:${minute}`;
  }
}

/** Does this tag produce real month names, or root's "M11"? */
function producesMonthNames(candidate: string): boolean {
  try {
    const name = new Intl.DateTimeFormat(candidate, { month: 'long', timeZone: 'UTC' }).format(
      Date.UTC(2026, 10, 1),
    );
    return !/^M?\d+$/u.test(name);
  } catch {
    return false;
  }
}

const dateTags = new Map<AppLocale, string>();

/**
 * The tag `Intl` is asked for. az never gets here — `formatDate` assembles it — so this fallback
 * only catches a trimmed ICU that is missing ru too, where English month names still beat "M11".
 */
function dateTag(locale: string): string {
  const app = resolveLocale(locale);
  const cached = dateTags.get(app);
  if (cached !== undefined) return cached;

  const preferred = intlLocales[app];
  const resolved = producesMonthNames(preferred) ? preferred : 'en-US';
  dateTags.set(app, resolved);
  return resolved;
}

function dateFormatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const resolved = dateTag(locale);
  const key = `${resolved}|${JSON.stringify(options)}`;
  let formatter = dateFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(resolved, { timeZone: TIME_ZONE, ...options });
    dateFormatters.set(key, formatter);
  }
  return formatter;
}

function relativeFormatter(locale: string): Intl.RelativeTimeFormat {
  const key = dateTag(locale);
  let formatter = relativeFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(key, { numeric: 'auto' });
    relativeFormatters.set(key, formatter);
  }
  return formatter;
}

/**
 * Weekday and month names for calendar UI (`<DateField>`'s picker, month headers).
 *
 * Exported because two screens used to build these with their own `new Intl.DateTimeFormat(locale,
 * …)` call and so printed "M11" in the month picker for the same reason the dates did.
 */
export interface CalendarNames {
  /** 12 full month names, January first. */
  months: readonly string[];
  /** 12 abbreviated month names, January first. */
  monthsShort: readonly string[];
  /** 7 abbreviated weekday names, **Monday first**. */
  weekdays: readonly string[];
}

const calendarNamesCache = new Map<AppLocale, CalendarNames>();

export function calendarNames(locale: string): CalendarNames {
  const app = resolveLocale(locale);
  const cached = calendarNamesCache.get(app);
  if (cached) return cached;

  let names: CalendarNames;
  if (app === 'az') {
    names = { months: AZ_MONTHS_LONG, monthsShort: AZ_MONTHS_SHORT, weekdays: AZ_WEEKDAYS_SHORT };
  } else {
    const resolved = dateTag(app);
    const monthFmt = new Intl.DateTimeFormat(resolved, { month: 'long', timeZone: 'UTC' });
    const monthShortFmt = new Intl.DateTimeFormat(resolved, { month: 'short', timeZone: 'UTC' });
    const weekdayFmt = new Intl.DateTimeFormat(resolved, { weekday: 'short', timeZone: 'UTC' });
    names = {
      months: Array.from({ length: 12 }, (_, i) => monthFmt.format(Date.UTC(2024, i, 1))),
      monthsShort: Array.from({ length: 12 }, (_, i) => monthShortFmt.format(Date.UTC(2024, i, 1))),
      // 2024-01-01 was a Monday, so day 1..7 of that month is Mon..Sun.
      weekdays: Array.from({ length: 7 }, (_, i) => weekdayFmt.format(Date.UTC(2024, 0, 1 + i))),
    };
  }

  calendarNamesCache.set(app, names);
  return names;
}

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

/**
 * Digits only, assembled from `formatToParts`. `style: 'currency'` is never used:
 * several runtimes render AZN as the literal text "AZN" instead of ₼, so the
 * symbol is attached by `formatMoney` instead.
 */
function digits(locale: string, value: number, options: Intl.NumberFormatOptions): string {
  return numberFormatter(locale, { ...options, style: 'decimal' })
    .formatToParts(safeNumber(value))
    .filter((part) => part.type !== 'currency' && part.type !== 'unit' && part.type !== 'percentSign')
    .map((part) => part.value)
    .join('')
    .trim();
}

function toDate(value: Date | string | number): Date {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

/** `12,50 ₼` (az/ru) · `₼12.50` (en) · `-12,50 ₼`. Always 2 fraction digits. */
export function formatMoney(locale: string, value: number): string {
  const amount = safeNumber(value);
  // Sign is lifted out so en reads "-₼3.00", not "₼-3.00".
  const sign = amount < 0 ? '-' : '';
  const body = digits(locale, Math.abs(amount), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return resolveLocale(locale) === 'en'
    ? `${sign}${MANAT}${body}`
    : `${sign}${body}${NBSP}${MANAT}`;
}

export function formatNumber(
  locale: string,
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return numberFormatter(locale, options ?? {}).format(safeNumber(value));
}

/** Catalog `stock` / `min_order_quantity` arrive in grams → `1,5 kq`. */
export function formatKg(locale: string, grams: number): string {
  const resolved = resolveLocale(locale);
  const amount = digits(resolved, safeNumber(grams) / 1000, { maximumFractionDigits: 3 });
  return `${amount}${NBSP}${KG_UNIT[resolved]}`;
}

export function formatDate(
  locale: string,
  value: Date | string | number,
  style: DateStyle = 'short',
): string {
  const date = toDate(value);
  return resolveLocale(locale) === 'az'
    ? formatAzDate(date, style)
    : dateFormatter(locale, DATE_PRESETS[style]).format(date);
}

type RelativeUnit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second';

const RELATIVE_UNITS: ReadonlyArray<[RelativeUnit, number]> = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['week', 7 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
];

/** az relative units — `Intl.RelativeTimeFormat('az')` has the same root-data gap as dates. */
const AZ_RELATIVE_UNITS: Record<RelativeUnit, string> = {
  year: 'il',
  month: 'ay',
  week: 'həftə',
  day: 'gün',
  hour: 'saat',
  minute: 'dəqiqə',
  second: 'saniyə',
};

/** What `numeric: 'auto'` would give for ±1 day, which az has single words for. */
function formatAzRelative(amount: number, unit: RelativeUnit): string {
  if (unit === 'second' && Math.abs(amount) < 10) return 'indi';
  if (unit === 'day' && amount === -1) return 'dünən';
  if (unit === 'day' && amount === 1) return 'sabah';

  const magnitude = Math.abs(amount);
  // az does not inflect the noun after a numeral: "3 gün", not "3 günlər".
  return amount < 0
    ? `${magnitude} ${AZ_RELATIVE_UNITS[unit]} əvvəl`
    : `${magnitude} ${AZ_RELATIVE_UNITS[unit]} sonra`;
}

/** "dünən", "5 dəqiqə əvvəl", "indi". Past is negative, future positive. */
export function formatRelative(
  locale: string,
  value: Date | string | number,
  now: Date | number = Date.now(),
): string {
  const diff = toDate(value).getTime() - (now instanceof Date ? now.getTime() : now);
  const isAz = resolveLocale(locale) === 'az';

  const render = (amount: number, unit: RelativeUnit): string =>
    isAz ? formatAzRelative(amount, unit) : relativeFormatter(locale).format(amount, unit);

  for (const [unit, ms] of RELATIVE_UNITS) {
    if (Math.abs(diff) >= ms) {
      return render(Math.round(diff / ms), unit);
    }
  }
  return render(Math.round(diff / 1000), 'second');
}

/** Takes a ratio: `0.015` → `1,5%`. Server values already in percent use {@link formatPercentPoints}. */
export function formatPercent(
  locale: string,
  ratio: number,
  options?: Intl.NumberFormatOptions,
): string {
  return numberFormatter(locale, {
    style: 'percent',
    maximumFractionDigits: 1,
    ...options,
  }).format(safeNumber(ratio));
}

/** Takes percentage points: `1.5` → `1,5%` (how the API sends cashback rates). */
export function formatPercentPoints(
  locale: string,
  points: number,
  options?: Intl.NumberFormatOptions,
): string {
  return formatPercent(locale, safeNumber(points) / 100, options);
}

export type Format = {
  money: (value: number) => string;
  number: (value: number, options?: Intl.NumberFormatOptions) => string;
  kg: (grams: number) => string;
  date: (value: Date | string | number, style?: DateStyle) => string;
  relative: (value: Date | string | number, now?: Date | number) => string;
  percent: (ratio: number, options?: Intl.NumberFormatOptions) => string;
  percentPoints: (points: number, options?: Intl.NumberFormatOptions) => string;
};

/** Non-hook factory — for server components, repositories and tests. */
export function createFormat(locale: string): Format {
  return {
    money: (value) => formatMoney(locale, value),
    number: (value, options) => formatNumber(locale, value, options),
    kg: (grams) => formatKg(locale, grams),
    date: (value, style) => formatDate(locale, value, style),
    relative: (value, now) => formatRelative(locale, value, now),
    percent: (ratio, options) => formatPercent(locale, ratio, options),
    percentPoints: (points, options) => formatPercentPoints(locale, points, options),
  };
}

/** `const { money } = useFormat()` — works in client and server components. */
export function useFormat(): Format {
  return createFormat(useLocale());
}
