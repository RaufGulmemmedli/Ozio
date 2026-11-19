'use client';

/**
 * Gallery (`PfDBi`): a 540 square main image at radius 36 with the yellow discount tag and the
 * favourite heart inset 20, over a row of four 96 thumbnails at radius 20 (the active one outlined
 * 3 px `brand`, the rest 1 px `line`).
 *
 * Out of stock (`nmFNI`): the image drops to 60 % opacity and the tag becomes the black "Bitib"
 * badge — no route change.
 *
 * a11y: tablist / tab / tabpanel, so the thumbnails are a keyboard-navigable list with real
 * thumbnails (Home / End / arrows), and the selected one is announced.
 */
import { useCallback, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Heart } from '@/shared/lucide';
import { ProductImage } from '@/shared/media';
import { IconButton } from '@/shared/ui';

export interface ProductGalleryProps {
  images: readonly string[];
  name: string;
  category?: string | null;
  /** `-15%` tag; 0 hides it. */
  discountPercent?: number;
  outOfStock?: boolean;
  favorite?: boolean;
  favoritePending?: boolean;
  onToggleFavorite?: () => void;
  /** The product page's main image is the LCP element; the quick view's is not. */
  priority?: boolean;
  className?: string;
}

export function ProductGallery({
  images,
  name,
  category,
  discountPercent = 0,
  outOfStock = false,
  favorite = false,
  favoritePending = false,
  onToggleFavorite,
  priority = false,
  className,
}: ProductGalleryProps) {
  const t = useTranslations('product');
  const baseId = useId();
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  const shots = images.length > 0 ? images : [''];
  const current = Math.min(active, shots.length - 1);

  const focusAt = useCallback(
    (index: number) => {
      const next = ((index % shots.length) + shots.length) % shots.length;
      setActive(next);
      listRef.current
        ?.querySelector<HTMLButtonElement>(`[data-thumb="${next}"]`)
        ?.focus();
    },
    [shots.length],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        focusAt(current + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        focusAt(current - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusAt(0);
        break;
      case 'End':
        event.preventDefault();
        focusAt(shots.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div className={cn('flex w-full flex-col gap-4', className)}>
      <div
        id={`${baseId}-panel-${current}`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${current}`}
        className="relative w-full"
      >
        <ProductImage
          src={shots[current] || null}
          alt={name}
          category={category}
          ratio="1/1"
          radius="gallery"
          sizes="(max-width: 767px) 100vw, (max-width: 1199px) 92vw, 540px"
          priority={priority}
          fallbackIconSize={64}
          className={cn(outOfStock && 'opacity-60')}
        />

        <div className="pointer-events-none absolute inset-0 flex items-start justify-between p-5">
          {outOfStock ? (
            <span className="inline-flex h-[34px] items-center rounded-pill bg-block px-4 text-label font-bold text-on-block">
              {t('outOfStock.badge')}
            </span>
          ) : discountPercent > 0 ? (
            <span className="inline-flex h-[34px] items-center rounded-pill bg-yellow px-4 text-label font-extrabold text-on-yellow">
              {t('discount', { percent: discountPercent })}
            </span>
          ) : (
            <span />
          )}

          {onToggleFavorite ? (
            <IconButton
              aria-label={favorite ? t('favorite.remove') : t('favorite.add')}
              aria-pressed={favorite}
              size={48}
              tone="surface"
              loading={favoritePending}
              onClick={onToggleFavorite}
              className="pointer-events-auto"
            >
              <Heart
                aria-hidden="true"
                className={favorite ? 'text-brand' : undefined}
                fill={favorite ? 'currentColor' : 'none'}
              />
            </IconButton>
          ) : null}
        </div>
      </div>

      {shots.length > 1 ? (
        <div
          ref={listRef}
          role="tablist"
          aria-label={t('gallery.label')}
          aria-orientation="horizontal"
          onKeyDown={onKeyDown}
          className="flex w-full flex-row gap-3"
        >
          {shots.map((src, index) => {
            const selected = index === current;
            return (
              <button
                key={`${src}-${index}`}
                type="button"
                role="tab"
                id={`${baseId}-tab-${index}`}
                data-thumb={index}
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${index}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(index)}
                className={cn(
                  'min-w-0 flex-1 overflow-hidden rounded-lg',
                  'transition-[outline-color,transform] duration-[var(--oz-dur-fast)] ease-out',
                  selected
                    ? 'outline outline-[3px] -outline-offset-2 outline-brand'
                    : 'outline outline-1 -outline-offset-1 outline-line hover:outline-ink3',
                )}
              >
                <ProductImage
                  src={src || null}
                  alt={t('gallery.thumb', { index: index + 1 })}
                  category={category}
                  ratio="1/1"
                  radius="none"
                  sizes="96px"
                  fallbackIconSize={28}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
