'use client';

/**
 * N6 — `Web · Qiymət izləmə` (`price-alerts.html`), loading (`price-alerts-loading.html`) and empty
 * (`price-alerts-empty.html`).
 *
 * Creating an alert needs a product. TODO(store)/TODO(search): once those modules land, replace the
 * plain name field in the "Məhsul izlə" modal with the shared product picker —
 *   `import { ProductCard } from '@/modules/store';`
 *   `import { ProductSearchField } from '@/modules/search';`
 * — and post the picked product's id instead of its name. Until then the modal says so and takes a
 * typed name, so the flow is still demonstrable end to end.
 *
 * A target price of 0 is the documented magic input: the handler answers 422 with a field error.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { useFormat } from '@/core/i18n';
import { Link } from '@/core/i18n/navigation';
import { useFailureMessage } from '@/core/i18n/failure-message';
import { paths } from '@/core/routes';
import { Bell, Plus, Trash2 } from '@/shared/lucide';
import { EmptyState, ErrorState } from '@/shared/states';
import { Button, IconButton, Input, Modal, Switch, toast } from '@/shared/ui';

import { FeedRow } from '../components/feed-row';
import { ProductPicker } from '../components/product-picker';
import { RewardsPage } from '../components/rewards-page';
import { StateCard } from '../components/state-card';
import {
  alertDropped,
  alertTargetHit,
  feedByPeriod,
  type PriceAlert,
} from '../data/models/price-alert';
import { usePriceAlertAction, usePriceAlerts } from '../hooks/use-price-alerts';
import { PriceAlertsSkeleton } from './PriceAlertsSkeleton';

/** Tile tints, cycled the way the export paints the two cards (yellow, then sky-soft). */
const TILE = ['bg-yellow', 'bg-sky-soft', 'bg-violet-soft', 'bg-success-soft'];

function WatchCard({
  alert,
  index,
  onToggle,
  onRemove,
  busy,
}: {
  alert: PriceAlert;
  index: number;
  onToggle: (alert: PriceAlert) => void;
  onRemove: (alert: PriceAlert) => void;
  busy: boolean;
}) {
  const t = useTranslations('rewards');
  const format = useFormat();
  const hit = alertTargetHit(alert);
  const dropped = alertDropped(alert);

  return (
    <article className="flex w-full flex-col gap-[14px] rounded-xl bg-surface p-6">
      <div className="flex w-full flex-row items-center gap-4">
        <span
          aria-hidden="true"
          className={cn(
            'flex size-[72px] shrink-0 items-center justify-center rounded-lg text-[34px] leading-none',
            TILE[index % TILE.length],
          )}
        >
          {alert.emoji}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="truncate text-body-l font-extrabold text-ink">{alert.productName}</h3>
          <p className="truncate text-label text-ink2">{alert.storeName}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span className={cn('text-h3 font-extrabold', dropped ? 'text-success' : 'text-ink')}>
            {format.money(alert.currentPrice)}
          </span>
          {dropped ? (
            <span className="text-caption text-ink3 line-through">
              {format.money(alert.trackedPrice)}
            </span>
          ) : null}
        </div>

        <IconButton
          size={36}
          tone="ghost"
          aria-label={t('priceAlerts.remove')}
          disabled={busy}
          onClick={() => onRemove(alert)}
        >
          <Trash2 />
        </IconButton>
      </div>

      <div
        className={cn(
          'flex min-h-[52px] w-full flex-row items-center justify-between gap-3 rounded-md px-4 py-2',
          hit ? 'bg-success-soft' : 'bg-surface2',
        )}
      >
        <span className="flex min-w-0 flex-row items-center gap-2">
          <Bell
            size={18}
            aria-hidden="true"
            className={cn('shrink-0', hit ? 'text-success' : 'text-ink2')}
          />
          <span
            className={cn(
              'truncate text-label font-bold',
              hit ? 'text-success' : 'text-ink2',
            )}
          >
            {alert.targetPrice === null
              ? t('priceAlerts.target.none')
              : hit
                ? t('priceAlerts.target.hit', { amount: format.money(alert.targetPrice) })
                : t('priceAlerts.target.pending', { amount: format.money(alert.targetPrice) })}
          </span>
        </span>

        <Switch
          checked={alert.active}
          disabled={busy}
          aria-label={t('priceAlerts.toggle', { product: alert.productName })}
          onCheckedChange={() => onToggle(alert)}
        />
      </div>
    </article>
  );
}

