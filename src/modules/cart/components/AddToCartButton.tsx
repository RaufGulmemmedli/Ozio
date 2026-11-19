'use client';

/**
 * `<AddToCartButton>` — the add control every product card, product page and search row uses
 * (M2 / M3 / M4 import it from `@/modules/cart`).
 *
 * At quantity 0 it is the **40px `brand` circle** with a white `plus` (`components.md` §10, the
 * "Add" node on every product card); the moment the line exists it morphs into
 * `<QuantityStepper>`, and the minus turns into a trash at one step — which is what the API does,
 * since removing the full quantity deletes the line.
 *
 * It handles everything cart-shaped internally, so a caller only passes the product row:
 * - **weight units**: `stock` / `min_order_quantity` arrive in grams, the cart speaks kg; the step
 *   is 0.1 kg. Converted by `toCartQty()` in the repository, never here;
 * - **`requireAuth()`** before any mutation (a guest cart is not persisted server-side);
 * - **250 ms debounce**, sending the net delta once.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Plus } from '@/shared/lucide';
import { Spinner } from '@/shared/ui';

import { cartStep } from '../data/cart.repository';
import { useCartQuantity } from '../hooks/use-cart';
import { useQuantityCommit } from '../hooks/use-quantity-commit';
import { CartQuantityStepper } from './CartQuantityStepper';

/** The product fields the cart needs. Both a catalog row and a cart line satisfy it. */
export interface AddToCartProduct {
  /** Store-product **ROW** id — `stores/{sid}/products[].id`, the cart's `product_id`. */
  id: number;
  storeId: number;
  name?: string;
  /** `measurements.sold_by_gram` — quantity is kg, catalog stock is grams. */
  soldByGram?: boolean | null;
  hasWeight?: boolean | null;
  /** Catalog `stock`: grams for a weight product. */
  stock?: number | null;
  /** Catalog `min_order_quantity` / `max_order_quantity`: grams for a weight product. */
  minOrderQuantity?: number | null;
  maxOrderQuantity?: number | null;
}

export interface AddToCartButtonProps {
  product: AddToCartProduct;
  /** `card` = the 40px circle / 40-high stepper. `row` = the 44-high cart-row control. */
  size?: 'card' | 'row';
  /** Out of stock, or the store is closed: the control renders disabled. */
  disabled?: boolean;
  /** Stretch the stepper (product page). */
  fullWidth?: boolean;
  className?: string;
}

export function AddToCartButton({
  product,
  size = 'card',
  disabled = false,
  fullWidth = false,
  className,
}: AddToCartButtonProps) {
  const t = useTranslations('cart');
  const serverQty = useCartQuantity(product.storeId, product.id);
  const commit = useQuantityCommit({
    storeId: product.storeId,
    productId: product.id,
    serverQty,
  });

  const step = cartStep(product);

  if (commit.value <= 0) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => commit.setQuantity(firstQuantity(product, step))}
        aria-label={product.name ? `${t('line.add')} — ${product.name}` : t('line.add')}
        className={cn(
          'grid place-items-center rounded-pill bg-brand text-on-cta',
          'transition-[background-color,transform] duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
          'hover:bg-brand-dark active:scale-[.97]',
          'disabled:cursor-not-allowed disabled:opacity-40',
          size === 'row' ? 'size-11' : 'size-10',
          fullWidth && 'w-full',
          className,
        )}
      >
        {commit.isPending ? (
          <Spinner size={18} />
        ) : (
          <Plus size={size === 'row' ? 22 : 20} aria-hidden="true" />
        )}
      </button>
    );
  }

  return (
    <CartQuantityStepper
      product={product}
      value={commit.value}
      onChange={commit.setQuantity}
      loading={commit.isPending}
      disabled={disabled}
      size={size === 'row' ? 'row' : 'compact'}
      className={cn(fullWidth && 'w-full justify-between', className)}
    />
  );
}

/**
 * The first quantity an empty line gets: one step, or the store's minimum when it demands more.
 * `min_order_quantity` is grams for a weight product, so it is compared in cart units.
 */
function firstQuantity(product: AddToCartProduct, step: number): number {
  const min = product.minOrderQuantity;
  if (min === null || min === undefined) return step;
  const minInCartUnits = product.soldByGram ? min / 1000 : min;
  return Math.max(step, minInCartUnits);
}
