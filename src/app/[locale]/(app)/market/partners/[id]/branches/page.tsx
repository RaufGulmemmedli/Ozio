import { setRequestLocale } from 'next-intl/server';

import { PartnerBranchesView } from '@/modules/partners/view/PartnerBranchesView';

export default async function MarketPartnerBranchesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, id } = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  const category = typeof query.category === 'string' ? query.category : null;
  return <PartnerBranchesView brandId={decodeURIComponent(id)} categoryId={category} />;
}
