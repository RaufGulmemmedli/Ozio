import { setRequestLocale } from 'next-intl/server';

import { TransactionDetailModal } from './modal';

/**
 * Intercepted route: clicking a bonus-activity row inside the app opens the
 * detail as a modal over `/card` or `/card/transactions` (layout `modal` in
 * ROUTES.md). A direct hit falls through to the full page at
 * `(app)/card/transactions/[id]`, because `@modal/default.tsx` renders `null`.
 */
export default async function CardTransactionModalPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <TransactionDetailModal id={decodeURIComponent(id)} />;
}
