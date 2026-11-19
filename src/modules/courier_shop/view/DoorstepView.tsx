'use client';

/**
 * `/courier-fit/doorstep` — "Qapıda sınaq" (`qapida-sinaq-sessiya.html`, `Or9Cm`).
 *
 * Four drawn states, all reachable:
 *  - session   `qapida-sinaq-sessiya.html`             → timer hero + per-size keep/return + panel
 *  - confirm   `qapida-sinaq-tesdiq-modali.html`       → `<DoorstepConfirmModal>`
 *  - result    `qapida-sinaq-netice.html`              → `<DoorstepResult>`
 *  - no session `qapida-sinaq-sessiya-yoxdur-bos.html` → `<EmptyState>` + "Sınağa başla (demo)"
 *
 * The countdown comes from the session's `expiresAt` (mock-owned). At 00:00 the hero says the time
 * is up and the choice stays confirmable — nothing is auto-charged, because nothing is ever
 * charged here. Loading reuses the fit skeleton, as the screen spec says.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { paths } from '@/core/routes';
import { Button } from '@/shared/ui';
import { Timer, WifiOff } from '@/shared/lucide';
import { EmptyState, ErrorState } from '@/shared/states';

import {
  DoorstepConfirmModal,
  DoorstepConfirmPanel,
  DoorstepResult,
  DoorstepTimer,
  FitItemChoice,
} from '../components/doorstep-parts';
import { ShopColumns, ShopLinkButton, ShopScreen } from '../components/shop-chrome';
import { chargeFor } from '../data/models';
import {
  useConfirmFit,
  useDoorstepClock,
  useFitProduct,
  useFitResult,
  useFitSession,
  useStartFit,
} from '../hooks/use-courier-fit';
import { DoorstepSkeleton } from './CourierShopSkeletons';

export function DoorstepView() {
  const t = useTranslations('courier_shop');
  const session = useFitSession();
  const result = useFitResult();
  const product = useFitProduct();
  const start = useStartFit();
  const confirm = useConfirmFit();

  const live = session.data ?? null;
  const clock = useDoorstepClock(live);

  /**
   * Which of the ordered sizes the shopper keeps. Stored per session id and derived during render,
   * so a new session falls straight back to the drawn default (the first size kept) without an
   * effect that would set state during a render pass.
   */
  const [choice, setChoice] = useState<{ sessionId: string; kept: string[] } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const kept = !live
    ? []
    : choice && choice.sessionId === live.id
      ? choice.kept
      : live.sizes.slice(0, 1);

  const setKept = (next: string[]) => {
    if (!live) return;
    setChoice({ sessionId: live.id, kept: next });
  };

  const header = (subtitle: string) => ({
    crumb: t('doorstep.crumb'),
    title: t('doorstep.title'),
    subtitle,
  });

  if (session.isPending || result.isPending) {
    return (
      <ShopScreen {...header(t('doorstep.waiting'))}>
        <DoorstepSkeleton />
      </ShopScreen>
    );
  }

  if (session.isError) {
    return (
      <ShopScreen {...header(t('doorstep.waiting'))}>
        <ShopColumns>
          <ErrorState
            className="rounded-card bg-surface px-6 py-14"
            icon={WifiOff}
            title={t('doorstep.error.title')}
            message={t('doorstep.error.body')}
            retryLabel={t('common.retry')}
            retrying={session.isRefetching}
            onRetry={() => session.refetch()}
          />
        </ShopColumns>
      </ShopScreen>
    );
  }

  // The session has settled: show what was kept and what it cost.
  if (!live && result.data) {
    return (
      <ShopScreen {...header(t('doorstep.resultSubtitle'))}>
        <ShopColumns>
          <DoorstepResult
            result={result.data}
            action={
              <ShopLinkButton href={paths.orders} variant="primary">
                {t('doorstep.result.cta')}
              </ShopLinkButton>
            }
          />
        </ShopColumns>
      </ShopScreen>
    );
  }

  // No session, nothing settled: the drawn empty state with the demo starter.
  if (!live) {
    return (
      <ShopScreen {...header(t('doorstep.waiting'))}>
        <ShopColumns>
          <EmptyState
            panel
            tone="brand"
            icon={Timer}
            title={t('doorstep.empty.title')}
            body={t('doorstep.empty.body', {
              count: product.data?.requiredSizes ?? 2,
              minutes: product.data?.waitMinutes ?? 10,
            })}
            action={
              <Button
                variant="brand"
                size="lg"
                loading={start.isPending}
                onClick={() => {
                  // An empty size list tells the mock to start the demo session with its own two
                  // sizes, so this debug action does not depend on the product query.
                  start.mutate([]);
                }}
              >
                {t('doorstep.empty.cta')}
              </Button>
            }
            secondaryAction={
              <ShopLinkButton href={paths.courierFit} variant="soft">
                {t('doorstep.empty.secondary')}
              </ShopLinkButton>
            }
          />
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
        </ShopColumns>
      </ShopScreen>
    );
  }

  const returned = live.sizes.filter((size) => !kept.includes(size));
  const charge = chargeFor(live, kept.length);

  return (
    <>
      <ShopScreen {...header(t('doorstep.waiting'))}>
        <ShopColumns
          aside={
            <DoorstepConfirmPanel
              keptSizes={kept}
              returnedSizes={returned}
              charge={charge}
              submitting={confirm.isPending}
              onConfirm={() => {
                setConfirmOpen(true);
              }}
            />
          }
        >
          <DoorstepTimer clock={clock} />
          <div className="flex w-full flex-col gap-5 md:flex-row">
            {live.sizes.map((size) => (
              <FitItemChoice
                key={size}
                session={live}
                size={size}
                kept={kept.includes(size)}
                onChange={(keep) => {
                  // Kept in the order the courier brought them, so the summary reads left to right.
                  setKept(
                    keep
                      ? live.sizes.filter((s) => s === size || kept.includes(s))
                      : kept.filter((s) => s !== size),
                  );
                }}
              />
            ))}
          </div>
          {confirm.isError ? (
            <ErrorState
              compact
              title={t('doorstep.confirmError.title')}
              message={t('doorstep.confirmError.body')}
              retryLabel={t('common.retry')}
              onRetry={() => {
                confirm.reset();
                setConfirmOpen(true);
              }}
            />
          ) : null}
        </ShopColumns>
      </ShopScreen>

      <DoorstepConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        keptSizes={kept}
        returnedSizes={returned}
        charge={charge}
        submitting={confirm.isPending}
        onConfirm={() => {
          confirm.mutate(kept, {
            onSuccess: () => {
              setConfirmOpen(false);
            },
            // Closed on failure too, or the inline error would sit behind the scrim.
            onError: () => {
              setConfirmOpen(false);
            },
          });
        }}
      />
    </>
  );
}
