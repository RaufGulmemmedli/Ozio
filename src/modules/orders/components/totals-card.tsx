'use client';

/**
 * The dark totals card used by the checkout summary (`app-payment-method.html` `ssuSU`), the order
 * detail (`app-order-detail.html` `TVulZ`) and the failed page (`y4oTKT`):
 * `block`, r28, padding 28, a 14/600 caption, the amount 44–48/800, then `label → value` rows
 * (15/400 `on-block2` vs 15/600 `on-block`), discounts in `yellow`, and an optional brand cashback
 * strip at the bottom.
 *
 * Every number comes from the server. Nothing here adds anything up.
 */
import type { ReactNode } from 'react';
import { useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { Gift } from '@/shared/lucide';
import { Card } from '@/shared/ui';

export interface TotalsRow {
  id: string;
  label: string;
  /** `null` hides the row — a fee the server did not send is not a zero. */
  value: number | null;
  /** Renders as `−x,xx ₼` in yellow. */
  negative?: boolean;
  /** Plain text instead of money (e.g. "5 çeşid", "6 ədəd"). */
  text?: string;
}

export interface TotalsCardProps {
  caption: string;
  /** `null` → the amount block is omitted (the server sent no payable amount). */
  amount: number | null;
  rows?: readonly TotalsRow[];
  /** The brand "keşbək" strip. */
  cashback?: { text: string } | null;
  /** Anything below the rows (thumbnails, a support line, a CTA). */
  children?: ReactNode;
  className?: string;
  amountClassName?: string;
}

export function TotalsCard({
  caption,
  amount,
  rows = [],
  cashback,
  children,
  className,
  amountClassName,
}: TotalsCardProps) {
  const f = useFormat();
  const visible = rows.filter((row) => row.value !== null || row.text);

  return (
    <Card
      tone="block"
      radius="xl"
      className={cn('flex w-full flex-col gap-[14px] p-7', className)}
    >
      <span className="text-label font-semibold text-on-block">{caption}</span>
      {amount !== null ? (
        <span
          className={cn(
            'text-[44px] font-extrabold leading-none tracking-[-0.035em] text-on-block',
            amountClassName,
          )}
        >
          {f.money(amount)}
        </span>
      ) : null}

      {visible.length > 0 ? (
        <dl className="m-0 flex w-full flex-col gap-[14px] border-t border-white/14 pt-4">
          {visible.map((row) => (
            <div key={row.id} className="flex items-baseline justify-between gap-4">
              <dt className="text-body-sm text-on-block2">{row.label}</dt>
              <dd
                className={cn(
                  'm-0 text-body-sm font-semibold',
                  row.negative ? 'text-yellow' : 'text-on-block',
                )}
              >
                {row.text ??
                  (row.negative
                    ? `−${f.money(Math.abs(row.value as number))}`
                    : f.money(row.value as number))}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {cashback ? (
        <p className="m-0 flex items-start gap-2.5 rounded-[16px] bg-brand p-[14px] text-caption font-semibold leading-[18px] text-white">
          <Gift size={18} aria-hidden="true" className="shrink-0" />
          {cashback.text}
        </p>
      ) : null}

      {children}
    </Card>
  );
}
