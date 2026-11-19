'use client';

/**
 * UN6 · "Ünvanlarım" — `/addresses` (`app-unvanlarim.html`, frame `ZTxnf`), with
 * UN6-empty (`app-unvanlarim-bos.html`, `r4Xbm`) as its empty state and the delivery-zone screen
 * (`app-catdirilma-zonasi.html`, `rhKzd`) as the `?view=zones` state of the same route.
 *
 * Header (title 36/800 + subtitle + the brand "Yeni ünvan" CTA 52) → the two-column card grid →
 * the dashed "Yeni ünvan əlavə et" tile and the `ink` "Çatdırılma zonası" promo block.
 */
import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

import { cn } from '@/core/lib/cn';
import { Link, useRouter } from '@/core/i18n/navigation';
import { useFailureMessage, useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { usePrefs } from '@/core/session';
import { Button, confirmDialog, toast } from '@/shared/ui';
import { EmptyState, ErrorState } from '@/shared/states';
import { MapPin, Plus, Trash2 } from '@/shared/lucide';

import { ADDRESS_ZONES_VIEW, addressZonesHref } from '../address.routes';
import { AddressCard } from '../components/AddressCard';
import { AddressMapThumb } from '../components/AddressMapThumb';
import { DeliveryZonePanel } from '../components/DeliveryZonePanel';
import {
  useAddresses,
  useCities,
  useDeleteAddress,
  useSelectAddress,
  useSelectedAddress,
} from '../hooks';
import type { Address } from '../data/models/address';
import { AddressesSkeleton, DeliveryZoneSkeleton } from './AddressesSkeleton';

export function AddressesView() {
  const t = useTranslations('address');
  const failureMessage = useFailureMessage();
  const { number } = useFormat();
  const router = useRouter();
  const params = useSearchParams();
  const showZones = params?.get('view') === ADDRESS_ZONES_VIEW;

  const cityId = usePrefs((s) => s.cityId);
  const setCityId = usePrefs((s) => s.setCityId);

  const list = useAddresses();
  const selected = useSelectedAddress();
  const cities = useCities();
  const select = useSelectAddress();
  const remove = useDeleteAddress();

  const addresses = list.data ?? [];

  const onMakeDefault = useCallback(
    (address: Address) => {
      select.mutate(address, {
        onSuccess: (result) => {
          toast.success({
            title: t('toast.defaultSet'),
            body: result.persistedOnServer ? undefined : t('toast.defaultLocalOnly'),
          });
        },
      });
    },
    [select, t],
  );

  const onDelete = useCallback(
    (address: Address) => {
      void (async () => {
        const confirmed = await confirmDialog({
          title: t('delete.title'),
          body: t('delete.body', { address: address.line || t('card.noLine') }),
          confirmLabel: t('delete.confirm'),
          cancelLabel: t('delete.cancel'),
          icon: Trash2,
          destructive: true,
          tone: 'brand',
        });
        if (!confirmed) return;
        remove.mutate(address.id, {
          onSuccess: () => toast.success(t('toast.deleted')),
          onError: (failure) => toast.error({ title: t('toast.deleteFailed'), body: failureMessage(failure) }),
        });
      })();
    },
    [remove, t, failureMessage],
  );

  const onEdit = useCallback(
    (address: Address) => {
      router.push(`${paths.addressPick}?id=${address.id}`);
    },
    [router],
  );

  const subtitle = useMemo(() => {
    if (addresses.length === 0) return t('empty.subtitle');
    return t('subtitle', { count: number(addresses.length) });
  }, [addresses.length, t, number]);

  /* ---------------------------------------------------------------- zones state */

  if (showZones) {
    return (
      <div className="flex w-full flex-col gap-8">
        <header className="flex w-full flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 text-h2 font-extrabold tracking-[-0.03em] text-ink lg:text-h1-app">
              {t('zones.title')}
            </h1>
            <p className="m-0 text-body text-ink2">{t('zones.subtitle')}</p>
          </div>
          <Button as="a" href={paths.addresses} variant="soft" size="lg">
            {t('zones.back')}
          </Button>
        </header>

        {cities.isPending || list.isPending ? (
          <DeliveryZoneSkeleton label={t('loading')} />
        ) : cities.isError ? (
          <ErrorState
            failure={cities.error}
            title={t('error.title')}
            message={failureMessage(cities.error)}
            onRetry={() => cities.refetch()}
            retryLabel={t('error.retry')}
          />
        ) : (
          <DeliveryZonePanel
            cities={cities.data ?? []}
            cityId={cityId}
            onCityChange={setCityId}
            address={selected.address}
            citiesLoading={cities.isFetching}
          />
        )}
      </div>
    );
  }

  /* ---------------------------------------------------------------- list state */

  return (
    <div className="flex w-full flex-col gap-8">
      <header className="flex w-full flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-h2 font-extrabold tracking-[-0.03em] text-ink lg:text-h1-app">
            {t('title')}
          </h1>
          <p className="m-0 text-body text-ink2">{subtitle}</p>
        </div>
        <Button as="a" href={paths.addressNew} variant="brand" size="xl">
          {t('new')}
        </Button>
      </header>

      {list.isPending ? (
        <AddressesSkeleton label={t('loading')} />
      ) : list.isError ? (
        <ErrorState
          failure={list.error}
          title={t('error.title')}
          message={failureMessage(list.error)}
          onRetry={() => list.refetch()}
          retryLabel={t('error.retry')}
        />
      ) : addresses.length === 0 ? (
        /* UN6-empty — `app-unvanlarim-bos.html` is the drawn truth: a 520-high `surface` r36 panel
           with the copy on the left and the map illustration on the right. */
        <section className="flex w-full flex-col items-center gap-14 overflow-hidden rounded-bento bg-surface p-7 md:flex-row md:p-12">
          <div className="flex w-full flex-col items-start gap-[18px] md:max-w-[420px]">
            <span className="rounded-pill bg-brand-soft px-3.5 py-1.5 text-caption font-bold text-brand-dark">
              {t('empty.tag')}
            </span>
            <h2 className="m-0 text-h2 font-extrabold leading-[1.08] tracking-[-0.03em] text-ink md:text-[38px]">
              {t('empty.title')}
            </h2>
            <p className="m-0 text-body leading-[1.45] text-ink2">{t('empty.body')}</p>
            <div className="flex flex-row flex-wrap gap-3 pt-2">
              <Button as="a" href={paths.addressPick} variant="brand" size="xl">
                {t('empty.pickOnMap')}
              </Button>
              <Button as="a" href={paths.addressNew} variant="soft" size="xl">
                {t('empty.typeIt')}
              </Button>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <AddressMapThumb label="" height={424} className="rounded-xl" />
          </div>
        </section>
      ) : (
        <>
          <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                isSelected={selected.selectedId === address.id}
                onEdit={onEdit}
                onDelete={onDelete}
                onMakeDefault={onMakeDefault}
                busy={select.isPending || remove.isPending}
              />
            ))}
          </div>

          <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
            <Link
              href={paths.addressNew}
              className={cn(
                'flex min-h-[150px] flex-col items-center justify-center gap-[14px] rounded-xl bg-bg p-5 text-center',
                'outline outline-2 outline-offset-[-1px] outline-line',
                'transition-colors duration-[var(--oz-dur-fast)] hover:outline-ink3',
              )}
            >
              <span aria-hidden="true" className="grid size-14 place-items-center rounded-pill bg-brand">
                <Plus size={24} className="text-white" />
              </span>
              <span className="text-[17px] font-bold text-ink">{t('addTile.title')}</span>
              <span className="text-caption text-ink2">{t('addTile.body')}</span>
            </Link>

            <section className="flex min-h-[150px] w-full flex-col justify-between gap-5 rounded-xl bg-block p-7 md:flex-row md:items-center">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <h2 className="m-0 text-[22px] font-extrabold text-on-block">{t('zones.title')}</h2>
                <p className="m-0 text-label leading-5 text-on-block/75">{t('zones.promoBody')}</p>
              </div>
              <Button
                as="a"
                href={addressZonesHref}
                size="lg"
                className="shrink-0 bg-yellow text-on-yellow hover:bg-yellow"
                leadingIcon={<MapPin size={18} aria-hidden="true" />}
              >
                {t('zones.cta')}
              </Button>
            </section>
          </div>

          {selected.isFallback ? (
            <EmptyState
              compact
              icon={MapPin}
              titleAs="p"
              title={t('fallback.title')}
              body={t('fallback.body')}
              className="items-start text-left"
            />
          ) : null}
        </>
      )}
    </div>
  );
}
