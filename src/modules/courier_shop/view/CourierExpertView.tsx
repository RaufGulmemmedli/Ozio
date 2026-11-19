'use client';

/**
 * `/courier-expert` — "Kuryer-Ekspert" service selection
 * (`kuryer-ekspert-xidmet-secimi.html`, `vrqmN`).
 *
 * Product → service → slot, then "Rezerv et" books in the mock and moves to
 * `/courier-expert/booking`. Loading mirrors `kuryer-ekspert-yuklenir.html` (`OYTuE`);
 * `?preview=loading|empty|error` all work.
 */
import { useState, type ReactNode } from 'react';
import { useRouter } from '@/core/i18n';
import { useTranslations } from 'next-intl';

import { paths } from '@/core/routes';
import { ShieldCheck, WifiOff } from '@/shared/lucide';
import { EmptyState, ErrorState } from '@/shared/states';

import {
  ExpertBookingSummary,
  ExpertProductPicker,
  ExpertServicePicker,
  ExpertSlotPicker,
} from '../components/expert-parts';
import { ShopColumns, ShopLinkButton, ShopScreen } from '../components/shop-chrome';
import type { ExpertProductKind, ExpertServiceKind } from '../data/models';
import { useBookExpert, useExpertCatalog } from '../hooks/use-courier-expert';
import { CourierExpertSkeleton } from './CourierShopSkeletons';

export function CourierExpertView() {
  const t = useTranslations('courier_shop');
  const router = useRouter();

  const [productKind, setProductKind] = useState<ExpertProductKind>('bike');
  const catalog = useExpertCatalog(productKind);
  const book = useBookExpert();

  /**
   * Only what the user actually picked is stored; the effective selection is derived during render
   * and falls back to the catalogue's first service and the drawn default slot. A different product
   * brings a different service list, so a kind that is no longer offered simply drops back to the
   * default — no effect, no cascading render.
   */
  const [pickedService, setPickedService] = useState<ExpertServiceKind | null>(null);
  const [pickedSlot, setPickedSlot] = useState<string | null>(null);

  const frame = (children: ReactNode, aside?: ReactNode) => (
    <ShopScreen crumb={t('expert.crumb')} title={t('expert.title')} subtitle={t('expert.subtitle')}>
      <ShopColumns aside={aside}>{children}</ShopColumns>
    </ShopScreen>
  );

  if (catalog.isPending) {
    return (
      <ShopScreen
        crumb={t('expert.crumb')}
        title={t('expert.title')}
        subtitle={t('expert.subtitle')}
      >
        <CourierExpertSkeleton />
      </ShopScreen>
    );
  }

  if (catalog.isError) {
    return frame(
      <ErrorState
        className="rounded-card bg-surface px-6 py-14"
        icon={WifiOff}
        title={t('expert.error.title')}
        message={t('expert.error.body')}
        retryLabel={t('common.retry')}
        retrying={catalog.isRefetching}
        onRetry={() => catalog.refetch()}
      />,
    );
  }

  const data = catalog.data;

  if (!data || data.services.length === 0 || data.slots.length === 0) {
    return frame(
      <EmptyState
        panel
        tone="brand"
        icon={ShieldCheck}
        title={t('expert.empty.title')}
        body={t('expert.empty.body')}
        action={
          <ShopLinkButton href={paths.courierServices} variant="brand">
            {t('expert.empty.cta')}
          </ShopLinkButton>
        }
      />,
    );
  }

  const product = data.products.find((p) => p.kind === data.product) ?? data.products[0];
  const service =
    data.services.find((s) => s.kind === pickedService) ?? data.services[0] ?? null;
  // The export's default slot is the third one ("Sabah 10:00").
  const slot = data.slots.find((s) => s.id === pickedSlot) ?? data.slots[2] ?? data.slots[0] ?? null;

  return (
    <>
      {frame(
        <>
          <ExpertProductPicker
            products={data.products}
            value={productKind}
            onChange={setProductKind}
          />
          <ExpertServicePicker
            services={data.services}
            value={service?.kind ?? null}
            onChange={(next) => {
              setPickedService(next.kind);
            }}
          />
          <ExpertSlotPicker
            slots={data.slots}
            value={slot?.id ?? null}
            onChange={(next) => {
              setPickedSlot(next.id);
            }}
          />
        </>,
        <ExpertBookingSummary
          product={product}
          service={service}
          slot={slot}
          submitting={book.isPending}
          onBook={() => {
            if (!service || !slot) return;
            book.mutate(
              { product: productKind, service: service.kind, slot: slot.id },
              {
                onSuccess: () => {
                  router.push(paths.courierExpertBooking);
                },
              },
            );
          }}
        />,
      )}

      {book.isError ? (
        <ErrorState
          compact
          title={t('expert.bookError.title')}
          message={t('expert.bookError.body')}
          retryLabel={t('common.retry')}
          onRetry={() => {
            book.reset();
          }}
        />
      ) : null}
    </>
  );
}
