'use client';

/**
 * SC3's main panel: the dark list header plus the item rows.
 *
 * Measured from `sc3-school-class-list.html`: white panel radius 36 with a `block` header
 * (padding 32, title 32/800, meta 15/400, a yellow "14 məhsul" pill and a `success-soft`
 * "Qənaət 4,35 ₼" pill), then rows at 83.5 high / padding 0 32 — 48 thumb at radius 14, name
 * 16/700, "Ən ucuz: … · 0,65 ₼ / ədəd" 13/400 `ink3`, a `surface2` quantity pill and the line
 * total 17/800.
 *
 * The rows are a **real `<table>`** (`<Table mobile="cards">`), which keeps the column headers
 * semantic while reproducing the drawn card rows below 768.
 *
 * Every number — `lineTotal`, `itemCount`, `savings`, `total` — is the mock's; nothing here
 * multiplies a price by a quantity.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { Table, type TableColumn } from '@/shared/ui';

import type { ClassList, ClassListItem } from '../data/models/class-list';
import { BookOpen } from './icons';

export interface ClassListCardProps {
  list: ClassList;
}

export function ClassListCard({ list }: ClassListCardProps) {
  const t = useTranslations('school');
  const { money } = useFormat();

  const columns: TableColumn<ClassListItem>[] = [
    {
      key: 'name',
      header: t('lists.table.product'),
      emphasis: 'id',
      render: (item) => (
        <div className="flex min-w-0 flex-row items-center gap-4">
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-md bg-surface2"
          >
            <BookOpen size={22} className="text-ink2" />
          </span>
          <span className="min-w-0 text-body font-bold text-ink">{item.name}</span>
        </div>
      ),
    },
    {
      key: 'seller',
      header: t('lists.table.seller'),
      render: (item) => (
        <span className="text-caption text-ink3">
          {t('lists.item.cheapest', {
            seller: item.cheapestSeller,
            price: money(item.unitPrice),
          })}
        </span>
      ),
    },
    {
      key: 'qty',
      header: t('lists.table.qty'),
      width: 120,
      render: (item) => (
        <span className="inline-flex h-7 items-center rounded-pill bg-surface2 px-2.5 text-micro font-bold text-ink2">
          {t('lists.item.qty', { count: item.qty })}
        </span>
      ),
    },
    {
      key: 'total',
      header: t('lists.table.total'),
      align: 'end',
      emphasis: 'amount',
      width: 120,
      render: (item) => (
        <span className="text-[17px] font-extrabold text-ink">{money(item.lineTotal)}</span>
      ),
    },
  ];

  return (
    <section
      aria-labelledby={`class-list-${list.id}`}
      className="flex w-full flex-col overflow-hidden rounded-bento bg-surface"
    >
      <header className="flex w-full flex-col gap-2 bg-block p-6 lg:p-8">
        <h2 id={`class-list-${list.id}`} className="text-h2 font-extrabold text-on-block">
          {list.title}
        </h2>
        <p className="text-body-sm text-on-block2">
          {list.sharedBy
            ? t('lists.header.meta', { school: list.school, person: list.sharedBy })
            : list.school}
        </p>
        <div className="mt-1 flex flex-row flex-wrap items-center gap-2">
          <span className="inline-flex h-7 items-center rounded-pill bg-yellow px-2.5 text-micro font-bold text-on-yellow">
            {t('lists.tag.items', { count: list.itemCount })}
          </span>
          {list.savings > 0 ? (
            <span className="inline-flex h-7 items-center rounded-pill bg-success-soft px-2.5 text-micro font-bold text-success">
              {t('lists.tag.savings', { amount: money(list.savings) })}
            </span>
          ) : null}
        </div>
      </header>

      <div className="w-full p-4 lg:px-2 lg:py-0">
        <Table<ClassListItem>
          columns={columns}
          rows={list.items}
          rowKey={(item) => item.id}
          caption={t('lists.table.caption', { title: list.title })}
          mobile="cards"
          className="bg-transparent px-0 lg:px-6"
        />
      </div>
    </section>
  );
}
