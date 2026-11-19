'use client';

/**
 * UN5 · "Yeni ünvan" on the map — `/addresses/pick` (`app-yeni-unvan.html`, frame `ZkmFQ`), and
 * UN7 · "Zona xaricində" (`app-unvan-zona-xaricinde.html`, frame `D1eUt`) as **a state of this
 * screen**, not a route.
 *
 * Split 24: the map picker (r36) | the 400-wide form panel. The pin's address line comes from
 * `reverseGeocode`, which is an **MSW stub** — hence `<DemoBanner module="address"/>` at the top.
 *
 * Zone verdict: there is no zone endpoint. "Çatdırılma mümkündür" / "Zonadan kənardır" is derived
 * the only way the API allows (api/address.md § "Zone check"): from the `zones` the address rows
 * carry, and otherwise it stays **unknown** — an unknown verdict never blocks saving, because
 * blocking on a guess would lock a real customer out of their own address.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

import { useRouter } from '@/core/i18n/navigation';
import { useFailureMessage } from '@/core/i18n';
import { paths } from '@/core/routes';
import { usePrefs } from '@/core/session';
import { Breadcrumbs, toast } from '@/shared/ui';
import { DemoBanner, ErrorState } from '@/shared/states';

import { addressZonesHref } from '../address.routes';
import { AddressForm, type AddressFormSubmit, type AddressFormValues } from '../components/AddressForm';
import { MapPicker } from '../components/MapPicker';
import {
  useAddress,
  useAddresses,
  useCities,
  useCreateAddress,
  useDebounced,
  useReverseGeocode,
  useSelectedAddress,
  useUpdateAddress,
} from '../hooks';
import { cityPointByName, DEFAULT_CITY_POINT } from '../lib/city-points';
import { toAddressInput, type LatLng } from '../data/models/address';
import { AddressPickSkeleton } from './AddressesSkeleton';

/**
 * The zone verdict for a point.
 *
 * `null` = unknown, which is what live data always produces today (`zones` is null on every row
 * and there is no zone endpoint). It becomes a real verdict only when an address row carries
 * zones, or when a checkout response says `out_of_zone` — both server-driven, never computed here.
 */
function zoneVerdict(hasZoneData: boolean, containsPoint: boolean): boolean | null {
  if (!hasZoneData) return null;
  return containsPoint;
}

