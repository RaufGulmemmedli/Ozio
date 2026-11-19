import { setRequestLocale } from 'next-intl/server';

import { PRODUCT_STORE_PARAM, ProductQuickView } from '@/modules/product';

/**
 * Intercepted route for the `@modal` slot: a product opened from a store / search / category page
 * shows the quick view over it (≥768) or the full page as a full-screen layer (<768), while the
 * page underneath keeps its scroll position.
 *
 * A direct URL hit never reaches this file — Next.js then renders
 * `(app)/market/product/[id]/page.tsx` with `@modal/default.tsx` (which returns `null`).
 */
type PageProps = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const asNumber = (value: string | string[] | undefined): number | null => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

export default async function ProductQuickViewPage({ params, searchParams }: PageProps) {
  const [{ locale, id }, query] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  return (
    <ProductQuickView variantId={asNumber(id)} storeId={asNumber(query[PRODUCT_STORE_PARAM])} />
  );
}
