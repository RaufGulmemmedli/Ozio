import { setRequestLocale } from 'next-intl/server';

import { AddressSearchModal } from './_modal';

/**
 * Intercepted modal for `/addresses/search` (ROUTES.md: layout `modal`). A direct hit falls
 * through to `(app)/addresses/search/page.tsx`.
 */
export default async function AddressSearchModalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AddressSearchModal />;
}
