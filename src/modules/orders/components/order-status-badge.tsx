'use client';

/**
 * The status pill from every orders screen: a 7px dot + the status word, in the status's tone.
 * (`app-orders.html` `HJkkh` / `RoXUw` / `QZGBV`, 13/700, padding 6×12, pill.)
 *
 * The status strings are unverified, so an unrecognised one renders as "İcrada" (in progress) in the
 * neutral tone rather than as nothing.
 */
import { useTranslations } from 'next-intl';
import { cn } from '@/core/lib/cn';
import { Badge } from '@/shared/ui';
import { statusTone, type OrderStatus } from '../data/models/order-status';

export interface OrderStatusBadgeProps {
  status: OrderStatus;
  /** `true` inside a `block`-toned card, where the soft tones have too little contrast. */
  onBlock?: boolean;
  className?: string;
}

const ON_BLOCK: Partial<Record<OrderStatus, string>> = {
  pickedUp: 'bg-yellow text-on-yellow',
  waiting: 'bg-yellow text-on-yellow',
};

export function OrderStatusBadge({ status, onBlock = false, className }: OrderStatusBadgeProps) {
  const t = useTranslations('orders');

  return (
    <Badge
      tone={statusTone(status)}
      className={cn(
        'h-auto gap-1.5 py-1.5 text-caption',
        onBlock && ON_BLOCK[status],
        className,
      )}
    >
      <span aria-hidden="true" className="size-[7px] shrink-0 rounded-pill bg-current" />
      {t(`status.${status}`)}
    </Badge>
  );
}
