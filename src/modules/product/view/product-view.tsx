'use client';

/**
 * `/market/product/[id]?store=<storeId>` — screen D4, with AX5 (out of stock) and AX6 (sold by
 * weight) as states of the same route.
 *
 * `[id]` is the **variant id** (`store_product_variants.id`); the store id rides in the query
 * because a variant is only meaningful together with its store. A list **row** id passed here makes
 * `GET stores/{sid}/products/{id}` answer HTTP 200 with `data: null`, which the repository turns
 * into a `notFound` Failure — hence the not-found state below rather than an empty product.
 *
 * Layout (`T38LqZ`): gallery 540 beside the 532 info column, gap 40, stacking at the width
 * `GallerySkeleton` stacks at, so the skeleton never shifts the layout.
 */
import { useTranslations } from 'next-intl';

import { useFailureMessage } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { Breadcrumbs, type BreadcrumbItem } from '@/shared/ui';
import { EmptyState, ErrorState, StateButton } from '@/shared/states';
import { SearchX } from '@/shared/lucide';

import { ProductGallery } from '../components/product-gallery';
import { ProductInfo } from '../components/product-info';
import { ProductTabs } from '../components/product-tabs';
import { SimilarRail } from '../components/similar-rail';
import { useProductDetail } from '../hooks/use-product-detail';
import { useProductFavorite } from '../hooks/use-product-favorite';
import { useSimilarProducts } from '../hooks/use-similar-products';
import { ProductSkeleton } from './product-skeleton';

export interface ProductViewProps {
  /** `store_product_variants.id` from the path, or `null` when the segment was not a number. */
  variantId: number | null;
  /** `?store=` — `null` when the link arrived without it. */
  storeId: number | null;
  /** Quick view: no breadcrumb, no tabs, no similar rail, smaller type. */
  compact?: boolean;
  /**
   * Fires after "Səbətə at" succeeds. The quick view passes `router.back()` so the modal gets out
   * of the way once the line is in the cart; the full page leaves it undefined and stays put.
   */
  onAddedToCart?: () => void;
  className?: string;
}

export function ProductView({
  variantId,
  storeId,
  compact = false,
  onAddedToCart,
  className,
}: ProductViewProps) {
  const t = useTranslations('product');
  const failureMessage = useFailureMessage();

  const detail = useProductDetail({ storeId, variantId });
  const product = detail.data ?? null;

  // Different path from the detail call, so the two are safe in parallel.
  const similar = useSimilarProducts({
    storeId,
    variantId,
    enabled: !compact && detail.isSuccess,
  });

  const favorite = useProductFavorite({
    storeId,
    variantId,
    initial: product?.isFavorite ?? null,
  });

  if (storeId === null || variantId === null) {
    return (
      <div className={cn('flex w-full justify-center py-10', className)}>
        <EmptyState
          icon={SearchX}
          tone="brand"
          panel
          title={t('storeMissing.title')}
          body={t('storeMissing.body')}
          action={<StateButton href={paths.market}>{t('notFound.back')}</StateButton>}
        />
      </div>
    );
  }

  if (detail.isPending) {
    return <ProductSkeleton compact={compact} className={className} />;
  }

  if (detail.isError) {
    const notFound = detail.error.kind === 'notFound';
    return (
      <div className={cn('flex w-full justify-center py-10', className)}>
        {notFound ? (
          <EmptyState
            icon={SearchX}
            tone="brand"
            panel
            title={t('notFound.title')}
            body={t('notFound.body')}
            action={<StateButton href={paths.market}>{t('notFound.back')}</StateButton>}
          />
        ) : (
          <ErrorState
            failure={detail.error}
            title={t('error.title')}
            message={failureMessage(detail.error)}
            onRetry={() => detail.refetch()}
            retryLabel={t('error.retry')}
            retrying={detail.isRefetching}
            secondaryAction={
              <StateButton href={paths.market} variant="soft">
                {t('notFound.back')}
              </StateButton>
            }
          />
        )}
      </div>
    );
  }

  if (!product) return <ProductSkeleton compact={compact} className={className} />;

  const crumbs: BreadcrumbItem[] = [
    { label: t('breadcrumb.market'), href: paths.market },
    ...(product.store?.name && product.storeId !== null
      ? [{ label: product.store.name, href: paths.store(product.storeId) }]
      : []),
    ...(product.categoryName && product.categoryId !== null
      ? [{ label: product.categoryName, href: paths.category(product.categoryId) }]
      : []),
    { label: product.name },
  ];

  return (
    <div className={cn('flex w-full flex-col gap-8', className)}>
      {compact ? null : <Breadcrumbs items={crumbs} label={t('breadcrumb.label')} />}

      {/*
        Container queries, not `lg:` — the columns must react to the width THIS component actually
        gets, not the viewport's. Inside the 760px quick-view modal on a 1440px screen, `lg:`
        was true, so the gallery took its fixed 540px with `shrink-0` and left the info column
        109px: the title wrapped letter by letter, the price collided with the bonus badge and the
        modal grew a horizontal scrollbar.

        Three steps now: stacked below 600, two even halves from 600 (the modal), and the drawn
        540 / 532 pair once the container can actually hold it (540 + 40 gap + 532 = 1112, hence 1120).
      */}
      <div className="@container w-full">
        <div className="flex w-full flex-col gap-10 @[600px]:flex-row">
          <div className="w-full @[600px]:w-1/2 @[1120px]:w-[540px] @[1120px]:shrink-0">
            <ProductGallery
              images={product.images}
              name={product.name}
              category={product.categoryName}
              discountPercent={product.discountPercent}
              outOfStock={!product.inStock}
              favorite={favorite.favorite}
              favoritePending={favorite.pending}
              onToggleFavorite={favorite.toggle}
              priority={!compact}
            />
          </div>

          <ProductInfo
            product={product}
            compact={compact}
            onAdded={onAddedToCart}
            className="@[600px]:w-1/2 @[1120px]:w-[532px]"
          />
        </div>
      </div>

      {compact ? null : (
        <>
          <ProductTabs product={product} />

          <SimilarRail
            title={t('similar.title')}
            products={similar.data?.items ?? []}
            loading={similar.isPending && similar.isFetching}
            allHref={
              product.categoryId !== null ? paths.category(product.categoryId) : paths.market
            }
            emptyLabel={similar.isError ? undefined : t('similar.empty')}
          />
        </>
      )}
    </div>
  );
}
