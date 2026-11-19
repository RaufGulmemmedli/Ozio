'use client';

/**
 * `/search` and `/search?q=…` — AX1 (landing), AX2 (results), AX3 (not found) are one route.
 *
 * The URL is the source of truth for the term (`?q=`), so a result page is shareable and the back
 * button works; the field keeps its own immediate value and pushes to the URL on submit, which is
 * also when the term is recorded in `usePrefs().recentSearches` (client-only, capped at 10).
 *
 * Typing itself never touches the URL: `useSearch` debounces 300 ms and aborts superseded legs.
 */
import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useFailureMessage } from '@/core/i18n';
import { useRouter } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';
import { ErrorState, StateButton } from '@/shared/states';

import { SearchField } from '../components/search-field';
import { SearchLanding, SearchLandingSkeleton } from '../components/search-landing';
import { SearchNotFound } from '../components/search-not-found';
import { SearchResults, type ResultTab } from '../components/search-results';
import { SuggestedRail } from '../components/suggested-rail';
import { POPULAR_SEARCHES, searchRepository } from '../data/search.repository';
import { useRecentSearches } from '../hooks/use-recent-searches';
import { useSearch, type SearchSort } from '../hooks/use-search';
import { useSearchCategories } from '../hooks/use-search-categories';
import { useSuggestedProducts } from '../hooks/use-suggested-products';

export interface SearchViewProps {
  /** `?q=` from the URL. */
  initialQuery: string;
}

export function SearchView({ initialQuery }: SearchViewProps) {
  const t = useTranslations('search');
  const router = useRouter();
  const failureMessage = useFailureMessage();
  const recent = useRecentSearches();

  const [term, setTerm] = useState(initialQuery);
  const [tab, setTab] = useState<ResultTab>('products');
  const [sort, setSort] = useState<SearchSort>('relevance');
  const [discountOnly, setDiscountOnly] = useState(false);
  const [storeId, setStoreId] = useState<number | null>(null);

  // A back/forward navigation changes `?q=` without remounting the view: adjust the field during
  // render rather than in an effect (react.dev "You Might Not Need an Effect").
  const [syncedQuery, setSyncedQuery] = useState(initialQuery);
  if (syncedQuery !== initialQuery) {
    setSyncedQuery(initialQuery);
    setTerm(initialQuery);
  }

  const search = useSearch({ term, sort, discountOnly, storeId });
  const nearestStoreId = search.legs[0]?.id ?? null;
  const categories = useSearchCategories(nearestStoreId);
  const suggested = useSuggestedProducts({
    storeId: nearestStoreId,
    categoryId: categories.data?.[0]?.id ?? null,
    enabled: search.isEmpty,
  });

  const commit = useCallback(
    (next: string) => {
      const value = next.trim();
      setTerm(value);
      if (value.length === 0) {
        router.replace(paths.search);
        return;
      }
      recent.add(value);
      router.replace(paths.searchQuery(value));
    },
    [recent, router],
  );

  const pick = useCallback(
    (next: string) => {
      setTerm(next);
      commit(next);
    },
    [commit],
  );

  const clear = useCallback(() => {
    setTerm('');
    router.replace(paths.search);
  }, [router]);

  const suggestions = useMemo(
    () =>
      searchRepository.suggestions(search.keyword, [...recent.terms, ...POPULAR_SEARCHES]),
    [recent.terms, search.keyword],
  );

  const showLanding = search.keyword.length === 0;

  return (
    <>
      <SearchField
        value={term}
        onValueChange={setTerm}
        onSubmit={commit}
        onCancel={() => router.back()}
        autoFocus={showLanding}
      />

      {/* Exactly one `h1` per render: the landing has no visible page title (the field is the
          header), the results screen's own title is the `h1`. */}
      {showLanding ? <h1 className="sr-only">{t('meta.title')}</h1> : null}

      {showLanding ? (
        categories.isPending && recent.terms.length === 0 ? (
          <SearchLandingSkeleton label={t('loading')} />
        ) : (
          <SearchLanding
            recent={recent.terms}
            onPick={pick}
            onRemoveRecent={recent.remove}
            onClearRecent={recent.clear}
            categories={categories.data ?? []}
            categoriesPending={categories.isPending}
          />
        )
      ) : search.isError && search.error ? (
        <ErrorState
          failure={search.error}
          title={t('error.title')}
          message={failureMessage(search.error)}
          onRetry={search.refetch}
          retryLabel={t('error.retry')}
          retrying={search.isFetching}
          secondaryAction={
            <StateButton variant="soft" onClick={clear}>
              {t('notFound.clear')}
            </StateButton>
          }
        />
      ) : search.isEmpty ? (
        <>
          <SearchNotFound
            keyword={search.keyword}
            suggestions={suggestions}
            onPick={pick}
            onClear={clear}
          />
          <SuggestedRail
            title={t('suggested.title')}
            products={suggested.data?.items ?? []}
            loading={suggested.isPending && suggested.isFetching}
          />
        </>
      ) : (
        <SearchResults
          keyword={search.keyword}
          total={search.total}
          products={search.visible}
          stores={search.stores}
          legs={search.legs}
          tab={tab}
          onTabChange={setTab}
          sort={sort}
          onSortChange={setSort}
          discountOnly={discountOnly}
          onDiscountOnlyChange={setDiscountOnly}
          storeId={storeId}
          onStoreIdChange={setStoreId}
          loading={search.isPending || (search.typing && search.products.length === 0)}
          hasMore={search.hasMore}
          remaining={search.remaining}
          loadingMore={search.isFetchingNextPage}
          onLoadMore={search.loadMore}
        />
      )}
    </>
  );
}
