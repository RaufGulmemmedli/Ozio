'use client';

/**
 * `/courier-bag` — "Kuryerin çantası" (`kuryerin-cantasi-esas.html`, node `kv6zx`).
 *
 * States, all reachable with `?preview=loading|empty|error` as well as for real:
 *  - loading  `kuryerin-cantasi-yuklenir.html`  → `<CourierBagSkeleton>`
 *  - empty    `kuryerin-cantasi-bos.html`       → `<EmptyState>` inside the column, intro kept real
 *  - error    `kuryerin-cantasi-xeta.html`      → `<ErrorState>` with retry
 *  - confirm  `kuryerin-cantasi-tesdiq-modali.html` → `<BagConfirmModal>`
 *  - success  `kuryerin-cantasi-ugurlu.html`    → `<BagSuccess>`
 */
import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { paths } from '@/core/routes';
import { FlaskConical, ShoppingBag, WifiOff } from '@/shared/lucide';
import { EmptyState, ErrorState } from '@/shared/states';

import { BagConfirmModal, BagIntro, BagItemCard, BagMiniCart, BagSuccess } from '../components/bag-parts';
import { ShopColumns, ShopLinkButton, ShopScreen } from '../components/shop-chrome';
import { useBagConfirm, useBagDraft, useBagItems, useBagQuote } from '../hooks/use-courier-bag';
import { EMPTY_BAG_QUOTE, type BagReceipt } from '../data/models';
import { CourierBagSkeleton } from './CourierShopSkeletons';

export function CourierBagView() {
  const t = useTranslations('courier_shop');
  const items = useBagItems();
  const draft = useBagDraft();
  const quote = useBagQuote(draft.lines);
  const confirm = useBagConfirm();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [receipt, setReceipt] = useState<BagReceipt | null>(null);

  const screen = (children: ReactNode, aside?: ReactNode) => (
    <ShopScreen crumb={t('bag.crumb')} title={t('bag.title')} subtitle={t('bag.subtitle')}>
      <ShopColumns aside={aside}>{children}</ShopColumns>
    </ShopScreen>
  );

  if (receipt) {
    return (
      <ShopScreen crumb={t('bag.crumb')} title={t('bag.title')} subtitle={t('bag.subtitle')}>
        <BagSuccess
          receipt={receipt}
          action={
            <ShopLinkButton href={paths.orders} variant="primary">
              {t('bag.success.cta')}
            </ShopLinkButton>
          }
        />
      </ShopScreen>
    );
  }

  if (items.isPending) {
    return (
      <ShopScreen crumb={t('bag.crumb')} title={t('bag.title')} subtitle={t('bag.subtitle')}>
        <CourierBagSkeleton />
      </ShopScreen>
    );
  }

  if (items.isError) {
    return screen(
      <>
        <BagIntro />
        <ErrorState
          className="rounded-card bg-surface px-6 py-14"
          icon={WifiOff}
          title={t('bag.error.title')}
          message={t('bag.error.body')}
          retryLabel={t('common.retry')}
          retrying={items.isRefetching}
          onRetry={() => items.refetch()}
        />
      </>,
    );
  }

  const rows = items.data ?? [];

  if (rows.length === 0) {
    return screen(
      <>
        <BagIntro />
        <EmptyState
          panel
          tone="brand"
          icon={ShoppingBag}
          title={t('bag.empty.title')}
          body={t('bag.empty.body')}
          action={
            <ShopLinkButton href={paths.courierServices} variant="brand">
              {t('bag.empty.cta')}
            </ShopLinkButton>
          }
        />
      </>,
    );
  }

  const currentQuote = quote.data ?? EMPTY_BAG_QUOTE;

  return (
    <>
      {screen(
        <>
          <BagIntro />
          <ul className="m-0 grid w-full list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((item) => (
              <li key={item.id} className="flex">
                <BagItemCard
                  item={item}
                  quantity={draft.quantityOf(item.id)}
                  onAdd={() => {
                    draft.add(item);
                  }}
                  onQuantityChange={(next) => {
                    draft.setQuantity(item, next);
                  }}
                />
              </li>
            ))}
          </ul>
          <p className="m-0 flex flex-row items-center gap-2 text-caption text-ink3">
            <FlaskConical size={14} aria-hidden="true" />
            {t('demo.noCharge')}
          </p>
        </>,
        <BagMiniCart
          items={rows}
          quote={currentQuote}
          pricing={quote.isFetching}
          onCheckout={() => {
            setConfirmOpen(true);
          }}
        />,
      )}

      <BagConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        quote={currentQuote}
        submitting={confirm.isPending}
        onConfirm={() => {
          confirm.mutate(draft.lines, {
            onSuccess: (value) => {
              setConfirmOpen(false);
              draft.clear();
              setReceipt(value);
              void items.refetch();
            },
            // The modal closes on failure too, or the inline error would sit behind the scrim.
            onError: () => {
              setConfirmOpen(false);
            },
          });
        }}
      />

      {confirm.isError ? (
        <ErrorState
          compact
          className="mt-4"
          title={t('bag.confirmError.title')}
          message={t('bag.confirmError.body')}
          retryLabel={t('common.retry')}
          onRetry={() => {
            confirm.reset();
            setConfirmOpen(true);
          }}
        />
      ) : null}
    </>
  );
}
