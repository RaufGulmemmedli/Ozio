'use client';

/**
 * The 532-wide info column (`HIj8d`), gap 20:
 * store row → name 40/800 → meta line → price row → bonus pill → divider →
 * [weight selector | stepper + add] → delivery info.
 *
 * States:
 *  - **AX6 weight** (`measurements.has_weight` / `sold_by_gram`): the meta line leads with
 *    "Çəkiyə görə satılır", the price carries "/ kq", and the stepper becomes `<WeightSelector>`.
 *  - **AX5 out of stock** (`stock <= 0`): `<OutOfStockNotice>`, a disabled add button, the
 *    "Stokda olanda xəbər ver" button (no endpoint → inert) and the "similar products below" note.
 *    No route change.
 */
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { Bell, Gift, Info, ShieldCheck, ShoppingCart, Star, Store } from '@/shared/lucide';
import { InlineNotice, OutOfStockNotice } from '@/shared/states';
import { Button, Price, QuantityStepper } from '@/shared/ui';

import { useCartAction } from '../data/cart-bridge';
import {
  bonusFor,
  clampQuantity,
  lineTotal,
  packLabel,
  quantityBounds,
  weightPresets,
  type ProductDetail,
} from '../data/models/product-detail';
import { WeightSelector } from './weight-selector';

export interface ProductInfoProps {
  product: ProductDetail;
  /** Rendered above the name on the full page (the quick view puts its own chrome there). */
  compact?: boolean;
  /** Fires after the server accepts the line. The quick view closes itself here. */
  onAdded?: () => void;
  className?: string;
}

export function ProductInfo({
  product,
  compact = false,
  onAdded,
  className,
}: ProductInfoProps) {
  const t = useTranslations('product');
  const { money, number } = useFormat();
  const cart = useCartAction();

  const bounds = useMemo(() => quantityBounds(product), [product]);
  const presets = useMemo(() => weightPresets(bounds), [bounds]);
  const [quantity, setQuantity] = useState(() => clampQuantity(bounds.min, bounds));

  const byWeight = product.hasWeight || product.soldByGram;
  const soldOut = !product.inStock;
  const bonus = bonusFor(product.price, product.store?.bonusPercentage ?? null);
  const total = lineTotal(product.price, quantity);

  const pack = packLabel(product);
  const metaParts = [
    byWeight ? t('weight.soldByWeight') : pack,
    product.brand,
    product.categoryName,
  ].filter((part) => part.length > 0);

  const rating = product.store?.rating;
  const ratingCount = product.store?.ratingCount;
  const Title = compact ? 'h2' : 'h1';

  const onAdd = () => {
    if (product.rowId === null || product.storeId === null) return;
    // `carts/action` takes the ROW id (the cart key), never the variant id.
    cart.add(
      {
        storeId: product.storeId,
        rowId: product.rowId,
        quantity,
        label: product.name,
      },
      onAdded ? { onSuccess: onAdded } : undefined,
    );
  };

  return (
    <div className={cn('flex w-full min-w-0 flex-col gap-5', className)}>
      {product.store ? (
        <div className="flex flex-row flex-wrap items-center gap-2.5">
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-[12px] bg-brand text-on-cta"
          >
            <Store size={16} />
          </span>
          <span className="text-body-sm font-bold text-ink">{product.store.name}</span>
          {rating !== null && rating !== undefined ? (
            <>
              <span aria-hidden="true" className="text-body-sm text-ink3">
                ·
              </span>
              <Star size={15} aria-hidden="true" className="shrink-0 text-ink" />
              <span className="text-label text-ink2">
                {ratingCount !== null && ratingCount !== undefined
                  ? t('ratingWithCount', { rating: number(rating), count: ratingCount })
                  : t('rating', { rating: number(rating) })}
              </span>
            </>
          ) : null}
        </div>
      ) : null}

      {/* The quick view sits over a page that already owns the `h1`, so it drops a level. */}
      <Title
        className={cn(
          'm-0 font-extrabold leading-[1.15] tracking-[-0.02em] text-ink',
          compact ? 'text-h3 md:text-h2' : 'text-h2 md:text-h1-app lg:text-[40px]',
        )}
      >
        {product.name}
      </Title>

      {metaParts.length > 0 ? (
        <p className="m-0 text-body text-ink2">{metaParts.join(' · ')}</p>
      ) : null}

      <div className="flex flex-row flex-wrap items-end gap-[14px]">
        <Price value={product.price} size={compact ? 'total' : 'page'} tone={soldOut ? 'ink3' : 'ink'} />
        {byWeight ? (
          <span className="text-h4 font-medium text-ink3">{t('pricePerKg')}</span>
        ) : null}
        {product.hasDiscount ? (
          <Price value={product.mrp} size="card" strike aria-label={t('oldPrice', { price: money(product.mrp) })} />
        ) : null}
      </div>

      {bonus > 0 && !soldOut ? (
        <p className="m-0 inline-flex h-9 w-fit flex-row items-center gap-2 rounded-pill bg-success-soft px-4 text-label font-bold text-success">
          <Gift size={16} aria-hidden="true" />
          {byWeight
            ? t('bonusWeight', { amount: money(bonus) })
            : t('bonus', { amount: money(bonus) })}
        </p>
      ) : null}

      <div aria-hidden="true" className="h-px w-full bg-line" />

      {soldOut ? (
        <OutOfStockBlock />
      ) : (
        <>
          {byWeight ? (
            <WeightSelector
              value={quantity}
              onChange={(next) => setQuantity(clampQuantity(next, bounds))}
              bounds={bounds}
              presets={presets}
            />
          ) : null}

          <div className="flex w-full flex-row flex-wrap items-center gap-4">
            {byWeight ? null : (
              <QuantityStepper
                value={quantity}
                min={bounds.min}
                max={bounds.max}
                step={bounds.step}
                onChange={(next) => setQuantity(clampQuantity(next, bounds))}
                decreaseLabel={t('quantity.decrease')}
                increaseLabel={t('quantity.increase')}
                valueAnnouncement={(v) => t('quantity.announce', { value: v })}
              />
            )}
            <Button
              variant="brand"
              size="2xl"
              loading={cart.pending}
              onClick={onAdd}
              className="min-w-0 flex-1"
            >
              <ShoppingCart aria-hidden="true" />
              {t('addToCart', { total: money(total) })}
            </Button>
          </div>
        </>
      )}

      <DeliveryInfo />
    </div>
  );
}

