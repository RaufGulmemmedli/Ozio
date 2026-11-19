'use client';

/**
 * The past-orders row — 104 high, `surface`, r24, padding 22, gap 20: a 60px thumb, the order id
 * (16/700) over a meta line (13), the status badge, and the amount (18/700) right-aligned.
 *
 * That geometry is the drawn truth of `app-sifarislerim-loading.html` ("Order Row": 104 / r24 / p22 /
 * 60 bone / 90 badge bone / 70 amount bone), which the loading skeleton mirrors exactly.
 * `app-orders.html` draws the same rows inside one `surface` panel with the store name on the first
 * line; the store name is used here when the server sends one, and the order number otherwise.
 *
 * The whole row is the link to the detail page.
 */
import { useTranslations } from 'next-intl';
import { Link, useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { ProductImage } from '@/shared/media';
import { formatOrderNo } from '../orders.format';
import type { OrderSummary } from '../data/models/order';
import { OrderStatusBadge } from './order-status-badge';

export interface OrderRowProps {
  order: OrderSummary;
  className?: string;
}

export function OrderRow({ order, className }: OrderRowProps) {
  const t = useTranslations('orders');
  const f = useFormat();

  const title = order.storeName ?? formatOrderNo(order.id);
  const metaParts: string[] = [];
  if (order.itemCount !== null) metaParts.push(t('row.items', { count: order.itemCount }));
  if (order.createdAt) {
    metaParts.push(`${f.date(order.createdAt, 'dayMonth')}, ${f.date(order.createdAt, 'time')}`);
  }
  if (!order.storeName) metaParts.unshift(t(`status.${order.status}`));

  return (
    <Link
      href={paths.order(order.id)}
      className={cn(
        'flex min-h-[104px] w-full items-center gap-5 rounded-card border border-line bg-surface p-[22px]',
        'transition-colors duration-[var(--oz-dur-fast)] hover:border-ink3',
        className,
      )}
      aria-label={t('row.open', { no: formatOrderNo(order.id) })}
    >
      <span className="size-[60px] shrink-0 overflow-hidden rounded-lg">
        <ProductImage
          src={order.thumbnails[0] ?? order.imageUrl}
          alt=""
          ratio="1/1"
          radius="inner"
          sizes="60px"
          fallbackIconSize={28}
        />
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-body font-bold text-ink">{title}</span>
        {metaParts.length > 0 ? (
          <span className="truncate text-caption text-ink2">{metaParts.join(' · ')}</span>
        ) : null}
      </span>

      <OrderStatusBadge status={order.status} className="hidden sm:inline-flex" />

      {order.amount !== null ? (
        <span className="w-[90px] shrink-0 text-right text-[18px] font-bold text-ink">
          {f.money(order.amount)}
        </span>
      ) : null}
    </Link>
  );
}
