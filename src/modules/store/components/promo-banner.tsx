'use client';

/**
 * The Market promo banner (`ZaUmX`): `yellow` fill, radius 28, 140 high, padding-inline 40,
 * `justify-between` — a text column (28/800 `on-yellow` + 15/400 at 70 %) and a `block` pill CTA
 * (height 48, padding-inline 24, 15/600 white).
 *
 * `app-market-mobil-390.html` draws the same banner smaller (radius 24, padding 20, gap 16,
 * 18/700 + 13/400, CTA height 40) **with shorter copy**, so the mobile strings are their own keys.
 *
 * The cashback rate in the copy is campaign text from the design, not a computed value: nothing
 * here derives money.
 */
import { useTranslations } from 'next-intl';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';

export interface PromoBannerProps {
  className?: string;
}

export function PromoBanner({ className }: PromoBannerProps) {
  const t = useTranslations('store');

  return (
    <section
      aria-label={t('promo.title')}
      className={cn(
        'flex w-full flex-row items-center justify-between gap-4 rounded-card bg-yellow p-5',
        'md:min-h-[140px] md:rounded-xl md:px-10 md:py-0',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1 md:gap-[6px]">
        <p className="text-body-l font-bold text-on-yellow md:text-[28px] md:font-extrabold">
          <span className="md:hidden">{t('promo.titleShort')}</span>
          <span className="hidden md:inline">{t('promo.title')}</span>
        </p>
        <p className="text-caption font-normal text-on-yellow/70 md:text-body-sm">
          <span className="md:hidden">{t('promo.subtitleShort')}</span>
          <span className="hidden md:inline">{t('promo.subtitle')}</span>
        </p>
      </div>

      <Link
        href={paths.offers}
        className={cn(
          'inline-flex h-10 shrink-0 items-center rounded-pill bg-block px-[18px] text-label font-semibold text-on-block',
          'transition-transform duration-[var(--oz-dur-fast)] ease-out active:scale-[.97]',
          'md:h-12 md:px-6 md:text-body-sm',
        )}
      >
        <span className="md:hidden">{t('promo.ctaShort')}</span>
        <span className="hidden md:inline">{t('promo.cta')}</span>
      </Link>
    </section>
  );
}
