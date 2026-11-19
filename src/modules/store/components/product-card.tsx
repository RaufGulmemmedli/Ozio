'use client';

/**
 * `<ProductCard>` — the catalog card used by every grid in the app (Market `q5wgL8`, Mağaza
 * `q9FFnz`, Kateqoriya `Iy7XQ`, home "Sənin üçün", search results).
 *
 * Measured (`app-market.html` → `B0b8M`): `surface`, radius 24, padding 12, gap 12;
 * image 200 high radius 16 with the yellow discount `<Tag>` inset 10; info block padding-inline 4,
 * gap 4 — name 16/600 `ink`, meta 13/400 `ink2` ("1 kq · Ozio Market"); price row
 * `justify-between` padding 0 4 4 4 — price 20/700 and a 40 px `brand` circle add button that
 * becomes a `<QuantityStepper size="compact">` once the quantity is above 0.
 *
 * Out of stock: image at 60 % opacity, a "Bitib" badge and a disabled add button.
 * The heart is a 36 px `<IconButton>` top-right (screen spec D3 "favorite heart"; the export
 * frames do not draw it on the card).
 */
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { Link } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { Heart, Plus } from '@/shared/lucide';
import { ProductImage } from '@/shared/media';
import { Badge, IconButton, Price, QuantityStepper, Tag } from '@/shared/ui';

import { stockInOrderUnit, type ProductRow } from '../data/models/product-row';

export interface ProductCardProps {
  product: ProductRow;
  /**
   * Target of the card. Defaults to the product detail route built from the **variant id**
   * (`store_product_variants.id`) plus the store, which is what `GET
   * stores/{storeId}/products/{variantId}` needs — never the row id.
   */
  href?: string;
  /** Cart quantity in the product unit (kg for weight rows). 0 → the add button. */
  quantity?: number;
  onQuantityChange?: (next: number) => void;
  /** Stepper step: 0.1 for weight rows. */
  step?: number;
  /** Store closed / purchasing disabled → the add control is inert. */
  disabled?: boolean;
  /** A cart write is in flight. */
  busy?: boolean;
  favorite?: boolean;
  onToggleFavorite?: () => void;
  /** Hide the heart where there is no favourite affordance (e.g. inside the mini-cart). */
  hideFavorite?: boolean;
  /** Only for an above-the-fold LCP image. */
  priority?: boolean;
  className?: string;
}

export function ProductCard({
  product,
  href,
  quantity = 0,
  onQuantityChange,
  step,
  disabled = false,
  busy = false,
  favorite = false,
  onToggleFavorite,
  hideFavorite = false,
  priority = false,
  className,
}: ProductCardProps) {
  const t = useTranslations('store');
  const { kg } = useFormat();

  const target = href ?? `${paths.product(product.variantId)}?store=${product.storeId}`;
  const max = useMemo(() => stockInOrderUnit(product), [product]);
  // A weight row is one the catalog counts in grams and the cart in kilograms; the two live flags
  // move together, so either one makes the card speak kilograms.
  const isWeight = product.hasWeight || product.soldByGram;
  // Step 0,1 kq for a weight row ("Addım 0,1 kq", screens/app-catalog.md §5); `step` from the
  // cart module wins, since it owns the cart unit.
  const unitStep = step ?? (isWeight ? 0.1 : 1);
  const soldOut = !product.inStock;
  const addDisabled = disabled || soldOut || !onQuantityChange;

  const meta = [product.quantityLabel, product.storeName].filter(Boolean).join(' · ');

  return (
    <article
      className={cn(
        // Cards are flat by design (components.md §5): the hover is a lift, never a shadow.
        'relative flex w-full min-w-0 flex-col gap-3 rounded-card bg-surface p-3',
        'transition-transform duration-[var(--oz-dur-base)] ease-out hover:-translate-y-0.5 active:scale-[.99]',
        className,
      )}
    >
      {/* One link covering the card; the buttons sit above it. */}
      <Link
        href={target}
        className="absolute inset-0 z-[1] rounded-card"
        aria-label={product.name}
      />

      <div className="pointer-events-none relative">
        <ProductImage
          src={product.imageUrl}
          alt=""
          category={product.categoryName}
          ratio="236/200"
          radius="inner"
          priority={priority}
          className={cn('h-[200px]', soldOut && 'opacity-60')}
          sizes="(max-width: 767px) 45vw, (max-width: 1199px) 30vw, 269px"
        />

        {soldOut ? (
          <Badge tone="neutral" className="absolute left-[10px] top-[10px]">
            {t('card.outOfStock')}
          </Badge>
        ) : product.isDiscounted ? (
          <Tag className="absolute left-[10px] top-[10px]">{`-${product.discountPercent}%`}</Tag>
        ) : null}

        {hideFavorite ? null : (
          <IconButton
            aria-label={favorite ? t('card.favoriteRemove') : t('card.favoriteAdd')}
            aria-pressed={favorite}
            size={36}
            tone="surface"
            onClick={onToggleFavorite}
            disabled={!onToggleFavorite}
            className="pointer-events-auto absolute right-[10px] top-[10px] z-[2]"
          >
            <Heart
              aria-hidden="true"
              className={favorite ? 'fill-brand text-brand' : 'text-ink2'}
            />
          </IconButton>
        )}
      </div>

      <div className="pointer-events-none flex w-full min-w-0 flex-col gap-1 px-1">
        <h3 className="truncate text-body font-semibold text-ink">{product.name}</h3>
        <p className="truncate text-caption font-normal text-ink2">{meta}</p>
      </div>

      <div className="flex w-full flex-row items-center justify-between gap-2 px-1 pb-1">
        <div className="pointer-events-none flex min-w-0 flex-row items-baseline gap-[6px]">
          <Price value={product.price} size="card" />
          {isWeight ? (
            <span className="text-caption font-normal text-ink2">{t('card.perUnit')}</span>
          ) : null}
          {product.isDiscounted ? (
            <Price value={product.mrp} size="sm" strike />
          ) : null}
        </div>

        {quantity > 0 && onQuantityChange ? (
          <QuantityStepper
            value={quantity}
            min={0}
            max={max > 0 ? max : undefined}
            step={unitStep}
            unit={isWeight ? 'kg' : 'pcs'}
            size="compact"
            loading={busy}
            disabled={disabled}
            onChange={onQuantityChange}
            decreaseLabel={t('card.decrease')}
            increaseLabel={t('card.increase')}
            removeLabel={t('card.remove')}
            formatValue={
              isWeight ? (value) => kg(Math.round(value * 1000)) : undefined
            }
            valueAnnouncement={(value) => t('card.quantity', { count: value })}
            className="pointer-events-auto relative z-[2]"
          />
        ) : (
          <button
            type="button"
            aria-label={t('card.add', { name: product.name })}
            disabled={addDisabled}
            aria-busy={busy || undefined}
            onClick={() => onQuantityChange?.(unitStep)}
            className={cn(
              'pointer-events-auto relative z-[2] grid size-10 shrink-0 place-items-center rounded-pill bg-brand text-on-cta',
              'transition-[background-color,transform] duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
              addDisabled
                ? 'cursor-not-allowed opacity-40'
                : 'hover:bg-brand-dark active:scale-[.97]',
            )}
          >
            <Plus size={20} aria-hidden="true" />
          </button>
        )}
      </div>
    </article>
  );
}
