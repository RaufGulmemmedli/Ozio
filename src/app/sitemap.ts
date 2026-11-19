import type { MetadataRoute } from "next";

import { siteUrl } from "@/core/config";
import { routing } from "@/core/i18n";
import { marketingPaths } from "@/core/routes";

/**
 * Every `(marketing)` path × 3 locales with `alternates.languages` + `x-default`
 * (02-routing.md: "all M paths × 3 locales with `alternates`"). `(app)`, `(auth)`
 * and `(onboarding)` are never listed — see `robots.ts`.
 */

/** Zod-validated, trailing slash already stripped (`core/config/env.ts`). */
const SITE_URL = siteUrl;

/** `/`, `/cashback`, `/partners`, `/delivery`, `/ten`, `/contact`, `/terms`, `/privacy`. */
const MARKETING_PATHS = marketingPaths;

/** `localePrefix: 'as-needed'` — az carries no prefix. */
function url(path: string, locale: string): string {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const suffix = path === "/" ? "" : path;
  return `${SITE_URL}${prefix}${suffix}` || `${SITE_URL}/`;
}

function entry(path: string, locale: string): MetadataRoute.Sitemap[number] {
  const languages = Object.fromEntries(
    routing.locales.map((other) => [other, url(path, other)]),
  );

  return {
    url: url(path, locale),
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
    alternates: {
      languages: { ...languages, "x-default": url(path, routing.defaultLocale) },
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.flatMap((locale) =>
    MARKETING_PATHS.map((path) => entry(path, locale)),
  );
}
