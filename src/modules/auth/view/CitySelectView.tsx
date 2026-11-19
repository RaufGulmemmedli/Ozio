'use client';

/**
 * A4 — `/city-select` (`sheher-sec.html`).
 *
 * Data: `GET v1/location/cities?country_id=1` — `country_id` is **required** (400 without it).
 * Rows carry **no `name`**: the label comes from `pickTranslation(row.city_translations, locale)`.
 * The "148 mağaza" counts and the "Tezliklə" flag in the export are **not** in the payload, so
 * they are not rendered — hiding them beats inventing them.
 *
 * States: loading (mirror skeleton) · empty (no cities at all) · no search result · error (retry).
 * All four, plus offline, are reachable with `?preview=loading|empty|error|offline`.
 *
 * Export: form column 520 (the `(auth)` layout caps it at 420, so the grid simply narrows) ·
 * search 56 high radius 14 · detect row 56 on `sky-soft` · city rows 64, radius 14, 1px `line`,
 * selected `brand-soft` + 2px `brand` with a 24px `brand` check tile · primary pill 60.
 */
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useRouter } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { useFailureMessage } from '@/core/i18n';
import { paths } from '@/core/routes';
import { usePrefs } from '@/core/session';
import { Check, ChevronRight, LocateFixed, MapPinOff, Search, SearchX } from '@/shared/lucide';
import { EmptyState, ErrorState, InlineNotice } from '@/shared/states';
import { Button, Input } from '@/shared/ui';

import { AuthHeading } from '../components/AuthHeading';
import { BackLink } from '../components/BackLink';
import { StepDots } from '../components/StepDots';
import { matchesCityQuery, type City } from '../data/models/city';
import { useAuthDestination } from '../hooks/use-auth-destination';
import { useCities } from '../hooks/use-cities';
import { CitySelectSkeleton } from './CitySelectSkeleton';

export function CitySelectView() {
  const t = useTranslations('auth');
  const router = useRouter();
  const failureMessage = useFailureMessage();
  const { afterCity } = useAuthDestination();

  const cityId = usePrefs((s) => s.cityId);
  const setCityId = usePrefs((s) => s.setCityId);

  const [query, setQuery] = useState('');
  // Only the user's tap is state; the persisted choice (which may hydrate after the first render)
  // is the fallback, so there is nothing to sync in an effect.
  const [picked, setPicked] = useState<number | null>(null);
  const selected = picked ?? cityId;
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const cities = useCities();

  const rows = useMemo(
    () => (cities.data ?? []).filter((city) => matchesCityQuery(city, query)),
    [cities.data, query],
  );

  const confirm = () => {
    if (selected === null) return;
    setCityId(selected);
    router.replace(afterCity());
  };

  /**
   * "Məkanımı avtomatik təyin et". There is no reverse-geocoding endpoint and the city rows carry
   * no coordinates, so the browser position cannot be turned into a city here: the permission is
   * requested (it is what the next onboarding step needs anyway) and the user still picks a row.
   * Degrades silently when the API is missing or denied — it never blocks the screen.
   */
  const detect = () => {
    setGeoError(null);
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGeoError(t('city.detect.unsupported'));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocating(false);
        setGeoError(t('city.detect.manual'));
      },
      () => {
        setLocating(false);
        setGeoError(t('city.detect.denied'));
      },
      { timeout: 10_000, maximumAge: 300_000 },
    );
  };

  return (
    <main id="main" className="flex w-full flex-col gap-5">
      <BackLink href={paths.login}>{t('back')}</BackLink>
      <StepDots total={3} current={1} label={t('city.step')} />
      <AuthHeading title={t('city.title')} subtitle={t('city.subtitle')} />

      {cities.isPending ? (
        <CitySelectSkeleton />
      ) : cities.isError ? (
        <ErrorState
          failure={cities.error}
          message={failureMessage(cities.error)}
          retryLabel={t('retry')}
          onRetry={() => cities.refetch()}
          retrying={cities.isRefetching}
          compact
        />
      ) : (
        <>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('city.search')}
            aria-label={t('city.search')}
            leadingIcon={<Search aria-hidden="true" />}
            autoComplete="off"
          />

          <button
            type="button"
            onClick={detect}
            aria-busy={locating}
            className={cn(
              'flex h-14 w-full items-center gap-3 rounded-md bg-sky-soft px-[18px] text-left',
              'transition-opacity duration-[var(--oz-dur-fast)]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
              locating && 'opacity-60',
            )}
          >
            <LocateFixed aria-hidden="true" className="size-[18px] shrink-0 text-sky" />
            <span className="flex-1 text-body-sm font-bold text-ink">{t('city.detect.action')}</span>
            <ChevronRight aria-hidden="true" className="size-[18px] shrink-0 text-ink2" />
          </button>

          {geoError ? <InlineNotice tone="info" role="status" body={geoError} multiline /> : null}

          {(cities.data ?? []).length === 0 ? (
            <EmptyState
              icon={MapPinOff}
              title={t('city.empty.title')}
              body={t('city.empty.body')}
              titleAs="h2"
              compact
              action={
                <Button type="button" variant="soft" size="lg" onClick={() => cities.refetch()}>
                  {t('retry')}
                </Button>
              }
            />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={t('city.noResult.title')}
              body={t('city.noResult.body')}
              titleAs="h2"
              compact
              action={
                <Button type="button" variant="soft" size="lg" onClick={() => setQuery('')}>
                  {t('city.noResult.clear')}
                </Button>
              }
            />
          ) : (
            <div
              role="radiogroup"
              aria-label={t('city.title')}
              className="grid w-full grid-cols-1 gap-[10px] md:grid-cols-2"
            >
              {rows.map((city) => (
                <CityRow
                  key={city.id}
                  city={city}
                  selected={selected === city.id}
                  onSelect={() => setPicked(city.id)}
                />
              ))}
            </div>
          )}

          <Button type="button" size="3xl" fullWidth disabled={selected === null} onClick={confirm}>
            {t('city.submit')}
          </Button>
        </>
      )}
    </main>
  );
}

function CityRow({
  city,
  selected,
  onSelect,
}: {
  city: City;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex h-16 w-full items-center gap-[10px] rounded-md px-4 text-left',
        'transition-[background-color,border-color] duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        selected
          ? 'border-2 border-brand bg-brand-soft'
          : 'border border-line bg-surface hover:border-ink3',
      )}
    >
      <span className="flex-1 text-body font-bold text-ink">{city.name}</span>
      {selected ? (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-[12px] bg-brand">
          <Check aria-hidden="true" className="size-[14px] text-on-cta" />
        </span>
      ) : null}
    </button>
  );
}
