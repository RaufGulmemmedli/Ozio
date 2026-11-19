'use client';

/**
 * N4 — `Web · Ağıllı siyahı` (`smart-list.html`), loading (`smart-list-loading.html`) and empty
 * (`smart-list-empty.html`, which keeps the real add field above the state card).
 *
 * Savings, totals and the per-store breakdown are derived from the prices the API sent (line × qty
 * only — BUILD-CONTRACT rule 7). Adding "xəta" as an item is the documented magic input that makes
 * the add fail, so the failure notice is reachable without any tooling.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { useFormat } from '@/core/i18n';
import { useFailureMessage } from '@/core/i18n/failure-message';
import { paths } from '@/core/routes';
import { Plus, ShoppingBasket, Users } from '@/shared/lucide';
import { EmptyState, ErrorState, InlineNotice } from '@/shared/states';
import { toast } from '@/shared/ui';

import { RewardsPage } from '../components/rewards-page';
import { SmartListRow } from '../components/smart-list-row';
import { StateCard } from '../components/state-card';
import {
  discountedItems,
  listSaving,
  listTotal,
  otherItems,
  storeTotals,
  type SmartListItem,
} from '../data/models/smart-list';
import { useSmartList, useSmartListAction } from '../hooks/use-smart-list';
import { SmartListSkeleton } from './SmartListSkeleton';

function AddField({
  value,
  onChange,
  onSubmit,
  busy,
  placeholder,
  addLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  busy: boolean;
  placeholder: string;
  addLabel: string;
}) {
  return (
    <form
      className="flex h-14 w-full flex-row items-center gap-3 rounded-pill bg-surface2 px-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Plus size={20} aria-hidden="true" className="shrink-0 text-ink3" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-body-sm text-ink outline-none placeholder:text-ink3"
      />
      <button
        type="submit"
        disabled={busy || value.trim().length === 0}
        className="shrink-0 text-label font-bold text-brand-dark disabled:opacity-50"
      >
        {addLabel}
      </button>
    </form>
  );
}

export function SmartListView() {
  const t = useTranslations('rewards');
  const tc = useTranslations('common');
  const format = useFormat();
  const failureMessage = useFailureMessage();

  const query = useSmartList();
  const action = useSmartListAction();
  const list = query.data;

  const [draft, setDraft] = useState('');

  const crumbs = [{ label: t('crumb.root'), href: paths.card }, { label: t('smartList.crumb') }];

  const page = (subtitle: string, children: React.ReactNode) => (
    <RewardsPage
      crumbs={crumbs}
      crumbsLabel={t('crumb.root')}
      title={t('smartList.title')}
      subtitle={subtitle}
      demoModule={t('demo.module')}
    >
      {children}
    </RewardsPage>
  );

  const submit = () => {
    const title = draft.trim();
    if (!title) return;
    action.mutate(
      { kind: 'add', title },
      {
        onSuccess: () => setDraft(''),
      },
    );
  };

  const addField = (
    <AddField
      value={draft}
      onChange={setDraft}
      onSubmit={submit}
      busy={action.isPending}
      placeholder={t('smartList.addPlaceholder')}
      addLabel={tc('apply')}
    />
  );

  if (query.isPending) {
    return page(t('smartList.subtitle'), <SmartListSkeleton label={t('loading')} />);
  }

  if (query.isError || !list) {
    return page(
      t('subtitle.error'),
      <StateCard>
        <ErrorState
          failure={query.error}
          title={t('smartList.error.title')}
          message={query.error ? failureMessage(query.error) : t('error.body')}
          retryLabel={t('retry')}
          onRetry={() => query.refetch()}
        />
      </StateCard>,
    );
  }

  const addFailed =
    action.isError && action.error && action.variables?.kind === 'add' ? action.error : null;

  if (list.items.length === 0) {
    return page(
      t('smartList.subtitleEmpty'),
      <div className="flex w-full flex-col gap-5">
        <div className="w-full rounded-xl bg-surface p-6 md:p-7">{addField}</div>
        {addFailed ? (
          <InlineNotice
            tone="error"
            title={t('smartList.addFailed')}
            body={failureMessage(addFailed)}
          />
        ) : null}
        <StateCard>
          <EmptyState
            icon={ShoppingBasket}
            tone="brand"
            title={t('smartList.empty.title')}
            body={t('smartList.empty.body')}
          />
        </StateCard>
      </div>,
    );
  }

  const discounted = discountedItems(list.items);
  const others = otherItems(list.items);
  const stores = storeTotals(list.items);
  const saving = listSaving(list.items);
  const total = listTotal(list.items);

  const onToggle = (item: SmartListItem) =>
    action.mutate({ kind: 'check', id: item.id, checked: !item.checked });
  const onQuantity = (item: SmartListItem, quantity: number) =>
    action.mutate({ kind: 'quantity', id: item.id, quantity });
  const onRemove = (item: SmartListItem) => action.mutate({ kind: 'remove', id: item.id });

  const group = (heading: string, rows: SmartListItem[]) =>
    rows.length === 0 ? null : (
      <div className="flex w-full flex-col">
        <div className="flex flex-row items-center justify-between pb-1 pt-3.5">
          <h3 className="text-caption font-extrabold text-ink3">{heading}</h3>
        </div>
        <ul className="flex w-full flex-col">
          {rows.map((item) => (
            <SmartListRow
              key={item.id}
              item={item}
              busy={action.isPending}
              onToggle={onToggle}
              onQuantity={onQuantity}
              onRemove={onRemove}
            />
          ))}
        </ul>
      </div>
    );

  return page(
    t('smartList.subtitle'),
    <div className="flex w-full flex-col gap-6 lg:flex-row">
      {/* List Card */}
      <section className="flex min-w-0 flex-1 flex-col gap-2 rounded-xl bg-surface p-6 md:p-7">
        {addField}
        {addFailed ? (
          <InlineNotice
            tone="error"
            className="mt-2"
            title={t('smartList.addFailed')}
            body={failureMessage(addFailed)}
          />
        ) : null}
        {group(t('smartList.group.discounted', { count: discounted.length }), discounted)}
        {group(t('smartList.group.other', { count: others.length }), others)}
      </section>

      {/* Summary Column */}
      <div className="flex w-full flex-col gap-5 lg:w-[360px] lg:shrink-0">
        <section className="flex w-full flex-col gap-2.5 rounded-bento bg-brand p-7">
          <p className="text-label font-semibold text-white">
            {t('smartList.savings.label', { count: discounted.length })}
          </p>
          <p className="text-[40px] font-extrabold leading-none tracking-[-0.03em] text-white md:text-[48px]">
            −{format.money(saving)}
          </p>
          <p className="text-label text-white">
            {t('smartList.savings.meta', {
              total: format.money(total),
              count: list.items.length,
            })}
          </p>
          {/*
            TODO(cart): the real add-to-cart is `useCartAction` / `<AddToCartButton>` from
            `@/modules/cart` (never a cart write written here). It cannot be called yet: it needs
            `{ storeId, productId }`, and these rows are placeholder data — a smart-list item
            carries a store *name* and no product id at all (`mock-modules.md` §7). The moment the
            fixture (or a real `v1/rewards/smart-list`) carries `store_id` + `product_id`, add
            `<AddToCartButton>` per row and point this CTA at `useCartAction`.
          */}
          <button
            type="button"
            onClick={() => toast.info({ title: t('smartList.cartMissing') })}
            className={cn(
              'mt-1.5 flex h-14 w-full items-center justify-center rounded-pill bg-white',
              'text-body font-extrabold text-brand-dark',
            )}
          >
            {t('smartList.order')}
          </button>
        </section>

        {stores.length > 0 ? (
          <section className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6">
            <h2 className="text-body font-extrabold text-ink">{t('smartList.stores.title')}</h2>
            <ul className="flex w-full flex-col gap-3">
              {stores.map((store) => (
                <li
                  key={store.storeName}
                  className="flex flex-row items-center justify-between gap-2.5"
                >
                  <span className="flex min-w-0 flex-row items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="size-3 shrink-0 rounded-pill"
                      style={{ backgroundColor: store.storeColor ?? 'var(--oz-ink-3)' }}
                    />
                    <span className="truncate text-body-sm font-bold text-ink">
                      {store.storeName}
                    </span>
                  </span>
                  <span className="shrink-0 text-caption text-ink2">
                    {t('smartList.stores.meta', {
                      count: store.count,
                      total: format.money(store.total),
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {list.sharedWith ? (
          <p className="flex h-14 w-full flex-row items-center gap-2.5 rounded-pill bg-violet-soft px-[18px] text-label font-bold text-violet">
            <Users size={18} aria-hidden="true" className="shrink-0" />
            {t('smartList.sharedWith', { name: list.sharedWith })}
          </p>
        ) : null}
      </div>
    </div>,
  );
}
