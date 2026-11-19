/** Public surface of the search module (AX1–AX3, AX8). Other modules import from here only. */
export { searchRoutes, SEARCH_QUERY_PARAM, type SearchRoute } from './search.routes';
export { searchKeys } from './search.query-keys';

export {
  searchRepository,
  FAN_OUT_STORES,
  POPULAR_SEARCHES,
  type SearchPage,
  type SearchProductsArgs,
} from './data/search.repository';
export { SEARCH_PAGE_LIMIT } from './data/search.remote';

export {
  useSearch,
  SEARCH_DEBOUNCE_MS,
  type SearchSort,
  type UseSearchArgs,
  type UseSearchResult,
} from './hooks/use-search';
export { useSearchCategories } from './hooks/use-search-categories';
export { useRecentSearches, type RecentSearchesState } from './hooks/use-recent-searches';
export { useFavorites } from './hooks/use-favorites';
export { useSuggestedProducts } from './hooks/use-suggested-products';

export { SearchField, type SearchFieldProps } from './components/search-field';
export { SearchResults, type SearchResultsProps, type ResultTab } from './components/search-results';
export { SearchNotFound, type SearchNotFoundProps } from './components/search-not-found';
export { SuggestedRail, type SuggestedRailProps } from './components/suggested-rail';
export { SearchLanding, SearchLandingSkeleton } from './components/search-landing';

export { SearchView, type SearchViewProps } from './view/search-view';
export { FavoritesView } from './view/favorites-view';
