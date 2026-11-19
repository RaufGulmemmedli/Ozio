'use client';

/**
 * "Ünvan axtar" — `/addresses/search` (modal route, with a full-page fallback on a direct hit).
 *
 * **There is no geocoding in the Ozio API.** This screen is written against the internal
 * `geocodeSearch(query)` interface and served by the MSW stub under
 * `/api/mock/address/geocode/search` with az / ru / en fixtures of real Baku streets — which is
 * why `<DemoBanner module="address"/>` is rendered here and on the picker, and nowhere else in
 * this module. One documented swap point (`GEOCODE_PROVIDER` in `data/geocode.remote.ts`)
 * replaces the stub with a real provider.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { useRouter } from '@/core/i18n/navigation';
import { useFailureMessage } from '@/core/i18n';
import { paths } from '@/core/routes';
import { usePrefs } from '@/core/session';
import { Input } from '@/shared/ui';
import { DemoBanner, EmptyState, ErrorState } from '@/shared/states';
import { Bone, Shimmer } from '@/shared/skeleton';
import { MapPin, Search, SearchX } from '@/shared/lucide';

import { GEOCODE_MIN_QUERY, useDebounced, useGeocodeSearch } from '../hooks';
import type { GeoPlace } from '../data/models/geo-place';

export interface AddressSearchViewProps {
  inModal?: boolean;
  onClose?: () => void;
}

export function AddressSearchView({ inModal = false, onClose }: AddressSearchViewProps) {
  const t = useTranslations('address');
  const failureMessage = useFailureMessage();
  const router = useRouter();
  const addRecentSearch = usePrefs((s) => s.addRecentSearch);

  const [query, setQuery] = useState('');
  const debounced = useDebounced(query);
  const results = useGeocodeSearch(debounced);

  const pick = (place: GeoPlace) => {
    addRecentSearch(place.label);
    onClose?.();
    // The picker owns the pin; the chosen point travels in the query string.
    router.push(`${paths.addressPick}?lat=${place.lat}&lng=${place.lng}`);
  };

  const tooShort = debounced.trim().length < GEOCODE_MIN_QUERY;

  return (
    <div className={cn('flex w-full flex-col gap-5', !inModal && 'md:max-w-[560px]')}>
      <DemoBanner module={t('demoModule')} body={t('demoBody')} />

      {inModal ? null : (
        <h1 className="m-0 text-h3 font-extrabold tracking-[-0.02em] text-ink">{t('search.title')}</h1>
      )}

      <Input
        autoFocus
        variant="pill"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('search.placeholder')}
        aria-label={t('search.title')}
        leadingIcon={<Search size={18} aria-hidden="true" className="text-ink3" />}
      />

      {tooShort ? (
        <p className="m-0 text-caption text-ink3">{t('search.hint', { min: GEOCODE_MIN_QUERY })}</p>
      ) : results.isPending ? (
        <Shimmer label={t('loading')} className="flex w-full flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Bone key={i} w="100%" h={56} r="md" />
          ))}
        </Shimmer>
      ) : results.isError ? (
        <ErrorState
          compact
          failure={results.error}
          title={t('search.errorTitle')}
          message={failureMessage(results.error)}
          onRetry={() => results.refetch()}
          retryLabel={t('error.retry')}
        />
      ) : (results.data?.length ?? 0) === 0 ? (
        <EmptyState
          compact
          icon={SearchX}
          titleAs="p"
          title={t('search.emptyTitle')}
          body={t('search.emptyBody')}
        />
      ) : (
        <ul className="m-0 flex w-full list-none flex-col gap-1 p-0">
          {(results.data ?? []).map((place) => (
            <li key={place.id}>
              <button
                type="button"
                onClick={() => pick(place)}
                className="flex w-full flex-row items-start gap-3 rounded-md px-3 py-3 text-left transition-colors duration-[var(--oz-dur-fast)] hover:bg-surface2"
              >
                <MapPin size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-ink3" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-body-sm font-semibold text-ink">{place.label}</span>
                  <span className="truncate text-caption text-ink2">
                    {[place.district, place.city].filter(Boolean).join(', ')}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
