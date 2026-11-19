'use client';

/**
 * V7's "Receipt Items" panel.
 *
 * Measured: white panel radius 28, padding 28 — store name 20/800, "Dünən · 5 məhsul tapıldı"
 * 13/400 `ink3`, a `success-soft` "Çek oxundu" pill with a check, a header row of 13/600 `ink3`
 * labels ("Məhsul / Mağaza / Ozio") and rows at 55.5 high: name 15/700, the store price 15/400
 * `ink2` and the Ozio price 15/800 **brand**.
 *
 * The header row is literally a table head, so this is a real `<Table mobile="cards">`.
 * `lineStoreTotal` / `lineOzioTotal` come from the mock — the cells print them.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { Check } from '@/shared/lucide';
import { Table, type TableColumn } from '@/shared/ui';

import type { ReceiptItem, ScannedReceipt } from '../data/models/receipt';

export interface ReceiptItemsProps {
  receipt: ScannedReceipt;
}

export function ReceiptItems({ receipt }: ReceiptItemsProps) {
  const t = useTranslations('viral');
  const { money } = useFormat();

  const columns: TableColumn<ReceiptItem>[] = [
    {
      key: 'name',
      header: t('scan.table.product'),
      emphasis: 'id',
      render: (item) => (
        <span className="text-body-sm font-bold text-ink">
          {item.qty > 1 ? t('scan.table.qtyName', { name: item.name, qty: item.qty }) : item.name}
        </span>
      ),
    },
    {
      key: 'store',
      header: t('scan.table.store'),
      align: 'end',
      width: 140,
      render: (item) => (
        <span className="text-body-sm text-ink2">{money(item.lineStoreTotal)}</span>
      ),
    },
    {
      key: 'ozio',
      header: t('scan.table.ozio'),
      align: 'end',
      width: 140,
      render: (item) => (
        <span className="text-body-sm font-extrabold text-brand">
          {money(item.lineOzioTotal)}
        </span>
      ),
    },
  ];

  return (
    <section
      aria-labelledby="receipt-store"
      className="flex min-w-0 flex-1 flex-col gap-4 rounded-xl bg-surface p-7"
    >
      <div className="flex w-full flex-row items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="receipt-store" className="text-h4 font-extrabold text-ink">
            {receipt.storeName}
          </h2>
          <p className="text-caption text-ink3">
            {t('scan.found', { date: receipt.dateLabel, count: receipt.itemCount })}
          </p>
        </div>
        <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-pill bg-success-soft px-2.5 text-micro font-bold text-success">
          <Check size={14} aria-hidden="true" />
          {t('scan.recognized')}
        </span>
      </div>

      <Table<ReceiptItem>
        columns={columns}
        rows={receipt.items}
        rowKey={(item) => item.id}
        caption={t('scan.table.caption', { store: receipt.storeName })}
        mobile="cards"
        className="bg-transparent px-0"
      />
    </section>
  );
}
