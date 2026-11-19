import { setRequestLocale } from 'next-intl/server';

import { PartnerDetailView } from '@/modules/partners/view/PartnerDetailView';

export default async function MarketPartnerPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <PartnerDetailView brandId={decodeURIComponent(id)} />;
}
