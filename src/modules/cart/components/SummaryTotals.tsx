'use client';

/**
 * The money block — a real `<dl>` (a11y requirement in the screen spec).
 *
 * **Every number here comes from `POST v2/orders/checkout`.** `v2/carts.totals` is the items total
 * and nothing else, and a fee is never derived, summed or guessed on the client (BUILD-CONTRACT
 * rule 7). A field the server did not send is simply not drawn — and while the calculation has not
 * answered yet the caller renders `<SummaryCardSkeleton>` instead of this, never a `0`.
 *
 * Layout from `app-core/app-cart.html` node `q6H2pO`: a 1px `line` divider, 16px top padding,
 * 10px row gap, labels 15/400 `ink2`, values 15/600 `ink`, the bonus line in `success`, and the
 * total row 20/800 against a 24/800 amount.
 */
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';
import { Price } from '@/shared/ui';

import type { CheckoutCalc } from '../data/models/checkout';

interface RowProps {
  label: ReactNode;
  children: ReactNode;
}

function Row({ label, children }: RowProps) {
  return (
    <div className="flex w-full flex-row items-start justify-between gap-4">
      <dt className="text-body-sm text-ink2">{label}</dt>
      <dd className="text-body-sm font-semibold text-ink">{children}</dd>
    </div>
  );
}

export interface SummaryTotalsProps {
  calc: CheckoutCalc;
  /** Number of lines, for the mobile "Məhsullar (6)" label. */
  itemCount?: number;
  /** `compact` = the mobile card / drawer (14px labels, no top divider). */
  variant?: 'panel' | 'compact';
  className?: string;
}

export function SummaryTotals({ calc, itemCount, variant = 'panel', className }: SummaryTotalsProps) {
  const t = useTranslations('cart');
  const b = calc.breakdown;

  return (
    <dl
      className={cn(
        'flex w-full flex-col',
        variant === 'panel' ? 'gap-[10px] border-t border-line pt-4' : 'gap-3',
        className,
      )}
    >
      {b.itemTotalPrice !== null ? (
        <Row
          label={itemCount === undefined ? t('rows.items') : t('rows.itemsWithCount', { count: itemCount })}
        >
          <Price value={b.itemTotalPrice} size="sm" tone="inherit" />
        </Row>
      ) : null}

      {b.totalDiscount !== null && b.totalDiscount > 0 ? (
        <Row label={t('rows.discount')}>
          <Price value={-b.totalDiscount} size="sm" tone="success" />
        </Row>
      ) : null}

      {b.deliveryFee !== null ? (
        <Row label={t('rows.delivery')}>
          {calc.delivery.isFree || b.deliveryFee === 0 ? (
            <span className="text-success">{t('rows.deliveryFree')}</span>
          ) : (
            <Price value={b.deliveryFee} size="sm" tone="inherit" />
          )}
        </Row>
      ) : null}

      {b.serviceFee !== null && b.serviceFee > 0 ? (
        <Row label={t('rows.serviceFee')}>
          <Price value={b.serviceFee} size="sm" tone="inherit" />
        </Row>
      ) : null}

      {b.packetFee !== null && b.packetFee > 0 ? (
        <Row label={t('rows.packetFee')}>
          <Price value={b.packetFee} size="sm" tone="inherit" />
        </Row>
      ) : null}

      {b.minimumOrderFee !== null && b.minimumOrderFee > 0 ? (
        <Row label={t('rows.minimumOrderFee')}>
          <Price value={b.minimumOrderFee} size="sm" tone="inherit" />
        </Row>
      ) : null}

      {b.courierTip !== null && b.courierTip > 0 ? (
        <Row label={t('rows.tip')}>
          <Price value={b.courierTip} size="sm" tone="inherit" />
        </Row>
      ) : null}

      {b.bonusPayment !== null && b.bonusPayment > 0 ? (
        <Row label={variant === 'panel' ? t('rows.bonus') : t('rows.bonusUsed')}>
          <Price value={-b.bonusPayment} size="sm" tone="success" />
        </Row>
      ) : null}

      {variant === 'compact' ? <div className="h-px w-full bg-line" /> : null}

      {calc.amount !== null ? (
        <div className="flex w-full flex-row items-center justify-between gap-4 pt-2">
          <dt className="text-h4 font-extrabold text-ink">{t('rows.total')}</dt>
          <dd>
            <Price value={calc.amount} size="total" className="text-h3" />
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

/** The drawer's lighter summary: items, delivery, the bonus it would earn, then the total. */
export function MiniCartTotals({ calc, className }: { calc: CheckoutCalc; className?: string }) {
  const t = useTranslations('cart');
  const b = calc.breakdown;

  return (
    <dl className={cn('flex w-full flex-col gap-3', className)}>
      {b.itemTotalPrice !== null ? (
        <Row label={t('rows.items')}>
          <Price value={b.itemTotalPrice} size="sm" tone="inherit" />
        </Row>
      ) : null}

      {b.deliveryFee !== null ? (
        <Row label={t('rows.delivery')}>
          {calc.delivery.isFree || b.deliveryFee === 0 ? (
            <span className="text-success">{t('rows.deliveryFree')}</span>
          ) : (
            <Price value={b.deliveryFee} size="sm" tone="inherit" />
          )}
        </Row>
      ) : null}

      {calc.earnedBonus !== null && calc.earnedBonus > 0 ? (
        <Row label={t('rows.earnedBonus')}>
          <span className="text-success">
            +<Price value={calc.earnedBonus} size="sm" tone="success" />
          </span>
        </Row>
      ) : null}

      {calc.amount !== null ? (
        <div className="flex w-full flex-row items-center justify-between gap-4 pt-2">
          <dt className="text-body-l font-extrabold text-ink">{t('rows.total')}</dt>
          <dd>
            <Price value={calc.amount} size="total" />
          </dd>
        </div>
      ) : null}
    </dl>
  );
}