export function AddressPickView() {
  const t = useTranslations('address');
  const failureMessage = useFailureMessage();
  const router = useRouter();
  const params = useSearchParams();
  const editId = Number(params?.get('id') ?? '') || null;
  /** `?lat&lng` — the point `/addresses/search` chose. */
  const fromSearch = useMemo<LatLng | null>(() => {
    const lat = Number(params?.get('lat') ?? '');
    const lng = Number(params?.get('lng') ?? '');
    return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0
      ? { lat, lng }
      : null;
  }, [params]);

  const cityId = usePrefs((s) => s.cityId);
  const cities = useCities();
  const list = useAddresses();
  const selected = useSelectedAddress();
  const editing = useAddress(editId);
  const create = useCreateAddress();
  const update = useUpdateAddress();

  const city = cities.data?.find((row) => row.id === cityId) ?? null;
  const center = useMemo<LatLng>(
    () => cityPointByName(city?.name) ?? selected.point ?? DEFAULT_CITY_POINT,
    [city?.name, selected.point],
  );

  /**
   * The pin.
   *
   * `dropped` is only what the user moved; the resting position is **derived** — the point
   * `/addresses/search` handed over, else the edited address's own point, else the map centre. A
   * derived default means no effect has to seed state (and no cascading render when the address or
   * the city list lands).
   */
  const [dropped, setDropped] = useState<LatLng | null>(null);
  const point = useMemo<LatLng | null>(() => {
    if (dropped) return dropped;
    if (fromSearch) return fromSearch;
    if (editId) return editing.data ? (editing.data.point ?? center) : null;
    return center;
  }, [dropped, fromSearch, editId, editing.data, center]);

  const debouncedPoint = useDebounced(point, 400);
  const reverse = useReverseGeocode(debouncedPoint);

  /**
   * Any zone data at all? On live: never. The flag exists so the UI switches from "unknown" to a
   * real verdict the moment the server starts filling `zones` in.
   */
  const zoneSource = (list.data ?? []).find((address) => address.zones.length > 0) ?? null;
  const inZone = zoneVerdict(
    zoneSource !== null,
    zoneSource?.zones.some((zone) => zone.contains) ?? false,
  );
  const outOfZone = inZone === false;

  const initial = useMemo<Partial<AddressFormValues>>(() => {
    if (editId && editing.data) {
      const input = toAddressInput(editing.data);
      return {
        kind: input.kind,
        line: input.line,
        road: input.road ?? '',
        buildingName: input.buildingName ?? '',
        floor: input.floor ?? '',
        apartmentRoom: input.apartmentRoom ?? '',
        entranceNumber: input.entranceNumber ?? '',
        personName: input.personName ?? '',
        phone: input.phone ?? '',
        details: input.details ?? '',
        makeDefault: selected.selectedId === editing.data.id,
      };
    }
    const place = reverse.data;
    if (!place) return {};
    return {
      line: place.label,
      road: place.street ?? '',
    };
  }, [editId, editing.data, reverse.data, selected.selectedId]);

  const submitting = create.isPending || update.isPending;
  const failure = create.error ?? update.error ?? null;

  const onSubmit = useCallback(
    (input: AddressFormSubmit) => {
      if (editId) {
        update.mutate(
          { id: editId, input, makeSelected: input.makeSelected },
          {
            onSuccess: () => {
              toast.success(t('toast.saved'));
              router.push(paths.addresses);
            },
            onError: (error) =>
              toast.error({ title: t('toast.saveFailed'), body: failureMessage(error) }),
          },
        );
        return;
      }
      create.mutate(input, {
        onSuccess: () => {
          toast.success(t('toast.saved'));
          router.push(paths.addresses);
        },
        onError: (error) =>
          toast.error({ title: t('toast.saveFailed'), body: failureMessage(error) }),
      });
    },
    [create, update, editId, router, t, failureMessage],
  );

  // A 404 on an edited address: back to the list with a toast.
  useEffect(() => {
    if (!editId || !editing.isError) return;
    if (editing.error?.kind !== 'notFound') return;
    toast.error(t('toast.notFound'));
    router.replace(paths.addresses);
  }, [editId, editing.isError, editing.error?.kind, router, t]);

  if (editId && editing.isPending) return <AddressPickSkeleton label={t('loading')} />;

  if (editId && editing.isError && editing.error?.kind !== 'notFound') {
    return (
      <ErrorState
        failure={editing.error}
        title={t('error.title')}
        message={failureMessage(editing.error)}
        onRetry={() => editing.refetch()}
        retryLabel={t('error.retry')}
      />
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <DemoBanner module={t('demoModule')} body={t('demoBody')} />

      <Breadcrumbs
        label={t('breadcrumbLabel')}
        items={[
          { label: t('title'), href: paths.addresses },
          { label: editId ? t('editTitle') : t('new') },
        ]}
      />

      <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-stretch">
        <div className="min-w-0 flex-1">
          <MapPicker
            point={point}
            center={center}
            onPointChange={setDropped}
            caption={reverse.data?.label ?? null}
            captionLoading={reverse.isFetching}
            inZone={inZone}
            onSearchClick={() => router.push(paths.addressSearch)}
            onLocateClick={() => setDropped(center)}
          />
          {reverse.isSuccess && reverse.data === null ? (
            <p className="m-0 pt-3 text-caption text-ink3">{t('picker.nothingHere')}</p>
          ) : null}
        </div>

        <div className="w-full lg:w-[400px]">
          <AddressForm
            title={editId ? t('editTitle') : t('new')}
            titleAs="h1"
            initial={initial}
            point={point}
            outOfZone={outOfZone}
            onPickAnother={() => setDropped(center)}
            onZoneMap={() => router.push(addressZonesHref)}
            onSubmit={onSubmit}
            submitting={submitting}
            failure={failure}
          />
        </div>
      </div>
    </div>
  );
}
