import { getTranslations } from 'next-intl/server';

import { OffersSkeleton } from '@/modules/home';

/** Route-level fallback for `/offers`: the mirror skeleton of the Kampaniyalar regions. */
export default async function OffersLoading() {
  const t = await getTranslations('home');
  return <OffersSkeleton label={t('loading')} />;
}
