/**
 * `@/modules/marketing` — the public, SEO-critical half of ozio.az.
 *
 * Section components + page content only: **no data layer and no hooks**. The
 * marketing pages are static by design (`screens/api/screen-api-matrix.md`), and
 * the only endpoint they may call (`GET v1/privacy-policies`, `auth: none`) is
 * read server-side from `lib/legal-document.ts`, not through a repository.
 *
 * `lib/legal-document.ts` is intentionally NOT re-exported here: it is
 * server-only and must not be reachable from a client import of this barrel.
 */

export * from './components';

export { marketingRoutes, type MarketingPrefetch, type MarketingRoute } from './marketing.routes';

export { appLinks } from './content/app-links';
export {
  cashbackCampaigns,
  cashbackRates,
  contactTopics,
  deliveryCategories,
  deliveryDistricts,
  deliveryProducts,
  deliverySteps,
  homeBento,
  homeFaq,
  homeMarketChips,
  homeProducts,
  homeStats,
  homeSteps,
  partnerCategories,
  partnerSamples,
  tenGifts,
  trustAvatarTones,
  type BentoItem,
  type BentoTone,
  type ContactTopic,
  type PartnerSample,
  type ProductSample,
  type StatItem,
} from './content/landing';
export { privacySections, termsSections, type LegalSection } from './content/legal';

export {
  AZ_E164,
  CONTACT_LIMITS,
  contactSchema,
  type ContactFailureKind,
  type ContactMessages,
  type ContactResponse,
  type ContactValues,
} from './lib/contact-schema';

export {
  absoluteUrl,
  alternatesFor,
  faqJsonLd,
  itemListJsonLd,
  jsonLdGraph,
  localizedPath,
  marketingMetadata,
  mobileApplicationJsonLd,
  organizationJsonLd,
  webSiteJsonLd,
  type JsonLdNode,
  type MarketingMetaInput,
} from './lib/seo';

export { hasContent, sanitizeHtml } from './lib/sanitize-html';
