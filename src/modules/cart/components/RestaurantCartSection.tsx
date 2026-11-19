'use client';

/**
 * The restaurant lines, inside `/cart`, beside the real store carts.
 *
 * The demo restaurants have no `store_products` row ids, so their lines cannot live in
 * `GET v2/carts` — they are held locally (`useRestaurantBasketStore`). What the owner asked for is
 * that the customer should not have to care: one cart screen, one count, one checkout. So this
 * section renders those lines in the same shape as a store group and the checkout hands over to
 * the demo confirmation.
 *
 * The import direction is cart → restaurants, which is safe: the restaurants module does not
 * import the cart, so there is no cycle.
 */

import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { Link } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import {
  useRestaurantBasketStore,
  restaurantPath,
  type BasketLine,
} from '@/modules/restaurants';
import { Badge, Button, QuantityStepper } from '@/shared/ui';
import { UtensilsCrossed } from '@/shared/lucide';

export interface RestaurantCartSectionProps {
  /** One restaurant's lines, already grouped by the caller. */
  restaurantId: number;
  restaurantName: string;
  lines: BasketLine[];
  /** `true` below lg — rows become cards, as the store groups do. */
  mobile: boolean;
  /** Fires the demo checkout for this restaurant. */
  onCheckout: (restaurantId: number) => void;
  className?: string;
}

export function RestaurantCartSection({
  restaurantId,
  restaurantName,
  lines,
  mobile,
  onCheckout,
  className,
}: RestaurantCartSectionProps) {
  const t = useTranslations('restaurants');
  const { money } = useFormat();
  const setQuantity = useRestaurantBasketStore((state) => state.setQuantity);

  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  return (
    <section
      aria-label={restaurantName}
      className={cn(
        'flex w-full flex-col',
        !mobile && 'rounded-xl bg-surface px-7 py-2',
        className,
      )}
    >
      <div className="flex flex-row items-center justify-between gap-3 pb-1 pt-4">
        <h2 className="flex min-w-0 flex-row items-center gap-2 truncate text-body font-bold text-ink">
          <UtensilsCrossed size={18} aria-hidden="true" className="shrink-0 text-ink3" />
          <Link href={restaurantPath(restaurantId)} className="truncate hover:underline">
            {restaurantName}
          </Link>
        </h2>
        <Badge tone="yellow">{t('demo.title')}</Badge>
      </div>

      <ul className={cn('flex w-full flex-col', mobile && 'gap-4')}>
        {lines.map((line, index) => (
          <li
            key={line.itemId}
            className={cn(
              'flex w-full flex-row items-center gap-4 py-4',
              !mobile && index > 0 && 'border-t border-line',
              mobile && 'rounded-card bg-surface p-4',
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body-sm font-bold text-ink">{line.name}</span>
              <span className="block text-caption font-normal text-ink2">
                {money(line.price)}
              </span>
            </span>

            <QuantityStepper
              value={line.quantity}
              min={0}
              max={99}
              size="compact"
              onChange={(next) => setQuantity(line.itemId, next)}
              decreaseLabel={t('menu.decrease')}
              increaseLabel={t('menu.increase')}
              removeLabel={t('menu.remove')}
            />

            <span className="w-20 shrink-0 text-end text-body-sm font-extrabold tabular-nums text-ink">
              {money(line.price * line.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex w-full flex-row items-center justify-between gap-4 border-t border-line py-4">
        <span className="text-body font-bold text-ink">{money(total)}</span>
        <Button variant="primary" size="md" onClick={() => onCheckout(restaurantId)}>
          {t('basket.checkout')}
        </Button>
      </div>
    </section>
  );
}
