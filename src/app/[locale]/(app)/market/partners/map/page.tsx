import { setRequestLocale } from 'next-intl/server';

import { PartnersMapView } from '@/modules/partners/view/PartnersMapView';

export default async function MarketPartnersMapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PartnersMapView />;
}
