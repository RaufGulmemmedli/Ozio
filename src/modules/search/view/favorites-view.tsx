'use client';

/**
 * `/favorites` — AX8 (`WQK0E`) with its empty twin (`pcqsE`).
 *
 * **What this renders today:** `GET v1/stores/favorites` is `not-found` on live (the path is
 * shadowed by `/stores/{id}` and answers 404 `store not found`; every query variant does the same).
 * The repository therefore fails with a `notFound` Failure *without calling anything*, and this
 * screen shows the documented "not available" state — never a broken or faked list.
 *
 * The real UI below it is finished and wired: as soon as `searchRepository.favorites()` returns a
 * page (see its one-line swap note), the page header count, the Məhsullar / Mağazalar tabs, the
 * grid, the price-drop hint and the empty state all light up with no further changes.
 *
 * `?preview=empty` shows the drawn empty screen, `?preview=loading` the mirror skeleton and
 * `?preview=error` the error state, so every designed state is reachable while the endpoint is dead.
 */
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useFailureMessage } from '@/core/i18n';
import { paths } from '@/core/routes';
import { Heart, Info, ShoppingBasket, ShoppingCart, Store as StoreIcon } from '@/shared/lucide';
import { ProductGridSkeleton, Shimmer } from '@/shared/skeleton';
import { EmptyState, ErrorState, InlineNotice, StateButton } from '@/shared/states';
import { Button, Chip } from '@/shared/ui';
import { PageHeader } from '@/shared/layout';
// TODO(store): `<ProductCard>` is agent M3's component.
import { ProductCard } from '@/modules/store';
import { useGridCart } from '@/modules/product';

import { SuggestedRail } from '../components/suggested-rail';
import { useFavorites } from '../hooks/use-favorites';
import { useSearch } from '../hooks/use-search';
import { useSearchCategories } from '../hooks/use-search-categories';
import { useSuggestedProducts } from '../hooks/use-suggested-products';

type FavoritesTab = 'products' | 'stores';

export function FavoritesView() {
  const t = useTranslations('search');
  const failureMessage = useFailureMessage();
  const [tab, setTab] = useState<FavoritesTab>('products');
  const cart = useGridCart();

  const favorites = useFavorites();
  // Only for the delivery point + the nearest store the suggestion rail needs; no keyword, so the
  // fan-out itself never runs here.
  const nearby = useSearch({ term: '' });
  const nearestStoreId = nearby.legs[0]?.id ?? null;
  const categories = useSearchCategories(nearestStoreId);
  const suggested = useSuggestedProducts({
    storeId: nearestStoreId,
    categoryId: categories.data?.[0]?.id ?? null,
    enabled: !favorites.isPending,
  });

  const items = useMemo(() => favorites.data?.items ?? [], [favorites.data]);
  const storeCount = useMemo(
    () => new Set(items.map((row) => row.storeId)).size,
    [items],
  );

  const isEmpty = favorites.isSuccess && items.length === 0;
  const unavailable = favorites.isError && favorites.error.kind === 'notFound';

  const subtitle = favorites.isSuccess
    ? items.length === 0
      ? t('favorites.emptySubtitle')
      : t('favorites.summary', {
          products: t('favorites.productCount', { count: items.length }),
          stores: t('favorites.storeCount', { count: storeCount }),
        })
    : undefined;

  return (
    <>
      <PageHeader
        title={t('favorites.title')}
        subtitle={subtitle}
        actions={
          items.length > 0 ? (
            // One `carts/action` per row, sequentially (same path → no concurrency), stop on 422.
            <Button
              variant="brand"
              size="xl"
              loading={cart.pending}
              onClick={() => void cart.addAll(items)}
            >
              <ShoppingCart aria-hidden="true" />
              {t('favorites.addAll')}
            </Button>
          ) : undefined
        }
      />

      {favorites.isPending ? (
        <Shimmer label={t('loading')} className="flex w-full flex-col gap-6">
          <ProductGridSkeleton cols={4} count={8} />
        </Shimmer>
      ) : unavailable ? (
        <EmptyState
          icon={Heart}
          tone="brand"
          panel
          title={t('favorites.unavailable.title')}
          body={t('favorites.unavailable.body')}
          action={
            <StateButton href={paths.market}>{t('favorites.unavailable.action')}</StateButton>
          }
        />
      ) : favorites.isError ? (
        <ErrorState
          failure={favorites.error}
          title={t('error.title')}
          message={failureMessage(favorites.error)}
          onRetry={() => favorites.refetch()}
          retryLabel={t('error.retry')}
          retrying={favorites.isRefetching}
        />
      ) : isEmpty ? (
        <EmptyState
          icon={Heart}
          tone="brand"
          panel
          title={t('favorites.empty.title')}
          body={t('favorites.empty.body')}
          action={
            <StateButton href={paths.market}>
              <ShoppingBasket size={20} aria-hidden="true" />
              {t('favorites.empty.cta')}
            </StateButton>
          }
        />
      ) : (
        <>
          <div
            role="group"
            aria-label={t('favorites.tabsLabel')}
            className="flex flex-row flex-wrap gap-2.5"
          >
            <Chip
              selected={tab === 'products'}
              count={items.length}
              leadingIcon={Heart}
              onClick={() => setTab('products')}
            >
              {t('tabs.products')}
            </Chip>
            <Chip
              selected={tab === 'stores'}
              count={storeCount}
              leadingIcon={StoreIcon}
              onClick={() => setTab('stores')}
            >
              {t('tabs.stores')}
            </Chip>
          </div>

          <div className="grid w-full grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {items.map((product) => (
              <ProductCard
                key={`${product.storeId}-${product.id}`}
                product={product}
                favorite
                quantity={cart.quantityOf(product)}
                onQuantityChange={(next) => cart.setQuantity(product, next)}
                step={cart.stepOf(product)}
                busy={cart.pending}
              />
            ))}
          </div>

          {/* Price-drop notifications have no endpoint — the hint is copy, not a feature switch. */}
          <InlineNotice tone="info" icon={Info} body={t('favorites.hint')} multiline />
        </>
      )}

      <SuggestedRail
        title={t('favorites.suggested.title')}
        products={suggested.data?.items ?? []}
        loading={suggested.isPending && suggested.isFetching}
      />
    </>
  );
}
