import type { MetadataRoute } from "next";

import { siteUrl } from "@/core/config";
import { routing } from "@/core/i18n";

/**
 * Only the marketing site is crawlable: `(app)`, `(auth)` and `(onboarding)`
 * route prefixes are disallowed for every locale (02-routing.md), as are the BFF
 * and auth API routes.
 */

/** Zod-validated, trailing slash already stripped (`core/config/env.ts`). */
const SITE_URL = siteUrl;

/** First URL segment of every non-public route (02-routing.md). */
const PRIVATE_SEGMENTS = [
  // (auth) + (onboarding)
  "/login",
  "/otp",
  "/register",
  "/city-select",
  "/welcome",
  "/splash",
  "/onboarding",
  "/permission",
  // (app)
  "/home",
  "/market",
  "/offers",
  "/search",
  "/favorites",
  "/cart",
  "/checkout",
  "/orders",
  "/card",
  "/coupons",
  "/lottery",
  "/rewards",
  "/addresses",
  "/profile",
  "/settings",
  "/support",
  "/invite",
  "/account",
  "/history",
  "/notifications",
  "/work",
  // mock modules
  "/topup",
  "/parcel",
  "/courier",
  "/courier-plus",
  "/courier-services",
  "/courier-bag",
  "/courier-fit",
  "/courier-expert",
  "/family-limits",
  "/ask-to-buy",
  "/senior",
  "/price-guarantee",
  "/price-locks",
  "/group-buy",
  "/savings-jar",
  "/school",
  "/viral",
] as const;

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/api/"];

  for (const locale of routing.locales) {
    const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    for (const segment of PRIVATE_SEGMENTS) {
      disallow.push(`${prefix}${segment}`);
    }
  }

  return {
    rules: [{ userAgent: "*", allow: "/", disallow }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
