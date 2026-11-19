import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { OrderSuccessView } from '@/modules/orders';

/**
 * `/orders/success?order=ID` (OD5) — guard `auth`, layout `app-shell`.
 *
 * The page is driven by `?order=` and re-reads the order, because the `POST v2/orders` response is
 * unverified. Without a usable id it shows the "could not confirm" state instead of claiming
 * success.
 */
type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'orders' });
  return { title: t('success.title') };
}

const firstValue = (value: string | string[] | undefined): string | null => {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : null;
};

/** `?total=11.11` → 11.11; anything unparseable → null, and that row is simply not printed. */
const firstNumber = (value: string | string[] | undefined): number | null => {
  const raw = firstValue(value);
  if (raw === null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

export default async function OrderSuccessPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;

  // Everything the confirmation prints comes from the checkout that sent the customer here, not
  // from a re-read of the order — see the view's header for why.
  return (
    <OrderSuccessView
      orderId={firstValue(query.order)}
      total={firstNumber(query.total)}
      bonus={firstNumber(query.bonus)}
      payment={firstValue(query.payment) === 'card' ? 'card' : 'cash'}
      eta={firstValue(query.eta)}
      streak={firstNumber(query.streak)}
    />
  );
}
