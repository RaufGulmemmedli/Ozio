'use client';

/**
 * "Məhsullar" on the order detail (`app-order-detail.html` `y3HPwj`): r28, padding 24/28/8,
 * a header row (22/800 + "5 çeşid · 7 ədəd" 14/400) and item rows (gap 18, a 64px image, name
 * 17/700 over a 14/400 variant line, the ordered quantity 15/600 `ink2` right-aligned in 80px, and
 * the line price 18/700 right-aligned in 90px), separated by `line`.
 *
 * Weight lines show **kg**, never grams: order quantities already arrive in the product unit
 * (api/README.md), so no conversion happens here.
 */
import { useTranslations } from 'next-intl';
import { useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { ProductImage } from '@/shared/media';
import { Badge, Card } from '@/shared/ui';
import { itemCounts, type OrderItem } from '../data/models/order-detail';

export interface OrderItemsCardProps {
  items: readonly OrderItem[];
  className?: string;
}

export function OrderItemsCard({ items, className }: OrderItemsCardProps) {
  const t = useTranslations('orders');
  const f = useFormat();
  const counts = itemCounts(items);

  return (
    <Card
      tone="surface"
      radius="xl"
      className={cn('flex w-full flex-col px-7 pb-2 pt-6', className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3">
        <h2 className="m-0 text-[22px] font-extrabold text-ink">{t('items.title')}</h2>
        <span className="text-label text-ink2">
          {t('items.counts', { kinds: counts.kinds, pieces: counts.pieces })}
        </span>
      </div>

      <ul className="m-0 flex list-none flex-col p-0">
        {items.map((item, index) => (
          <li
            key={`${item.id ?? 'item'}-${index}`}
            className={cn(
              'flex items-center gap-[18px] py-4',
              index > 0 && 'border-t border-line',
            )}
          >
            <span className="size-16 shrink-0 overflow-hidden rounded-lg">
              <ProductImage
                src={item.imageUrl}
                alt=""
                ratio="1/1"
                radius="inner"
                sizes="64px"
                fallbackIconSize={28}
              />
            </span>

            <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span className="flex flex-wrap items-center gap-2">
                <span className="truncate text-[17px] font-bold text-ink">
                  {item.name || t('items.unnamed')}
                </span>
                {item.replaced ? <Badge tone="yellow">{t('items.replaced')}</Badge> : null}
              </span>
              {item.variant ? (
                <span className="truncate text-label text-ink2">{item.variant}</span>
              ) : null}
            </span>

            {item.quantity !== null ? (
              <span className="w-20 shrink-0 text-right text-body-sm font-semibold text-ink2">
                {item.isWeight
                  ? f.kg(item.quantity * 1000)
                  : t('items.pieces', { count: Math.round(item.quantity) })}
              </span>
            ) : null}

            {item.lineTotal !== null ? (
              <span className="w-[90px] shrink-0 text-right text-[18px] font-bold text-ink">
                {f.money(item.lineTotal)}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
