'use client';

/**
 * `/coupons` — "Kuponlar" (`app-kuponlar.html`, frame `BepxL`).
 *
 * Layout from the export: Page Header (title 36/800, subtitle 16/400, brand pill button 48)
 * → Toolbar (tab pills 40 high at gap 10, spacer, 300x48 search, 48 filter circle)
 * → Coupon rows, two cards per 1112 row at gap 20.
 *
 * Tabs: the export shows "Mənim · 6 / Qazanılmış · 3 / Hamısı". The API has exactly two
 * sources — `coupons/global` (the public catalogue) and `promo-code` (the customer's own,
 * empty on live) — and no "earned" flag, so the tabs here are the four distinctions the
 * data can actually make: Hamısı / Mənim / Aktiv / Bitmiş.
 *
 * Search and filtering are client-side: `coupons/global` takes no query parameters.
 */
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { useFailureMessage } from '@/core/i18n';
import { Ticket, Search as SearchIcon } from '@/shared/lucide';
import { EmptyState, ErrorState } from '@/shared/states';
import { Button, ChipGroup, Input, type ChipOption } from '@/shared/ui';
import { PageHeader } from '@/shared/layout';
import { paths } from '@/core/routes';

import { CouponTicket } from '../components/coupon-ticket';
import { LinkButton } from '../components/link-button';
import { PromoCodeModal } from '../components/promo-code-modal';
import { couponState, isLive, type Coupon } from '../data/models/coupon';
import { useCoupons } from '../hooks/use-coupons';
import { CouponsSkeleton } from './CouponsSkeleton';

type Scope = 'all' | 'mine' | 'active' | 'expired';

const SCOPES: readonly Scope[] = ['all', 'mine', 'active', 'expired'] as const;

/** `?scope=` also accepts the `global` value the empty state links to. */
export function normalizeScope(raw: string | undefined): Scope {
  if (!raw) return 'all';
  if (raw === 'global') return 'all';
  return (SCOPES as readonly string[]).includes(raw) ? (raw as Scope) : 'all';
}

function inScope(coupon: Coupon, scope: Scope, now: Date): boolean {
  switch (scope) {
    case 'mine':
      return coupon.source === 'promo';
    case 'active':
      return isLive(coupon, now);
    case 'expired': {
      const state = couponState(coupon, now);
      return state === 'expired' || state === 'used';
    }
    default:
      return true;
  }
}

export interface CouponsViewProps {
  /** From `?scope=` — the empty state's "Bütün kuponlar" button links to `?scope=global`. */
  scope?: string;
}

export function CouponsView({ scope: scopeParam }: CouponsViewProps) {
  const t = useTranslations('coupons');
  const tc = useTranslations('common');
  const failureMessage = useFailureMessage();

  const [scope, setScope] = useState<Scope>(() => normalizeScope(scopeParam));
  const [query, setQuery] = useState('');
  const [codeOpen, setCodeOpen] = useState(false);

  const coupons = useCoupons();
  const items = useMemo(() => coupons.data?.items ?? [], [coupons.data]);

  // One clock for the whole render, so two cards never disagree about "today". It is the instant
  // the list was fetched, which is also when it last changed.
  const updatedAt = coupons.dataUpdatedAt;
  const now = useMemo(() => (updatedAt > 0 ? new Date(updatedAt) : new Date()), [updatedAt]);

  const counts = useMemo(() => {
    const result: Record<Scope, number> = { all: 0, mine: 0, active: 0, expired: 0 };
    for (const s of SCOPES) result[s] = items.filter((c) => inScope(c, s, now)).length;
    return result;
  }, [items, now]);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('az');
    return items.filter((coupon) => {
      if (!inScope(coupon, scope, now)) return false;
      if (!needle) return true;
      return (
        coupon.title.toLocaleLowerCase('az').includes(needle) ||
        coupon.description.toLocaleLowerCase('az').includes(needle) ||
        coupon.code.toLocaleLowerCase('az').includes(needle)
      );
    });
  }, [items, now, query, scope]);

  const tabs: ChipOption[] = SCOPES.map((value) => ({
    value,
    label: t(`tab.${value}`),
    count: counts[value],
  }));

  const filtering = query.trim().length > 0 || scope !== 'all';

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <Button variant="brand" size="lg" onClick={() => setCodeOpen(true)}>
            {t('action.enterCode')}
          </Button>
        }
      />

      <div className="flex w-full flex-col gap-[10px] lg:flex-row lg:items-center">
        <ChipGroup
          value={scope}
          onValueChange={(value) => setScope(value as Scope)}
          options={tabs}
          label={t('tab.label')}
          scroll
          className="lg:flex-1"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('search.placeholder')}
          aria-label={t('search.placeholder')}
          leadingIcon={<SearchIcon size={18} aria-hidden="true" />}
          containerClassName="h-12 rounded-pill lg:w-[300px]"
        />
      </div>

      {coupons.isPending ? (
        <CouponsSkeleton label={tc('loading')} />
      ) : coupons.isError ? (
        <ErrorState
          failure={coupons.error}
          title={tc('error.generic.title')}
          message={failureMessage(coupons.error)}
          retryLabel={tc('retry')}
          onRetry={() => coupons.refetch()}
        />
      ) : visible.length === 0 ? (
        filtering ? (
          <EmptyState
            icon={SearchIcon}
            title={t('empty.filtered.title')}
            body={t('empty.filtered.body')}
            panel
            action={
              <Button
                variant="soft"
                size="lg"
                onClick={() => {
                  setQuery('');
                  setScope('all');
                }}
              >
                {tc('clear')}
              </Button>
            }
          />
        ) : (
          /* The drawn truth for this state is `app-kuponlar-bos.html` (frame `t8lpeO`). */
          <EmptyState
            icon={Ticket}
            tone="brand"
            title={t('empty.title')}
            body={t('empty.body')}
            panel
            action={
              <LinkButton href={paths.lottery} variant="primary" size="lg">
                {t('empty.primary')}
              </LinkButton>
            }
            secondaryAction={
              <Button variant="soft" size="lg" onClick={() => setScope('all')}>
                {t('empty.secondary')}
              </Button>
            }
          />
        )
      ) : (
        <ul className="grid w-full list-none grid-cols-1 gap-5 p-0 lg:grid-cols-2">
          {visible.map((coupon) => (
            <li key={coupon.id || coupon.code} className="min-w-0">
              <CouponTicket coupon={coupon} />
            </li>
          ))}
        </ul>
      )}

      <PromoCodeModal open={codeOpen} onOpenChange={setCodeOpen} />
    </>
  );
}
