'use client';

/**
 * PL1's `Staples` table: eight rows of `Məhsul · Kilidli qiymət · Bazar qiyməti ·
 * Platforma ödəyir`, with the success tag when the market price is above the locked one and an
 * em dash when it is not.
 *
 * `difference` is the source's number. Below 768 the shared `<Table mobile="cards">` stacks each
 * row into its own card, which is how this fits a 390 viewport without a horizontal scroll.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { ProductImage } from '@/shared/media';
import { Badge, Table, type TableColumn } from '@/shared/ui';

import type { StapleItem } from '../data/models/guarantee';

export function StaplesTable({ items }: { items: StapleItem[] }) {
  const t = useTranslations('price_lock');
  const { money } = useFormat();

  const columns: TableColumn<StapleItem>[] = [
    {
      key: 'name',
      header: t('staples.product'),
      emphasis: 'id',
      render: (row) => (
        <span className="flex items-center gap-3">
          <span className="w-10 shrink-0">
            <ProductImage src={null} alt="" ratio="1/1" radius="pill" fallbackIconSize={18} />
          </span>
          <span className="min-w-0 text-body font-bold text-ink">{row.name}</span>
        </span>
      ),
    },
    {
      key: 'locked',
      header: t('staples.locked'),
      emphasis: 'amount',
      render: (row) => <span className="text-body font-extrabold text-ink">{money(row.lockedPrice)}</span>,
    },
    {
      key: 'market',
      header: t('staples.market'),
      render: (row) => <span className="text-body text-ink2">{money(row.marketPrice)}</span>,
    },
    {
      key: 'difference',
      header: t('staples.platformPays'),
      render: (row) =>
        row.difference > 0 ? (
          <Badge tone="success">
            {t('staples.platformPaysTag', { amount: money(row.difference) })}
          </Badge>
        ) : (
          <span className="text-body text-ink3">
            <span aria-hidden="true">—</span>
            <span className="sr-only">{t('staples.noDifference')}</span>
          </span>
        ),
    },
  ];

  return (
    <Table
      columns={columns}
      rows={items}
      rowKey={(row) => row.id}
      caption={t('staples.title')}
      mobile="cards"
      className="w-full rounded-xl px-7 py-2"
    />
  );
}
