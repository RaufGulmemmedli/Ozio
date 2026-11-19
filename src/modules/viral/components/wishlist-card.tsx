'use client';

/**
 * One card on V2 (`v2-viral-campaigns.html`).
 *
 * Measured: white card radius 28, padding 24, gap 16 — an 80×80 `surface2` thumb at radius 24,
 * product 20/700, "Ad günü · 12 gün qalıb" 13/400 `ink3`, a `brand-soft` percentage pill (or the
 * `success-soft` "Tamamlandı" pill with a check), "80 ₼ / 480 ₼" 16/800, the contributor count
 * 13/400 and a 10-high progress bar (brand while open, success when complete).
 *
 * Every number — the percentage, `raised`, `target`, the contributor count — is the mock's.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { Link } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';
import { Check } from '@/shared/lucide';
import { Progress } from '@/shared/ui';

import type { Wishlist } from '../data/models/wishlist';
import { GiftThumb } from './gift-thumb';

export interface WishlistCardProps {
  wishlist: Wishlist;
}

export function WishlistCard({ wishlist }: WishlistCardProps) {
  const t = useTranslations('viral');
  const { money } = useFormat();

  return (
    <Link
      href={paths.viralWishlist(wishlist.id)}
      className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6 transition-colors duration-[var(--oz-dur-fast)] hover:bg-surface2/60"
    >
      <div className="flex w-full flex-row items-start gap-4">
        <GiftThumb icon={wishlist.product.icon} size={80} radiusClassName="rounded-card" />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-h4 font-bold text-ink">{wishlist.product.name}</span>
          <span className="text-caption text-ink3">
            {t('wishlists.card.meta', {
              occasion: t(`occasion.${wishlist.occasion}`),
              days: wishlist.daysLeft,
            })}
          </span>
        </div>

        {wishlist.completed ? (
          <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-pill bg-success-soft px-2.5 text-micro font-bold text-success">
            <Check size={14} aria-hidden="true" />
            {t('wishlists.card.completed')}
          </span>
        ) : (
          <span className="inline-flex h-7 shrink-0 items-center rounded-pill bg-brand-soft px-2.5 text-micro font-bold text-brand">
            {t('percent', { value: wishlist.progressPercent })}
          </span>
        )}
      </div>

      <div className="flex w-full flex-row items-end justify-between gap-3">
        <span className="text-body font-extrabold text-ink">
          {t('wishlists.card.raised', {
            raised: money(wishlist.raised),
            target: money(wishlist.target),
          })}
        </span>
        <span className="text-caption text-ink2">
          {t('wishlists.card.contributors', { count: wishlist.contributorCount })}
        </span>
      </div>

      <Progress
        value={wishlist.progressPercent}
        max={100}
        height={10}
        tone={wishlist.completed ? 'success' : 'brand'}
        label={t('wishlists.card.progressLabel', { product: wishlist.product.name })}
        valueText={t('percent', { value: wishlist.progressPercent })}
      />
    </Link>
  );
}