export function PriceAlertsView() {
  const t = useTranslations('rewards');
  const tc = useTranslations('common');
  const failureMessage = useFailureMessage();

  const query = usePriceAlerts();
  const action = usePriceAlertAction();
  const board = query.data;

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [store, setStore] = useState('');
  const [target, setTarget] = useState('');

  const crumbs = [{ label: t('crumb.root'), href: paths.card }, { label: t('priceAlerts.crumb') }];

  const page = (subtitle: string, children: React.ReactNode) => (
    <RewardsPage
      crumbs={crumbs}
      crumbsLabel={t('crumb.root')}
      title={t('priceAlerts.title')}
      subtitle={subtitle}
      demoModule={t('demo.module')}
    >
      {children}
    </RewardsPage>
  );

  const addButton = (
    <Button
      size="md"
      variant="primary"
      leadingIcon={<Plus size={18} aria-hidden="true" />}
      onClick={() => setAddOpen(true)}
    >
      {t('priceAlerts.add')}
    </Button>
  );

  const submit = () => {
    const parsed = Number(target.replace(',', '.'));
    action.mutate(
      {
        kind: 'add',
        alert: {
          product_name: name.trim(),
          store_name: store.trim(),
          target_price: Number.isFinite(parsed) ? parsed : 0,
        },
      },
      {
        onSuccess: () => {
          setAddOpen(false);
          setName('');
          setStore('');
          setTarget('');
          toast.success({ title: t('priceAlerts.new.done') });
        },
      },
    );
  };

  const addModal = (
    <Modal
      open={addOpen}
      onOpenChange={setAddOpen}
      title={t('priceAlerts.new.title')}
      description={t('priceAlerts.new.body')}
      size="s"
      footer={
        <>
          <Button variant="soft" onClick={() => setAddOpen(false)}>
            {tc('cancel')}
          </Button>
          <Button variant="primary" loading={action.isPending} onClick={submit}>
            {t('priceAlerts.new.submit')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-label font-semibold text-ink2">{t('priceAlerts.new.search')}</span>
          <ProductPicker
            picked={name ? { name, storeName: store, price: 0 } : null}
            onPick={(product) => {
              setName(product.name);
              setStore(product.storeName);
              // Seed the target just under the price the catalog reports, so the field is usable.
              setTarget(String(Math.max(0.01, Math.round(product.price * 0.9 * 100) / 100)));
            }}
          />
          <p className="text-caption text-ink3">{t('priceAlerts.new.pickHint')}</p>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-label font-semibold text-ink2">{t('priceAlerts.new.product')}</span>
          <Input
            value={name}
            placeholder={t('priceAlerts.new.productPlaceholder')}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-label font-semibold text-ink2">{t('priceAlerts.new.store')}</span>
          <Input value={store} onChange={(event) => setStore(event.target.value)} />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-label font-semibold text-ink2">{t('priceAlerts.new.target')}</span>
          <Input
            value={target}
            inputMode="decimal"
            onChange={(event) => setTarget(event.target.value)}
          />
        </label>

        {action.isError && action.error && action.variables?.kind === 'add' ? (
          <p role="alert" className="text-caption text-brand">
            {action.error.fieldErrors.some((f) => f.path === 'target_price')
              ? t('priceAlerts.new.invalidTarget')
              : failureMessage(action.error)}
          </p>
        ) : null}
      </div>
    </Modal>
  );

  if (query.isPending) {
    return page(t('priceAlerts.subtitle'), <PriceAlertsSkeleton label={t('loading')} />);
  }

  if (query.isError || !board) {
    return page(
      t('subtitle.error'),
      <StateCard>
        <ErrorState
          failure={query.error}
          title={t('priceAlerts.error.title')}
          message={query.error ? failureMessage(query.error) : t('error.body')}
          retryLabel={t('retry')}
          onRetry={() => query.refetch()}
        />
      </StateCard>,
    );
  }

  if (board.alerts.length === 0) {
    return (
      <>
        {page(
          t('priceAlerts.subtitleEmpty'),
          <StateCard>
            <EmptyState
              icon={Bell}
              tone="brand"
              title={t('priceAlerts.empty.title')}
              body={t('priceAlerts.empty.body')}
              action={
                <Button variant="primary" onClick={() => setAddOpen(true)}>
                  {t('priceAlerts.add')}
                </Button>
              }
            />
          </StateCard>,
        )}
        {addModal}
      </>
    );
  }

  const todayRows = feedByPeriod(board.feed, 'today');
  const weekRows = feedByPeriod(board.feed, 'week');

  return (
    <>
      {page(
        t('priceAlerts.subtitle'),
        <div className="flex w-full flex-col gap-6 lg:flex-row">
          {/* Watch Column */}
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <div className="flex flex-row flex-wrap items-center justify-between gap-3">
              <h2 className="text-h4 font-extrabold text-ink">
                {t('priceAlerts.watched', { count: board.alerts.length })}
              </h2>
              {addButton}
            </div>

            {board.alerts.map((alert, index) => (
              <WatchCard
                key={alert.id}
                alert={alert}
                index={index}
                busy={action.isPending}
                onToggle={(row) =>
                  action.mutate({ kind: 'toggle', id: row.id, active: !row.active })
                }
                onRemove={(row) => action.mutate({ kind: 'remove', id: row.id })}
              />
            ))}
          </div>

          {/* Feed Card — the compact preview of the same feed as `/notifications` */}
          <section className="flex w-full flex-col gap-1.5 rounded-xl bg-surface p-6 lg:w-[400px] lg:shrink-0">
            <div className="flex flex-row items-center justify-between gap-3 pb-2">
              <h2 className="text-h4 font-extrabold text-ink">{t('priceAlerts.feed.title')}</h2>
              <Link
                href={paths.notifications}
                className="shrink-0 text-label font-bold text-brand-dark hover:underline"
              >
                {t('priceAlerts.feed.all')}
              </Link>
            </div>

            {todayRows.length > 0 ? (
              <>
                <h3 className="pb-1 pt-3 text-micro font-extrabold text-ink3">
                  {t('priceAlerts.feed.today')}
                </h3>
                <ul className="flex w-full flex-col">
                  {todayRows.map((row) => (
                    <FeedRow key={row.id} item={row} />
                  ))}
                </ul>
              </>
            ) : null}

            {weekRows.length > 0 ? (
              <>
                <h3 className="pb-1 pt-3 text-micro font-extrabold text-ink3">
                  {t('priceAlerts.feed.week')}
                </h3>
                <ul className="flex w-full flex-col">
                  {weekRows.map((row) => (
                    <FeedRow key={row.id} item={row} />
                  ))}
                </ul>
              </>
            ) : null}
          </section>
        </div>,
      )}
      {addModal}
    </>
  );
}
