'use client';

/**
 * The cart's quantity control: `<QuantityStepper>` from `@/shared/ui` with the cart's units and
 * a11y wiring attached.
 *
 * - the step is 1, or **0.1 kg** for a sold-by-gram product (screen spec §4);
 * - `max` is the stock, converted from grams to cart units by `toCartQty()`;
 * - `min: 0` turns the minus button into the remove (trash) button at one step, which is exactly
 *   what the API does: removing the line's full quantity deletes it;
 * - the buttons carry "Artır" / "Azalt" labels and the value is announced through `aria-live`
 *   (the shared stepper renders that `sr-only` live region itself).
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { QuantityStepper } from '@/shared/ui';

import { cartStep, fromCartQty, toCartQty, type CartQtyProduct } from '../data/cart.repository';

export interface CartQuantityStepperProps {
  product: CartQtyProduct & { stock?: number | null; maxOrderQuantity?: number | null };
  /** Current quantity in cart units (kg for a weight product). */
  value: number;
  onChange: (next: number) => void;
  loading?: boolean;
  disabled?: boolean;
  /** `row` = the 44-high cart row control; `compact` = the 40-high card / drawer control. */
  size?: 'row' | 'compact';
  className?: string;
}

/** `1`, `2` for a count product; `1 kq`, `0,5 kq` for a weight product. */
export function useQuantityLabel(product: CartQtyProduct) {
  const { kg, number } = useFormat();
  return (value: number) => (product.soldByGram ? kg(fromCartQty(product, value)) : number(value));
}

export function CartQuantityStepper({
  product,
  value,
  onChange,
  loading = false,
  disabled = false,
  size = 'row',
  className,
}: CartQuantityStepperProps) {
  const t = useTranslations('cart');
  const label = useQuantityLabel(product);

  const step = cartStep(product);
  // `stock` is grams for a weight product; `toCartQty` is the only place that divides.
  const stockLimit =
    product.stock === null || product.stock === undefined ? undefined : toCartQty(product, product.stock);
  const orderLimit =
    product.maxOrderQuantity === null || product.maxOrderQuantity === undefined
      ? undefined
      : toCartQty(product, product.maxOrderQuantity);
  const max =
    stockLimit === undefined && orderLimit === undefined
      ? undefined
      : Math.min(stockLimit ?? Number.POSITIVE_INFINITY, orderLimit ?? Number.POSITIVE_INFINITY);

  return (
    <QuantityStepper
      size="compact"
      value={value}
      min={0}
      max={max}
      step={step}
      unit={product.soldByGram ? 'kg' : 'pcs'}
      onChange={onChange}
      loading={loading}
      disabled={disabled}
      increaseLabel={t('line.increase')}
      decreaseLabel={t('line.decrease')}
      removeLabel={t('line.remove')}
      formatValue={label}
      valueAnnouncement={(next) => t('line.quantityAnnouncement', { value: label(next) })}
      className={cn(size === 'row' && 'h-11 gap-[14px] px-[6px]', className)}
    />
  );
}
