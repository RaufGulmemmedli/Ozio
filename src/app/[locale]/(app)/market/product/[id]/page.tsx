import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PRODUCT_STORE_PARAM, ProductView } from '@/modules/product';

/**
 * `/market/product/[id]?store=<storeId>` — guard `guest`, the full page.
 *
 * `[id]` is the **variant id** (`store_product_variants.id`), which is what
 * `GET v1/stores/{storeId}/products/{id}` takes; a list **row** id answers `data: null`. The store
 * id travels in `?store=` because a variant only means something together with its store.
 *
 * Opened from a card this same path is intercepted by
 * `(app)/@modal/(.)market/product/[id]/page.tsx` and shows the quick view instead; a direct hit
 * (or a reload) falls through to this page.
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'product' });
  return { title: t('meta.title') };
}

export default async function ProductPage({ params, searchParams }: PageProps) {
  const [{ locale, id }, query] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  return (
    <ProductView variantId={asNumber(id)} storeId={asNumber(query[PRODUCT_STORE_PARAM])} />
  );
}
