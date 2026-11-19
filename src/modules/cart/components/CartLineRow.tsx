'use client';

/**
 * One cart line.
 *
 * `row` — desktop, from `app-core/app-cart.html` node `IbDZE`: 120 high (20px vertical padding),
 * gap 20, separated from the row above by a 1px `line` border; thumb 80 `rounded-[16px]`,
 * name 17/700, meta 14/400 `ink2`, the stepper, the line price 20/700 and a 20px `trash-2` in
 * `ink3` that turns `brand` on hover.
 *
 * `card` — mobile, from `app-states/app-sebet-mobil-390.html`: a `surface` card, radius 24,
 * padding 12, gap 14; name 16/600, meta 12/400, and the price + stepper share one row.
 *
 * Removing asks for confirmation (`confirmDialog`) and offers an undo through `snackbar`.
 * The only number computed here is nothing at all: the line price is the server's
 * `price_details.total_price`.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { Trash2 } from '@/shared/lucide';
import { ProductImage } from '@/shared/media';
import { Price, confirmDialog, snackbar } from '@/shared/ui';

import { fromCartQty } from '../data/cart.repository';
import type { CartLine } from '../data/models/cart';
import { useQuantityCommit } from '../hooks/use-quantity-commit';
import { CartQuantityStepper } from './CartQuantityStepper';

export interface CartLineRowProps {
  line: CartLine;
  storeName: string;
  variant?: 'row' | 'card';
  /** Drawn with a top divider (every row after the first). */
  divided?: boolean;
  /** The store is closed or the item is gone — the stepper locks, remove stays available. */
  locked?: boolean;
  className?: string;
}

export function CartLineRow({
  line,
  storeName,
  variant = 'row',
  divided = false,
  locked = false,
  className,
}: CartLineRowProps) {
  const t = useTranslations('cart');
  const tc = useTranslations('common');
  const { kg, number } = useFormat();
  const commit = useQuantityCommit({
    storeId: line.storeId,
    productId: line.id,
    serverQty: line.quantity,
  });

  const quantityText = line.soldByGram ? kg(fromCartQty(line, line.quantity)) : number(line.quantity);
  const meta = t('line.meta', { quantity: quantityText, store: storeName });

  async function remove() {
    const confirmed = await confirmDialog({
      title: t('remove.title'),
      body: t('remove.body', { name: line.name }),
      confirmLabel: t('remove.confirm'),
      cancelLabel: tc('cancel'),
      destructive: true,
      icon: Trash2,
    });
    if (!confirmed) return;

    const removed = line.quantity;
    const ok = await commit.removeLine();
    if (!ok) return;

    snackbar.show({
      message: t('remove.done', { name: line.name }),
      actionLabel: t('remove.undo'),
      onAction: () => commit.restore(removed),
    });
  }

  const stepper = (
    <CartQuantityStepper
      product={line}
      value={commit.value}
      onChange={(next) => (next <= 0 ? void remove() : commit.setQuantity(next))}
      loading={commit.isPending}
      disabled={locked}
      size={variant === 'row' ? 'row' : 'compact'}
    />
  );

  const removeButton = (
    <button
      type="button"
      onClick={() => void remove()}
      aria-label={t('line.remove')}
      className={cn(
        'grid size-11 shrink-0 place-items-center rounded-pill text-ink3',
        'transition-colors duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
        'hover:text-brand focus-visible:text-brand',
      )}
    >
      <Trash2 size={20} aria-hidden="true" />
    </button>
  );

  if (variant === 'card') {
    return (
      <li
        className={cn(
          'flex w-full flex-row items-center gap-[14px] rounded-card bg-surface p-3',
          className,
        )}
      >
        <div className="size-20 shrink-0">
          <ProductImage src={line.imageUrl} alt={line.name} ratio="1/1" radius="inner" sizes="80px" fallbackIconSize={32} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
          <p className="truncate text-body font-semibold text-ink">{line.name}</p>
          <p className="truncate text-micro text-ink2">{meta}</p>
          <div className="flex w-full flex-row items-center justify-between gap-2">
            <Price value={line.linePrice} size="row" className="text-body" />
            {stepper}
          </div>
        </div>
      </li>
    );
  }

  return (
    <li
      className={cn(
        'flex w-full flex-row items-center gap-5 py-5',
        divided && 'border-t border-line',
        className,
      )}
    >
      <div className="size-20 shrink-0">
        <ProductImage src={line.imageUrl} alt={line.name} ratio="1/1" radius="inner" sizes="80px" fallbackIconSize={32} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-[17px] font-bold leading-tight text-ink">{line.name}</p>
        <p className="truncate text-label text-ink2">{meta}</p>
      </div>

      {stepper}

      <Price value={line.linePrice} size="card" className="min-w-20 text-right" />

      {removeButton}
    </li>
  );
}
