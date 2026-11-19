'use client';

/**
 * `<CourierBagBanner>` — the dark card the order-tracking screen places while the courier is on
 * the way (`kuryerin-cantasi-sifaris-izleme-banneri.html`, node `R9jqwg`).
 *
 * **This module does not place it.** `@/modules/orders` owns the tracking screen, so the orders
 * agent (M6) imports it from `@/modules/courier_shop` and renders it when the order status is
 * `pickedUp`:
 *
 * ```tsx
 * import { CourierBagBanner } from '@/modules/courier_shop';
 * {order.status === 'pickedUp' ? <CourierBagBanner minutesAway={order.etaMinutes} /> : null}
 * ```
 *
 * It returns `null` when `courierShop` is off or there is no ETA to show, so the caller needs no
 * flag check and no conditional of its own.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n';
import { paths } from '@/core/routes';
import { ArrowRight, ShoppingBag } from '@/shared/lucide';

import { useCourierShopEnabled } from '../courier_shop.flags';

export interface CourierBagBannerProps {
  /**
   * Minutes until the courier is at the door — tracking data from the order, not a countdown this
   * component runs. Omit it (or pass a non-positive value) and the banner hides itself.
   */
  minutesAway?: number | null;
  className?: string;
}

export function CourierBagBanner({ minutesAway, className }: CourierBagBannerProps) {
  const enabled = useCourierShopEnabled();
  const t = useTranslations('courier_shop');

  if (!enabled) return null;
  if (typeof minutesAway !== 'number' || !Number.isFinite(minutesAway) || minutesAway <= 0) {
    return null;
  }

  return (
    <aside
      className={cn(
        'flex w-full flex-col items-start gap-5 rounded-card bg-block p-6 text-on-block',
        'md:flex-row md:items-center',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-white/[0.12]"
      >
        <ShoppingBag size={32} className="text-on-block" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[22px] font-extrabold leading-tight">
          {t('banner.title', { minutes: Math.round(minutesAway) })}
        </span>
        <span className="text-label text-on-block/75">{t('banner.body')}</span>
      </span>
      <Link
        href={paths.courierBag}
        className={cn(
          'inline-flex h-12 shrink-0 items-center gap-2 rounded-pill bg-brand px-6',
          'text-body-sm font-bold text-on-cta transition-colors hover:bg-brand-dark',
        )}
      >
        {t('banner.cta')}
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </aside>
  );
}
