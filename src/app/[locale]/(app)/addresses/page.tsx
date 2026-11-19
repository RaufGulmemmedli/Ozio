import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AddressesView } from '@/modules/address/view/AddressesView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'address' });
  return { title: t('title') };
}

/**
 * UN6 "Ünvanlarım". `?view=zones` renders the "Çatdırılma zonası" screen on this same route —
 * ROUTES.md keeps the zone screen out of the route registry (it is a state, like UN7/UN8).
 */
export default async function AddressesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AddressesView />;
}
