import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { RestaurantView } from '@/modules/restaurants';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'restaurants' });
  return { title: t('title') };
}

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // A non-numeric segment is handled by the view's not-found branch, not by `notFound()`, so the
  // visitor keeps the app shell and the "back to restaurants" action.
  const parsed = Number.parseInt(id, 10);
  return <RestaurantView restaurantId={Number.isFinite(parsed) ? parsed : null} />;
}
