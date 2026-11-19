'use client';

/**
 * The no-saved-cards state of `/topup/card` (`topup-card-no-cards.html`, node `ownif`).
 *
 * **This is the normal state today**, not an edge case: `GET v1/profile/me/cards` returns `[]` on
 * live, so every real account lands here.
 *
 * Measured: a `surface` panel at radius 28 with 64 padding, gap 16, centred — an 88 `brand-soft`
 * disc with a 40 card glyph, a 24/800 title, 16/400 `ink2` body, the 52-high dark "Yeni kart əlavə
 * et" CTA (with an 18 plus), then the "Kassada artır →" brand link.
 *
 * The CTA is a **link to `/checkout/add-card`** — the bank's own page handles the card details.
 */
import { useTranslations } from 'next-intl';

import { Link } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';
import { ArrowRight, CreditCard, Plus } from '@/shared/lucide';
import { Button } from '@/shared/ui';

import { useLocaleHref } from '../hooks/use-locale-href';

export function TopupNoCards() {
  const t = useTranslations('topup');
  const localeHref = useLocaleHref();

  return (
    <section
      role="status"
      className="flex w-full flex-col items-center gap-4 rounded-xl bg-surface px-5 py-12 text-center md:px-16 md:py-16"
    >
      <span
        aria-hidden="true"
        className="flex size-[88px] items-center justify-center rounded-pill bg-brand-soft text-brand"
      >
        <CreditCard size={40} />
      </span>

      <h2 className="text-h3 font-extrabold text-ink">{t('empty.cards.title')}</h2>
      <p className="max-w-[46ch] text-body text-ink2">{t('empty.cards.body')}</p>

      <Button
        as="a"
        href={localeHref(paths.checkoutAddCard)}
        size="xl"
        leadingIcon={<Plus aria-hidden="true" size={18} />}
        className="mt-1"
      >
        {t('cards.addCard')}
      </Button>

      <Link
        href={paths.topupCashier}
        className="flex w-fit flex-row items-center gap-2 text-body-sm font-bold text-brand hover:text-brand-dark"
      >
        {t('empty.cards.cashier')}
        <ArrowRight aria-hidden="true" size={16} className="shrink-0" />
      </Link>
    </section>
  );
}
