import { setRequestLocale } from 'next-intl/server';

import { AddressNewModal } from './_modal';

/**
 * Intercepted modal for `/addresses/new` (ROUTES.md: layout `modal`).
 *
 * A soft navigation from `/addresses` opens this; a direct hit falls through to
 * `(app)/addresses/new/page.tsx` because `@modal/default.tsx` renders `null`.
 * `<Modal>` is already a bottom sheet below 768, which is what the brief asks for.
 */
export default async function AddressNewModalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AddressNewModal />;
}
