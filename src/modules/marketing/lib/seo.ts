/**
 * Metadata + JSON-LD helpers shared by the eight `(marketing)` pages.
 *
 * 02-routing.md §Marketing: every page needs its title/description from the
 * `meta.*` message keys, a canonical, `hreflang` az/ru/en with `x-default` = az,
 * and a per-locale OG image. `/` additionally carries
 * `Organization` + `WebSite` + `MobileApplication`, `/cashback` a `FAQPage` and
 * `/partners` an `ItemList`.
 */
import type { Metadata } from 'next';

import { siteUrl } from '@/core/config';
import { defaultLocale, locales, resolveLocale, type AppLocale } from '@/core/i18n';

/** `localePrefix: 'as-needed'` — az carries no prefix. */
export function localizedPath(path: string, locale: AppLocale): string {
  const prefix = locale === defaultLocale ? '' : `/${locale}`;
  const suffix = path === '/' ? '' : path;
  return `${prefix}${suffix}` || '/';
}

export function absoluteUrl(path: string, locale: AppLocale): string {
  return `${siteUrl}${localizedPath(path, locale)}`;
}

/** `alternates` with canonical + az/ru/en + `x-default` (= az) for one path. */
export function alternatesFor(path: string, locale: AppLocale): Metadata['alternates'] {
  // Absolute hrefs: Google wants absolute URLs in `hreflang`, and Next only
  // emits the `<link rel="alternate">` set when every value resolves to one.
  const languages: Record<string, string> = {};
  for (const other of locales) languages[other] = absoluteUrl(path, other);
  languages['x-default'] = absoluteUrl(path, defaultLocale);

  return { canonical: absoluteUrl(path, locale), languages };
}

export interface MarketingMetaInput {
  path: string;
  locale: string;
  title: string;
  description: string;
  /** Defaults to the route's own `opengraph-image`, which Next fills in. */
  ogImage?: string;
}

/**
 * One `Metadata` object per marketing page.
 *
 * `title` is `{ absolute }` on purpose: the `[locale]` layout sets a
 * `%s — Ozio` template, and every `meta.*.title` already carries the brand
 * ("Ozio — Bakıda market, keşbek, lotereya", "Ozio Keşbek — …"), so letting the
 * template run would ship "… — Ozio — Ozio" as the document title.
 */
export function marketingMetadata({
  path,
  locale: rawLocale,
  title,
  description,
  ogImage,
}: MarketingMetaInput): Metadata {
  const locale = resolveLocale(rawLocale);

  return {
    title: { absolute: title },
    description,
    alternates: alternatesFor(path, locale),
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      siteName: 'Ozio',
      locale,
      url: absoluteUrl(path, locale),
      title,
      description,
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

/* -------------------------------------------------------------------------- */
/* JSON-LD                                                                    */
/* -------------------------------------------------------------------------- */

/** schema.org objects are untyped by nature; one `unknown`-valued record is enough. */
export type JsonLdNode = Record<string, unknown>;

export function organizationJsonLd(locale: AppLocale, description: string): JsonLdNode {
  return {
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: 'Ozio',
    url: absoluteUrl('/', locale),
    logo: `${siteUrl}/logo.svg`,
    description,
    areaServed: { '@type': 'City', name: 'Baku' },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+994-12-000-00-00',
        email: 'info@ozio10.az',
        contactType: 'customer support',
        availableLanguage: ['az', 'ru', 'en'],
      },
    ],
  };
}

export function webSiteJsonLd(locale: AppLocale, name: string): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: absoluteUrl('/', locale),
    name,
    inLanguage: locale,
    publisher: { '@id': `${siteUrl}/#organization` },
  };
}

export interface MobileAppJsonLdInput {
  name: string;
  description: string;
  appStoreUrl: string;
  googlePlayUrl: string;
}

export function mobileApplicationJsonLd({
  name,
  description,
  appStoreUrl,
  googlePlayUrl,
}: MobileAppJsonLdInput): JsonLdNode[] {
  const base = {
    '@type': 'MobileApplication',
    name,
    description,
    applicationCategory: 'ShoppingApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'AZN' },
    publisher: { '@id': `${siteUrl}/#organization` },
  };

  return [
    { ...base, operatingSystem: 'iOS', installUrl: appStoreUrl },
    { ...base, operatingSystem: 'Android', installUrl: googlePlayUrl },
  ];
}

export function faqJsonLd(items: { question: string; answer: string }[]): JsonLdNode {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function itemListJsonLd(
  name: string,
  items: { name: string; description?: string; url?: string }[],
): JsonLdNode {
  return {
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.description ? { description: item.description } : {}),
      ...(item.url ? { url: item.url } : {}),
    })),
  };
}

/** Wraps one or more nodes in a single `@graph` document. */
export function jsonLdGraph(nodes: JsonLdNode[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes });
}
