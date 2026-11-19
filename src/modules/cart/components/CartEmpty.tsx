'use client';

/**
 * Empty cart (`app-states/app-bos-sebet.html`, frame `Q2IfPl`): the `surface` panel at radius 36
 * with 56px vertical padding, a 120px `brand-soft` tile holding a 52px `shopping-cart`, the title
 * 28/700, one centred sentence at 420 wide and the `brand` "Marketə keç" pill.
 *
 * Below it the export draws a "Çox alınanlar" rail of product cards — those belong to the store
 * module, see the TODO.
 */
import { useTranslations } from 'next-intl';

import { Link } from '@/core/i18n';
import { paths } from '@/core/routes';
import { ShoppingCart } from '@/shared/lucide';
import { EmptyState } from '@/shared/states';

export function CartEmpty() {
  const t = useTranslations('cart');

  return (
    <div className="flex w-full flex-col gap-8">
      <EmptyState
        panel
        tone="brand"
        icon={ShoppingCart}
        title={t('empty.title')}
        body={t('empty.body')}
        action={
          <Link
            href={paths.market}
            className="inline-flex h-13 items-center rounded-pill bg-brand px-7 text-body font-semibold text-on-cta transition-colors duration-[var(--oz-dur-fast)] hover:bg-brand-dark"
          >
            {t('empty.cta')}
          </Link>
        }
      />

      {/*
        TODO(store): the "Çox alınanlar" suggestions rail needs the product card from agent M3:
          import { ProductCard } from '@/modules/store';
        Rendering it here would duplicate a card (and its add-to-cart wiring) that M3 owns, so the
        section stays out until that export exists. The heading copy is ready: `cart.empty.suggestions`.
      */}
    </div>
  );
}