/** AX5 — the add row is replaced, the page stays the same route. */
function OutOfStockBlock() {
  const t = useTranslations('product');

  return (
    <div className="flex w-full flex-col gap-4">
      <OutOfStockNotice title={t('outOfStock.title')} body={t('outOfStock.body')} multiline />

      <Button variant="soft" size="2xl" disabled className="w-full">
        {t('outOfStock.title')}
      </Button>

      {/* No endpoint for a back-in-stock subscription (screen spec AX5): rendered inert. */}
      <Button
        variant="primary"
        size="2xl"
        disabled
        aria-describedby="oz-notify-note"
        className="w-full"
      >
        <Bell aria-hidden="true" />
        {t('outOfStock.notify')}
      </Button>
      <p id="oz-notify-note" className="m-0 text-caption text-ink3">
        {t('outOfStock.notifyPending')}
      </p>

      <InlineNotice tone="info" icon={Info} body={t('outOfStock.alternative')} multiline />
    </div>
  );
}

/**
 * `WkRGS` — two info items. The delivery window and fee are **not** in the detail payload (the
 * screen spec records this as a design defect), so only the quality-guarantee item, which is
 * static copy, is rendered until a delivery-point source feeds the first one.
 */
function DeliveryInfo() {
  const t = useTranslations('product');

  return (
    <div className="flex w-full flex-row flex-wrap gap-6">
      <div className="flex min-w-0 flex-1 flex-row items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-[16px] bg-surface text-ink"
        >
          <ShieldCheck size={20} />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-label font-bold text-ink">{t('quality.title')}</span>
          <span className="text-caption text-ink2">{t('quality.body')}</span>
        </span>
      </div>
    </div>
  );
}
