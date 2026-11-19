'use client';

/**
 * GB3's `Product Pick · …` tile (3×2 grid): 56 thumb on white, title 15/700, "{pack} · {retail}"
 * 12/400 ink3. The selected tile is `brand-soft`, the rest `surface2`.
 *
 * It is a radio, not a button: the six tiles are one choice, so they are grouped with
 * `role="radiogroup"` by the form and each tile carries `aria-checked`.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';

import type { GroupProduct } from '../data/models/group-product';
import { DealThumb } from './deal-thumb';

export interface ProductPickProps {
  product: GroupProduct;
  selected: boolean;
  onSelect: () => void;
}

export function ProductPick({ product, selected, onSelect }: ProductPickProps) {
  const t = useTranslations('group_buy');
  const { money } = useFormat();

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex min-h-[84px] w-full flex-row items-center gap-[14px] rounded-card p-[14px] text-left transition-colors',
        selected ? 'bg-brand-soft' : 'bg-surface2 hover:bg-line',
      )}
    >
      <DealThumb iconKey={product.iconKey} alt="" size={56} radius="inner" tone="white" />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-body-sm font-bold text-ink">{product.title}</span>
        <span className="truncate text-micro text-ink3">
          {t('create.productMeta', { pack: product.pack, price: money(product.retailPrice) })}
        </span>
      </span>
    </button>
  );
}
