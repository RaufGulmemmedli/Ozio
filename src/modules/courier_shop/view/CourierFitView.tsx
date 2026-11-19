'use client';

/**
 * `/courier-fit` — "Geyin, seç, qaytar" size selection (`geyin-sec-qaytar-olculer.html`, `zCypE`).
 *
 * Picking exactly two sizes and ordering creates the `FitSession` in the mock and moves to
 * `/courier-fit/doorstep`. Loading mirrors `geyin-sec-qaytar-yuklenir.html` (`S29O4`);
 * `?preview=loading|empty|error` all work.
 */
import { useCallback, useState, type ReactNode } from 'react';
import { useRouter } from '@/core/i18n';
import { useTranslations } from 'next-intl';

import { paths } from '@/core/routes';
import { Shirt, WifiOff } from '@/shared/lucide';
import { EmptyState, ErrorState } from '@/shared/states';

import { FitExplainer, FitOrderSummary, FitProductCard } from '../components/fit-parts';
import { ShopColumns, ShopLinkButton, ShopScreen } from '../components/shop-chrome';
import { useFitProduct, useStartFit } from '../hooks/use-courier-fit';
import { CourierFitSkeleton } from './CourierShopSkeletons';

export function CourierFitView() {
  const t = useTranslations('courier_shop');
  const router = useRouter();
  const product = useFitProduct();
  const start = useStartFit();
  const [selected, setSelected] = useState<string[]>([]);

  const required = product.data?.requiredSizes ?? 2;

  const toggle = useCallback(
    (size: string) => {
      setSelected((prev) => {
        if (prev.includes(size)) return prev.filter((s) => s !== size);
        if (prev.length >= required) return prev;
        return [...prev, size];
      });
    },
    [required],
  );

  const frame = (children: ReactNode, aside?: ReactNode) => (
    <ShopScreen crumb={t('fit.crumb')} title={t('fit.title')} subtitle={t('fit.subtitle')}>
      <ShopColumns aside={aside}>{children}</ShopColumns>
    </ShopScreen>
  );

  if (product.isPending) {
    return (
      <ShopScreen crumb={t('fit.crumb')} title={t('fit.title')} subtitle={t('fit.subtitle')}>
        <CourierFitSkeleton />
      </ShopScreen>
    );
  }

  if (product.isError) {
    return frame(
      <ErrorState
        className="rounded-card bg-surface px-6 py-14"
        icon={WifiOff}
        title={t('fit.error.title')}
        message={t('fit.error.body')}
        retryLabel={t('common.retry')}
        retrying={product.isRefetching}
        onRetry={() => product.refetch()}
      />,
    );
  }

  const row = product.data;

  if (!row || row.sizes.length === 0) {
    return frame(
      <EmptyState
        panel
        tone="brand"
        icon={Shirt}
        title={t('fit.empty.title')}
        body={t('fit.empty.body')}
        action={
          <ShopLinkButton href={paths.courierServices} variant="brand">
            {t('fit.empty.cta')}
          </ShopLinkButton>
        }
      />,
    );
  }

  return (
    <>
      {frame(
        <>
          <FitProductCard product={row} selected={selected} onToggle={toggle} />
          <FitExplainer waitMinutes={row.waitMinutes} />
        </>,
        <FitOrderSummary
          product={row}
          selected={selected}
          submitting={start.isPending}
          onOrder={() => {
            start.mutate(selected, {
              onSuccess: () => {
                router.push(paths.courierFitDoorstep);
              },
            });
          }}
        />,
      )}

      {start.isError ? (
        <ErrorState
          compact
          title={t('fit.startError.title')}
          message={t('fit.startError.body')}
          retryLabel={t('common.retry')}
          onRetry={() => {
            start.reset();
          }}
        />
      ) : null}
    </>
  );
}
